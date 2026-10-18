import crypto from "node:crypto";
import { env, isProd } from "../../../config/env";
import {
  header,
  jsonBody,
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

const MP_API = "https://api.mercadopago.com";

interface MpPayment {
  id: number;
  status: string;
  external_reference: string | null;
  transaction_amount: number;
  currency_id: string;
}

async function mpFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${MP_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) {
    throw new ProviderApiError("MERCADOPAGO", `Mercado Pago ${res.status}: ${data.message ?? "error desconocido"}`);
  }
  return data;
}

const getPayment = (paymentId: string) => mpFetch<MpPayment>(`/v1/payments/${encodeURIComponent(paymentId)}`);

/**
 * Verifica la cabecera `x-signature` de un webhook de Mercado Pago.
 * Plantilla firmada: `id:{data.id};request-id:{x-request-id};ts:{ts};` con HMAC-SHA256.
 */
export function verifyMpSignature(opts: {
  secret: string;
  signatureHeader: string | undefined;
  requestId: string | undefined;
  dataId: string | undefined;
  toleranceSec?: number;
  now?: number;
}): boolean {
  if (!opts.signatureHeader) return false;
  const parts = Object.fromEntries(
    opts.signatureHeader.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    }),
  ) as Record<string, string | undefined>;
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1 || !/^[0-9a-f]+$/i.test(v1)) return false;

  const tolerance = opts.toleranceSec ?? 600;
  const tsSec = Number(ts) > 1e12 ? Number(ts) / 1000 : Number(ts);
  if (!Number.isFinite(tsSec) || Math.abs((opts.now ?? Date.now()) / 1000 - tsSec) > tolerance) return false;

  let manifest = "";
  // Los ids alfanuméricos se firman en minúsculas.
  if (opts.dataId) manifest += `id:${/^[a-z0-9]+$/i.test(opts.dataId) ? opts.dataId.toLowerCase() : opts.dataId};`;
  if (opts.requestId) manifest += `request-id:${opts.requestId};`;
  manifest += `ts:${ts};`;
  const expected = crypto.createHmac("sha256", opts.secret).update(manifest).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(v1, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function toEvent(eventId: string, p: MpPayment): PaymentEvent {
  const base = {
    eventId,
    orderId: p.external_reference ?? undefined,
    paymentRef: String(p.id),
    amountCents: Math.round(p.transaction_amount * 100),
    currency: p.currency_id,
  };
  if (p.status === "approved" || p.status === "authorized") return { ...base, type: "paid" };
  if (p.status === "rejected" || p.status === "cancelled") return { ...base, type: "failed" };
  return { ...base, type: "ignored" };
}

/**
 * Mercado Pago Checkout Pro. El webhook `POST /api/webhooks/mercadopago` verifica `x-signature`
 * y el estado real se consulta a la API (el cuerpo del aviso no es fuente de verdad).
 * Ojo: Mercado Pago cobra en la moneda de la cuenta (PEN, MXN, ARS…): configura CURRENCY.
 */
export class MercadoPagoProvider implements PaymentProvider {
  readonly id = "MERCADOPAGO" as const;
  readonly label = "Mercado Pago";

  isEnabled() {
    return Boolean(env.MP_ACCESS_TOKEN);
  }

  async createCheckout(r: CheckoutRequest): Promise<CheckoutSession> {
    const pref = await mpFetch<{ id: string; init_point: string; sandbox_init_point: string }>(
      "/checkout/preferences",
      {
        method: "POST",
        headers: { "X-Idempotency-Key": `pref-${r.orderId}` },
        body: JSON.stringify({
          items: r.lines.map((line) => ({
            id: line.id,
            title: line.title.slice(0, 250),
            quantity: line.quantity,
            unit_price: line.unitAmountCents / 100,
            currency_id: r.currency,
          })),
          payer: { email: r.payerEmail, name: r.payerName ?? undefined },
          external_reference: r.orderId,
          notification_url: `${env.API_URL}/api/webhooks/mercadopago`,
          back_urls: { success: r.successUrl, pending: r.successUrl, failure: r.cancelUrl },
          auto_return: "approved",
          ...(r.expiresAt ? { expires: true, expiration_date_to: r.expiresAt.toISOString() } : {}),
          statement_descriptor: env.APP_NAME.slice(0, 22).toUpperCase(),
        }),
      },
    );
    // Las credenciales de prueba (TEST-...) solo funcionan con sandbox_init_point.
    const url = env.MP_ACCESS_TOKEN!.startsWith("TEST-") ? pref.sandbox_init_point : pref.init_point;
    return { providerRef: pref.id, url };
  }

  /** Al volver, Mercado Pago añade `payment_id`; se consulta y se comprueba que sea de esta orden. */
  async confirm(r: ConfirmRequest): Promise<PaymentEvent | null> {
    const paymentId = r.params.payment_id ?? r.params.collection_id;
    if (!paymentId || !/^\d+$/.test(paymentId)) return null;
    const payment = await getPayment(paymentId);
    if (payment.external_reference !== r.orderId) return null;
    const event = toEvent(`payment:${payment.id}:${payment.status}`, payment);
    return event.type === "ignored" ? null : event;
  }

  async parseWebhook(req: WebhookRequest): Promise<PaymentEvent> {
    const body = jsonBody<{ type?: string; data?: { id?: string | number } }>(req);
    const type = String(req.query.type ?? req.query.topic ?? body.type ?? "");
    const rawId = req.query["data.id"] ?? req.query.id ?? body.data?.id;
    const dataId = rawId === undefined ? undefined : String(rawId);
    const requestId = header(req, "x-request-id");
    if (type !== "payment" || !dataId) {
      return { eventId: `ignored:${requestId ?? crypto.randomUUID()}`, type: "ignored" };
    }

    if (env.MP_WEBHOOK_SECRET) {
      const valid = verifyMpSignature({
        secret: env.MP_WEBHOOK_SECRET,
        signatureHeader: header(req, "x-signature"),
        requestId,
        dataId,
      });
      if (!valid) throw new WebhookSignatureError();
    } else if (isProd) {
      // En producción no se aceptan avisos sin firma.
      throw new WebhookSignatureError("Configura MP_WEBHOOK_SECRET para recibir webhooks de Mercado Pago");
    }

    if (!/^\d+$/.test(dataId)) return { eventId: `ignored:${dataId}`, type: "ignored" };
    const payment = await getPayment(dataId);
    // Mismo id que la confirmación de la vuelta para el mismo estado: se procesa una sola vez.
    return toEvent(`payment:${payment.id}:${payment.status}`, payment);
  }

  async refund(r: RefundRequest) {
    await mpFetch(`/v1/payments/${encodeURIComponent(r.paymentRef)}/refunds`, {
      method: "POST",
      headers: { "X-Idempotency-Key": `refund-${r.refundKey}` },
      body: JSON.stringify({ amount: r.amountCents / 100 }),
    });
  }
}
