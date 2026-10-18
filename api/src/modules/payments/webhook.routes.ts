import { Router, type Request, type Response } from "express";
import { logger } from "../../lib/logger";
import { processPaymentEvent } from "./checkout.service";
import { providerById, WEBHOOK_PROVIDERS, WebhookSignatureError, type PaymentEvent } from "./providers";

/**
 * Webhooks de las pasarelas: `POST /api/webhooks/{stripe,paypal,mercadopago}`.
 * El cuerpo llega crudo (Buffer) porque la firma se calcula sobre los bytes exactos.
 */
const router = Router();

router.post("/:provider", async (req: Request, res: Response) => {
  const providerId = WEBHOOK_PROVIDERS[String(req.params.provider)];
  if (!providerId) return res.status(404).json({ error: "Ruta no encontrada", code: "NOT_FOUND" });
  const provider = providerById(providerId);
  if (!provider.isEnabled()) {
    return res.status(503).json({ error: `${provider.label} no está configurado` });
  }
  if (!Buffer.isBuffer(req.body)) return res.status(400).json({ error: "Cuerpo inválido" });

  let event: PaymentEvent;
  try {
    event = await provider.parseWebhook({
      rawBody: req.body,
      headers: req.headers,
      query: req.query as Record<string, unknown>,
    });
  } catch (err) {
    if (err instanceof WebhookSignatureError) {
      logger.warn({ provider: providerId }, "webhook con firma inválida");
      return res.status(400).json({ error: err.message });
    }
    logger.error({ err, provider: providerId }, "webhook: no se pudo leer el aviso");
    // 500 → la pasarela reintenta más tarde.
    return res.status(500).json({ error: "No se pudo procesar el aviso" });
  }

  try {
    const result = await processPaymentEvent(providerId, event);
    logger.info({ provider: providerId, eventId: event.eventId, type: event.type, result }, "webhook procesado");
    return res.json({ received: true });
  } catch (err) {
    logger.error({ err, provider: providerId, eventId: event.eventId }, "webhook: falló al aplicar el evento");
    return res.status(500).json({ error: "No se pudo procesar el aviso" });
  }
});

export default router;
