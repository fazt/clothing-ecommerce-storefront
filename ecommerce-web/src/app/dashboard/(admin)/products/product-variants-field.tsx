"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ApiProductVariant } from "@/lib/api";

type DraftVariant = {
  key: string;
  id?: string;
  size: string;
  color: string;
  sku: string;
  stock: string;
  price: string;
};

function toDraft(v: ApiProductVariant, i: number): DraftVariant {
  return {
    key: v.id ?? `v-${i}`,
    id: v.id,
    size: v.size ?? "",
    color: v.color ?? "",
    sku: v.sku ?? "",
    stock: String(v.stock ?? 0),
    price: v.price ?? "",
  };
}

function newDraft(): DraftVariant {
  return {
    key: `new-${Math.random().toString(36).slice(2, 8)}`,
    size: "",
    color: "",
    sku: "",
    stock: "0",
    price: "",
  };
}

export function ProductVariantsField({
  name = "variantsJson",
  initial,
}: {
  name?: string;
  initial?: ApiProductVariant[];
}) {
  const [rows, setRows] = useState<DraftVariant[]>(
    initial && initial.length > 0 ? initial.map(toDraft) : [],
  );

  const serialized = JSON.stringify(
    rows
      .filter((r) => r.size.trim() || r.color.trim())
      .map((r) => ({
        id: r.id,
        size: r.size.trim() || null,
        color: r.color.trim() || null,
        sku: r.sku.trim() || null,
        stock: Number(r.stock) || 0,
        price: r.price.trim() === "" ? null : Number(r.price),
      })),
  );

  function update(key: string, patch: Partial<DraftVariant>) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r)),
    );
  }

  function remove(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  function add() {
    setRows((prev) => [...prev, newDraft()]);
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={serialized} />

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
          {rows.map((r) => (
            <div
              key={r.key}
              className="grid gap-2 rounded-md border bg-muted/20 p-2 md:grid-cols-[1fr_1fr_1fr_90px_100px_auto] md:items-center md:bg-transparent md:p-0 md:border-0"
            >
              <div className="grid gap-1 md:gap-0">
                <Label className="text-[10px] uppercase tracking-wide md:hidden">
                  Talle
                </Label>
                <Input
                  value={r.size}
                  onChange={(e) => update(r.key, { size: e.target.value })}
                  placeholder="S / 42 / Única"
                />
              </div>
              <div className="grid gap-1 md:gap-0">
                <Label className="text-[10px] uppercase tracking-wide md:hidden">
                  Color
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={r.color}
                    onChange={(e) =>
                      update(r.key, { color: e.target.value })
                    }
                    placeholder="#111827 o Negro"
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
          ))}
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="mr-1 h-4 w-4" />
        Agregar variante
      </Button>
    </div>
  );
}
