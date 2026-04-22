import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <Card className="gap-6 py-6">
      <CardHeader className="gap-2 text-center">
        <CardTitle className="text-2xl">Recupera tu contraseña</CardTitle>
        <CardDescription>
          Te enviaremos un enlace para restablecerla.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ForgotPasswordForm />
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
