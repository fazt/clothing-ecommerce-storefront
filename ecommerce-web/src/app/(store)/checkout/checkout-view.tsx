"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CreditCard, ShoppingBag } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/components/cart-provider";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api-client";
import type { CheckoutItemInput, PaymentMethods } from "@/lib/api-types";

type Provider = "stripe" | "paypal";

const PROVIDER_NAME: Record<Provider, string> = { stripe: "Stripe", paypal: "PayPal" };

// Each gateway returns the URL where the buyer completes the payment.
const START_CHECKOUT: Record<Provider, (items: CheckoutItemInput[]) => Promise<string>> = {
  stripe: (items) => api.payments.createStripeSession(items).then((r) => r.url),
  paypal: (items) => api.payments.createPaypalOrder(items).then((r) => r.approveUrl),
};

function checkoutErrorMessage(provider: Provider, e: unknown): string {
  const name = PROVIDER_NAME[provider];
  if (!(e instanceof ApiError)) return `No se pudo iniciar el pago con ${name}.`;
  if (e.code === "PAYPAL_NOT_CONFIGURED") {
    return "PayPal aún no está configurado. Añade PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET al .env de la API.";
  }
  if (e.code === "STRIPE_NOT_CONFIGURED") {
    return "Stripe aún no está configurado. Añade STRIPE_SECRET_KEY al .env de la API.";
  }
  if (e.status === 502) {
    return `${name} rechazó la solicitud. Revisa las credenciales configuradas en la API.`;
  }
  if (e.status === 0 || e.status === 400 || e.status === 404) return e.message;
  return `No se pudo iniciar el pago con ${name}.`;
}

export function CheckoutView({ methods }: { methods: PaymentMethods }) {
  const { items, subtotal, hydrated, setQuantity, removeItem } = useCart();
  const router = useRouter();
  const [pending, setPending] = useState<Provider | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!hydrated) {
    return <div className="h-40 animate-pulse rounded-lg bg-muted/40" />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-background p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">Tu carrito está vacío</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Añade algunas prendas antes de continuar al checkout.
        </p>
        <Link
          href="/products"
          className={cn(buttonVariants({ variant: "default" }))}
        >
          Ir a la tienda
        </Link>
      </div>
    );
  }

  const shipping = subtotal >= 80 ? 0 : 6.99;
  const total = subtotal + shipping;

  function startCheckout(provider: Provider) {
    setError(null);
    const payload = items.map((i) => ({
      productId: i.id,
      quantity: i.quantity,
      variantId: i.variantId ?? null,
      sizeLabel: i.sizeLabel ?? null,
      colorLabel: i.colorLabel ?? null,
    }));
    setPending(provider);
    START_CHECKOUT[provider](payload).then(
      (url) => {
        window.location.href = url;
      },
      (e: unknown) => {
        setPending(null);
        if (e instanceof ApiError && e.status === 401) {
          router.push("/login?next=/checkout");
          return;
        }
        setError(checkoutErrorMessage(provider, e));
      },
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <section className="rounded-xl border bg-background p-6">
        <h2 className="mb-4 text-lg font-semibold">Tu pedido</h2>
        <ul className="divide-y">
          {items.map((item) => (
            <li
              key={`${item.id}-${item.variantId ?? ""}`}
              className="flex items-center gap-4 py-4"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                {item.sizeLabel || item.colorLabel ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[item.sizeLabel, item.colorLabel]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center rounded-md border">
                    <button
                      type="button"
                      className="px-2 py-1 text-sm hover:bg-muted"
                      onClick={() =>
                        setQuantity(
                          item.id,
                          item.quantity - 1,
                          item.variantId,
                        )
                      }
                      aria-label="Disminuir cantidad"
                    >
                      −
                    </button>
                    <span className="px-2 text-sm tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="px-2 py-1 text-sm hover:bg-muted"
                      onClick={() =>
                        setQuantity(
                          item.id,
                          item.quantity + 1,
                          item.variantId,
                        )
                      }
                      aria-label="Aumentar cantidad"
                    >
                      +
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => removeItem(item.id, item.variantId)}
                  >
                    Eliminar
                  </Button>
                </div>
              </div>
              <p className="text-sm font-semibold">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <aside className="h-fit rounded-xl border bg-background p-6">
        <h2 className="mb-4 text-lg font-semibold">Resumen</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-medium">${subtotal.toFixed(2)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Envío</dt>
            <dd className="font-medium">
              {shipping === 0 ? "Gratis" : `$${shipping.toFixed(2)}`}
            </dd>
          </div>
        </dl>
        <Separator className="my-4" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-lg font-bold">${total.toFixed(2)}</span>
        </div>
        {error ? (
          <p
            className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {methods.stripe || methods.paypal ? (
          <>
            <div className="mt-6 flex flex-col gap-2">
              {methods.stripe ? (
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => startCheckout("stripe")}
                  disabled={pending !== null}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {pending === "stripe" ? "Redirigiendo a Stripe..." : "Pagar con tarjeta"}
                </Button>
              ) : null}
              {methods.paypal ? (
                <Button
                  size="lg"
                  variant={methods.stripe ? "outline" : "default"}
                  className="w-full"
                  onClick={() => startCheckout("paypal")}
                  disabled={pending !== null}
                >
                  {pending === "paypal" ? "Redirigiendo a PayPal..." : "Pagar con PayPal"}
                </Button>
              ) : null}
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Te redirigiremos a la pasarela de pago para completar la compra.
            </p>
          </>
        ) : (
          <p className="mt-6 rounded-md border bg-muted/40 px-3 py-2 text-center text-xs text-muted-foreground">
            Todavía no hay métodos de pago configurados en la tienda.
          </p>
        )}
      </aside>
    </div>
  );
}
