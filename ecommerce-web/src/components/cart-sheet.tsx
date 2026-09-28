"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useCart, type CartItem } from "@/components/cart-provider";
import { shopFontVariables } from "@/lib/fonts";

export function CartSheet() {
  const { items, count, subtotal, hydrated, setQuantity, removeItem } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" className="relative" />}
      >
        <ShoppingBag className="h-5 w-5" />
        {hydrated && count > 0 ? (
          <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-[10px]">
            {count}
          </Badge>
        ) : null}
        <span className="sr-only">Carrito</span>
      </SheetTrigger>
      {/* Portaled outside the store layout, so it re-applies the store theme. */}
      <SheetContent
        side="right"
        className={`shop-theme ${shopFontVariables} flex w-full flex-col sm:max-w-md`}
      >
        <SheetHeader>
          <SheetTitle className="font-body">
            Tu carrito ({hydrated ? count : 0})
          </SheetTitle>
        </SheetHeader>
        {!hydrated ? null : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <ShoppingBag className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium">Tu carrito está vacío</p>
            <p className="text-sm text-muted-foreground">
              Añade prendas para verlas aquí.
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {items.map((item) => (
                <CartRow
                  key={`${item.id}-${item.variantId ?? ""}`}
                  item={item}
                  onIncrement={() =>
                    setQuantity(item.id, item.quantity + 1, item.variantId)
                  }
                  onDecrement={() =>
                    setQuantity(item.id, item.quantity - 1, item.variantId)
                  }
                  onRemove={() => removeItem(item.id, item.variantId)}
                />
              ))}
            </div>
            <div className="border-t p-6">
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <Link
                href="/checkout"
                className="block"
                aria-label="Ir al checkout"
                onClick={() => setOpen(false)}
              >
                <Button className="w-full" size="lg" render={<span />}>
                  Ir al checkout
                </Button>
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function CartRow({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}: {
  item: CartItem;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-4 border-b py-4 last:border-0">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex-1">
        <div className="flex justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{item.name}</p>
            {item.sizeLabel || item.colorLabel ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {[item.sizeLabel, item.colorLabel].filter(Boolean).join(" · ")}
              </p>
            ) : null}
          </div>
          <p className="text-sm font-medium">
            ${(item.price * item.quantity).toFixed(2)}
          </p>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center rounded-md border">
            <button
              type="button"
              className="px-2 py-1 text-sm hover:bg-muted"
              onClick={onDecrement}
              aria-label="Disminuir cantidad"
            >
              −
            </button>
            <span className="px-2 text-sm tabular-nums" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              className="px-2 py-1 text-sm hover:bg-muted"
              onClick={onIncrement}
              aria-label="Aumentar cantidad"
            >
              +
            </button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={onRemove}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}
