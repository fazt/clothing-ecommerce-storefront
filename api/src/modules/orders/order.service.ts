import { OrderStatus, Prisma } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";
import { fromCents, toCents } from "../../lib/money";
import { contains, pageArgs, paginated, type PaginationQuery } from "../../lib/pagination";
import { emailService } from "../email";
import {
  CheckoutError,
  checkoutService,
  orderInclude,
  PAID_STATUSES,
  releaseReservation,
  reserveLine,
} from "../payments";
import type { CreateOrderInput, ListOrdersQuery, UpdateOrderInput } from "./order.schema";

async function findPage(where: Prisma.OrderWhereInput, query: PaginationQuery) {
  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: orderInclude,
      ...pageArgs(query),
    }),
    prisma.order.count({ where }),
  ]);
  return paginated(orders, total, query);
}

/**
 * Transiciones que el panel puede hacer a mano. Pagar solo lo hace la pasarela (webhook /
 * confirmación) y reembolsar tiene su propio endpoint, que además devuelve el dinero.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CANCELLED"],
  PROCESSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};

function notifyShipped(orderId: string) {
  prisma.order
    .findUnique({
      where: { id: orderId },
      include: { user: true, customer: true, shippingMethod: { select: { name: true } } },
    })
    .then((order) => {
      if (!order) return;
      const to = order.user ?? { email: order.customer.email, name: order.customer.name };
      return emailService.sendOrderShipped(order, { email: to.email, name: to.name });
    })
    .catch((err) => logger.error({ err, orderId }, "orders: falló el email de envío"));
}

export const orderService = {
  findAll: async (query: ListOrdersQuery) => {
    const asNumber = query.search && /^#?\d{1,9}$/.test(query.search) ? Number(query.search.replace("#", "")) : null;
    const where: Prisma.OrderWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          ...(asNumber !== null ? [{ number: asNumber }] : []),
          { customer: { name: contains(query.search) } },
          { customer: { email: contains(query.search) } },
          { paymentMethod: contains(query.search) },
          { couponCode: contains(query.search) },
        ],
      }),
    };
    return findPage(where, query);
  },

  findMine: (userId: string, query: PaginationQuery) => findPage({ userId }, query),

  findById: (id: string) => prisma.order.findUnique({ where: { id }, include: orderInclude }),

  /**
   * Pedido manual desde el panel o el CLI (venta telefónica, tienda física). Precios de la base
   * salvo que se indiquen, y el stock se descuenta igual que en el checkout.
   */
  create: async (data: CreateOrderInput) => {
    const status = data.status ?? "PENDING";
    if (status === "CANCELLED" || status === "REFUNDED") {
      throw new CheckoutError(400, "INVALID_STATUS", "Un pedido nuevo no puede nacer cancelado o reembolsado");
    }
    const productIds = [...new Set(data.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: { select: { id: true, price: true } } },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    const lines = data.items.map((i) => {
      const product = productById.get(i.productId);
      if (!product) throw new CheckoutError(404, "INVALID_PRODUCT", "Uno de los productos no existe");
      const variant = i.variantId ? product.variants.find((v) => v.id === i.variantId) : undefined;
      if (i.variantId && !variant) throw new CheckoutError(404, "INVALID_VARIANT", `Variante inválida en «${product.name}»`);
      const unitCents = i.unitPrice !== undefined ? toCents(i.unitPrice) : toCents(variant?.price ?? product.price);
      return {
        productId: i.productId,
        variantId: i.variantId ?? null,
        sizeLabel: i.sizeLabel ?? null,
        colorLabel: i.colorLabel ?? null,
        quantity: i.quantity,
        unitCents,
        name: product.name,
      };
    });
    const totalCents = lines.reduce((sum, l) => sum + l.unitCents * l.quantity, 0);

    return prisma.$transaction(async (tx) => {
      for (const line of lines) await reserveLine(tx, line);
      return tx.order.create({
        data: {
          customerId: data.customerId,
          status,
          paymentMethod: data.paymentMethod,
          subtotal: fromCents(totalCents),
          total: fromCents(totalCents),
          // PENDING retiene el stock (cancelar lo devuelve); un pedido ya pagado lo consume.
          stockReserved: status === "PENDING",
          paidAt: PAID_STATUSES.includes(status) ? new Date() : null,
          items: {
            create: lines.map(({ name: _name, unitCents, ...item }) => ({ ...item, unitPrice: fromCents(unitCents) })),
          },
        },
        include: orderInclude,
      });
    });
  },

  update: async (id: string, input: UpdateOrderInput) => {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw new CheckoutError(404, "ORDER_NOT_FOUND", "Orden no encontrada");

    const status = input.status;
    if (status && status !== order.status) {
      if (!ALLOWED_TRANSITIONS[order.status].includes(status)) {
        const hint = status === "REFUNDED" || (status === "CANCELLED" && PAID_STATUSES.includes(order.status))
          ? " Usa «Reembolsar» para devolver el dinero."
          : "";
        throw new CheckoutError(409, "INVALID_TRANSITION", `No se puede pasar de ${order.status} a ${status}.${hint}`);
      }
      if (status === "CANCELLED") {
        await releaseReservation(id, "CANCELLED");
      } else {
        const { count } = await prisma.order.updateMany({
          where: { id, status: order.status },
          data: { status, ...(input.trackingNumber !== undefined && { trackingNumber: input.trackingNumber }) },
        });
        if (count === 0) throw new CheckoutError(409, "ORDER_STATE_CHANGED", "La orden cambió mientras la editabas");
        if (status === "SHIPPED") notifyShipped(id);
      }
    } else if (input.trackingNumber !== undefined) {
      await prisma.order.update({ where: { id }, data: { trackingNumber: input.trackingNumber } });
    }

    return prisma.order.findUniqueOrThrow({ where: { id }, include: orderInclude });
  },

  refund: (id: string) => checkoutService.refund(id),

  /** Solo se borran órdenes canceladas (las pagadas son registro contable). */
  remove: async (id: string) => {
    const order = await prisma.order.findUnique({ where: { id }, select: { status: true } });
    if (!order) throw new CheckoutError(404, "ORDER_NOT_FOUND", "Orden no encontrada");
    if (order.status !== "CANCELLED") {
      throw new CheckoutError(409, "ORDER_NOT_DELETABLE", "Solo se pueden eliminar órdenes canceladas");
    }
    await prisma.order.delete({ where: { id } });
  },
};
