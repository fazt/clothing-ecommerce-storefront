import Stripe from "stripe";

export class StripeNotConfiguredError extends Error {
  code = "STRIPE_NOT_CONFIGURED" as const;
  constructor(what = "Stripe secret key") {
    super(`${what} is not configured`);
  }
}

function secretKey(): string {
  return (process.env.STRIPE_SECRET_KEY ?? "").trim();
}

/** True when a real secret key is set (placeholders from .env.example don't count). */
export function isStripeConfigured(): boolean {
  const key = secretKey();
  return Boolean(key) && !key.includes("placeholder");
}

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (!isStripeConfigured()) throw new StripeNotConfiguredError();
  client ??= new Stripe(secretKey());
  return client;
}

/** Verifies the `Stripe-Signature` header against the raw request body. */
export function constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
  const secret = (process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();
  if (!secret || secret.includes("placeholder")) {
    throw new StripeNotConfiguredError("Stripe webhook secret");
  }
  return getStripe().webhooks.constructEvent(rawBody, signature, secret);
}

export function isStripeError(error: unknown): error is Stripe.errors.StripeError {
  return error instanceof Stripe.errors.StripeError;
}
