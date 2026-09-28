import { z } from "zod";
import { booleanQuery, paginationQuery } from "../../lib/pagination";

export const listCategoriesQuery = paginationQuery.extend({
  isVisible: booleanQuery.optional(),
});

// No defaults here: defaults would leak into PATCH through `.partial()`.
const categoryFields = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
      error: "El slug solo admite minúsculas, números y guiones",
    }),
  name: z.string().trim().min(1, { error: "El nombre es obligatorio" }).max(100),
  image: z
    .union([z.url({ error: "URL de imagen inválida" }), z.literal("")])
    .transform((v) => v || null)
    .nullable(),
  isVisible: z.boolean(),
});

export const createCategoryBody = categoryFields.extend({
  image: categoryFields.shape.image.optional(),
  isVisible: z.boolean().default(true),
});

export const updateCategoryBody = categoryFields.partial();

export type ListCategoriesQuery = z.infer<typeof listCategoriesQuery>;
export type CreateCategoryInput = z.infer<typeof createCategoryBody>;
export type UpdateCategoryInput = z.infer<typeof updateCategoryBody>;
