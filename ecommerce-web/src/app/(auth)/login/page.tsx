import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <Card className="gap-6 py-6">
      <CardHeader className="gap-2 text-center">
        <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
        <CardDescription>
          Accede con tu cuenta para continuar.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {resetOk ? (
          <div
            className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
            role="status"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Contraseña actualizada. Inicia sesión con la nueva.
            </span>
          </div>
        ) : null}
        <LoginForm next={next} />
        <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/forgot-password"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
          <p>
            ¿No tienes cuenta?{" "}
            <Link
              href="/register"
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Regístrate
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
