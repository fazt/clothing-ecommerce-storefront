import { z } from "zod";
import { emailField, optionalText, passwordField } from "./fields";

export const profileSchema = z.object({
  name: optionalText(100),
  email: emailField,
  // Only rendered (and required by the API) when the email changes.
  currentPassword: z
    .string()
    .optional()
    .transform((v) => v || undefined),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, { error: "La contraseña actual es obligatoria" }),
    newPassword: passwordField,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    error: "Las contraseñas nuevas no coinciden",
    path: ["confirmPassword"],
  });
