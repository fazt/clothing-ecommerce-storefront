import { z } from "zod";
import { emailField, optionalText, passwordField } from "./fields";

const role = z.enum(["USER", "ADMIN"], { error: "Rol inválido" });

export const userCreateSchema = z.object({
  name: optionalText(100),
  email: emailField,
  password: passwordField,
  role,
});

export const userUpdateSchema = z.object({
  name: optionalText(100),
  // Empty keeps the current password.
  password: z
    .string()
    .transform((v) => v || undefined)
    .pipe(passwordField.optional()),
  role: role.optional(),
});
