import { Request, Response } from "express";
import { DiscountType, DiscountStatus } from "@prisma/client";
import { discountService } from "./discount.service";

const VALID_TYPES: DiscountType[] = ["PERCENT", "FIXED", "SHIPPING"];
const VALID_STATUSES: DiscountStatus[] = ["ACTIVE", "SCHEDULED", "EXPIRED"];

export const discountController = {
  list: async (_req: Request, res: Response) => {
    try {
      res.json(await discountService.findAll());
    } catch {
      res.status(500).json({ error: "Failed to fetch discounts" });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const d = await discountService.findById(String(req.params.id));
      if (!d) return res.status(404).json({ error: "Discount not found" });
      res.json(d);
    } catch {
      res.status(500).json({ error: "Failed to fetch discount" });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { code, description, type, value, limit, status, expiresAt } =
        req.body;

      if (!code || !type || value === undefined) {
        return res.status(400).json({ error: "code, type and value are required" });
      }
      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: "Invalid type" });
      }
      if (status && !VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const discount = await discountService.create({
        code,
        description,
        type,
        value,
        limit: limit ?? null,
        status,
        expiresAt: expiresAt ?? null,
      });
      res.status(201).json(discount);
    } catch (error: any) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Code already exists" });
      }
      res.status(500).json({ error: "Failed to create discount" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const d = await discountService.update(String(req.params.id), req.body);
      res.json(d);
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Discount not found" });
      }
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Code already exists" });
      }
      res.status(500).json({ error: "Failed to update discount" });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      await discountService.remove(String(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Discount not found" });
      }
      res.status(500).json({ error: "Failed to delete discount" });
    }
  },
};
