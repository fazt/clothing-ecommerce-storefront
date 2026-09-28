import { Request, Response } from "express";
import { orderService } from "./order.service";
import type { CreateOrderInput, ListOrdersQuery, UpdateOrderInput } from "./order.schema";

export const orderController = {
  list: async (req: Request, res: Response) => {
    try {
      res.json(await orderService.findAll(req.query as unknown as ListOrdersQuery));
    } catch {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const order = await orderService.findById(String(req.params.id));
      if (!order) return res.status(404).json({ error: "Order not found" });
      res.json(order);
    } catch {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const order = await orderService.create(req.body as CreateOrderInput);
      res.status(201).json(order);
    } catch {
      res.status(500).json({ error: "Failed to create order" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { status } = req.body as UpdateOrderInput;
      const order = await orderService.updateStatus(String(req.params.id), status);
      res.json(order);
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Order not found" });
      }
      res.status(500).json({ error: "Failed to update order" });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      await orderService.remove(String(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Order not found" });
      }
      res.status(500).json({ error: "Failed to delete order" });
    }
  },
};
