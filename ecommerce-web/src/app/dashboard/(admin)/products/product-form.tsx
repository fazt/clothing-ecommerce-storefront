"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
import { ImageUpload } from "@/components/image-upload";
import { ProductVariantsField } from "./product-variants-field";
import type { ApiCategory, ApiProduct } from "@/lib/api";

export function ProductForm({
  initial,
  categories,
  action,
  submitLabel,
}: {
  initial?: ApiProduct;
  categories: ApiCategory[];
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [galleryKeys, setGalleryKeys] = useState<string[]>(
    (initial?.images ?? []).map((_, i) => `g-${i}`),
  );

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await action(formData);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  const galleryInitial = initial?.images ?? [];

  return (
    <form action={onSubmit} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información general</CardTitle>
            <CardDescription>
              Datos principales que describen el producto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={initial?.name ?? ""}
                placeholder="Ej: Camiseta oversized"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={initial?.description ?? ""}
                placeholder="Describe el producto, materiales, cuidado..."
              />
            </div>
            <div className="grid gap-2">
              <Label>Imagen principal</Label>
              <ImageUpload
                name="imageUrl"
                defaultValue={initial?.imageUrl ?? ""}
                folder="products"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Precio e inventario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Precio base *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="pl-7"
                  defaultValue={initial?.price ?? ""}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock (si no hay variantes)</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                defaultValue={initial?.stock ?? 0}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categoryId">Categoría</Label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={initial?.categoryId ?? ""}
                className="h-8 rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 border-t pt-4">
              <Label>Etiquetas</Label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="isNew"
                    defaultChecked={!!initial?.isNew}
                    className="h-4 w-4"
                  />
                  Marcar como nuevo
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="isSale"
                    defaultChecked={!!initial?.isSale}
                    className="h-4 w-4"
                  />
                  En oferta
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    defaultChecked={!!initial?.isFeatured}
                    className="h-4 w-4"
                  />
                  Destacado
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Galería</CardTitle>
          <CardDescription>
            Imágenes adicionales que aparecen en la ficha del producto.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {galleryKeys.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
              Sin imágenes adicionales.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {galleryKeys.map((k, i) => (
                <div key={k} className="relative rounded-md border p-2">
                  <ImageUpload
                    name="images"
                    defaultValue={galleryInitial[i] ?? ""}
                    folder="products"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-2 top-2"
                    onClick={() =>
                      setGalleryKeys((prev) => prev.filter((x) => x !== k))
                    }
                    aria-label="Quitar imagen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setGalleryKeys((prev) => [
                ...prev,
                `g-new-${Math.random().toString(36).slice(2, 8)}`,
              ])
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Agregar imagen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variantes</CardTitle>
          <CardDescription>
            Combinaciones de talle y color. Si una fila tiene precio vacío se
            usa el precio base.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductVariantsField initial={initial?.variants} />
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Link
          href="/dashboard/products"
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
