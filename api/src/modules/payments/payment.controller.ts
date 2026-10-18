import { Request, Response } from "express";
import { checkoutService } from "./checkout.service";
import { CheckoutError } from "./errors";
import { ProviderApiError } from "./providers";
import type { CheckoutBody, QuoteBody } from "./checkout.schema";

/** Errores conocidos → JSON con código estable; el resto, 500 registrado en el log. */
export function sendCheckoutError(req: Request, res: Response, error: unknown, fallback: string) {
  if (error instanceof CheckoutError) {
    return res.status(error.status).json({ error: error.message, code: error.code });
  }
  if (error instanceof ProviderApiError) {
    req.log?.error({ err: error, provider: error.provider }, "la pasarela rechazó la solicitud");
    return res.status(502).json({
      error: "La pasarela de pago rechazó la solicitud. Inténtalo de nuevo o elige otro método.",
      code: "PROVIDER_ERROR",
    });
  }
  req.log?.error({ err: error }, fallback);
  return res.status(500).json({ error: fallback });
}

const buyer = (req: Request) => ({ id: req.user!.id, email: req.user!.email });
const orderId = (req: Request) => String(req.params.id);

export const paymentController = {
  methods: (_req: Request, res: Response) => {
    res.json({ methods: checkoutService.methods() });
  },

  quote: async (req: Request, res: Response) => {
    try {
      return res.json(await checkoutService.quote(req.body as QuoteBody));
    } catch (error) {
      return sendCheckoutError(req, res, error, "No se pudo calcular el carrito");
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const result = await checkoutService.createCheckout(buyer(req), req.body as CheckoutBody);
      return res.status(201).json(result);
    } catch (error) {
      return sendCheckoutError(req, res, error, "No se pudo iniciar el pago");
    }
  },

  getOrder: async (req: Request, res: Response) => {
    try {
      return res.json(await checkoutService.getOwned(buyer(req), orderId(req)));
    } catch (error) {
      return sendCheckoutError(req, res, error, "No se pudo leer la orden");
    }
  },

  confirm: async (req: Request, res: Response) => {
    try {
      const params = req.body as Record<string, string | undefined>;
      return res.json(await checkoutService.confirm(buyer(req), orderId(req), params));
    } catch (error) {
      return sendCheckoutError(req, res, error, "No se pudo confirmar el pago");
    }
  },

  cancel: async (req: Request, res: Response) => {
    try {
      return res.json(await checkoutService.cancel(buyer(req), orderId(req)));
    } catch (error) {
      return sendCheckoutError(req, res, error, "No se pudo cancelar la orden");
    }
  },

  simulate: async (req: Request, res: Response) => {
    try {
      const { action } = req.body as { action: "approve" | "reject" };
      return res.json(await checkoutService.simulate(buyer(req), orderId(req), action));
    } catch (error) {
      return sendCheckoutError(req, res, error, "No se pudo procesar el pago simulado");
    }
  },
};
