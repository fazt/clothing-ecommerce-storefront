import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => v || null);

const cartItem = z.object({
  productId: z.string().min(1),
  variantId: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v || null),
  quantity: z.coerce.number().int().min(1).max(99),
});

/** Carrito que envía la tienda: los precios se calculan en el servidor. */
export const quoteBody = z.object({
  items: z.array(cartItem).min(1, { error: "Tu carrito está vacío" }).max(50),
  couponCode: optionalText(50),
  shippingMethodId: optionalText(64),
});

export const shippingAddress = z.object({
  name: z.string().trim().min(2, { error: "Escribe el nombre de quien recibe" }).max(120),
  phone: optionalText(40),
  line1: z.string().trim().min(3, { error: "Escribe la dirección" }).max(200),
  line2: optionalText(200),
  city: z.string().trim().min(2, { error: "Escribe la ciudad" }).max(100),
  region: optionalText(100),
  postalCode: optionalText(20),
  country: z.string().trim().min(2, { error: "Elige el país" }).max(60),
});

export const checkoutBody = quoteBody.extend({
  provider: z.enum(["STRIPE", "PAYPAL", "MERCADOPAGO", "SIMULATED"]).optional().nullable(),
  shipping: shippingAddress,
});

export const orderIdParams = z.object({ id: z.uuid({ error: "Orden inválida" }) });

/** Parámetros con los que vuelve el comprador (solo se usan para consultar a la pasarela). */
export const confirmBody = z.object({
  session_id: z.string().max(255).optional(),
  token: z.string().max(255).optional(),
  payment_id: z.string().max(64).optional(),
  collection_id: z.string().max(64).optional(),
});

export const simulateBody = z.object({ action: z.enum(["approve", "reject"]) });

export type QuoteBody = z.infer<typeof quoteBody>;
export type CheckoutBody = z.infer<typeof checkoutBody>;
