import { z } from "zod";

export const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Email inválido" }));

export const passwordField = z
  .string()
  .min(6, { error: "La contraseña debe tener al menos 6 caracteres" })
  .max(100);

export const registerBody = z.object({
  email: emailField,
  password: passwordField,
  name: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => v || undefined),
});

export const loginBody = z.object({
  email: emailField,
  password: z.string().min(1, { error: "La contraseña es obligatoria" }),
});

export const forgotPasswordBody = z.object({ email: emailField });

export const resetPasswordBody = z.object({
  token: z.string().min(1, { error: "Token inválido o expirado" }),
  password: passwordField,
});
