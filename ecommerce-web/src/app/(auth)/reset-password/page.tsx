import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <div className="auth-alert auth-alert--warn" role="alert">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>No recibimos un token de recuperación en la URL.</span>
          </div>
          <p className="auth-eyebrow">Enlace inválido</p>
          <h1 className="auth-title">Intentalo de nuevo</h1>
          <p className="auth-subtitle">
            Solicita un nuevo enlace desde la pantalla de recuperación.
          </p>
        </div>
        <Link href="/forgot-password" className="auth-submit">
          Solicitar un nuevo enlace
        </Link>
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

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="auth-eyebrow">Nueva contraseña</p>
        <h1 className="auth-title">Elige una segura</h1>
        <p className="auth-subtitle">
          Usa al menos 6 caracteres. Vas a poder iniciar sesión de inmediato.
        </p>
      </div>

      <ResetPasswordForm token={token} />

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
