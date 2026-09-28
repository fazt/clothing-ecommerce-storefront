import { z } from "zod";
import { optionalUrl } from "./fields";

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "El nombre es obligatorio" })
    .max(100, { error: "Máximo 100 caracteres" }),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { error: "El slug es obligatorio" })
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      error: "El slug solo admite minúsculas, números y guiones",
    }),
  image: optionalUrl,
  // A checked checkbox submits "on"; an unchecked one is absent from FormData.
  isVisible: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});
