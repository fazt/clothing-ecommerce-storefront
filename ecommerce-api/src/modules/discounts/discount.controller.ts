import { Request, Response } from "express";
import { discountService } from "./discount.service";
import type {
  CreateDiscountInput,
  ListDiscountsQuery,
  UpdateDiscountInput,
} from "./discount.schema";

export const discountController = {
  list: async (req: Request, res: Response) => {
    try {
      res.json(await discountService.findAll(req.query as unknown as ListDiscountsQuery));
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
      const discount = await discountService.create(req.body as CreateDiscountInput);
      res.status(201).json(discount);
    } catch (error: any) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Ya existe un descuento con ese código" });
      }
      res.status(500).json({ error: "Failed to create discount" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const d = await discountService.update(String(req.params.id), req.body as UpdateDiscountInput);
      res.json(d);
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Discount not found" });
      }
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Ya existe un descuento con ese código" });
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
