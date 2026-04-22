import { Request, Response } from "express";
import { OrderStatus } from "@prisma/client";
import { orderService } from "./order.service";

const VALID_STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export const orderController = {
  list: async (_req: Request, res: Response) => {
    try {
      const orders = await orderService.findAll();
      res.json(orders);
    } catch {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  },

  listMine: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const orders = await orderService.findMine(req.user.id);
      res.json(orders);
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
      const { customerId, paymentMethod, status, items } = req.body;
      if (!customerId || !paymentMethod || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          error: "customerId, paymentMethod and non-empty items[] are required",
        });
      }
      const order = await orderService.create({
        customerId,
        paymentMethod,
        status,
        items,
      });
      res.status(201).json(order);
    } catch {
      res.status(500).json({ error: "Failed to create order" });
    }
  },

  updateStatus: async (req: Request, res: Response) => {
    try {
      const status = req.body.status as OrderStatus;
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
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
