import { Request, Response } from "express";
import { paymentService } from "./payment.service";
import {
  isPaypalConfigured,
  PaypalApiError,
  PaypalNotConfiguredError,
} from "./paypal.client";
import {
  constructWebhookEvent,
  isStripeConfigured,
  isStripeError,
  StripeNotConfiguredError,
} from "./stripe.client";
import type { CheckoutInput } from "./payment.schema";

const STATUS_BY_CODE: Record<string, number> = {
  EMPTY_CART: 400,
  INVALID_TOTAL: 400,
  INVALID_PRODUCT: 404,
  INVALID_VARIANT: 404,
  ORDER_NOT_FOUND: 404,
  FORBIDDEN: 403,
  CAPTURE_NOT_COMPLETED: 409,
  PAYMENT_NOT_COMPLETED: 409,
};

function sendPaymentError(res: Response, error: unknown, fallback: string) {
  if (error instanceof PaypalNotConfiguredError) {
    return res.status(503).json({
      error: "PayPal no está configurado todavía",
      code: error.code,
    });
  }
  if (error instanceof StripeNotConfiguredError) {
    return res.status(503).json({
      error: "Stripe no está configurado todavía",
      code: error.code,
    });
  }
  if (error instanceof PaypalApiError) {
    return res.status(502).json({
      error: "PayPal API error",
      details: error.body,
    });
  }
  if (isStripeError(error)) {
    return res.status(502).json({
      error: "Stripe rechazó la solicitud",
      code: "STRIPE_API_ERROR",
      details: error.message,
    });
  }
  const code = (error as Error & { code?: string }).code;
  const status = code ? STATUS_BY_CODE[code] : undefined;
  if (status) {
    return res.status(status).json({ error: (error as Error).message, code });
  }
  console.error(`[payments] ${fallback}:`, error);
  return res.status(500).json({ error: fallback });
}

function checkoutInput(req: Request) {
  const { items } = req.body as CheckoutInput;
  return {
    userId: req.user!.id,
    userEmail: req.user!.email,
    userName: null,
    items,
  };
}

export const paymentController = {
  /** Which gateways have credentials, so the storefront only offers those. */
  methods: (_req: Request, res: Response) => {
    res.json({ paypal: isPaypalConfigured(), stripe: isStripeConfigured() });
  },

  createPaypal: async (req: Request, res: Response) => {
    try {
      const result = await paymentService.createCheckout(checkoutInput(req));
      return res.status(201).json(result);
    } catch (error) {
      return sendPaymentError(res, error, "Failed to create PayPal order");
    }
  },

  capturePaypal: async (req: Request, res: Response) => {
    try {
      const paypalOrderId = String(req.params.paypalOrderId);
      const order = await paymentService.capture(paypalOrderId, req.user!.id);
      return res.json(order);
    } catch (error) {
      return sendPaymentError(res, error, "Failed to capture PayPal order");
    }
  },

  createStripe: async (req: Request, res: Response) => {
    try {
      const result = await paymentService.createStripeCheckout(checkoutInput(req));
      return res.status(201).json(result);
    } catch (error) {
      return sendPaymentError(res, error, "Failed to create Stripe checkout session");
    }
  },

  confirmStripe: async (req: Request, res: Response) => {
    try {
      const sessionId = String(req.params.sessionId);
      const order = await paymentService.confirmStripeSession(sessionId, req.user!.id);
      return res.json(order);
    } catch (error) {
      return sendPaymentError(res, error, "Failed to confirm Stripe payment");
    }
  },

  stripeWebhook: async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];
    if (typeof signature !== "string" || !Buffer.isBuffer(req.body)) {
      return res.status(400).json({ error: "Missing Stripe signature" });
    }

    let event;
    try {
      event = constructWebhookEvent(req.body, signature);
    } catch (error) {
      if (error instanceof StripeNotConfiguredError) {
        return res.status(503).json({ error: error.message, code: error.code });
      }
      return res.status(400).json({ error: "Invalid Stripe signature" });
    }

    try {
      await paymentService.handleStripeEvent(event);
      return res.json({ received: true });
    } catch (error) {
      // A non-2xx makes Stripe retry the delivery later.
      console.error("[payments] Stripe webhook failed:", error);
      return res.status(500).json({ error: "Failed to process Stripe event" });
    }
  },
};
