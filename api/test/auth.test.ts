import { beforeEach, describe, expect, it } from "vitest";
import { app, prisma, registerUser, request, resetDatabase, sessionFrom } from "./helpers";

describe("auth", () => {
  beforeEach(resetDatabase);

  it("registra, inicia sesión y lee /me con la cookie", async () => {
    const { email } = await registerUser("Valentina");
    const login = await request(app).post("/api/auth/login").send({ email, password: "password123" }).expect(200);
    const token = sessionFrom(login);
    const me = await request(app).get("/api/me").set("Authorization", `Bearer ${token}`).expect(200);
    expect(me.body.email).toBe(email);
    expect(me.body.passwordHash).toBeUndefined();
  });

  it("rechaza credenciales inválidas con 401", async () => {
    const { email } = await registerUser();
    await request(app).post("/api/auth/login").send({ email, password: "otra-clave" }).expect(401);
  });

  it("cambiar la contraseña invalida las sesiones anteriores y renueva la actual", async () => {
    const { token } = await registerUser();
    const res = await request(app)
      .put("/api/me/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "password123", newPassword: "nueva-clave-123" })
      .expect(204);
    const fresh = sessionFrom(res);

    await request(app).get("/api/me").set("Authorization", `Bearer ${token}`).expect(401);
    await request(app).get("/api/me").set("Authorization", `Bearer ${fresh}`).expect(200);
  });

  it("el token de restablecimiento se guarda hasheado", async () => {
    const { email, user } = await registerUser();
    await request(app).post("/api/auth/forgot-password").send({ email }).expect(200);
    // La solicitud se procesa en segundo plano.
    await new Promise((r) => setTimeout(r, 300));
    const record = await prisma.passwordResetToken.findFirst({ where: { userId: user.id } });
    expect(record).not.toBeNull();
    expect(record!.token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("rutas de admin: 401 sin sesión y 403 para un cliente", async () => {
    await request(app).get("/api/orders").expect(401);
    const { token } = await registerUser();
    await request(app).get("/api/orders").set("Authorization", `Bearer ${token}`).expect(403);
  });

  it("una ruta desconocida responde 404 en JSON", async () => {
    const res = await request(app).get("/api/no-existe").expect(404);
    expect(res.body.code).toBe("NOT_FOUND");
  });
});
