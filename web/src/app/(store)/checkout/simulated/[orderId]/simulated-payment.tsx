"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FlaskConical, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type { ApiOrder } from "@/lib/api-types";
import { cn } from "@/lib/utils";

/** Pantalla de la pasarela simulada (solo demo): el comprador aprueba o rechaza el cobro. */
export function SimulatedPayment({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<ApiOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.checkout.order(orderId).then(
      (o) => !cancelled && setOrder(o),
      (e: unknown) => !cancelled && setError(e instanceof Error ? e.message : "No se encontró la orden"),
    );
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  function decide(action: "approve" | "reject") {
    setPending(action);
    api.checkout.simulate(orderId, action).then(
      () => router.replace(action === "approve" ? `/checkout/return?order=${orderId}` : `/checkout/cancel?order=${orderId}`),
      (e: unknown) => {
        setPending(null);
        setError(e instanceof Error ? e.message : "No se pudo procesar el pago");
      },
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <p className="text-sm text-destructive">{error}</p>
        <Link href="/checkout" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
          Volver al checkout
        </Link>
      </div>
    );
  }

  if (!order) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted/40" />;
  }

  const payable = order.status === "PENDING";

  return (
    <div className="rounded-xl border bg-background p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <FlaskConical className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold">Pasarela simulada</h1>
          <p className="text-xs text-muted-foreground">Modo demo: no se mueve dinero real.</p>
        </div>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Pedido</dt>
          <dd className="font-mono">#{order.number}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Artículos</dt>
          <dd>{order.items.reduce((n, i) => n + i.quantity, 0)}</dd>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <dt>Total a pagar</dt>
          <dd className="tabular-nums">${Number(order.total).toFixed(2)}</dd>
        </div>
      </dl>
      {payable ? (
        <div className="mt-8 grid gap-2 sm:grid-cols-2">
          <Button size="lg" onClick={() => decide("approve")} disabled={pending !== null}>
            {pending === "approve" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Aprobar pago
          </Button>
          <Button size="lg" variant="outline" onClick={() => decide("reject")} disabled={pending !== null}>
            {pending === "reject" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Rechazar
          </Button>
        </div>
      ) : (
        <p className="mt-6 rounded-md bg-muted/50 px-3 py-2 text-center text-sm text-muted-foreground">
          Esta orden ya no está pendiente de pago.
        </p>
      )}
    </div>
  );
}
