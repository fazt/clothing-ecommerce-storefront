import { Request, Response } from "express";
import { z } from "zod";
import { authService } from "./auth.service";
import { clearAuthCookie, setAuthCookie } from "../../lib/auth-cookie";
import { isGoogleConfigured } from "./google.client";
import {
  forgotPasswordBody,
  loginBody,
  registerBody,
  resetPasswordBody,
} from "./auth.schema";
import { isGithubConfigured } from "./github.client";

export const authController = {
  register: async (req: Request, res: Response) => {
    try {
      const input = req.body as z.infer<typeof registerBody>;
      const { token, user } = await authService.register(input);
      setAuthCookie(res, token);
      return res.status(201).json({ user });
    } catch (error) {
      const code = (error as Error & { code?: string }).code;
      if (code === "EMAIL_TAKEN") {
        return res.status(409).json({ error: "Ese email ya está registrado" });
      }
      return res.status(500).json({ error: "Failed to register" });
    }
  },

  login: async (req: Request, res: Response) => {
    try {
      const input = req.body as z.infer<typeof loginBody>;
      const { token, user } = await authService.login(input);
      setAuthCookie(res, token);
      return res.json({ user });
    } catch (error) {
      const code = (error as Error & { code?: string }).code;
      if (code === "INVALID_CREDENTIALS") {
        return res.status(401).json({ error: "Email o contraseña incorrectos" });
      }
      if (code === "PASSWORD_NOT_SET") {
        return res.status(401).json({
          error:
            "Esta cuenta se creó con un proveedor externo y no tiene contraseña. Entra con ese proveedor o crea una desde «¿Olvidaste tu contraseña?».",
          code,
        });
      }
      return res.status(500).json({ error: "Failed to login" });
    }
  },

  /** Which sign-in providers have credentials, so the web only offers those. */
  providers: (_req: Request, res: Response) => {
    res.json({ google: isGoogleConfigured(), github: isGithubConfigured() });
  },

  logout: (_req: Request, res: Response) => {
    clearAuthCookie(res);
    return res.status(204).send();
  },

  forgotPassword: async (req: Request, res: Response) => {
    const { email } = req.body as z.infer<typeof forgotPasswordBody>;
    // Never block response on email success/failure
    authService
      .requestPasswordReset(email)
      .catch((e) => console.error("[auth.forgotPassword] request failed", e));
    // Always respond success to avoid email enumeration
    return res.json({ ok: true });
  },

  resetPassword: async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body as z.infer<typeof resetPasswordBody>;
      await authService.resetPassword(token, password);
      return res.json({ ok: true });
    } catch (error) {
      const code = (error as Error & { code?: string }).code;
      if (code === "INVALID_TOKEN") {
        return res.status(400).json({ error: "Token inválido o expirado" });
      }
      console.error("[auth.resetPassword] error", error);
      return res.status(500).json({ error: "Failed to reset password" });
    }
  },
};
