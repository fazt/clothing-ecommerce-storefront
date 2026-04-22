"use client";

import { useMemo, useState } from "react";
import { Check, Heart, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import type { Product, ProductVariant } from "@/lib/products";

function findVariant(
  variants: ProductVariant[],
  size: string | null,
  color: string | null,
): ProductVariant | null {
  return (
    variants.find(
      (v) => (v.size ?? null) === size && (v.color ?? null) === color,
    ) ?? null
  );
}

export function ProductVariantSelector({ product }: { product: Product }) {
  const hasVariants = product.variants.length > 0;
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const [size, setSize] = useState<string | null>(
    product.sizes.length > 0 ? product.sizes[0] : null,
  );
  const [color, setColor] = useState<string | null>(
    product.colors.length > 0 ? product.colors[0] : null,
  );

  const selectedVariant = useMemo(() => {
    if (!hasVariants) return null;
    return findVariant(product.variants, size, color);
  }, [hasVariants, product.variants, size, color]);

  const currentPrice = selectedVariant?.price ?? product.price;
  const currentStock = selectedVariant?.stock ?? product.stock;
  const outOfStock = hasVariants
    ? !selectedVariant || selectedVariant.stock <= 0
    : product.stock <= 0;

  function isSizeAvailable(s: string): boolean {
    if (!hasVariants) return true;
    return product.variants.some(
      (v) => v.size === s && (color === null || v.color === color) && v.stock > 0,
    );
  }

  function isColorAvailable(c: string): boolean {
    if (!hasVariants) return true;
    return product.variants.some(
      (v) => v.color === c && (size === null || v.size === size) && v.stock > 0,
    );
  }

  function onAdd() {
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: currentPrice,
      variantId: selectedVariant?.id ?? null,
      sizeLabel: hasVariants ? size : null,
      colorLabel: hasVariants ? color : null,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <div className="flex flex-col">
      <div className="mt-5 flex items-end gap-3">
        <span className="text-3xl font-bold">${currentPrice.toFixed(2)}</span>
        {hasVariants && selectedVariant?.price &&
        selectedVariant.price !== product.price ? (
          <span className="text-sm text-muted-foreground">
            Base ${product.price.toFixed(2)}
          </span>
        ) : null}
      </div>

      {product.colors.length > 0 ? (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Color</h3>
            <span className="text-xs text-muted-foreground">
              {product.colors.length} opciones
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {product.colors.map((c) => {
              const isSelected = c === color;
              const available = isColorAvailable(c);
              const isHex = c.startsWith("#");
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-pressed={isSelected}
                  title={c}
                  className={[
                    "flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-xs ring-1",
                    isSelected
                      ? "ring-2 ring-foreground"
                      : "ring-border hover:ring-foreground",
                    !available && "opacity-40",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={isHex ? { backgroundColor: c } : undefined}
                >
                  {isHex ? <span className="sr-only">{c}</span> : c}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {product.sizes.length > 0 ? (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Talla</h3>
            <button className="text-xs text-muted-foreground underline">
              Guía de tallas
            </button>
          </div>
          <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
            {product.sizes.map((s) => {
              const isSelected = s === size;
              const available = isSizeAvailable(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  aria-pressed={isSelected}
                  className={[
                    "flex h-11 items-center justify-center rounded-md border text-sm font-medium",
                    isSelected
                      ? "border-foreground bg-foreground text-background"
                      : "hover:border-foreground",
                    !available && "opacity-40",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {hasVariants ? (
        <p className="mt-4 text-xs text-muted-foreground">
          {outOfStock
            ? "Sin stock en esta combinación."
            : `${currentStock} en stock`}
        </p>
      ) : null}

      <div className="mt-8 flex gap-3">
        <Button
          size="lg"
          className="flex-1"
          onClick={onAdd}
          disabled={outOfStock}
        >
          {justAdded ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Añadido
            </>
          ) : outOfStock ? (
            "Sin stock"
          ) : (
            <>
              <ShoppingBag className="mr-2 h-4 w-4" />
              Añadir al carrito
            </>
          )}
        </Button>
        <Button size="lg" variant="outline" aria-label="Favorito">
          <Heart className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
