import { Request, Response } from "express";
import { userService } from "./user.service";
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from "./user.schema";

export const userController = {
  list: async (req: Request, res: Response) => {
    try {
      res.json(await userService.findAll(req.query as unknown as ListUsersQuery));
    } catch {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const user = await userService.findById(String(req.params.id));
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json(user);
    } catch {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const user = await userService.create(req.body as CreateUserInput);
      return res.status(201).json(user);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      if (code === "P2002") {
        return res.status(409).json({ error: "Ese email ya está registrado" });
      }
      return res.status(500).json({ error: "Failed to create user" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const input = req.body as UpdateUserInput;
      // Prevent self-demotion from ADMIN → USER to avoid admin lockout
      if (
        req.user &&
        req.user.id === String(req.params.id) &&
        input.role !== undefined &&
        input.role !== req.user.role
      ) {
        return res.status(400).json({ error: "No puedes cambiar tu propio rol" });
      }
      const user = await userService.update(String(req.params.id), input);
      return res.json(user);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      if (code === "P2025") {
        return res.status(404).json({ error: "User not found" });
      }
      return res.status(500).json({ error: "Failed to update user" });
    }
  },

  remove: async (req: Request, res: Response) => {
    try {
      if (req.user && req.user.id === req.params.id) {
        return res.status(400).json({ error: "No puedes eliminarte a ti mismo" });
      }
      await userService.remove(String(req.params.id));
      return res.status(204).send();
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      if (code === "P2025") {
        return res.status(404).json({ error: "User not found" });
      }
      return res.status(500).json({ error: "Failed to delete user" });
    }
  },
};
