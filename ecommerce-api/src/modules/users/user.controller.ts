import { Request, Response } from "express";
import { Role } from "@prisma/client";
import { userService } from "./user.service";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidRole = (value: unknown): value is Role => value === "USER" || value === "ADMIN";

export const userController = {
  list: async (_req: Request, res: Response) => {
    try {
      const users = await userService.findAll();
      res.json(users);
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
      const { email, password, name, role } = req.body ?? {};
      if (typeof email !== "string" || !isValidEmail(email)) {
        return res.status(400).json({ error: "Valid email is required" });
      }
      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      const user = await userService.create({
        email,
        password,
        name: typeof name === "string" ? name : null,
        role: isValidRole(role) ? role : "USER",
      });
      return res.status(201).json(user);
    } catch (error: unknown) {
      const code = (error as { code?: string }).code;
      if (code === "P2002") {
        return res.status(409).json({ error: "Email already registered" });
      }
      return res.status(500).json({ error: "Failed to create user" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const { name, role, password } = req.body ?? {};
      if (role !== undefined && !isValidRole(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      if (password !== undefined && (typeof password !== "string" || password.length < 6)) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Prevent self-demotion from ADMIN → USER to avoid admin lockout
      if (
        req.user &&
        req.user.id === req.params.id &&
        role !== undefined &&
        role !== req.user.role
      ) {
        return res
          .status(400)
          .json({ error: "No puedes cambiar tu propio rol" });
      }

      const user = await userService.update(String(req.params.id), {
        name: typeof name === "string" ? name : undefined,
        role: isValidRole(role) ? role : undefined,
        password: typeof password === "string" ? password : undefined,
      });
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
