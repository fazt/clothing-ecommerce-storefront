import type { Discount, Prisma } from "../../generated/prisma/client";
import { env } from "../../config/env";
import { toCents } from "../../lib/money";
import { checkoutFail } from "./errors";

type Db = Prisma.TransactionClient;

export interface CartItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface QuoteInput {
  items: CartItemInput[];
  couponCode?: string | null;
  shippingMethodId?: string | null;
}

export interface QuoteLine {
  productId: string;
  variantId: string | null;
  name: string;
  sizeLabel: string | null;
  colorLabel: string | null;
  imageUrl: string | null;
  quantity: number;
  unitCents: number;
  totalCents: number;
  /** Stock disponible ahora (orientativo: la reserva real es atómica al crear la orden). */
  available: number;
}

export interface ShippingOption {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  /** Precio para ESTE carrito (0 si supera el umbral de envío gratis). */
  costCents: number;
  freeOverCents: number | null;
  minDays: number;
  maxDays: number;
}

export interface Quote {
  currency: string;
  lines: QuoteLine[];
  subtotalCents: number;
  shippingCents: number;
  discountCents: number;
  totalCents: number;
  shippingMethod: ShippingOption | null;
  shippingMethods: ShippingOption[];
  coupon: { id: string; code: string; type: Discount["type"]; description: string | null } | null;
  /** Motivo por el que el cupón no aplica (solo en la cotización; el checkout lo rechaza). */
  couponError: string | null;
}

/** Junta líneas repetidas del mismo producto/variante. */
export function mergeItems(items: CartItemInput[]): CartItemInput[] {
  const merged = new Map<string, CartItemInput>();
  for (const item of items) {
    const key = `${item.productId}:${item.variantId ?? ""}`;
    const prev = merged.get(key);
    merged.set(key, { ...item, variantId: item.variantId ?? null, quantity: (prev?.quantity ?? 0) + item.quantity });
  }
  return [...merged.values()];
}

/**
 * Reglas del cupón. Devuelve el descuento en centavos o el motivo por el que no aplica.
 * PERCENT y FIXED descuentan sobre el subtotal; SHIPPING deja el envío gratis.
 */
export function evaluateCoupon(
  d: Pick<Discount, "type" | "value" | "status" | "limit" | "usesCount" | "startsAt" | "expiresAt" | "minSubtotal">,
  subtotalCents: number,
  shippingCents: number,
  now = new Date(),
): { discountCents: number } | { error: string } {
  if (d.status !== "ACTIVE") return { error: "Este cupón no está activo" };
  if (d.startsAt && d.startsAt > now) return { error: "Este cupón todavía no está vigente" };
  if (d.expiresAt && d.expiresAt <= now) return { error: "Este cupón expiró" };
  if (d.limit !== null && d.usesCount >= d.limit) return { error: "Este cupón ya alcanzó su límite de usos" };
  const minCents = d.minSubtotal === null ? 0 : toCents(d.minSubtotal);
  if (subtotalCents < minCents) {
    return { error: `Este cupón requiere una compra mínima de $${(minCents / 100).toFixed(2)}` };
  }
  switch (d.type) {
    case "PERCENT": {
      const pct = Math.min(Math.max(Number(d.value), 0), 100);
      return { discountCents: Math.round((subtotalCents * pct) / 100) };
    }
    case "FIXED":
      return { discountCents: Math.min(toCents(d.value), subtotalCents) };
    case "SHIPPING":
      if (shippingCents === 0) return { error: "Tu envío ya es gratis" };
      return { discountCents: shippingCents };
    default:
      return { error: "Tipo de cupón no soportado" };
  }
}

function shippingOption(m: {
  id: string;
  name: string;
  description: string | null;
  price: unknown;
  freeOver: unknown;
  minDays: number;
  maxDays: number;
}, subtotalCents: number): ShippingOption {
  const priceCents = toCents(m.price);
  const freeOverCents = m.freeOver === null || m.freeOver === undefined ? null : toCents(m.freeOver);
  const free = freeOverCents !== null && subtotalCents >= freeOverCents;
  return {
    id: m.id,
    name: m.name,
    description: m.description,
    priceCents,
    costCents: free ? 0 : priceCents,
    freeOverCents,
    minDays: m.minDays,
    maxDays: m.maxDays,
  };
}

/**
 * Calcula el carrito con precios de la base (nunca del cliente): líneas, envío, cupón y total.
 * `strict`: el checkout exige stock suficiente y un cupón válido; la cotización solo los informa.
 */
export async function computeQuote(db: Db, input: QuoteInput, { strict }: { strict: boolean }): Promise<Quote> {
  const items = mergeItems(input.items).filter((i) => i.quantity > 0);
  if (items.length === 0) checkoutFail(400, "EMPTY_CART", "Tu carrito está vacío");

  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  const lines: QuoteLine[] = items.map((item) => {
    const product = productById.get(item.productId);
    if (!product) checkoutFail(404, "INVALID_PRODUCT", "Uno de los productos ya no existe");
    const p = product!;
    let variant: (typeof p.variants)[number] | undefined;
    if (item.variantId) {
      variant = p.variants.find((v) => v.id === item.variantId);
      if (!variant) checkoutFail(404, "INVALID_VARIANT", `La talla/color elegida de «${p.name}» ya no existe`);
    } else if (p.variants.length > 0) {
      checkoutFail(400, "VARIANT_REQUIRED", `Elige talla y color de «${p.name}»`);
    }
    const unitCents = toCents(variant?.price ?? p.price);
    const available = variant ? variant.stock : p.stock;
    if (strict && item.quantity > available) {
      checkoutFail(
        409,
        "OUT_OF_STOCK",
        available > 0
          ? `Solo quedan ${available} unidades de «${p.name}»`
          : `«${p.name}» se agotó`,
      );
    }
    return {
      productId: p.id,
      variantId: variant?.id ?? null,
      name: p.name,
      sizeLabel: variant?.size ?? null,
      colorLabel: variant?.color ?? null,
      imageUrl: p.imageUrl,
      quantity: item.quantity,
      unitCents,
      totalCents: unitCents * item.quantity,
      available,
    };
  });

  const subtotalCents = lines.reduce((sum, l) => sum + l.totalCents, 0);
  if (subtotalCents <= 0) checkoutFail(400, "INVALID_TOTAL", "El total debe ser mayor que cero");

  const methods = await db.shippingMethod.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { price: "asc" }],
  });
  const shippingMethods = methods.map((m) => shippingOption(m, subtotalCents));
  let shippingMethod: ShippingOption | null = null;
  if (input.shippingMethodId) {
    shippingMethod = shippingMethods.find((m) => m.id === input.shippingMethodId) ?? null;
    if (!shippingMethod) checkoutFail(400, "INVALID_SHIPPING", "El método de envío elegido no está disponible");
  } else {
    shippingMethod = shippingMethods[0] ?? null;
  }
  const shippingCents = shippingMethod?.costCents ?? 0;

  let coupon: Quote["coupon"] = null;
  let couponError: string | null = null;
  let discountCents = 0;
  const code = input.couponCode?.trim().toUpperCase();
  if (code) {
    const discount = await db.discount.findUnique({ where: { code } });
    const result = discount
      ? evaluateCoupon(discount, subtotalCents, shippingCents)
      : { error: "El cupón no existe" };
    if ("error" in result) {
      if (strict) checkoutFail(400, "COUPON_INVALID", result.error);
      couponError = result.error;
    } else {
      discountCents = result.discountCents;
      coupon = { id: discount!.id, code: discount!.code, type: discount!.type, description: discount!.description };
    }
  }

  return {
    currency: env.CURRENCY,
    lines,
    subtotalCents,
    shippingCents,
    discountCents,
    totalCents: subtotalCents + shippingCents - discountCents,
    shippingMethod,
    shippingMethods,
    coupon,
    couponError,
  };
}
