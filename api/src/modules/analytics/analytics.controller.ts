import { Request, Response } from "express";
import { analyticsService } from "./analytics.service";

export const analyticsController = {
  summary: async (req: Request, res: Response) => {
    try {
      res.json(await analyticsService.summary());
    } catch (error) {
      req.log?.error({ err: error }, "analytics: no se pudo calcular el resumen");
      res.status(500).json({ error: "Failed to compute analytics" });
    }
  },
};
