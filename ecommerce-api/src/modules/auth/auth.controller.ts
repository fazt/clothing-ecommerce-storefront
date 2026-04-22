import { Request, Response } from "express";
import { authService } from "./auth.service";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const authController = {
  register: async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body ?? {};
      if (typeof email !== "string" || !isValidEmail(email)) {
        return res.status(400).json({ error: "Valid email is required" });
      }
      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      const result = await authService.register({ email, password, name });
      return res.status(201).json(result);
    } catch (error) {
      const code = (error as Error & { code?: string }).code;
      if (code === "EMAIL_TAKEN") {
        return res.status(409).json({ error: "Email already registered" });
      }
      return res.status(500).json({ error: "Failed to register" });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body ?? {};
      if (typeof email !== "string" || typeof password !== "string") {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const result = await authService.login({ email, password });
      return res.json(result);
    } catch (error) {
      const code = (error as Error & { code?: string }).code;
      if (code === "INVALID_CREDENTIALS") {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      return res.status(500).json({ error: "Failed to login" });
    }
  },

  me: async (req: Request, res: Response) => {
    try {
      if (!req.user) return res.status(401).json({ error: "Unauthorized" });
      const user = await authService.getMe(req.user.id);
      if (!user) return res.status(404).json({ error: "User not found" });
      return res.json(user);
    } catch {
      return res.status(500).json({ error: "Failed to fetch user" });
    }
  },

  forgotPassword: async (req: Request, res: Response) => {
    try {
      const { email } = req.body ?? {};
      if (typeof email === "string" && isValidEmail(email)) {
        // Never block response on email success/failure
        authService
          .requestPasswordReset(email)
          .catch((e) =>
            console.error("[auth.forgotPassword] request failed", e),
          );
      }
      // Always respond success to avoid email enumeration
      return res.json({ ok: true });
    } catch {
      // Even on unexpected errors, respond 200 to avoid leaking state
      return res.json({ ok: true });
    }
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body ?? {};
      await authService.resetPassword(String(token ?? ""), String(password ?? ""));
      return res.json({ ok: true });
    } catch (error) {
      const code = (error as Error & { code?: string }).code;
      if (code === "INVALID_TOKEN") {
        return res.status(400).json({ error: "Token inválido o expirado" });
      }
      if (code === "INVALID_PASSWORD") {
        return res
          .status(400)
          .json({ error: "La contraseña debe tener al menos 6 caracteres" });
      }
      console.error("[auth.resetPassword] error", error);
      return res.status(500).json({ error: "Failed to reset password" });
    }
  },
};
