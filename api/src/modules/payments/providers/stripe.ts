import crypto from "node:crypto";
import { env } from "../../../config/env";
import {
  header,
  ProviderApiError,
  WebhookSignatureError,
  type CheckoutRequest,
  type CheckoutSession,
  type ConfirmRequest,
  type PaymentEvent,
  type PaymentProvider,
  type RefundRequest,
  type WebhookRequest,
} from "./types";

const API = "https://api.stripe.com/v1";
/** Tolerancia de la marca de tiempo de la firma (anti-replay), igual que el SDK oficial. */
const TOLERANCE_SECONDS = 300;
/** Monedas sin decimales en Stripe: el monto va en unidades, no en centavos. */
const ZERO_DECIMAL = new Set(["CLP", "PYG", "JPY", "KRW", "VND"]);

export const toStripeAmount = (cents: number, currency: string) =>
  ZERO_DECIMAL.has(currency.toUpperCase()) ? Math.round(cents / 100) : cents;
export const fromStripeAmount = (amount: number, currency: string) =>
  ZERO_DECIMAL.has(currency.toUpperCase()) ? amount * 100 : amount;

async function stripeApi<T>(
  method: "GET" | "POST",
  path: string,
  params?: Record<string, string>,
  idempotencyKey?: string,
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: params && method === "POST" ? new URLSearchParams(params).toString() : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) {
    throw new ProviderApiError("STRIPE", `Stripe ${res.status}: ${json.error?.message ?? "error desconocido"}`);
  }
  return json;
}

/** Verifica `Stripe-Signature` (t=…,v1=…) con HMAC-SHA256 sobre `${t}.${rawBody}`. */
export function verifyStripeSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  secret: string,
  now = Date.now(),
): boolean {
  if (!signatureHeader) return false;
  const items = signatureHeader.split(",").map((p) => p.trim());
  const t = Number(items.find((p) => p.startsWith("t="))?.slice(2));
  const signatures = items.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!t || !signatures.length || Math.abs(now / 1000 - t) > TOLERANCE_SECONDS) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${rawBody.toString("utf8")}`)
    .digest("hex");
  return signatures.some(
    (s) => s.length === expected.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)),
  );
}

interface StripeSession {
  id: string;
  url?: string;
  payment_status?: string;
  payment_intent?: string | { id: string } | null;
  amount_total?: number;
  currency?: string;
  client_reference_id?: string | null;
  metadata?: Record<string, string>;
}

function sessionEvent(eventId: string, s: StripeSession): PaymentEvent {
  const currency = String(s.currency ?? "").toUpperCase();
  const intent = typeof s.payment_intent === "string" ? s.payment_intent : s.payment_intent?.id;
  return {
    eventId,
    type: "paid",
    orderId: s.metadata?.orderId ?? s.client_reference_id ?? undefined,
    paymentRef: intent ?? undefined,
    amountCents: fromStripeAmount(Number(s.amount_total ?? 0), currency),
    currency,
  };
}

/**
 * Stripe Checkout por API REST (sin SDK).
 * Webhook `POST /api/webhooks/stripe` con los eventos `checkout.session.completed`,
 * `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
 * y `checkout.session.expired`.
 */
export class StripeProvider implements PaymentProvider {
  readonly id = "STRIPE" as const;
  readonly label = "Tarjeta (Stripe)";

  isEnabled() {
    return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET);
  }

  async createCheckout(r: CheckoutRequest): Promise<CheckoutSession> {
    const success = new URL(r.successUrl);
    // Stripe sustituye el marcador por el id real de la sesión.
    const successUrl = `${success.toString()}${success.search ? "&" : "?"}session_id={CHECKOUT_SESSION_ID}`;
    const params: Record<string, string> = {
      mode: "payment",
      customer_email: r.payerEmail,
      client_reference_id: r.orderId,
      "metadata[orderId]": r.orderId,
      "payment_intent_data[metadata][orderId]": r.orderId,
      "payment_intent_data[description]": `Orden #${r.orderNumber}`,
      success_url: successUrl,
      cancel_url: r.cancelUrl,
      locale: "es",
    };
    r.lines.forEach((line, i) => {
      params[`line_items[${i}][quantity]`] = String(line.quantity);
      params[`line_items[${i}][price_data][currency]`] = r.currency.toLowerCase();
      params[`line_items[${i}][price_data][unit_amount]`] = String(toStripeAmount(line.unitAmountCents, r.currency));
      params[`line_items[${i}][price_data][product_data][name]`] = line.title.slice(0, 250);
    });
    // Stripe exige entre 30 minutos y 24 horas; si la reserva es más corta la vence nuestro job.
    if (r.expiresAt && r.expiresAt.getTime() - Date.now() > 31 * 60_000) {
      params.expires_at = String(Math.floor(r.expiresAt.getTime() / 1000));
    }
    const session = await stripeApi<StripeSession>("POST", "/checkout/sessions", params, `checkout-${r.orderId}`);
    if (!session.url) throw new ProviderApiError("STRIPE", "Stripe no devolvió la URL de pago");
    return { providerRef: session.id, url: session.url };
  }

  async confirm(r: ConfirmRequest): Promise<PaymentEvent | null> {
    const session = await stripeApi<StripeSession>("GET", `/checkout/sessions/${encodeURIComponent(r.providerRef)}`);
    if (session.payment_status !== "paid") return null;
    return sessionEvent(`session:${session.id}`, session);
  }

  async parseWebhook(req: WebhookRequest): Promise<PaymentEvent> {
    if (!verifyStripeSignature(req.rawBody, header(req, "stripe-signature"), env.STRIPE_WEBHOOK_SECRET!)) {
      throw new WebhookSignatureError();
    }
    const event = JSON.parse(req.rawBody.toString("utf8")) as {
      id: string;
      type: string;
      data: { object: StripeSession };
    };
    const session = event.data.object;
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        if (session.payment_status !== "paid") return { eventId: event.id, type: "ignored" };
        // Mismo id que la confirmación de la vuelta: el pago se registra una sola vez.
        return sessionEvent(`session:${session.id}`, session);
      case "checkout.session.async_payment_failed":
      case "checkout.session.expired":
        return {
          eventId: event.id,
          type: "failed",
          orderId: session.metadata?.orderId ?? session.client_reference_id ?? undefined,
        };
      default:
        return { eventId: event.id, type: "ignored" };
    }
  }

  async refund(r: RefundRequest) {
    await stripeApi(
      "POST",
      "/refunds",
      { payment_intent: r.paymentRef, amount: String(toStripeAmount(r.amountCents, r.currency)) },
      `refund-${r.refundKey}`,
    );
  }
}
