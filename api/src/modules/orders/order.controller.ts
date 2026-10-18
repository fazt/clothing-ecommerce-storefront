import { Request, Response } from "express";
import { orderService } from "./order.service";
import { sendCheckoutError } from "../payments";
import type { CreateOrderInput, ListOrdersQuery, UpdateOrderInput } from "./order.schema";

export const orderController = {
  list: async (req: Request, res: Response) => {
    try {
      res.json(await orderService.findAll(req.query as unknown as ListOrdersQuery));
    } catch (error) {
      sendCheckoutError(req, res, error, "Failed to fetch orders");
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const order = await orderService.findById(String(req.params.id));
      if (!order) return res.status(404).json({ error: "Order not found" });
      res.json(order);
    } catch (error) {
      sendCheckoutError(req, res, error, "Failed to fetch order");
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const order = await orderService.create(req.body as CreateOrderInput);
      res.status(201).json(order);
    } catch (error) {
      sendCheckoutError(req, res, error, "Failed to create order");
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const order = await orderService.update(String(req.params.id), req.body as UpdateOrderInput);
      res.json(order);
    } catch (error) {
      sendCheckoutError(req, res, error, "Failed to update order");
    }
  },

  refund: async (req: Request, res: Response) => {
    try {
      res.json(await orderService.refund(String(req.params.id)));
    } catch (error) {
      sendCheckoutError(req, res, error, "No se pudo reembolsar la orden");
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      await orderService.remove(String(req.params.id));
      res.status(204).send();
    } catch (error) {
      sendCheckoutError(req, res, error, "Failed to delete order");
    }
  },
};
