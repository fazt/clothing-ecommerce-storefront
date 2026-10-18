import { Prisma, type OrderStatus } from "../../generated/prisma/client";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { fromCents, toCents } from "../../lib/money";
import { emailService } from "../email";
import { checkoutFail } from "./errors";
import { computeQuote, type QuoteInput, type QuoteLine } from "./pricing";
import {
  enabledProviders,
  providerById,
  resolveProvider,
  type CheckoutLine,
  type PaymentEvent,
  type ProviderId,
} from "./providers";

type Tx = Prisma.TransactionClient;

export interface ShippingAddressInput {
  name: string;
  phone?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  region?: string | null;
  postalCode?: string | null;
  country: string;
}

export interface CheckoutInput extends QuoteInput {
  provider?: ProviderId | null;
  shipping: ShippingAddressInput;
}

export interface Buyer {
  id: string;
  email: string;
}

/** Estados en los que el cobro ya ocurrió. */
export const PAID_STATUSES: OrderStatus[] = ["PROCESSING", "SHIPPED", "DELIVERED"];

export const orderInclude = {
  items: {
    include: {
      product: { select: { id: true, name: true, imageUrl: true } },
    },
  },
  customer: { select: { id: true, name: true, email: true } },
  shippingMethod: { select: { id: true, name: true, minDays: true, maxDays: true } },
} satisfies Prisma.OrderInclude;

const webOrigin = () => new URL(env.WEB_URL).origin;

// ---------------------------------------------------------------------------
// Stock y cupones: reservas atómicas (UPDATE condicional → sin sobreventa)
// ---------------------------------------------------------------------------

/**
 * Descuenta stock de una línea. El UPDATE condicional (`stock >= qty`) bloquea la fila: dos
 * compras simultáneas de la última unidad se serializan y la segunda no encuentra stock.
 */
export async function reserveLine(tx: Tx, line: Pick<QuoteLine, "productId" | "variantId" | "quantity" | "name">) {
  if (line.variantId) {
    const { count } = await tx.productVariant.updateMany({
      where: { id: line.variantId, stock: { gte: line.quantity } },
      data: { stock: { decrement: line.quantity } },
    });
    if (count === 0) checkoutFail(409, "OUT_OF_STOCK", `«${line.name}» se agotó en esa talla/color`);
    // El stock del producto es la suma de sus variantes (informativo): nunca baja de 0.
    await tx.$executeRaw`UPDATE "Product" SET "stock" = GREATEST("stock" - ${line.quantity}, 0) WHERE "id" = ${line.productId}`;
    return;
  }
  const { count } = await tx.product.updateMany({
    where: { id: line.productId, stock: { gte: line.quantity } },
    data: { stock: { decrement: line.quantity } },
  });
  if (count === 0) checkoutFail(409, "OUT_OF_STOCK", `«${line.name}» se agotó`);
}

async function restock(tx: Tx, items: { productId: string; variantId: string | null; quantity: number }[]) {
  for (const item of items) {
    if (item.variantId) {
      await tx.productVariant.updateMany({
        where: { id: item.variantId },
        data: { stock: { increment: item.quantity } },
      });
    }
    await tx.product.updateMany({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }
}

/** Suma un uso al cupón solo si no superó su límite (atómico). */
async function claimCoupon(tx: Tx, discountId: string) {
  const claimed = await tx.$executeRaw`
    UPDATE "Discount" SET "usesCount" = "usesCount" + 1, "updatedAt" = NOW()
    WHERE "id" = ${discountId} AND ("limit" IS NULL OR "usesCount" < "limit")`;
  if (claimed === 0) checkoutFail(409, "COUPON_EXHAUSTED", "El cupón alcanzó su límite de usos");
}

async function releaseCoupon(tx: Tx, discountId: string) {
  await tx.$executeRaw`
    UPDATE "Discount" SET "usesCount" = GREATEST("usesCount" - 1, 0), "updatedAt" = NOW()
    WHERE "id" = ${discountId}`;
}

/**
 * Cancela una orden PENDING y devuelve su stock y su cupón. La transición condicional
 * (`status = PENDING AND stockReserved`) hace que dos llamadas simultáneas (job de vencimiento,
 * webhook de fallo, cancelación del comprador) liberen una sola vez.
 */
export async function releaseReservation(orderId: string, to: OrderStatus = "CANCELLED"): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING", stockReserved: true },
      data: { status: to, stockReserved: false, expiresAt: null },
    });
    if (count === 0) {
      await tx.order.updateMany({ where: { id: orderId, status: "PENDING" }, data: { status: to, expiresAt: null } });
      return false;
    }
    const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true } });
    await restock(tx, order.items);
    if (order.discountId) await releaseCoupon(tx, order.discountId);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Pagos
// ---------------------------------------------------------------------------

function sendConfirmation(orderId: string) {
  prisma.order
    .findUnique({ where: { id: orderId }, include: { ...orderInclude, user: true } })
    .then((order) => {
      if (!order) return;
      const to = order.user ?? { email: order.customer.email, name: order.customer.name };
      return emailService.sendOrderConfirmation(order, { email: to.email, name: to.name });
    })
    .catch((err) => logger.error({ err, orderId }, "payments: falló el email de confirmación"));
}

/** Pago que llega con la orden ya vencida: se intenta volver a reservar; si no hay stock, se reembolsa. */
async function handleLatePayment(orderId: string, providerId: ProviderId, event: PaymentEvent) {
  try {
    await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { items: { include: { product: { select: { name: true } } } } },
      });
      for (const item of order.items) {
        await reserveLine(tx, { ...item, name: item.product.name });
      }
      if (order.discountId) {
        await tx.$executeRaw`UPDATE "Discount" SET "usesCount" = "usesCount" + 1 WHERE "id" = ${order.discountId}`;
      }
      const { count } = await tx.order.updateMany({
        where: { id: orderId, status: "CANCELLED", paidAt: null },
        data: { status: "PROCESSING", paidAt: new Date(), paymentRef: event.paymentRef ?? null },
      });
      if (count === 0) checkoutFail(409, "ORDER_STATE_CHANGED", "La orden cambió de estado");
    });
    logger.warn({ orderId }, "payments: pago tardío aceptado (stock reservado de nuevo)");
    sendConfirmation(orderId);
  } catch (err) {
    logger.error({ err, orderId }, "payments: pago tardío sin stock → reembolso automático");
    if (event.paymentRef && event.amountCents !== undefined) {
      await providerById(providerId)
        .refund({
          paymentRef: event.paymentRef,
          amountCents: event.amountCents,
          currency: event.currency ?? env.CURRENCY,
          refundKey: `late-${orderId}`,
        })
        .catch((refundErr) =>
          logger.error({ err: refundErr, orderId }, "payments: falló el reembolso automático: revisar a mano"),
        );
    }
  }
}

async function applyPaid(orderId: string, providerId: ProviderId, event: PaymentEvent) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return;
  if (order.provider !== providerId) {
    logger.warn({ orderId, providerId }, "payments: aviso de un proveedor distinto al de la orden");
    return;
  }
  // El monto cobrado tiene que coincidir con el de la orden (evita pagar menos manipulando la sesión).
  if (event.amountCents !== undefined && event.amountCents !== toCents(order.total)) {
    logger.error(
      { orderId, expected: toCents(order.total), received: event.amountCents },
      "payments: el monto cobrado no coincide con la orden",
    );
    return;
  }
  if (event.currency && event.currency.toUpperCase() !== order.currency) {
    logger.error({ orderId, currency: event.currency }, "payments: la moneda cobrada no coincide con la orden");
    return;
  }

  const { count } = await prisma.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: {
      status: "PROCESSING",
      paidAt: new Date(),
      paymentRef: event.paymentRef ?? null,
      // El stock pasa de reservado a vendido: ya no se libera.
      stockReserved: false,
      expiresAt: null,
    },
  });
  if (count === 1) {
    sendConfirmation(orderId);
    return;
  }
  if (order.status === "CANCELLED" && !order.paidAt) {
    await handleLatePayment(orderId, providerId, event);
  }
}

/**
 * Procesa un evento de pago UNA sola vez: se reclama (`PaymentEvent` único por proveedor + id)
 * antes de aplicarlo; si el proceso falla se suelta el reclamo para que el reintento funcione.
 */
export async function processPaymentEvent(providerId: ProviderId, event: PaymentEvent): Promise<"processed" | "duplicate" | "ignored"> {
  if (event.type === "ignored" || !event.orderId) return "ignored";
  const exists = await prisma.order.findUnique({ where: { id: event.orderId }, select: { id: true } });
  if (!exists) return "ignored";

  let claimId: string;
  try {
    const claim = await prisma.paymentEvent.create({
      data: { provider: providerId, eventId: event.eventId, type: event.type, orderId: event.orderId },
    });
    claimId = claim.id;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return "duplicate";
    throw err;
  }

  try {
    if (event.type === "paid") await applyPaid(event.orderId, providerId, event);
    else await releaseReservation(event.orderId);
    return "processed";
  } catch (err) {
    await prisma.paymentEvent.delete({ where: { id: claimId } }).catch(() => undefined);
    throw err;
  }
}

/** Líneas para la pasarela: detalle si no hay descuento; si lo hay, una sola línea con el total. */
function providerLines(orderNumber: number, lines: QuoteLine[], shippingCents: number, discountCents: number, totalCents: number): CheckoutLine[] {
  if (discountCents > 0) {
    const units = lines.reduce((n, l) => n + l.quantity, 0);
    return [{ id: `order-${orderNumber}`, title: `Pedido #${orderNumber} (${units} artículos)`, quantity: 1, unitAmountCents: totalCents }];
  }
  const result: CheckoutLine[] = lines.map((l) => {
    const labels = [l.sizeLabel, l.colorLabel].filter(Boolean).join(" · ");
    return {
      id: l.variantId ?? l.productId,
      title: labels ? `${l.name} (${labels})` : l.name,
      quantity: l.quantity,
      unitAmountCents: l.unitCents,
    };
  });
  if (shippingCents > 0) result.push({ id: "shipping", title: "Envío", quantity: 1, unitAmountCents: shippingCents });
  return result;
}

async function findOwnedOrder(orderId: string, buyer: Buyer) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
  if (!order || order.userId !== buyer.id) checkoutFail(404, "ORDER_NOT_FOUND", "Orden no encontrada");
  return order!;
}

export const checkoutService = {
  /** Pasarelas activas para el checkout. */
  methods() {
    return enabledProviders().map((p) => ({ id: p.id, label: p.label }));
  },

  /** Cotización sin efectos: precios, envío y cupón tal como se cobrarían. */
  quote(input: QuoteInput) {
    return computeQuote(prisma, input, { strict: false });
  },

  /**
   * Crea la orden PENDING reservando stock y cupón en UNA transacción y abre el cobro en la pasarela.
   * Si la pasarela falla, la reserva se libera en el acto.
   */
  async createCheckout(buyer: Buyer, input: CheckoutInput) {
    const provider = resolveProvider(input.provider ?? null);
    if (!provider) checkoutFail(400, "PROVIDER_UNAVAILABLE", "El método de pago elegido no está disponible");
    const gateway = provider!;
    const expiresAt = new Date(Date.now() + env.ORDER_RESERVATION_MINUTES * 60_000);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: buyer.id }, select: { email: true, name: true } });

    const { order, quote } = await prisma.$transaction(
      async (tx) => {
        const quote = await computeQuote(tx, input, { strict: true });
        for (const line of quote.lines) await reserveLine(tx, line);
        if (quote.coupon) await claimCoupon(tx, quote.coupon.id);

        const customer = await tx.customer.upsert({
          where: { email: user.email },
          update: user.name ? { name: user.name } : {},
          create: { email: user.email, name: user.name || user.email.split("@")[0] },
        });

        const s = input.shipping;
        const order = await tx.order.create({
          data: {
            customerId: customer.id,
            userId: buyer.id,
            status: "PENDING",
            currency: quote.currency,
            subtotal: fromCents(quote.subtotalCents),
            discountTotal: fromCents(quote.discountCents),
            shippingTotal: fromCents(quote.shippingCents),
            total: fromCents(quote.totalCents),
            paymentMethod: gateway.label,
            provider: gateway.id,
            expiresAt,
            stockReserved: true,
            discountId: quote.coupon?.id ?? null,
            couponCode: quote.coupon?.code ?? null,
            shippingMethodId: quote.shippingMethod?.id ?? null,
            shippingName: s.name,
            shippingPhone: s.phone ?? null,
            shippingLine1: s.line1,
            shippingLine2: s.line2 ?? null,
            shippingCity: s.city,
            shippingRegion: s.region ?? null,
            shippingPostal: s.postalCode ?? null,
            shippingCountry: s.country,
            items: {
              create: quote.lines.map((l) => ({
                productId: l.productId,
                variantId: l.variantId,
                sizeLabel: l.sizeLabel,
                colorLabel: l.colorLabel,
                quantity: l.quantity,
                unitPrice: fromCents(l.unitCents),
              })),
            },
          },
        });
        return { order, quote };
      },
      { timeout: 15_000 },
    );

    try {
      const session = await gateway.createCheckout({
        orderId: order.id,
        orderNumber: order.number,
        lines: providerLines(order.number, quote.lines, quote.shippingCents, quote.discountCents, quote.totalCents),
        totalCents: quote.totalCents,
        currency: quote.currency,
        payerEmail: user.email,
        payerName: user.name,
        successUrl: `${webOrigin()}/checkout/return?order=${order.id}`,
        cancelUrl: `${webOrigin()}/checkout/cancel?order=${order.id}`,
        expiresAt,
      });
      await prisma.order.update({ where: { id: order.id }, data: { providerRef: session.providerRef } });
      return { orderId: order.id, number: order.number, provider: gateway.id, url: session.url };
    } catch (err) {
      await releaseReservation(order.id);
      throw err;
    }
  },

  /** Vuelta del comprador: se consulta a la pasarela (nunca se confía en los parámetros de la URL). */
  async confirm(buyer: Buyer, orderId: string, params: Record<string, string | undefined>) {
    const order = await findOwnedOrder(orderId, buyer);
    if (order.status !== "PENDING" || !order.provider || !order.providerRef) return order;
    const provider = providerById(order.provider);
    const event = await provider.confirm({ orderId: order.id, providerRef: order.providerRef, params });
    if (event) await processPaymentEvent(order.provider, { ...event, orderId: order.id });
    return prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
  },

  /** Detalle de una orden propia (página de vuelta y pantalla simulada). */
  async getOwned(buyer: Buyer, orderId: string) {
    return findOwnedOrder(orderId, buyer);
  },

  /** El comprador abandona el pago: se libera la reserva. */
  async cancel(buyer: Buyer, orderId: string) {
    const order = await findOwnedOrder(orderId, buyer);
    if (order.status === "PENDING") await releaseReservation(order.id);
    return prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
  },

  /** Pantalla de la pasarela simulada: el comprador aprueba o rechaza. */
  async simulate(buyer: Buyer, orderId: string, action: "approve" | "reject") {
    const order = await findOwnedOrder(orderId, buyer);
    if (order.provider !== "SIMULATED" || !providerById("SIMULATED").isEnabled()) {
      checkoutFail(404, "ORDER_NOT_FOUND", "Orden no encontrada");
    }
    if (order.status === "PENDING") {
      if (action === "approve") {
        await processPaymentEvent("SIMULATED", {
          eventId: `sim:${order.id}`,
          type: "paid",
          orderId: order.id,
          paymentRef: `simpay_${order.id}`,
          amountCents: toCents(order.total),
          currency: order.currency,
        });
      } else {
        await releaseReservation(order.id);
      }
    }
    return prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
  },

  /** Reembolso total desde el panel. Si la orden no salió del almacén, el stock vuelve al inventario. */
  async refund(orderId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true, user: true, customer: true } });
    if (!order) checkoutFail(404, "ORDER_NOT_FOUND", "Orden no encontrada");
    const o = order!;
    if (!PAID_STATUSES.includes(o.status)) checkoutFail(409, "NOT_REFUNDABLE", "Solo se reembolsan órdenes pagadas");
    if (!o.provider) checkoutFail(409, "NOT_REFUNDABLE", "La orden no tiene una pasarela asociada");
    if (o.provider !== "SIMULATED" && !o.paymentRef) {
      checkoutFail(409, "NOT_REFUNDABLE", "La orden no tiene el id del cobro: reembólsala desde la pasarela");
    }

    await providerById(o.provider!).refund({
      paymentRef: o.paymentRef ?? "",
      amountCents: toCents(o.total),
      currency: o.currency,
      refundKey: o.id,
    });

    const restocked = await prisma.$transaction(async (tx) => {
      const { count } = await tx.order.updateMany({
        where: { id: o.id, status: { in: PAID_STATUSES } },
        data: { status: "REFUNDED" },
      });
      if (count === 1 && o.status === "PROCESSING") {
        await restock(tx, o.items);
        return true;
      }
      return false;
    });

    const to = o.user ?? { email: o.customer.email, name: o.customer.name };
    emailService
      .sendOrderRefunded(o, { email: to.email, name: to.name })
      .catch((err) => logger.error({ err, orderId }, "payments: falló el email de reembolso"));

    logger.info({ orderId, restocked }, "orden reembolsada");
    return prisma.order.findUniqueOrThrow({ where: { id: o.id }, include: orderInclude });
  },

  /** Job: vence las órdenes PENDING cuya reserva caducó. Devuelve cuántas liberó. */
  async expireStaleOrders(now = new Date()): Promise<number> {
    const stale = await prisma.order.findMany({
      where: { status: "PENDING", expiresAt: { lt: now } },
      select: { id: true },
      take: 100,
      orderBy: { expiresAt: "asc" },
    });
    let released = 0;
    for (const { id } of stale) {
      if (await releaseReservation(id)) released += 1;
    }
    return released;
  },
};
