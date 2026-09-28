import { z } from "zod";
import { emailField } from "./fields";

// Same shape for create and edit: the API's PATCH accepts both fields.
export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "El nombre es obligatorio" })
    .max(100, { error: "Máximo 100 caracteres" }),
  email: emailField,
});
