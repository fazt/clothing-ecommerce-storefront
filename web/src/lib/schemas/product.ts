// Mirrors api/src/modules/products/product.schema.ts.
import { z } from "zod";
import { optionalText, optionalUrl } from "./fields";

/** Products with 0 < stock < this are "low stock" (same as the API). */
export const LOW_STOCK_THRESHOLD = 15;

const price = z
  .string()
  .trim()
  .min(1, { error: "El precio es obligatorio" })
  .pipe(
    z.coerce
      .number<string>({ error: "Precio inválido" })
      .min(0, { error: "El precio no puede ser negativo" }),
  );

/** Optional price override; "" becomes null. */
const optionalPrice = z
  .string()
  .trim()
  .transform((v) => v || null)
  .pipe(
    z.coerce
      .number<string>({ error: "Precio inválido" })
      .min(0, { error: "El precio no puede ser negativo" })
      .nullable(),
  );

/** Whole number ≥ 0; "" counts as 0. */
const stock = z
  .string()
  .trim()
  .transform((v) => v || "0")
  .pipe(
    z.coerce
      .number<string>({ error: "Stock inválido" })
      .int({ error: "El stock debe ser un número entero" })
      .min(0, { error: "El stock no puede ser negativo" }),
  );

/** Native checkbox: present ("on") when checked, missing otherwise. */
const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on");

const variant = z.object({
  size: optionalText(50),
  color: optionalText(50),
  sku: optionalText(50),
  stock,
  price: optionalPrice,
});

// Used for both create (POST) and edit (PATCH): the form always sends every field.
export const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "El nombre es obligatorio" })
    .max(200, { error: "Máximo 200 caracteres" }),
  description: optionalText(5000),
  price,
  stock,
  imageUrl: optionalUrl,
  // Validated per slot (so errors match the gallery order), then empty slots are dropped.
  images: z
    .array(optionalUrl)
    .transform((urls) => urls.filter((url): url is string => url !== null))
    .pipe(z.array(z.string()).max(20, { error: "Máximo 20 imágenes" })),
  isNew: checkbox,
  isSale: checkbox,
  isFeatured: checkbox,
  categoryId: z.string().transform((v) => v || null),
  // A variant needs at least a size or a color; empty rows are dropped.
  variants: z
    .array(variant)
    .transform((rows) => rows.filter((v) => v.size || v.color)),
});
