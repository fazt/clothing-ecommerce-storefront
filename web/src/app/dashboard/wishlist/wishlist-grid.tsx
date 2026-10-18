"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type { WishlistEntry } from "@/lib/api-types";
import { cn } from "@/lib/utils";

/** Mismo slug que usa la tienda para las URLs de producto. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function WishlistGrid() {
  const [items, setItems] = useState<WishlistEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.wishlist.list().then(
      ({ data }) => !cancelled && setItems(data),
      (e: unknown) => !cancelled && setError(e instanceof Error ? e.message : "No se pudo cargar tu lista"),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  async function remove(productId: string) {
    setItems((prev) => prev?.filter((i) => i.product.id !== productId) ?? null);
    await api.wishlist.remove(productId).catch(() => undefined);
  }

  if (error) {
    return <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">{error}</p>;
  }
  if (items === null) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted/40" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-background p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Heart className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Tu lista está vacía</h2>
        <p className="max-w-md text-sm text-muted-foreground">Toca el corazón en cualquier prenda para guardarla aquí.</p>
        <Link href="/products" className={cn(buttonVariants({ variant: "default" }))}>
          Explorar la tienda
        </Link>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {items.map(({ product }) => {
        const inStock = product.variants.length ? product.variants.some((v) => v.stock > 0) : product.stock > 0;
        return (
          <li key={product.id} className="overflow-hidden rounded-xl border bg-background">
            <Link href={`/products/${slugify(product.name) || product.id}`} className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.imageUrl ?? product.images[0] ?? ""}
                alt={product.name}
                className="aspect-[4/5] w-full object-cover"
              />
            </Link>
            <div className="flex items-start justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <p className="text-sm">${Number(product.price).toFixed(2)}</p>
                {!inStock ? <p className="text-xs text-destructive">Agotado</p> : null}
              </div>
              <Button variant="ghost" size="sm" aria-label={`Quitar ${product.name}`} onClick={() => remove(product.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
