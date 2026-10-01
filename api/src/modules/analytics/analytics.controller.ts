import { Request, Response } from "express";
import { analyticsService } from "./analytics.service";

export const analyticsController = {
  summary: async (_req: Request, res: Response) => {
    try {
      res.json(await analyticsService.summary());
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to compute analytics" });
    }
  },
};
