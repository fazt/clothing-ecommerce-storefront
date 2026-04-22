import { Request, Response } from "express";
import { customerService } from "./customer.service";

export const customerController = {
  list: async (_req: Request, res: Response) => {
    try {
      const customers = await customerService.findAll();
      res.json(customers);
    } catch {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const c = await customerService.findById(String(req.params.id));
      if (!c) return res.status(404).json({ error: "Customer not found" });
      res.json(c);
    } catch {
      res.status(500).json({ error: "Failed to fetch customer" });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { email, name } = req.body;
      if (!email || !name) {
        return res.status(400).json({ error: "email and name are required" });
      }
      const c = await customerService.create({ email, name });
      res.status(201).json(c);
    } catch (error: any) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Failed to create customer" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const c = await customerService.update(String(req.params.id), req.body);
      res.json(c);
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.status(500).json({ error: "Failed to update customer" });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      await customerService.remove(String(req.params.id));
      res.status(204).send();
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Customer not found" });
      }
      res.status(500).json({ error: "Failed to delete customer" });
    }
  },
};
