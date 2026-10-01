import { z } from "zod";
import { emailField, passwordField } from "../auth/auth.schema";

export const updateMeBody = z
  .object({
    name: z
      .string()
      .trim()
      .max(100)
      .transform((v) => v || null)
      .nullable()
      .optional(),
    email: emailField.optional(),
    avatarUrl: z
      .union([z.url({ error: "URL de avatar inválida" }), z.literal("")])
      .transform((v) => v || null)
      .nullable()
      .optional(),
    // Required only when the email changes.
    currentPassword: z.string().optional(),
  })
  .strict();

export const changePasswordBody = z.object({
  currentPassword: z.string().min(1, { error: "La contraseña actual es obligatoria" }),
  newPassword: passwordField,
});

export type UpdateMeInput = z.infer<typeof updateMeBody>;
export type ChangePasswordInput = z.infer<typeof changePasswordBody>;
