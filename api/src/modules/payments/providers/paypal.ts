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

/** Monedas que acepta PayPal. Las de LatAm sin soporte (PEN, COP, CLP, ARS…) desactivan la pasarela. */
export const PAYPAL_CURRENCIES = new Set([
  "AUD", "BRL", "CAD", "CNY", "CZK", "DKK", "EUR", "HKD", "HUF", "ILS", "JPY", "MYR",
  "MXN", "TWD", "NZD", "NOK", "PHP", "PLN", "GBP", "SGD", "SEK", "CHF", "THB", "USD",
]);
const ZERO_DECIMAL = new Set(["JPY", "HUF", "TWD"]);
const toPaypalAmount = (cents: number, currency: string) =>
  ZERO_DECIMAL.has(currency) ? String(Math.round(cents / 100)) : (cents / 100).toFixed(2);
const fromPaypalAmount = (value: string, currency: string) =>
  ZERO_DECIMAL.has(currency) ? Number(value) * 100 : Math.round(Number(value) * 100);

const baseUrl = () => (env.PAYPAL_ENV === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com");

let cachedToken: { value: string; expiresAt: number } | null = null;

async function token(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.value;
  const credentials = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${baseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new ProviderApiError("PAYPAL", `PayPal: no se pudo autenticar (${res.status})`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
  return json.access_token;
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown, requestId?: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${await token()}`,
      "Content-Type": "application/json",
      ...(requestId ? { "PayPal-Request-Id": requestId } : {}),
    },
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as T & { message?: string; details?: { issue?: string }[] };
  if (!res.ok) {
    // Orden ya capturada: no es un error para nosotros (se consulta su estado).
    if (json.details?.some((d) => d.issue === "ORDER_ALREADY_CAPTURED")) {
      return call<T>("GET", path.replace(/\/capture$/, ""));
    }
    throw new ProviderApiError("PAYPAL", `PayPal ${res.status}: ${json.message ?? "error desconocido"}`);
  }
  return json;
}

interface PaypalCapture {
  id: string;
  status: string;
  custom_id?: string;
  amount?: { currency_code: string; value: string };
}

interface PaypalOrder {
  id: string;
  status: string;
  links?: { rel: string; href: string }[];
  purchase_units?: { custom_id?: string; payments?: { captures?: PaypalCapture[] } }[];
}

/**
 * PayPal Checkout (Orders v2): crear la orden → el comprador aprueba en PayPal → vuelve a
 * /checkout/return → la API captura. El webhook `PAYMENT.CAPTURE.COMPLETED` cubre al comprador que
 * cierra la pestaña antes de volver; los dos caminos comparten el id de evento `capture:<id>`.
 */
export class PaypalProvider implements PaymentProvider {
  readonly id = "PAYPAL" as const;
  readonly label = "PayPal";

  isEnabled() {
    return Boolean(
      env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET && env.PAYPAL_WEBHOOK_ID && PAYPAL_CURRENCIES.has(env.CURRENCY),
    );
  }

  async createCheckout(r: CheckoutRequest): Promise<CheckoutSession> {
    const order = await call<PaypalOrder>(
      "POST",
      "/v2/checkout/orders",
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: r.orderId,
            custom_id: r.orderId,
            invoice_id: `atelier-${r.orderNumber}`,
            description: `Orden #${r.orderNumber}`,
            amount: { currency_code: r.currency, value: toPaypalAmount(r.totalCents, r.currency) },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              brand_name: env.APP_NAME,
              return_url: r.successUrl,
              cancel_url: r.cancelUrl,
              user_action: "PAY_NOW",
              shipping_preference: "NO_SHIPPING",
              locale: "es-ES",
            },
          },
        },
      },
      `order-${r.orderId}`,
    );
    const approve = order.links?.find((l) => l.rel === "payer-action" || l.rel === "approve");
    if (!approve) throw new ProviderApiError("PAYPAL", "PayPal: la orden no tiene enlace de aprobación");
    return { providerRef: order.id, url: approve.href };
  }

  /** Captura la orden aprobada al volver el comprador. Idempotente por PayPal-Request-Id. */
  async confirm(r: ConfirmRequest): Promise<PaymentEvent | null> {
    const result = await call<PaypalOrder>(
      "POST",
      `/v2/checkout/orders/${encodeURIComponent(r.providerRef)}/capture`,
      {},
      `capture-${r.providerRef}`,
    );
    const capture = result.purchase_units?.[0]?.payments?.captures?.[0];
    if (!capture || capture.status !== "COMPLETED") return null;
    return this.fromCapture(capture, r.orderId);
  }

  private fromCapture(c: PaypalCapture, fallbackOrderId?: string): PaymentEvent {
    const currency = c.amount?.currency_code ?? "";
    return {
      eventId: `capture:${c.id}`,
      type: "paid",
      orderId: c.custom_id ?? fallbackOrderId,
      paymentRef: c.id,
      amountCents: c.amount ? fromPaypalAmount(c.amount.value, currency) : undefined,
      currency,
    };
  }

  async parseWebhook(req: WebhookRequest): Promise<PaymentEvent> {
    const event = JSON.parse(req.rawBody.toString("utf8")) as {
      id: string;
      event_type: string;
      resource: PaypalCapture;
    };
    // Verificación oficial: PayPal valida certificado, firma y webhook id.
    const verification = await call<{ verification_status: string }>(
      "POST",
      "/v1/notifications/verify-webhook-signature",
      {
        auth_algo: header(req, "paypal-auth-algo"),
        cert_url: header(req, "paypal-cert-url"),
        transmission_id: header(req, "paypal-transmission-id"),
        transmission_sig: header(req, "paypal-transmission-sig"),
        transmission_time: header(req, "paypal-transmission-time"),
        webhook_id: env.PAYPAL_WEBHOOK_ID,
        webhook_event: event,
      },
    );
    if (verification.verification_status !== "SUCCESS") throw new WebhookSignatureError();
    switch (event.event_type) {
      case "PAYMENT.CAPTURE.COMPLETED":
        return this.fromCapture(event.resource);
      case "PAYMENT.CAPTURE.DENIED":
        return { eventId: event.id, type: "failed", orderId: event.resource.custom_id };
      default:
        return { eventId: event.id, type: "ignored" };
    }
  }

  async refund(r: RefundRequest) {
    await call(
      "POST",
      `/v2/payments/captures/${encodeURIComponent(r.paymentRef)}/refund`,
      { amount: { currency_code: r.currency, value: toPaypalAmount(r.amountCents, r.currency) } },
      `refund-${r.refundKey}`,
    );
  }
}
