import { z } from "zod";
import { paginationQuery } from "../../lib/pagination";
import { emailField, passwordField } from "../auth/auth.schema";

const role = z.enum(["USER", "ADMIN"], { error: "Rol inválido" });

const nameField = z
  .string()
  .trim()
  .max(100)
  .transform((v) => v || null)
  .nullable();

export const listUsersQuery = paginationQuery.extend({
  role: role.optional(),
});

export const createUserBody = z.object({
  email: emailField,
  password: passwordField,
  name: nameField.optional(),
  role: role.default("USER"),
});

export const updateUserBody = z.object({
  name: nameField.optional(),
  role: role.optional(),
  password: passwordField.optional(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuery>;
export type CreateUserInput = z.infer<typeof createUserBody>;
export type UpdateUserInput = z.infer<typeof updateUserBody>;
