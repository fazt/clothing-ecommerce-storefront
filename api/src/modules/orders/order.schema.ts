import { z } from "zod";
import { paginationQuery } from "../../lib/pagination";

export const orderStatus = z.enum(
  ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
  { error: "Estado inválido" },
);

export const listOrdersQuery = paginationQuery.extend({
  status: orderStatus.optional(),
});

const optionalLabel = z
  .string()
  .trim()
  .max(50)
  .transform((v) => v || null)
  .nullable()
  .optional();

export const createOrderBody = z.object({
  customerId: z.string().min(1, { error: "El cliente es obligatorio" }),
  paymentMethod: z.string().trim().min(1, { error: "El método de pago es obligatorio" }).max(50),
  status: orderStatus.optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.coerce.number().int().min(1),
        unitPrice: z.coerce.number().min(0).optional(),
        variantId: z.string().min(1).nullable().optional(),
        sizeLabel: optionalLabel,
        colorLabel: optionalLabel,
      }),
    )
    .min(1, { error: "El pedido necesita al menos un producto" }),
});

export const updateOrderBody = z.object({ status: orderStatus });

export type ListOrdersQuery = z.infer<typeof listOrdersQuery>;
export type CreateOrderInput = z.infer<typeof createOrderBody>;
export type UpdateOrderInput = z.infer<typeof updateOrderBody>;
