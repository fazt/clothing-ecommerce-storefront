import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RegisterForm } from "./register-form";
import { getSessionUser } from "@/lib/session";

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) {
    redirect(user.role === "ADMIN" ? "/dashboard" : "/");
  }

  return (
    <Card className="gap-6 py-6">
      <CardHeader className="gap-2 text-center">
        <CardTitle className="text-2xl">Crear cuenta</CardTitle>
        <CardDescription>
          Regístrate para comprar y seguir tus pedidos.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
            Inicia sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
