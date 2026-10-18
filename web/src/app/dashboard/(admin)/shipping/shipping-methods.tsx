"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api-client";
import type { ApiShippingMethod, ShippingMethodInput } from "@/lib/api-types";
import { cn } from "@/lib/utils";

const EMPTY: ShippingMethodInput = {
  name: "",
  description: "",
  price: "",
  freeOver: "",
  minDays: 2,
  maxDays: 5,
  isActive: true,
  sortOrder: 0,
};

function toForm(m: ApiShippingMethod): ShippingMethodInput {
  return {
    name: m.name,
    description: m.description ?? "",
    price: m.price,
    freeOver: m.freeOver ?? "",
    minDays: m.minDays,
    maxDays: m.maxDays,
    isActive: m.isActive,
    sortOrder: m.sortOrder,
  };
}

export function ShippingMethods() {
  const [methods, setMethods] = useState<ApiShippingMethod[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<ShippingMethodInput>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.shipping.all().then(
      ({ data }) => {
        setMethods(data);
        setError(null);
      },
      (e: unknown) => setError(e instanceof Error ? e.message : "No se pudieron cargar los envíos"),
    );
  }, []);

  useEffect(load, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing === "new") await api.shipping.create(form);
      else if (editing) await api.shipping.update(editing, form);
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? (Object.values(err.fieldErrors)[0] ?? err.message) : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  async function remove(m: ApiShippingMethod) {
    if (!window.confirm(`¿Eliminar «${m.name}»? Si tiene pedidos, solo se desactiva.`)) return;
    try {
      await api.shipping.remove(m.id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo eliminar");
    }
  }

  const set = <K extends keyof ShippingMethodInput>(key: K, value: ShippingMethodInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setForm(EMPTY);
            setEditing("new");
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Nuevo método
        </Button>
      </div>

      {editing ? (
        <form onSubmit={save} className="grid gap-4 rounded-xl border bg-background p-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="sm-name">Nombre</Label>
            <Input id="sm-name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sm-desc">Descripción</Label>
            <Input id="sm-desc" value={form.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sm-price">Precio (USD)</Label>
            <Input
              id="sm-price"
              type="number"
              min={0}
              step="0.01"
              required
              value={String(form.price)}
              onChange={(e) => set("price", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sm-free">Gratis desde (opcional)</Label>
            <Input
              id="sm-free"
              type="number"
              min={0}
              step="0.01"
              value={String(form.freeOver ?? "")}
              onChange={(e) => set("freeOver", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sm-min">Días mínimos</Label>
            <Input id="sm-min" type="number" min={0} value={form.minDays} onChange={(e) => set("minDays", Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sm-max">Días máximos</Label>
            <Input id="sm-max" type="number" min={0} value={form.maxDays} onChange={(e) => set("maxDays", Number(e.target.value))} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sm-order">Orden</Label>
            <Input id="sm-order" type="number" min={0} value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
          </div>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
            Activo en el checkout
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Guardar
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {methods === null ? (
        <div className="h-32 animate-pulse rounded-xl bg-muted/40" />
      ) : methods.length === 0 ? (
        <p className="rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">
          No hay métodos de envío: el checkout no cobrará envío hasta que crees uno.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border bg-background">
          {methods.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className={cn("font-medium", !m.isActive && "text-muted-foreground line-through")}>{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  ${Number(m.price).toFixed(2)}
                  {m.freeOver ? ` · gratis desde $${Number(m.freeOver).toFixed(2)}` : ""} · {m.minDays}–{m.maxDays} días
                  {m._count ? ` · ${m._count.orders} pedido(s)` : ""}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Editar ${m.name}`}
                  onClick={() => {
                    setForm(toForm(m));
                    setEditing(m.id);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" aria-label={`Eliminar ${m.name}`} onClick={() => remove(m)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
