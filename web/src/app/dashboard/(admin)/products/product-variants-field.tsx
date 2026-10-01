"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "@/components/form-message";
import type { FieldErrors } from "@/hooks/use-api-form";
import type { ApiProductVariant } from "@/lib/api-types";

/** One editable row. Values stay strings; the product schema parses them. */
export type VariantDraft = {
  key: string;
  size: string;
  color: string;
  sku: string;
  stock: string;
  price: string;
};

const FIELD_LABELS = {
  size: "Talle",
  color: "Color",
  sku: "SKU",
  stock: "Stock",
  price: "Precio",
} as const;

type VariantField = keyof typeof FIELD_LABELS;

let nextKey = 0;

export function toVariantDrafts(variants: ApiProductVariant[] = []): VariantDraft[] {
  return variants.map((v) => ({
    key: v.id,
    size: v.size ?? "",
    color: v.color ?? "",
    sku: v.sku ?? "",
    stock: String(v.stock ?? 0),
    price: v.price ?? "",
  }));
}

function newDraft(): VariantDraft {
  return {
    key: `new-${nextKey++}`,
    size: "",
    color: "",
    sku: "",
    stock: "0",
    price: "",
  };
}

export function ProductVariantsField({
  rows,
  onChange,
  errors = {},
}: {
  rows: VariantDraft[];
  onChange: (rows: VariantDraft[]) => void;
  /** Form errors; rows read `variants.<index>.<field>`. */
  errors?: FieldErrors;
}) {
  function update(key: string, patch: Partial<VariantDraft>) {
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function remove(key: string) {
    onChange(rows.filter((r) => r.key !== key));
  }

  function add() {
    onChange([...rows, newDraft()]);
  }

  return (
    <div className="space-y-3">
      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
          Sin variantes. Si el producto se vende como un único SKU, puedes
          dejarlo así y se usará el stock general de arriba.
        </p>
      ) : (
        <div className="space-y-2">
          <div className="hidden grid-cols-[1fr_1fr_1fr_90px_100px_auto] gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground md:grid">
            <span>Talle</span>
            <span>Color</span>
            <span>SKU</span>
            <span>Stock</span>
            <span>Precio (override)</span>
            <span className="sr-only">Acciones</span>
          </div>
          {rows.map((r, i) => {
            const error = (field: VariantField) => errors[`variants.${i}.${field}`];
            const invalid = (field: VariantField) => (error(field) ? true : undefined);
            const rowError = (Object.keys(FIELD_LABELS) as VariantField[])
              .filter((field) => error(field))
              .map((field) => `${FIELD_LABELS[field]}: ${error(field)}`)
              .join(" · ");
            return (
              <div key={r.key} className="space-y-1">
                <div className="grid gap-2 rounded-md border bg-muted/20 p-2 md:grid-cols-[1fr_1fr_1fr_90px_100px_auto] md:items-center md:bg-transparent md:p-0 md:border-0">
                  <div className="grid gap-1 md:gap-0">
                    <Label className="text-[10px] uppercase tracking-wide md:hidden">
                      Talle
                    </Label>
                    <Input
                      value={r.size}
                      onChange={(e) => update(r.key, { size: e.target.value })}
                      placeholder="S / 42 / Única"
                      aria-invalid={invalid("size")}
                    />
                  </div>
                  <div className="grid gap-1 md:gap-0">
                    <Label className="text-[10px] uppercase tracking-wide md:hidden">
                      Color
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={r.color}
                        onChange={(e) => update(r.key, { color: e.target.value })}
                        placeholder="#111827 o Negro"
                        aria-invalid={invalid("color")}
                      />
                      {r.color.startsWith("#") && r.color.length >= 4 ? (
                        <span
                          className="h-6 w-6 shrink-0 rounded-full border"
                          style={{ backgroundColor: r.color }}
                          aria-hidden
                        />
                      ) : null}
                    </div>
                  </div>
                  <div className="grid gap-1 md:gap-0">
                    <Label className="text-[10px] uppercase tracking-wide md:hidden">
                      SKU
                    </Label>
                    <Input
                      value={r.sku}
                      onChange={(e) => update(r.key, { sku: e.target.value })}
                      placeholder="opcional"
                      aria-invalid={invalid("sku")}
                    />
                  </div>
                  <div className="grid gap-1 md:gap-0">
                    <Label className="text-[10px] uppercase tracking-wide md:hidden">
                      Stock
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={r.stock}
                      onChange={(e) => update(r.key, { stock: e.target.value })}
                      aria-invalid={invalid("stock")}
                    />
                  </div>
                  <div className="grid gap-1 md:gap-0">
                    <Label className="text-[10px] uppercase tracking-wide md:hidden">
                      Precio (override)
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={r.price}
                      onChange={(e) => update(r.key, { price: e.target.value })}
                      placeholder="usa precio base"
                      aria-invalid={invalid("price")}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => remove(r.key)}
                      aria-label="Quitar variante"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <FieldError message={rowError} className="px-1" />
              </div>
            );
          })}
        </div>
      )}

      <FieldError message={errors.variants} />

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1 h-4 w-4" />
        Agregar variante
      </Button>
    </div>
  );
}
