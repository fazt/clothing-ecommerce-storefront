import { z } from "zod";
import { emailField, passwordField } from "./fields";

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { error: "La contraseña es obligatoria" }),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .max(100)
    .transform((v) => v || undefined),
  email: emailField,
  password: passwordField,
});

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, { error: "Token inválido o expirado" }),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    error: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });
