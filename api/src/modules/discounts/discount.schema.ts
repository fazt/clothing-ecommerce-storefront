import { z } from "zod";
import { paginationQuery } from "../../lib/pagination";

const discountType = z.enum(["PERCENT", "FIXED", "SHIPPING"], { error: "Tipo inválido" });
const discountStatus = z.enum(["ACTIVE", "SCHEDULED", "EXPIRED"], { error: "Estado inválido" });

export const listDiscountsQuery = paginationQuery.extend({
  type: discountType.optional(),
  status: discountStatus.optional(),
});

// No defaults here: defaults would leak into PATCH through `.partial()`.
const discountFields = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, { error: "El código es obligatorio" })
    .max(50)
    .regex(/^[A-Z0-9_-]+$/, { error: "Usa solo letras, números, guiones o guion bajo" }),
  description: z
    .string()
    .trim()
    .max(255)
    .transform((v) => v || null)
    .nullable(),
  type: discountType,
  value: z.coerce.number({ error: "Valor inválido" }).min(0, { error: "El valor no puede ser negativo" }),
  limit: z.coerce
    .number({ error: "Límite inválido" })
    .int()
    .min(1, { error: "El límite debe ser al menos 1" })
    .nullable(),
  status: discountStatus,
  expiresAt: z.preprocess(
    (v) => (v === "" ? null : v),
    z.coerce.date({ error: "Fecha inválida" }).nullable(),
  ),
});

const percentAtMost100 = (d: { type?: string; value?: number }) =>
  d.type !== "PERCENT" || d.value === undefined || d.value <= 100;
const percentIssue = { error: "Un porcentaje no puede superar 100", path: ["value"] };

export const createDiscountBody = discountFields
  .extend({
    description: discountFields.shape.description.optional(),
    limit: discountFields.shape.limit.optional(),
    status: discountStatus.default("ACTIVE"),
    expiresAt: discountFields.shape.expiresAt.optional(),
  })
  .refine(percentAtMost100, percentIssue);

export const updateDiscountBody = discountFields.partial().refine(percentAtMost100, percentIssue);

export type ListDiscountsQuery = z.infer<typeof listDiscountsQuery>;
export type CreateDiscountInput = z.infer<typeof createDiscountBody>;
export type UpdateDiscountInput = z.infer<typeof updateDiscountBody>;
