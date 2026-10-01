"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import type { ApiOrder } from "@/lib/api-types";
import { cn } from "@/lib/utils";
import { CartClearer } from "./cart-clearer";

export type ReturnedPayment = { provider: "stripe" | "paypal"; id: string } | null;

// Stripe: check the Checkout Session was paid. PayPal: capture the approved order.
function confirmPayment({ provider, id }: NonNullable<ReturnedPayment>): Promise<ApiOrder> {
  return provider === "stripe"
    ? api.payments.confirmStripeSession(id)
    : api.payments.capturePaypalOrder(id);
}

type CaptureState =
  | { status: "loading" }
  | { status: "done"; order: ApiOrder }
  | { status: "error"; message: string };

export function CaptureView({ payment }: { payment: ReturnedPayment }) {
  const [state, setState] = useState<CaptureState>(
    payment
      ? { status: "loading" }
      : {
          status: "error",
          message:
            "No recibimos el identificador del pago. Vuelve al carrito e inténtalo de nuevo.",
        },
  );
  // Capturing charges the buyer: never fire it twice (StrictMode re-runs effects).
  const started = useRef(false);

  const provider = payment?.provider;
  const paymentId = payment?.id;

  useEffect(() => {
    if (!provider || !paymentId || started.current) return;
    started.current = true;
    confirmPayment({ provider, id: paymentId }).then(
      (order) => setState({ status: "done", order }),
      (e: unknown) =>
        setState({
          status: "error",
          message: e instanceof Error ? e.message : "Error al confirmar el pago",
        }),
    );
  }, [provider, paymentId]);

  if (state.status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-background p-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Confirmando tu pago con {payment?.provider === "stripe" ? "Stripe" : "PayPal"}...
        </p>
      </div>
    );
  }

  if (state.status === "error") {
    return <ErrorPanel message={state.message} />;
  }

  const { order } = state;

  return (
    <>
      <CartClearer />
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-background p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold">¡Pago confirmado!</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Tu pedido{" "}
          <span className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>{" "}
          se ha registrado por un total de ${Number(order.total).toFixed(2)}.
        </p>
        <ul className="w-full divide-y rounded-lg border text-left">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
            >
              <span className="font-medium">{item.product?.name ?? "Producto"}</span>
              <span className="text-muted-foreground">
                x{item.quantity} · ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <Link
            href="/dashboard/my-orders"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Volver a la tienda
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
      <Link
        href="/checkout"
        className={cn(buttonVariants({ variant: "default" }))}
      >
        Volver al checkout
      </Link>
    </div>
  );
}
