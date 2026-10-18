"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CreditCard, Loader2, ShoppingBag, Tag, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/components/cart-provider";
import { cn } from "@/lib/utils";
import { api, ApiError } from "@/lib/api-client";
import type { PaymentMethod, PaymentProviderId, Quote, ShippingAddressInput } from "@/lib/api-types";

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

const ADDRESS_KEY = "atelier:checkout:address";

const EMPTY_ADDRESS: ShippingAddressInput = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postalCode: "",
  country: "Perú",
};

const PROVIDER_HINT: Record<PaymentProviderId, string> = {
  STRIPE: "Visa, Mastercard y Amex con Stripe Checkout.",
  PAYPAL: "Paga con tu cuenta PayPal o tarjeta.",
  MERCADOPAGO: "Tarjetas, Yape y efectivo con Mercado Pago.",
  SIMULATED: "Demo: apruebas o rechazas el pago en una pantalla de prueba.",
};

function errorMessage(e: unknown): string {
  if (!(e instanceof ApiError)) return "No se pudo iniciar el pago. Inténtalo de nuevo.";
  if (e.status === 429) return "Demasiados intentos seguidos. Espera unos minutos.";
  const field = Object.values(e.fieldErrors)[0];
  return field ?? e.message;
}

function loadAddress(defaultName: string): ShippingAddressInput {
  if (typeof window === "undefined") return { ...EMPTY_ADDRESS, name: defaultName };
  try {
    const raw = window.localStorage.getItem(ADDRESS_KEY);
    if (raw) return { ...EMPTY_ADDRESS, ...(JSON.parse(raw) as ShippingAddressInput) };
  } catch {
    // almacenamiento no disponible
  }
  return { ...EMPTY_ADDRESS, name: defaultName };
}

export function CheckoutView({ methods, defaultName }: { methods: PaymentMethod[]; defaultName: string }) {
  const { items, hydrated, setQuantity, removeItem } = useCart();
  const router = useRouter();
  // Inicializador perezoso: en el servidor no hay localStorage (y allí solo se pinta el esqueleto).
  const [address, setAddress] = useState<ShippingAddressInput>(() => loadAddress(defaultName));
  const [shippingMethodId, setShippingMethodId] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [provider, setProvider] = useState<PaymentProviderId | null>(methods[0]?.id ?? null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [resolvedKey, setResolvedKey] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cartKey = useMemo(
    () => JSON.stringify(items.map((i) => [i.id, i.variantId ?? null, i.quantity])),
    [items],
  );
  const requestKey = JSON.stringify([cartKey, couponCode, shippingMethodId]);
  const quoting = resolvedKey !== requestKey;

  // Los totales SIEMPRE los calcula la API (precios, envío y cupón del servidor).
  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    let cancelled = false;
    api.checkout
      .quote({
        items: items.map((i) => ({ productId: i.id, variantId: i.variantId ?? null, quantity: i.quantity })),
        couponCode,
        shippingMethodId,
      })
      .then(
        (q) => {
          if (cancelled) return;
          setQuote(q);
          setQuoteError(null);
          setResolvedKey(requestKey);
          if (!shippingMethodId && q.shippingMethod) setShippingMethodId(q.shippingMethod.id);
        },
        (e: unknown) => {
          if (cancelled) return;
          setQuote(null);
          setQuoteError(e instanceof Error ? e.message : "No se pudo calcular el total");
          setResolvedKey(requestKey);
        },
      );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, requestKey]);

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
        <p className="max-w-md text-sm text-muted-foreground">Añade algunas prendas antes de continuar al checkout.</p>
        <Link href="/products" className={cn(buttonVariants({ variant: "default" }))}>
          Ir a la tienda
        </Link>
      </div>
    );
  }

  const lineFor = (id: string, variantId?: string | null) =>
    quote?.lines.find((l) => l.productId === id && (l.variantId ?? null) === (variantId ?? null));
  const stockIssue = quote?.lines.some((l) => l.quantity > l.available) ?? false;

  const update = (field: keyof ShippingAddressInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setAddress((prev) => ({ ...prev, [field]: e.target.value }));

  function startCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!provider) return;
    setError(null);
    setPending(true);
    try {
      window.localStorage.setItem(ADDRESS_KEY, JSON.stringify(address));
    } catch {
      // sin almacenamiento: no pasa nada
    }
    api.checkout
      .create({
        items: items.map((i) => ({ productId: i.id, variantId: i.variantId ?? null, quantity: i.quantity })),
        couponCode,
        shippingMethodId,
        provider,
        shipping: address,
      })
      .then(
        (result) => {
          window.location.href = result.url;
        },
        (err: unknown) => {
          setPending(false);
          if (err instanceof ApiError && err.status === 401) {
            router.push("/login?next=/checkout");
            return;
          }
          setError(errorMessage(err));
        },
      );
  }

  return (
    <form onSubmit={startCheckout} className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <section className="rounded-xl border bg-background p-6" aria-labelledby="order-title">
          <h2 id="order-title" className="mb-4 text-lg font-semibold">
            Tu pedido
          </h2>
          <ul className="divide-y">
            {items.map((item) => {
              const line = lineFor(item.id, item.variantId);
              const short = line && line.quantity > line.available;
              return (
                <li key={`${item.id}-${item.variantId ?? ""}`} className="flex items-center gap-4 py-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    {item.sizeLabel || item.colorLabel ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {[item.sizeLabel, item.colorLabel].filter(Boolean).join(" · ")}
                      </p>
                    ) : null}
                    {short ? (
                      <p className="mt-1 text-xs font-medium text-destructive">
                        {line.available > 0 ? `Solo quedan ${line.available}` : "Agotado"}
                      </p>
                    ) : null}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex items-center rounded-md border">
                        <button
                          type="button"
                          className="px-2.5 py-1 text-sm hover:bg-muted"
                          onClick={() => setQuantity(item.id, item.quantity - 1, item.variantId)}
                          aria-label="Disminuir cantidad"
                        >
                          −
                        </button>
                        <span className="px-2 text-sm tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          className="px-2.5 py-1 text-sm hover:bg-muted"
                          onClick={() => setQuantity(item.id, item.quantity + 1, item.variantId)}
                          aria-label="Aumentar cantidad"
                        >
                          +
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs text-muted-foreground"
                        onClick={() => removeItem(item.id, item.variantId)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">
                    {line ? money(line.totalCents) : `$${(item.price * item.quantity).toFixed(2)}`}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-xl border bg-background p-6" aria-labelledby="ship-title">
          <h2 id="ship-title" className="mb-4 text-lg font-semibold">
            Datos de envío
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ship-name">Nombre de quien recibe</Label>
              <Input id="ship-name" required minLength={2} autoComplete="name" value={address.name} onChange={update("name")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ship-line1">Dirección</Label>
              <Input
                id="ship-line1"
                required
                minLength={3}
                autoComplete="address-line1"
                placeholder="Av. José Larco 1232"
                value={address.line1}
                onChange={update("line1")}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ship-line2">Departamento, referencia (opcional)</Label>
              <Input id="ship-line2" autoComplete="address-line2" value={address.line2 ?? ""} onChange={update("line2")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ship-city">Ciudad</Label>
              <Input id="ship-city" required minLength={2} autoComplete="address-level2" value={address.city} onChange={update("city")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ship-region">Región / estado</Label>
              <Input id="ship-region" autoComplete="address-level1" value={address.region ?? ""} onChange={update("region")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ship-postal">Código postal</Label>
              <Input id="ship-postal" autoComplete="postal-code" value={address.postalCode ?? ""} onChange={update("postalCode")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ship-country">País</Label>
              <Input id="ship-country" required autoComplete="country-name" value={address.country} onChange={update("country")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ship-phone">Teléfono (para el courier)</Label>
              <Input id="ship-phone" type="tel" autoComplete="tel" value={address.phone ?? ""} onChange={update("phone")} />
            </div>
          </div>

          {quote && quote.shippingMethods.length > 0 ? (
            <fieldset className="mt-6">
              <legend className="mb-3 text-sm font-medium">Método de envío</legend>
              <div className="grid gap-2">
                {quote.shippingMethods.map((m) => (
                  <label
                    key={m.id}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors",
                      shippingMethodId === m.id ? "border-foreground bg-muted/40" : "hover:bg-muted/30",
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="shipping"
                        value={m.id}
                        checked={shippingMethodId === m.id}
                        onChange={() => setShippingMethodId(m.id)}
                        className="accent-foreground"
                      />
                      <span>
                        <span className="font-medium">{m.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {m.minDays === m.maxDays ? `${m.minDays} día(s)` : `${m.minDays}–${m.maxDays} días`}
                          {m.description ? ` · ${m.description}` : ""}
                          {m.freeOverCents !== null && m.costCents > 0 ? ` · gratis desde ${money(m.freeOverCents)}` : ""}
                        </span>
                      </span>
                    </span>
                    <span className="font-medium tabular-nums">{m.costCents === 0 ? "Gratis" : money(m.costCents)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-xl border bg-background p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Resumen</h2>

        <div>
          <Label htmlFor="coupon" className="mb-1.5 flex items-center gap-1.5 text-sm">
            <Tag className="h-3.5 w-3.5" /> Cupón de descuento
          </Label>
          {couponCode && quote?.coupon ? (
            <div className="flex items-center justify-between rounded-md border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-sm">
              <span>
                <span className="font-mono font-semibold">{quote.coupon.code}</span>
                {quote.coupon.description ? (
                  <span className="block text-xs text-muted-foreground">{quote.coupon.description}</span>
                ) : null}
              </span>
              <button
                type="button"
                aria-label="Quitar cupón"
                className="rounded p-1 hover:bg-muted"
                onClick={() => {
                  setCouponCode(null);
                  setCouponInput("");
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                id="coupon"
                placeholder="BIENVENIDA10"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setCouponCode(couponInput.trim() || null);
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={() => setCouponCode(couponInput.trim() || null)}>
                Aplicar
              </Button>
            </div>
          )}
          {quote?.couponError ? <p className="mt-1.5 text-xs text-destructive">{quote.couponError}</p> : null}
        </div>

        <Separator />

        {quoteError ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
            {quoteError}
          </p>
        ) : null}

        <dl className={cn("space-y-2 text-sm", quoting && "opacity-60")} aria-busy={quoting}>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-medium tabular-nums">{quote ? money(quote.subtotalCents) : "—"}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Envío</dt>
            <dd className="font-medium tabular-nums">
              {quote ? (quote.shippingCents === 0 ? "Gratis" : money(quote.shippingCents)) : "—"}
            </dd>
          </div>
          {quote && quote.discountCents > 0 ? (
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
              <dt>Descuento</dt>
              <dd className="font-medium tabular-nums">−{money(quote.discountCents)}</dd>
            </div>
          ) : null}
        </dl>
        <Separator />
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-lg font-bold tabular-nums">{quote ? money(quote.totalCents) : "—"}</span>
        </div>

        {methods.length > 0 ? (
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Método de pago</legend>
            <div className="grid gap-2">
              {methods.map((m) => (
                <label
                  key={m.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
                    provider === m.id ? "border-foreground bg-muted/40" : "hover:bg-muted/30",
                  )}
                >
                  <input
                    type="radio"
                    name="provider"
                    value={m.id}
                    checked={provider === m.id}
                    onChange={() => setProvider(m.id)}
                    className="mt-0.5 accent-foreground"
                  />
                  <span>
                    <span className="font-medium">{m.label}</span>
                    <span className="block text-xs text-muted-foreground">{PROVIDER_HINT[m.id]}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <p className="rounded-md border bg-muted/40 px-3 py-2 text-center text-xs text-muted-foreground">
            Todavía no hay métodos de pago configurados en la tienda.
          </p>
        )}

        {stockIssue ? (
          <p className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Ajusta las cantidades: algunas prendas no tienen stock suficiente.
          </p>
        ) : null}

        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={pending || !provider || !quote || quoting || stockIssue || methods.length === 0}
        >
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
          {pending ? "Redirigiendo…" : quote ? `Pagar ${money(quote.totalCents)}` : "Pagar"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Reservamos tu stock unos minutos mientras completas el pago en la pasarela.
        </p>
      </aside>
    </form>
  );
}
