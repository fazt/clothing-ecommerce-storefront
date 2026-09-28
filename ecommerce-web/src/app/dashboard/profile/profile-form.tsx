"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
import { FieldError } from "@/components/form-message";
import { useApiForm } from "@/hooks/use-api-form";
import { api } from "@/lib/api-client";
import type { ApiUser } from "@/lib/api-types";
import { formValues } from "@/lib/form-values";
import { profileSchema } from "@/lib/schemas/profile";

export function ProfileForm({ user }: { user: ApiUser }) {
  const router = useRouter();
  const [email, setEmail] = useState(user.email);
  const [saved, setSaved] = useState(false);
  const emailChanged = email.trim().toLowerCase() !== user.email;

  const { pending, errors, formError, run } = useApiForm(
    profileSchema,
    ({ name, email: nextEmail, currentPassword }) =>
      api.me.update({
        name,
        ...(nextEmail !== user.email && { email: nextEmail, currentPassword }),
      }),
    () => {
      setSaved(true);
      router.refresh();
    },
  );

  return (
    <Card className="border-none bg-background/50 shadow-none ring-1 ring-border/50">
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(false);
          void run(formValues(e.currentTarget));
        }}
      >
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight">
            Información Personal
          </CardTitle>
          <CardDescription>Actualiza tu nombre y correo electrónico.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input
              id="name"
              name="name"
              defaultValue={user.name || ""}
              placeholder="Tu nombre"
              aria-invalid={errors.name ? true : undefined}
              className="h-10 transition-all focus-visible:ring-1"
            />
            <FieldError message={errors.name} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              placeholder="tu@correo.com"
              aria-invalid={errors.email ? true : undefined}
              className="h-10 transition-all focus-visible:ring-1"
            />
            <FieldError message={errors.email} />
          </div>
          {emailChanged ? (
            <div className="grid gap-2">
              <Label htmlFor="profile-current-password">Contraseña Actual</Label>
              <Input
                id="profile-current-password"
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                aria-invalid={errors.currentPassword ? true : undefined}
                className="h-10 transition-all focus-visible:ring-1"
              />
              <p className="text-[10px] text-muted-foreground">
                Necesaria para cambiar tu correo electrónico.
              </p>
              <FieldError message={errors.currentPassword} />
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-4 border-t border-border/50 bg-muted/20 px-6 py-4">
          {formError ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {formError}
            </p>
          ) : saved ? (
            <p className="text-sm font-medium text-green-600" role="status">
              Perfil actualizado con éxito
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Asegúrate de guardar los cambios antes de salir.
            </p>
          )}
          <Button type="submit" disabled={pending} className="min-w-[120px] rounded-full">
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
