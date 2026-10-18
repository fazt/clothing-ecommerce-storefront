import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/lib/prisma";
import { AUTH_COOKIE } from "../src/lib/auth-cookie";

export const app = createApp();

/** Vacía todas las tablas de la base de test (menos el historial de migraciones). */
export async function resetDatabase(): Promise<void> {
  if (!process.env["DATABASE_URL"]?.includes("test")) {
    throw new Error("resetDatabase solo se ejecuta contra una base de test");
  }
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
  if (rows.length === 0) return;
  const tables = rows.map((r) => `"public"."${r.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}

let counter = 0;

/** Lee el token de sesión de la cabecera Set-Cookie. */
export function sessionFrom(res: request.Response): string {
  const raw = res.headers["set-cookie"] as unknown as string[] | string | undefined;
  const cookies = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const cookie = cookies.find((c) => c.startsWith(`${AUTH_COOKIE}=`));
  if (!cookie) throw new Error("La respuesta no trae cookie de sesión");
  return cookie.split(";")[0].slice(AUTH_COOKIE.length + 1);
}

/** Registra un usuario nuevo y devuelve su token (para `Authorization: Bearer`). */
export async function registerUser(name = "Usuario Test") {
  counter += 1;
  const email = `user${Date.now()}${counter}@test.dev`;
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name, email, password: "password123" })
    .expect(201);
  return { token: sessionFrom(res), user: res.body.user as { id: string }, email };
}

/** Crea un usuario ADMIN y devuelve su token. */
export async function adminUser() {
  const { token, user, email } = await registerUser("Admin Test");
  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  return { token, user, email };
}

/** Producto con una variante (talla M / color Negro) y el stock indicado. */
export async function productWithVariant(stock: number, price = 50) {
  const product = await prisma.product.create({
    data: {
      name: `Polo test ${Date.now()}-${++counter}`,
      price,
      stock,
      variants: { create: [{ size: "M", color: "Negro", stock }] },
    },
    include: { variants: true },
  });
  return { product, variant: product.variants[0] };
}

export const shippingAddress = {
  name: "Valentina Rojas",
  phone: "+51 999 888 777",
  line1: "Av. Larco 1232",
  city: "Lima",
  region: "Lima",
  postalCode: "15074",
  country: "Perú",
};

export { prisma, request };
