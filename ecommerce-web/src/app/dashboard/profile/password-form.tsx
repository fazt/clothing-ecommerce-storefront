"use client";

import { useState } from "react";
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
import { formValues } from "@/lib/form-values";
import { passwordChangeSchema } from "@/lib/schemas/profile";

export function PasswordForm() {
  const [saved, setSaved] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const { pending, errors, formError, run } = useApiForm(
    passwordChangeSchema,
    ({ currentPassword, newPassword }) => api.me.changePassword({ currentPassword, newPassword }),
    () => {
      setSaved(true);
      setFormKey((k) => k + 1); // remount to clear the password inputs
    },
  );

  return (
    <Card className="border-none bg-background/50 shadow-none ring-1 ring-border/50">
      <form
        key={formKey}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(false);
          void run(formValues(e.currentTarget));
        }}
      >
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight">Seguridad</CardTitle>
          <CardDescription>Cambia tu contraseña para mantener tu cuenta segura.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Contraseña Actual</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              aria-invalid={errors.currentPassword ? true : undefined}
              className="h-10 transition-all focus-visible:ring-1"
            />
            <FieldError message={errors.currentPassword} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">Nueva Contraseña</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={errors.newPassword ? true : undefined}
              className="h-10 transition-all focus-visible:ring-1"
            />
            <FieldError message={errors.newPassword} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              aria-invalid={errors.confirmPassword ? true : undefined}
              className="h-10 transition-all focus-visible:ring-1"
            />
            <FieldError message={errors.confirmPassword} />
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between gap-4 border-t border-border/50 bg-muted/20 px-6 py-4">
          {formError && !errors.currentPassword ? (
            <p className="text-sm font-medium text-destructive" role="alert">
              {formError}
            </p>
          ) : saved ? (
            <p className="text-sm font-medium text-green-600" role="status">
              Contraseña actualizada
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">Usa al menos 6 caracteres.</p>
          )}
          <Button type="submit" disabled={pending} className="min-w-[120px] rounded-full">
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Actualizando
              </>
            ) : (
              "Actualizar contraseña"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
