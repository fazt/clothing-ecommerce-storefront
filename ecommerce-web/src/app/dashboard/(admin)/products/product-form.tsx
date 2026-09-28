"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { ImageUpload } from "@/components/image-upload";
import { selectClassName } from "@/components/dashboard/data-table";
import { useApiForm } from "@/hooks/use-api-form";
import { api } from "@/lib/api-client";
import type { ApiCategory, ApiProduct } from "@/lib/api-types";
import { formValues } from "@/lib/form-values";
import { productSchema } from "@/lib/schemas/product";
import { cn } from "@/lib/utils";
import {
  ProductVariantsField,
  toVariantDrafts,
  type VariantDraft,
} from "./product-variants-field";

const MAX_GALLERY_IMAGES = 20;

type CategoryOption = Pick<ApiCategory, "id" | "name">;

let nextGalleryKey = 0;

// Same form for create and edit; `initial` switches it to edit mode.
export function ProductForm({
  initial,
  categories,
}: {
  initial?: ApiProduct;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const mode = initial ? "edit" : "create";
  const { pending, errors, formError, run } = useApiForm(
    productSchema,
    (v) => (initial ? api.products.update(initial.id, v) : api.products.create(v)),
    () => {
      router.push("/dashboard/products");
      router.refresh();
    },
  );

  const [gallery, setGallery] = useState(() =>
    (initial?.images ?? []).map((url, i) => ({ key: `g-${i}`, url })),
  );
  const [variants, setVariants] = useState<VariantDraft[]>(() =>
    toVariantDrafts(initial?.variants),
  );

  // Keep the current category selectable even if the list failed to load,
  // otherwise saving would silently clear it.
  const categoryOptions: CategoryOption[] =
    initial?.category && !categories.some((c) => c.id === initial.category?.id)
      ? [...categories, initial.category]
      : categories;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        // Every gallery slot renders a hidden `images` input, in display order.
        const images = new FormData(form)
          .getAll("images")
          .filter((v): v is string => typeof v === "string");
        void run({ ...formValues(form), images, variants });
      }}
      className="space-y-6"
    >
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
                defaultValue={initial?.name ?? ""}
                placeholder="Ej: Camiseta oversized"
                aria-invalid={errors.name ? true : undefined}
              />
              <FieldError message={errors.name} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={initial?.description ?? ""}
                placeholder="Describe el producto, materiales, cuidado..."
                aria-invalid={errors.description ? true : undefined}
              />
              <FieldError message={errors.description} />
            </div>
            <div className="grid gap-2">
              <Label>Imagen principal</Label>
              <ImageUpload
                name="imageUrl"
                defaultValue={initial?.imageUrl ?? ""}
                folder="products"
              />
              <FieldError message={errors.imageUrl} />
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
                  className="pl-7"
                  defaultValue={initial?.price ?? ""}
                  placeholder="0.00"
                  aria-invalid={errors.price ? true : undefined}
                />
              </div>
              <FieldError message={errors.price} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock (si no hay variantes)</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                defaultValue={initial?.stock ?? 0}
                aria-invalid={errors.stock ? true : undefined}
              />
              <FieldError message={errors.stock} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="categoryId">Categoría</Label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={initial?.categoryId ?? ""}
                className={cn(selectClassName, "w-full")}
                aria-invalid={errors.categoryId ? true : undefined}
              >
                <option value="">Sin categoría</option>
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <FieldError message={errors.categoryId} />
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
          {gallery.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
              Sin imágenes adicionales.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((item, i) => (
                <div key={item.key} className="relative space-y-2 rounded-md border p-2">
                  <ImageUpload name="images" defaultValue={item.url} folder="products" />
                  <FieldError message={errors[`images.${i}`]} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="absolute right-2 top-2"
                    onClick={() =>
                      setGallery((prev) => prev.filter((x) => x.key !== item.key))
                    }
                    aria-label="Quitar imagen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <FieldError message={errors.images} />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={gallery.length >= MAX_GALLERY_IMAGES}
            onClick={() =>
              setGallery((prev) => [...prev, { key: `g-new-${nextGalleryKey++}`, url: "" }])
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
          <ProductVariantsField rows={variants} onChange={setVariants} errors={errors} />
        </CardContent>
      </Card>

      <FormAlert message={formError} />

      <div className="flex items-center justify-end gap-2">
        <Link
          href="/dashboard/products"
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Cancelar
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : mode === "create" ? "Crear producto" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
