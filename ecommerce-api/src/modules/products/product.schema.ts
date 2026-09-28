import { z } from "zod";
import { paginationQuery } from "../../lib/pagination";

export const LOW_STOCK_THRESHOLD = 15;

export const listProductsQuery = paginationQuery.extend({
  categoryId: z.string().min(1).optional(),
  stock: z.enum(["in", "low", "out"]).optional(),
});

const optionalText = z
  .string()
  .trim()
  .max(50)
  .transform((v) => v || null)
  .nullable()
  .optional();

const imageUrl = z.union([z.url({ error: "URL de imagen inválida" }), z.literal("")]);

const variant = z.object({
  size: optionalText,
  color: optionalText,
  sku: optionalText,
  stock: z.coerce.number().int().min(0).default(0),
  price: z.preprocess(
    (v) => (v === "" ? null : v),
    z.coerce.number().min(0).nullable().optional(),
  ),
});

// No defaults here: defaults would leak into PATCH through `.partial()`.
const productFields = z.object({
  name: z.string().trim().min(1, { error: "El nombre es obligatorio" }).max(200),
  description: z
    .string()
    .trim()
    .max(5000)
    .transform((v) => v || null)
    .nullable(),
  price: z.coerce.number({ error: "Precio inválido" }).min(0, { error: "El precio no puede ser negativo" }),
  stock: z.coerce.number().int().min(0, { error: "El stock no puede ser negativo" }),
  imageUrl: imageUrl.transform((v) => v || null).nullable(),
  images: z.array(z.url({ error: "URL de imagen inválida" })).max(20),
  isNew: z.boolean(),
  isSale: z.boolean(),
  isFeatured: z.boolean(),
  categoryId: z
    .string()
    .transform((v) => v || null)
    .nullable(),
  // A variant needs at least a size or a color; empty rows are dropped.
  variants: z
    .array(variant)
    .transform((rows) => rows.filter((v) => v.size || v.color)),
});

export const createProductBody = productFields.extend({
  description: productFields.shape.description.optional(),
  stock: productFields.shape.stock.default(0),
  imageUrl: productFields.shape.imageUrl.optional(),
  images: productFields.shape.images.default([]),
  isNew: z.boolean().default(false),
  isSale: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  categoryId: productFields.shape.categoryId.optional(),
  variants: productFields.shape.variants.optional(),
});

export const updateProductBody = productFields.partial();

export type ListProductsQuery = z.infer<typeof listProductsQuery>;
export type CreateProductInput = z.infer<typeof createProductBody>;
export type UpdateProductInput = z.infer<typeof updateProductBody>;
export type ProductVariantInput = z.infer<typeof variant>;
