import { z } from "zod";

const optionalLabel = z
  .string()
  .trim()
  .max(50)
  .transform((v) => v || null)
  .nullable()
  .optional()
  .transform((v) => v ?? null);

export const createPaypalOrderBody = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1).max(99),
        variantId: z
          .string()
          .nullable()
          .optional()
          .transform((v) => v || null),
        sizeLabel: optionalLabel,
        colorLabel: optionalLabel,
      }),
    )
    .min(1, { error: "Tu carrito está vacío" }),
});

export const captureParams = z.object({ paypalOrderId: z.string().min(1) });

export type CreatePaypalOrderInput = z.infer<typeof createPaypalOrderBody>;
