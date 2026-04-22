import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Card className="gap-6 py-6">
        <CardHeader className="gap-2 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl">Enlace inválido</CardTitle>
          <CardDescription>
            No recibimos un token de recuperación en la URL.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link
            href="/forgot-password"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Solicitar un nuevo enlace
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gap-6 py-6">
      <CardHeader className="gap-2 text-center">
        <CardTitle className="text-2xl">Nueva contraseña</CardTitle>
        <CardDescription>
          Elige una contraseña segura para tu cuenta.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ResetPasswordForm token={token} />
        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Volver a iniciar sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
