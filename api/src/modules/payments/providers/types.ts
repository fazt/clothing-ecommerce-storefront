import type { PaymentProviderId } from "../../../generated/prisma/client";

export type ProviderId = PaymentProviderId;

/** Una línea del cobro (productos, envío y descuento ya prorrateados). */
export interface CheckoutLine {
  id: string;
  title: string;
  quantity: number;
  unitAmountCents: number;
}

export interface CheckoutRequest {
  orderId: string;
  /** Número legible de la orden (#1024). */
  orderNumber: number;
  /** Líneas que suman exactamente `totalCents`. */
  lines: CheckoutLine[];
  totalCents: number;
  /** ISO 4217 en mayúsculas (USD, MXN, PEN…). */
  currency: string;
  payerEmail: string;
  payerName: string | null;
  /** Vuelta tras pagar (o quedar pendiente). */
  successUrl: string;
  /** Vuelta si el comprador cancela. */
  cancelUrl: string;
  expiresAt?: Date;
}

export interface CheckoutSession {
  /** Id de la sesión / orden / preferencia en el proveedor. */
  providerRef: string;
  /** URL a la que se redirige al comprador. */
  url: string;
}

/** Evento normalizado tras verificar la firma del webhook o consultar la API del proveedor. */
export interface PaymentEvent {
  /** Id único del evento: clave de idempotencia (junto con el proveedor). */
  eventId: string;
  type: "paid" | "failed" | "ignored";
  /** Nuestra orden (metadata / custom_id / external_reference). */
  orderId?: string;
  /** Id del cobro en el proveedor: es el que se usa para reembolsar. */
  paymentRef?: string;
  amountCents?: number;
  currency?: string;
}

export interface ConfirmRequest {
  orderId: string;
  providerRef: string;
  /** Parámetros con los que el proveedor devolvió al comprador (session_id, token, payment_id…). */
  params: Record<string, string | undefined>;
}

export interface WebhookRequest {
  rawBody: Buffer;
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, unknown>;
}

export interface RefundRequest {
  paymentRef: string;
  amountCents: number;
  currency: string;
  /** Clave de idempotencia del reembolso. */
  refundKey: string;
}

/**
 * Contrato común de las pasarelas. Agregar otra (Culqi, Wompi, Paddle…) es implementar esta
 * interfaz y registrarla en `providers/index.ts`. Cada una se activa solo si sus variables de
 * entorno existen; sin ninguna, queda la simulada para la demo (apagada en producción).
 */
export interface PaymentProvider {
  readonly id: ProviderId;
  readonly label: string;
  isEnabled(): boolean;
  createCheckout(request: CheckoutRequest): Promise<CheckoutSession>;
  /** Comprueba el pago cuando el comprador vuelve a la tienda. `null` = todavía sin resultado. */
  confirm(request: ConfirmRequest): Promise<PaymentEvent | null>;
  /** Verifica la firma y traduce el aviso. Lanza `WebhookSignatureError` si no es válida. */
  parseWebhook(request: WebhookRequest): Promise<PaymentEvent>;
  /** Reembolso total o parcial de `amountCents`. */
  refund(request: RefundRequest): Promise<void>;
}

export class WebhookSignatureError extends Error {
  constructor(message = "Firma de webhook inválida") {
    super(message);
    this.name = "WebhookSignatureError";
  }
}

/** Error de la API de una pasarela (credenciales, validación, caída). */
export class ProviderApiError extends Error {
  constructor(
    public readonly provider: ProviderId,
    message: string,
  ) {
    super(message);
    this.name = "ProviderApiError";
  }
}

export const header = (req: WebhookRequest, name: string) => {
  const v = req.headers[name.toLowerCase()];
  return Array.isArray(v) ? v[0] : v;
};

/** Parsea el cuerpo crudo como JSON (o `{}` si no lo es). */
export function jsonBody<T>(req: WebhookRequest): T {
  try {
    return JSON.parse(req.rawBody.toString("utf8")) as T;
  } catch {
    return {} as T;
  }
}
