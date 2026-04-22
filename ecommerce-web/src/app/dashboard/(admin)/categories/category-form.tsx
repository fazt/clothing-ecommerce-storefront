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
import type { ApiCategory } from "@/lib/api";

export function CategoryForm({
  initial,
  action,
  submitLabel,
}: {
  initial?: ApiCategory;
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

  return (
    <form action={onSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Datos de la categoría</CardTitle>
          <CardDescription>
            Se usa para agrupar productos y navegar la tienda.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-2 md:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={initial?.name ?? ""}
                placeholder="Mujer"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                name="slug"
                required
                defaultValue={initial?.slug ?? ""}
                placeholder="mujer"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="image">URL de imagen</Label>
            <Input
              id="image"
              name="image"
              type="url"
              defaultValue={initial?.image ?? ""}
              placeholder="https://..."
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isVisible"
              defaultChecked={initial?.isVisible ?? true}
              className="h-4 w-4 rounded border"
            />
            Visible en la tienda
          </label>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Link
          href="/dashboard/categories"
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
