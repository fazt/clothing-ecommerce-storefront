"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
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
import { cn } from "@/lib/utils";
import type { ApiDiscount } from "@/lib/api";

export function DiscountForm({
  initial,
  action,
  submitLabel,
}: {
  initial?: ApiDiscount;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
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

  const expiresDefault = initial?.expiresAt
    ? initial.expiresAt.slice(0, 10)
    : "";

  return (
    <form action={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Descuento</CardTitle>
          <CardDescription>
            Configura código, tipo y alcance del descuento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-2 md:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="code">Código *</Label>
              <Input
                id="code"
                name="code"
                required
                defaultValue={initial?.code ?? ""}
                placeholder="SUMMER25"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Tipo *</Label>
              <select
                id="type"
                name="type"
                defaultValue={initial?.type ?? "PERCENT"}
                className="h-8 rounded-md border bg-background px-3 text-sm"
              >
                <option value="PERCENT">Porcentaje</option>
                <option value="FIXED">Monto fijo</option>
                <option value="SHIPPING">Envío</option>
              </select>
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
            />
          </div>

          <div className="grid gap-2 md:grid-cols-3 md:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="value">Valor *</Label>
              <Input
                id="value"
                name="value"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={initial?.value ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="limit">Límite de usos</Label>
              <Input
                id="limit"
                name="limit"
                type="number"
                min="0"
                defaultValue={initial?.limit ?? ""}
                placeholder="Sin límite"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                name="status"
                defaultValue={initial?.status ?? "ACTIVE"}
                className="h-8 rounded-md border bg-background px-3 text-sm"
              >
                <option value="ACTIVE">Activo</option>
                <option value="SCHEDULED">Programado</option>
                <option value="EXPIRED">Expirado</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2 md:max-w-xs">
            <Label htmlFor="expiresAt">Expira el</Label>
            <Input
              id="expiresAt"
              name="expiresAt"
              type="date"
              defaultValue={expiresDefault}
            />
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
          href="/dashboard/discounts"
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
