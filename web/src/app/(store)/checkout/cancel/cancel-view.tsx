"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/** El comprador abandonó la pasarela: se libera la reserva de stock y cupón de inmediato. */
export function CancelView({ orderId }: { orderId: string | null }) {
  const sent = useRef(false);

  useEffect(() => {
    if (!orderId || sent.current) return;
    sent.current = true;
    // Si falla no pasa nada: el job de vencimiento libera la reserva igualmente.
    api.checkout.cancel(orderId).catch(() => undefined);
  }, [orderId]);

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border bg-background p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <XCircle className="h-7 w-7 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-semibold">Pago cancelado</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        No se realizó ningún cargo. Tu carrito sigue intacto por si quieres intentarlo de nuevo.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Link href="/checkout" className={cn(buttonVariants({ variant: "default" }))}>
          Volver al checkout
        </Link>
        <Link href="/products" className={cn(buttonVariants({ variant: "outline" }))}>
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}
