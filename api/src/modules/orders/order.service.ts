import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { contains, pageArgs, paginated, type PaginationQuery } from "../../lib/pagination";
import type { CreateOrderInput, ListOrdersQuery } from "./order.schema";

const orderInclude = {
  customer: { select: { id: true, name: true, email: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, imageUrl: true } },
    },
  },
} satisfies Prisma.OrderInclude;

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

export const orderService = {
  findAll: async (query: ListOrdersQuery) => {
    const where: Prisma.OrderWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { id: { startsWith: query.search.toLowerCase() } },
          { customer: { name: contains(query.search) } },
          { customer: { email: contains(query.search) } },
          { paymentMethod: contains(query.search) },
        ],
      }),
    };
    return findPage(where, query);
  },

  findMine: (userId: string, query: PaginationQuery) =>
    findPage({ userId }, query),

  findById: (id: string) =>
    prisma.order.findUnique({ where: { id }, include: orderInclude }),

  create: async (data: CreateOrderInput) => {
    // Fetch product prices if unitPrice not provided, compute total
    const productIds = data.items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true },
    });
    const priceMap = new Map(products.map((p) => [p.id, Number(p.price)]));

    const itemsData = data.items.map((i) => {
      const unit =
        i.unitPrice !== undefined
          ? Number(i.unitPrice)
          : priceMap.get(i.productId) ?? 0;
      return {
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: unit,
        variantId: i.variantId ?? null,
        sizeLabel: i.sizeLabel ?? null,
        colorLabel: i.colorLabel ?? null,
      };
    });
    const total = itemsData.reduce(
      (sum, i) => sum + i.unitPrice * i.quantity,
      0,
    );

    return prisma.order.create({
      data: {
        customerId: data.customerId,
        status: data.status ?? "PENDING",
        paymentMethod: data.paymentMethod,
        total,
        items: { create: itemsData },
      },
      include: orderInclude,
    });
  },

  updateStatus: (id: string, status: OrderStatus) =>
    prisma.order.update({
      where: { id },
      data: { status },
      include: orderInclude,
    }),

  remove: (id: string) => prisma.order.delete({ where: { id } }),
};
