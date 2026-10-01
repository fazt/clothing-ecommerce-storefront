import { z } from "zod";
import { optionalText } from "./fields";

const discountTypes = ["PERCENT", "FIXED", "SHIPPING"] as const;
const discountStatuses = ["ACTIVE", "SCHEDULED", "EXPIRED"] as const;

export const discountSchema = z
  .object({
    code: z
      .string()
      .trim()
      .toUpperCase()
      .min(1, { error: "El código es obligatorio" })
      .max(50, { error: "Máximo 50 caracteres" })
      .regex(/^[A-Z0-9_-]+$/, { error: "Usa solo letras, números, guiones o guion bajo" }),
    description: optionalText(255),
    type: z.enum(discountTypes, { error: "Tipo inválido" }),
    // Number("") is 0, so an empty value is rejected before converting.
    value: z
      .string()
      .trim()
      .min(1, { error: "El valor es obligatorio" })
      .transform(Number)
      .pipe(
        z
          .number({ error: "Valor inválido" })
          .min(0, { error: "El valor no puede ser negativo" }),
      ),
    // Empty means "sin límite".
    limit: z
      .string()
      .trim()
      .transform((v) => (v ? Number(v) : null))
      .pipe(
        z
          .number({ error: "Límite inválido" })
          .int({ error: "El límite debe ser un número entero" })
          .min(1, { error: "El límite debe ser al menos 1" })
          .nullable(),
      ),
    status: z.enum(discountStatuses, { error: "Estado inválido" }),
    // <input type="date"> gives "YYYY-MM-DD"; it is stored as UTC midnight.
    expiresAt: z
      .string()
      .trim()
      .transform((v) => v || null)
      .pipe(
        z.iso
          .date({ error: "Fecha inválida" })
          .transform((v) => new Date(`${v}T00:00:00.000Z`).toISOString())
          .nullable(),
      ),
  })
  .refine((d) => d.type !== "PERCENT" || d.value <= 100, {
    error: "Un porcentaje no puede superar 100",
    path: ["value"],
  });
