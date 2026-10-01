import { Request, Response } from "express";
import { meService } from "./me.service";
import { orderService } from "../orders/order.service";
import type { PaginationQuery } from "../../lib/pagination";
import type { ChangePasswordInput, UpdateMeInput } from "./me.schema";

function errorCode(error: unknown): string | undefined {
  return (error as { code?: string }).code;
}

const PASSWORD_ERRORS: Record<string, string> = {
  INVALID_PASSWORD: "La contraseña actual no es correcta",
  PASSWORD_NOT_SET:
    "Tu cuenta no tiene contraseña porque entraste con un proveedor externo. Créala desde «¿Olvidaste tu contraseña?» en el inicio de sesión.",
};

/** 400 tied to the `currentPassword` field, or null when it is another error. */
function sendPasswordError(res: Response, code: string | undefined) {
  const message = code ? PASSWORD_ERRORS[code] : undefined;
  if (!message) return null;
  return res.status(400).json({
    error: message,
    code,
    details: [{ path: "currentPassword", message }],
  });
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
      const passwordError = sendPasswordError(res, code);
      if (passwordError) return passwordError;
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
      const passwordError = sendPasswordError(res, errorCode(error));
      if (passwordError) return passwordError;
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
