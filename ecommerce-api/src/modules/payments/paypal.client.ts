export class PaypalNotConfiguredError extends Error {
  code = "PAYPAL_NOT_CONFIGURED" as const;
  constructor() {
    super("PayPal credentials are not configured");
  }
}

export class PaypalApiError extends Error {
  code = "PAYPAL_API_ERROR" as const;
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    super(`PayPal API error (${status})`);
    this.status = status;
    this.body = body;
  }
}

function getBaseUrl(): string {
  return process.env.PAYPAL_API_BASE || "https://api-m.sandbox.paypal.com";
}

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = (process.env.PAYPAL_CLIENT_ID ?? "").trim();
  const clientSecret = (process.env.PAYPAL_CLIENT_SECRET ?? "").trim();
  if (
    !clientId ||
    !clientSecret ||
    clientId.includes("placeholder") ||
    clientSecret.includes("placeholder")
  ) {
    throw new PaypalNotConfiguredError();
  }
  return { clientId, clientSecret };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.token;
  }
  const { clientId, clientSecret } = getCredentials();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
    access_token?: string;
    expires_in?: number;
    id?: string;
    status?: string;
    links?: Array<{ rel?: string; href?: string }>;
    purchase_units?: Array<{
      payments?: { captures?: Array<{ id?: string }> };
    }>;
    payer?: { email_address?: string };
  };
  if (!res.ok) throw new PaypalApiError(res.status, body);
  const token = body.access_token as string;
  const expiresIn = Number(body.expires_in ?? 3600);
  cachedToken = { token, expiresAt: Date.now() + expiresIn * 1000 };
  return token;
}

export interface CreateOrderInput {
  amount: string;
  currency: string;
  description?: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CreateOrderResult {
  id: string;
  approveUrl: string;
  raw: unknown;
}

export async function createPaypalOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const token = await getAccessToken();
  const res = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: input.currency, value: input.amount },
          description: input.description,
        },
      ],
      application_context: {
        brand_name: "Atelier",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
      },
    }),
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
    access_token?: string;
    expires_in?: number;
    id?: string;
    status?: string;
    links?: Array<{ rel?: string; href?: string }>;
    purchase_units?: Array<{
      payments?: { captures?: Array<{ id?: string }> };
    }>;
    payer?: { email_address?: string };
  };
  if (!res.ok) throw new PaypalApiError(res.status, body);
  const links = Array.isArray(body.links) ? body.links : [];
  const approveLink = links.find((l: { rel?: string }) => l.rel === "approve");
  if (!approveLink?.href) {
    throw new PaypalApiError(500, { error: "Missing approve link", body });
  }
  return { id: body.id as string, approveUrl: approveLink.href as string, raw: body };
}

export interface CaptureOrderResult {
  status: string;
  captureId: string | null;
  payerEmail: string | null;
  raw: unknown;
}

export async function capturePaypalOrder(
  paypalOrderId: string,
): Promise<CaptureOrderResult> {
  const token = await getAccessToken();
  const res = await fetch(
    `${getBaseUrl()}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
    access_token?: string;
    expires_in?: number;
    id?: string;
    status?: string;
    links?: Array<{ rel?: string; href?: string }>;
    purchase_units?: Array<{
      payments?: { captures?: Array<{ id?: string }> };
    }>;
    payer?: { email_address?: string };
  };
  if (!res.ok) throw new PaypalApiError(res.status, body);
  const firstUnit = body.purchase_units?.[0];
  const firstCapture = firstUnit?.payments?.captures?.[0];
  return {
    status: body.status as string,
    captureId: firstCapture?.id ?? null,
    payerEmail: body.payer?.email_address ?? null,
    raw: body,
  };
}
