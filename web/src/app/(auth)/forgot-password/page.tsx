import Link from "next/link";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="auth-eyebrow">¿Olvidaste tu contraseña?</p>
        <h1 className="auth-title">Recupérala</h1>
        <p className="auth-subtitle">
          Ingresa tu email y te enviaremos un enlace para restablecerla.
        </p>
      </div>

      <ForgotPasswordForm />

      <div
        className="border-t pt-6 text-[13px]"
        style={{ borderColor: "var(--border)" }}
      >
        <Link
          href="/login"
          className="auth-link"
          style={{ color: "var(--ink-soft)" }}
        >
          ← Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
