"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type { ApiOrder } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import { CartClearer } from "./cart-clearer";

type State =
  | { status: "loading" }
  | { status: "done"; order: ApiOrder }
  | { status: "error"; message: string };

const PAID = new Set(["PROCESSING", "SHIPPED", "DELIVERED"]);
const money = (v: string | number) => `$${Number(v).toFixed(2)}`;

/**
 * La API consulta a la pasarela (Stripe: sesión pagada; PayPal: captura; Mercado Pago: pago
 * aprobado). Si el pago aún está en proceso, se reintenta unas veces: el webhook puede llegar después.
 */
export function CaptureView({
  orderId,
  params,
}: {
  orderId: string | null;
  params: Record<string, string | undefined>;
}) {
  const [state, setState] = useState<State>(
    orderId
      ? { status: "loading" }
      : { status: "error", message: "No recibimos el identificador del pedido. Vuelve al carrito e inténtalo de nuevo." },
  );
  // Capturar cobra al comprador: nunca dos veces (StrictMode repite los efectos).
  const started = useRef(false);
  const paramsKey = JSON.stringify(params);

  useEffect(() => {
    if (!orderId || started.current) return;
    started.current = true;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const providerParams = JSON.parse(paramsKey) as Record<string, string | undefined>;

    const run = () => {
      attempts += 1;
      api.checkout.confirm(orderId, providerParams).then(
        (order) => {
          if (order.status === "PENDING" && attempts < 5) {
            timer = setTimeout(run, 2500);
            return;
          }
          setState({ status: "done", order });
        },
        (e: unknown) =>
          setState({ status: "error", message: e instanceof Error ? e.message : "Error al confirmar el pago" }),
      );
    };
    run();
    return () => clearTimeout(timer);
  }, [orderId, paramsKey]);

  if (state.status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-background p-10 text-center" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Confirmando tu pago…</p>
      </div>
    );
  }

  if (state.status === "error") {
    return <ErrorPanel message={state.message} />;
  }

  const { order } = state;

  if (!PAID.has(order.status)) {
    const cancelled = order.status === "CANCELLED";
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-background p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          {cancelled ? <AlertTriangle className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
        </div>
        <h1 className="text-2xl font-semibold">{cancelled ? "El pago no se completó" : "Pago en proceso"}</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {cancelled
            ? `El pedido #${order.number} se canceló y no se realizó ningún cargo. Puedes intentarlo de nuevo.`
            : `Tu pedido #${order.number} quedó registrado. Apenas la pasarela confirme el pago te enviaremos un email.`}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href={cancelled ? "/checkout" : "/dashboard/my-orders"} className={cn(buttonVariants({ variant: "default" }))}>
            {cancelled ? "Volver al checkout" : "Ver mis pedidos"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <CartClearer />
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-background p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold">¡Pago confirmado!</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Tu pedido <span className="font-mono">#{order.number}</span> se registró por un total de {money(order.total)}.
          Te enviamos la confirmación por email.
        </p>
        <ul className="w-full divide-y rounded-lg border text-left">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
              <span className="font-medium">
                {item.product?.name ?? "Producto"}
                {item.sizeLabel || item.colorLabel ? (
                  <span className="block text-xs font-normal text-muted-foreground">
                    {[item.sizeLabel, item.colorLabel].filter(Boolean).join(" · ")}
                  </span>
                ) : null}
              </span>
              <span className="text-muted-foreground tabular-nums">
                x{item.quantity} · {money(Number(item.unitPrice) * item.quantity)}
              </span>
            </li>
          ))}
          <li className="flex justify-between px-4 py-2 text-xs text-muted-foreground">
            <span>Envío{order.shippingMethod ? ` (${order.shippingMethod.name})` : ""}</span>
            <span>{Number(order.shippingTotal) === 0 ? "Gratis" : money(order.shippingTotal)}</span>
          </li>
          {Number(order.discountTotal) > 0 ? (
            <li className="flex justify-between px-4 py-2 text-xs text-emerald-700 dark:text-emerald-400">
              <span>Descuento{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span>−{money(order.discountTotal)}</span>
            </li>
          ) : null}
        </ul>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <Link href="/dashboard/my-orders" className={cn(buttonVariants({ variant: "default" }))}>
            Ver mis pedidos
          </Link>
          <Link href="/products" className={cn(buttonVariants({ variant: "outline" }))}>
            Seguir comprando
          </Link>
        </div>
      </div>
    </>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-semibold">No pudimos confirmar el pago</h1>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      <Link href="/checkout" className={cn(buttonVariants({ variant: "default" }))}>
        Volver al checkout
      </Link>
    </div>
  );
}
