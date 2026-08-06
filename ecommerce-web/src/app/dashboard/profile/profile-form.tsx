"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateProfileAction } from "./profile-actions";
import type { ApiUser } from "@/lib/api";
import { Loader2 } from "lucide-react";

export function ProfileForm({ user }: { user: ApiUser }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function action(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        await updateProfileAction(formData);
        setSuccess(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Algo salió mal");
      }
    });
  }

  return (
    <div className="grid gap-6">
      <Card className="border-none bg-background/50 shadow-none ring-1 ring-border/50">
        <form action={action}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-tight">
              Información Personal
            </CardTitle>
            <CardDescription>
              Actualiza tu nombre y correo electrónico.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email}
                placeholder="tu@correo.com"
                className="h-10 transition-all focus-visible:ring-1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name || ""}
                placeholder="Tu nombre"
                className="h-10 transition-all focus-visible:ring-1"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4 border-t border-border/50 bg-muted/20 px-6 py-4">
            <div className="flex w-full items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Asegúrate de guardar los cambios antes de salir.
              </p>
              <Button
                type="submit"
                disabled={isPending}
                className="min-w-[120px] rounded-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>

      <Card className="border-none bg-background/50 shadow-none ring-1 ring-border/50">
        <form action={action}>
          <CardHeader>
            <CardTitle className="text-xl font-semibold tracking-tight">
              Seguridad
            </CardTitle>
            <CardDescription>
              Cambia tu contraseña para mantener tu cuenta segura.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <Input
                id="currentPassword"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                className="h-10 transition-all focus-visible:ring-1"
              />
              <p className="text-[10px] text-muted-foreground">
                Necesaria para realizar cualquier cambio en tu cuenta.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                className="h-10 transition-all focus-visible:ring-1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="h-10 transition-all focus-visible:ring-1"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col items-start gap-4 border-t border-border/50 bg-muted/20 px-6 py-4">
            <div className="flex w-full items-center justify-between">
              {error && (
                <p className="text-sm font-medium text-destructive">{error}</p>
              )}
              {success && (
                <p className="text-sm font-medium text-green-600">
                  Perfil actualizado con éxito
                </p>
              )}
              {!error && !success && (
                <p className="text-sm text-muted-foreground">
                  Usa al menos 6 caracteres.
                </p>
              )}
              <Button
                type="submit"
                disabled={isPending}
                className="min-w-[120px] rounded-full"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando
                  </>
                ) : (
                  "Actualizar contraseña"
                )}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}