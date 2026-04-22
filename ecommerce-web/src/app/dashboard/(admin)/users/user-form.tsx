"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ApiUser } from "@/lib/api";

export function UserForm({
  initial,
  action,
  submitLabel,
  mode,
  isSelf = false,
}: {
  initial?: ApiUser;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  mode: "create" | "edit";
  isSelf?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await action(formData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "create" ? "Nuevo usuario" : "Datos del usuario"}
          </CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Crea una cuenta con rol USER o ADMIN."
              : "Actualiza el nombre, rol o contraseña de la cuenta."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-2 md:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                defaultValue={initial?.name ?? ""}
                placeholder="Nombre y apellido"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email{mode === "create" ? " *" : ""}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required={mode === "create"}
                defaultValue={initial?.email ?? ""}
                placeholder="usuario@ejemplo.com"
                readOnly={mode === "edit"}
                className={mode === "edit" ? "bg-muted/50" : undefined}
              />
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-2 md:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">
                Contraseña{mode === "create" ? " *" : ""}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required={mode === "create"}
                minLength={6}
                placeholder={
                  mode === "create"
                    ? "Al menos 6 caracteres"
                    : "Dejar vacío para mantener la actual"
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Rol</Label>
              <select
                id="role"
                name="role"
                defaultValue={initial?.role ?? "USER"}
                disabled={isSelf}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
              >
                <option value="USER">Usuario</option>
                <option value="ADMIN">Administrador</option>
              </select>
              {isSelf ? (
                <p className="text-xs text-muted-foreground">
                  No puedes cambiar tu propio rol.
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Link
          href="/dashboard/users"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
