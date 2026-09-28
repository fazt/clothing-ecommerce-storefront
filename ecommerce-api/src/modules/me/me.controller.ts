import { Request, Response } from "express";
import { meService } from "./me.service";
import { orderService } from "../orders/order.service";
import type { PaginationQuery } from "../../lib/pagination";
import type { ChangePasswordInput, UpdateMeInput } from "./me.schema";

function errorCode(error: unknown): string | undefined {
  return (error as { code?: string }).code;
}

export const meController = {
  get: async (req: Request, res: Response) => {
    try {
      const user = await meService.get(req.user!.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json(user);
    } catch {
      return res.status(500).json({ error: "Failed to fetch user" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const user = await meService.update(req.user!.id, req.body as UpdateMeInput);
      return res.json(user);
    } catch (error) {
      const code = errorCode(error);
      if (code === "INVALID_PASSWORD") {
        return res.status(400).json({
          error: "La contraseña actual no es correcta",
          code,
          details: [{ path: "currentPassword", message: "La contraseña actual no es correcta" }],
        });
      }
      if (code === "P2002") {
        return res.status(409).json({ error: "Ese email ya está registrado" });
      }
      return res.status(500).json({ error: "Failed to update profile" });
    }
  },

  changePassword: async (req: Request, res: Response) => {
    try {
      await meService.changePassword(req.user!.id, req.body as ChangePasswordInput);
      return res.status(204).send();
    } catch (error) {
      const code = errorCode(error);
      if (code === "INVALID_PASSWORD") {
        return res.status(400).json({
          error: "La contraseña actual no es correcta",
          code,
          details: [{ path: "currentPassword", message: "La contraseña actual no es correcta" }],
        });
      }
      return res.status(500).json({ error: "Failed to change password" });
    }
  },

  listOrders: async (req: Request, res: Response) => {
    try {
      const query = req.query as unknown as PaginationQuery;
      return res.json(await orderService.findMine(req.user!.id, query));
    } catch {
      return res.status(500).json({ error: "Failed to fetch orders" });
    }
  },
};
