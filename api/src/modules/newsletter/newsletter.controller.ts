import { Request, Response } from "express";
import { z } from "zod";
import { newsletterService } from "./newsletter.service";
import { logger } from "../../lib/logger";

export const subscribeBody = z.object({
  email: z.email({ error: "Email inválido" }).trim().toLowerCase().max(254),
});

export const newsletterController = {
  subscribe: async (req: Request, res: Response) => {
    try {
      const { email } = req.body as z.infer<typeof subscribeBody>;
      await newsletterService.subscribe(email);
      // Misma respuesta si ya estaba suscrito: no revela qué emails existen.
      res.status(201).json({ ok: true });
    } catch (err) {
      logger.error({ err }, "newsletter: no se pudo suscribir");
      res.status(500).json({ error: "Failed to subscribe" });
    }
  },
};
