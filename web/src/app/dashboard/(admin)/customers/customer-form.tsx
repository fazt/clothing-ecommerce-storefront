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
import { useApiForm } from "@/hooks/use-api-form";
import { api } from "@/lib/api-client";
import type { ApiCustomer } from "@/lib/api-types";
import { formValues } from "@/lib/form-values";
import { customerSchema } from "@/lib/schemas/customer";
import { cn } from "@/lib/utils";

// Same form for create and edit; `initial` switches it to edit mode.
export function CustomerForm({
  initial,
}: {
  initial?: Pick<ApiCustomer, "id" | "name" | "email">;
}) {
  const router = useRouter();
  const mode = initial ? "edit" : "create";
  const { pending, errors, formError, run } = useApiForm(
    customerSchema,
    (v) => (initial ? api.customers.update(initial.id, v) : api.customers.create(v)),
    () => {
      router.push("/dashboard/customers");
      router.refresh();
    },
  );

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
          <CardTitle>{mode === "create" ? "Nuevo cliente" : "Datos del cliente"}</CardTitle>
          <CardDescription>
            {mode === "create"
              ? "Registra un cliente con su nombre y email."
              : "Actualiza el nombre o el email del cliente."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
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
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={initial?.email ?? ""}
                placeholder="cliente@ejemplo.com"
                aria-invalid={errors.email ? true : undefined}
              />
              <FieldError message={errors.email} />
            </div>
          </div>
        </CardContent>
      </Card>

      <FormAlert message={formError} />

      <div className="flex items-center justify-end gap-2">
        <Link href="/dashboard/customers" className={cn(buttonVariants({ variant: "outline" }))}>
          Cancelar
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : mode === "create" ? "Crear cliente" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
