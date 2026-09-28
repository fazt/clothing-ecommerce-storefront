import { Request, Response } from "express";
import { paymentService } from "./payment.service";
import { PaypalApiError, PaypalNotConfiguredError } from "./paypal.client";
import type { CreatePaypalOrderInput } from "./payment.schema";

export const paymentController = {
  createPaypal: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const { items } = req.body as CreatePaypalOrderInput;
      const result = await paymentService.createCheckout({
        userId: req.user.id,
        userEmail: req.user.email,
        userName: null,
        items,
      });
      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof PaypalNotConfiguredError) {
        return res.status(503).json({
          error: "PayPal no está configurado todavía",
          code: "PAYPAL_NOT_CONFIGURED",
        });
      }
      if (error instanceof PaypalApiError) {
        return res.status(502).json({
          error: "PayPal API error",
          details: error.body,
        });
      }
      const code = (error as Error & { code?: string }).code;
      if (code === "EMPTY_CART" || code === "INVALID_TOTAL") {
        return res.status(400).json({ error: (error as Error).message });
      }
      if (code === "INVALID_PRODUCT" || code === "INVALID_VARIANT") {
        return res.status(404).json({ error: (error as Error).message });
      }
      console.error("createPaypal error:", error);
      return res.status(500).json({ error: "Failed to create PayPal order" });
    }
  },

  capturePaypal: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const paypalOrderId = String(req.params.paypalOrderId);
      const order = await paymentService.capture(paypalOrderId, req.user.id);
      return res.json(order);
    } catch (error) {
      if (error instanceof PaypalNotConfiguredError) {
        return res.status(503).json({
          error: "PayPal no está configurado todavía",
          code: "PAYPAL_NOT_CONFIGURED",
        });
      }
      if (error instanceof PaypalApiError) {
        return res.status(502).json({
          error: "PayPal API error",
          details: error.body,
        });
      }
      const code = (error as Error & { code?: string }).code;
      if (code === "ORDER_NOT_FOUND") {
        return res.status(404).json({ error: "Order not found" });
      }
      if (code === "FORBIDDEN") {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (code === "CAPTURE_NOT_COMPLETED") {
        return res.status(409).json({ error: (error as Error).message });
      }
      console.error("capturePaypal error:", error);
      return res.status(500).json({ error: "Failed to capture PayPal order" });
    }
  },
};
