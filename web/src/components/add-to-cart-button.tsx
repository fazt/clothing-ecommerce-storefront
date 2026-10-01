"use client";

import { useState } from "react";
import { Check, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart-provider";
import type { Product } from "@/lib/products";

export function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const hasVariants = product.variants.length > 0;

  function onClick() {
    if (hasVariants) {
      // When variants exist, pushing a cart item without a selection is ambiguous.
      // The variant selector on the detail page owns this flow.
      return;
    }
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image,
      price: product.price,
      variantId: null,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <Button size="lg" className="flex-1" onClick={onClick} disabled={hasVariants}>
      {justAdded ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Añadido
        </>
      ) : (
        <>
          <ShoppingBag className="mr-2 h-4 w-4" />
          {hasVariants ? "Elige una opción" : "Añadir al carrito"}
        </>
      )}
    </Button>
  );
}
