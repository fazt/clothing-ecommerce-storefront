import { Request, Response } from "express";
import { customerService } from "./customer.service";
import type {
  CreateCustomerInput,
  ListCustomersQuery,
  UpdateCustomerInput,
} from "./customer.schema";

export const customerController = {
  list: async (req: Request, res: Response) => {
    try {
      res.json(await customerService.findAll(req.query as unknown as ListCustomersQuery));
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
      const c = await customerService.create(req.body as CreateCustomerInput);
      res.status(201).json(c);
    } catch (error: any) {
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Ya existe un cliente con ese email" });
      }
      res.status(500).json({ error: "Failed to create customer" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const c = await customerService.update(String(req.params.id), req.body as UpdateCustomerInput);
      res.json(c);
    } catch (error: any) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Customer not found" });
      }
      if (error.code === "P2002") {
        return res.status(409).json({ error: "Ya existe un cliente con ese email" });
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
      if (error.code === "P2003") {
        return res
          .status(409)
          .json({ error: "No se puede eliminar un cliente con pedidos" });
      }
      res.status(500).json({ error: "Failed to delete customer" });
    }
  },
};
