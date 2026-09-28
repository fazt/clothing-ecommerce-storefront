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
import { ImageUpload } from "@/components/image-upload";
import { useApiForm } from "@/hooks/use-api-form";
import { api } from "@/lib/api-client";
import type { ApiCategory } from "@/lib/api-types";
import { formValues } from "@/lib/form-values";
import { categorySchema } from "@/lib/schemas/category";
import { cn } from "@/lib/utils";

// Same form for create and edit; `initial` switches it to edit mode.
export function CategoryForm({ initial }: { initial?: ApiCategory }) {
  const router = useRouter();
  const mode = initial ? "edit" : "create";
  const { pending, errors, formError, run } = useApiForm(
    categorySchema,
    (v) => (initial ? api.categories.update(initial.id, v) : api.categories.create(v)),
    () => {
      router.push("/dashboard/categories");
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
          <CardTitle>Datos de la categoría</CardTitle>
          <CardDescription>Se usa para agrupar productos y navegar la tienda.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                defaultValue={initial?.name ?? ""}
                placeholder="Mujer"
                aria-invalid={errors.name ? true : undefined}
              />
              <FieldError message={errors.name} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                name="slug"
                defaultValue={initial?.slug ?? ""}
                placeholder="mujer"
                aria-invalid={errors.slug ? true : undefined}
              />
              <FieldError message={errors.slug} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Imagen</Label>
            <ImageUpload name="image" defaultValue={initial?.image ?? ""} folder="categories" />
            <FieldError message={errors.image} />
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

      <FormAlert message={formError} />

      <div className="flex items-center justify-end gap-2">
        <Link href="/dashboard/categories" className={cn(buttonVariants({ variant: "outline" }))}>
          Cancelar
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : mode === "create" ? "Crear categoría" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
