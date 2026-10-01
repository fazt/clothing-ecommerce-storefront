"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { ApiDiscount } from "@/lib/api-types";
import { formValues } from "@/lib/form-values";
import { discountSchema } from "@/lib/schemas/discount";
import { cn } from "@/lib/utils";

// Same form for create and edit; `initial` switches it to edit mode.
export function DiscountForm({ initial }: { initial?: ApiDiscount }) {
  const router = useRouter();
  const mode = initial ? "edit" : "create";
  const { pending, errors, formError, run } = useApiForm(
    discountSchema,
    (v) => (initial ? api.discounts.update(initial.id, v) : api.discounts.create(v)),
    () => {
      router.push("/dashboard/discounts");
      router.refresh();
    },
  );

  // expiresAt is a calendar date stored at UTC midnight.
  const expiresDefault = initial?.expiresAt ? initial.expiresAt.slice(0, 10) : "";

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
          <CardTitle>Descuento</CardTitle>
          <CardDescription>Configura código, tipo y alcance del descuento.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                name="code"
                defaultValue={initial?.code ?? ""}
                placeholder="SUMMER25"
                autoCapitalize="characters"
                className="uppercase"
                aria-invalid={errors.code ? true : undefined}
              />
              <FieldError message={errors.code} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo *</Label>
              <select
                id="type"
                name="type"
                defaultValue={initial?.type ?? "PERCENT"}
                className={cn(selectClassName, "w-full")}
              >
                <option value="PERCENT">Porcentaje</option>
                <option value="FIXED">Monto fijo</option>
                <option value="SHIPPING">Envío</option>
              </select>
              <FieldError message={errors.type} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={initial?.description ?? ""}
              placeholder="Para qué sirve este descuento..."
              aria-invalid={errors.description ? true : undefined}
            />
            <FieldError message={errors.description} />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="value">Valor *</Label>
              <Input
                id="value"
                name="value"
                type="number"
                step="0.01"
                min="0"
                defaultValue={initial?.value ?? ""}
                aria-invalid={errors.value ? true : undefined}
              />
              <FieldError message={errors.value} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="limit">Límite de usos</Label>
              <Input
                id="limit"
                name="limit"
                type="number"
                step="1"
                min="1"
                defaultValue={initial?.limit ?? ""}
                placeholder="Sin límite"
                aria-invalid={errors.limit ? true : undefined}
              />
              <FieldError message={errors.limit} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                name="status"
                defaultValue={initial?.status ?? "ACTIVE"}
                className={cn(selectClassName, "w-full")}
              >
                <option value="ACTIVE">Activo</option>
                <option value="SCHEDULED">Programado</option>
                <option value="EXPIRED">Expirado</option>
              </select>
              <FieldError message={errors.status} />
            </div>
          </div>

          <div className="grid gap-2 md:max-w-xs">
            <Label htmlFor="expiresAt">Expira el</Label>
            <Input
              id="expiresAt"
              name="expiresAt"
              type="date"
              defaultValue={expiresDefault}
              aria-invalid={errors.expiresAt ? true : undefined}
            />
            <FieldError message={errors.expiresAt} />
          </div>
        </CardContent>
      </Card>

      <FormAlert message={formError} />

      <div className="flex items-center justify-end gap-2">
        <Link href="/dashboard/discounts" className={cn(buttonVariants({ variant: "outline" }))}>
          Cancelar
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : mode === "create" ? "Crear descuento" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
