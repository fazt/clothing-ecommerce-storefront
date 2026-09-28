"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { FieldError, FormAlert } from "@/components/form-message";
import { selectClassName } from "@/components/dashboard/data-table";
import { useApiForm } from "@/hooks/use-api-form";
import { api } from "@/lib/api-client";
import type { ApiUser } from "@/lib/api-types";
import { formValues } from "@/lib/form-values";
import { userCreateSchema, userUpdateSchema } from "@/lib/schemas/user";
import { cn } from "@/lib/utils";

// Same form for create and edit; `initial` switches it to edit mode.
export function UserForm({
  initial,
  isSelf = false,
}: {
  initial?: ApiUser;
  isSelf?: boolean;
}) {
  const router = useRouter();
  const mode = initial ? "edit" : "create";
  const onSuccess = () => {
    router.push("/dashboard/users");
    router.refresh();
  };
  const create = useApiForm(userCreateSchema, (v) => api.users.create(v), onSuccess);
  // A disabled role select isn't submitted, so self-edits never send a role.
  const update = useApiForm(userUpdateSchema, (v) => api.users.update(initial!.id, v), onSuccess);
  const { pending, errors, formError, run } = mode === "create" ? create : update;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void run(formValues(e.currentTarget));
      }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>{mode === "create" ? "Nuevo usuario" : "Datos del usuario"}</CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Crea una cuenta con rol USER o ADMIN."
              : "Actualiza el nombre, rol o contraseña de la cuenta."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                defaultValue={initial?.name ?? ""}
                placeholder="Nombre y apellido"
                aria-invalid={errors.name ? true : undefined}
              />
              <FieldError message={errors.name} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email{mode === "create" ? " *" : ""}</Label>
              <Input
                id="email"
                name={mode === "create" ? "email" : undefined}
                type="email"
                defaultValue={initial?.email ?? ""}
                placeholder="usuario@ejemplo.com"
                readOnly={mode === "edit"}
                className={mode === "edit" ? "bg-muted/50" : undefined}
                aria-invalid={errors.email ? true : undefined}
              />
              <FieldError message={errors.email} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña{mode === "create" ? " *" : ""}</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder={
                  mode === "create" ? "Al menos 6 caracteres" : "Dejar vacío para mantener la actual"
                }
                aria-invalid={errors.password ? true : undefined}
              />
              <FieldError message={errors.password} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Rol</Label>
              <select
                id="role"
                name="role"
                defaultValue={initial?.role ?? "USER"}
                disabled={isSelf}
                className={cn(selectClassName, "w-full disabled:opacity-50")}
              >
                <option value="USER">Usuario</option>
                <option value="ADMIN">Administrador</option>
              </select>
              {isSelf ? (
                <p className="text-xs text-muted-foreground">No puedes cambiar tu propio rol.</p>
              ) : (
                <FieldError message={errors.role} />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <FormAlert message={formError} />

      <div className="flex items-center justify-end gap-2">
        <Link href="/dashboard/users" className={cn(buttonVariants({ variant: "outline" }))}>
          Cancelar
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : mode === "create" ? "Crear usuario" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
