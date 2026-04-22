import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { LoginForm } from "./login-form";
import { getSessionUser } from "@/lib/session";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string }>;
}) {
  const user = await getSessionUser();
  if (user) {
    redirect(user.role === "ADMIN" ? "/dashboard" : "/");
  }
  const params = await searchParams;
  const next = params.next ?? "";
  const resetOk = params.reset === "1";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <p className="auth-eyebrow">Bienvenido de vuelta</p>
        <h1 className="auth-title">Iniciar sesión</h1>
        <p className="auth-subtitle">
          Accede a tu cuenta para continuar comprando y seguir tus pedidos.
        </p>
      </div>

      {resetOk ? (
        <div className="auth-alert auth-alert--success" role="status">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Contraseña actualizada. Inicia sesión con la nueva.</span>
        </div>
      ) : null}

      <LoginForm next={next} />

      <div
        className="flex flex-col gap-3 border-t pt-6 text-[13px]"
        style={{ borderColor: "var(--border)" }}
      >
        <Link
          href="/forgot-password"
          className="auth-link"
          style={{ color: "var(--ink-soft)" }}
        >
          ¿Olvidaste tu contraseña?
        </Link>
        <p style={{ color: "var(--ink-soft)" }}>
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="auth-link font-semibold underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
