import Link from "next/link";
import { redirect } from "next/navigation";
import { RegisterForm } from "./register-form";
import { OAuthButtons } from "../oauth-buttons";
import { getSessionUser } from "@/lib/session";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) {
    redirect(user.role === "ADMIN" ? "/dashboard" : "/");
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="auth-eyebrow">Crea tu cuenta</p>
        <h1 className="auth-title">Únete</h1>
        <p className="auth-subtitle">
          Regístrate para comprar, seguir tus pedidos y guardar tus prendas
          favoritas.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <OAuthButtons />
        <RegisterForm />
      </div>

      <div
        className="border-t pt-6 text-[13px]"
        style={{ borderColor: "var(--border)" }}
      >
        <p style={{ color: "var(--ink-soft)" }}>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="auth-link font-semibold underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
