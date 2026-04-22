import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export interface OrderItemInput {
  productId: string;
  quantity: number;
  unitPrice?: number | string;
  variantId?: string | null;
  sizeLabel?: string | null;
  colorLabel?: string | null;
}

export interface OrderInput {
  customerId: string;
  status?: OrderStatus;
  paymentMethod: string;
  items: OrderItemInput[];
}

const orderInclude = {
  customer: { select: { id: true, name: true, email: true } },
  items: {
    include: {
      product: { select: { id: true, name: true, imageUrl: true } },
    },
  },
} satisfies Prisma.OrderInclude;

export const orderService = {
  findAll: () =>
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: orderInclude,
    }),

  findMine: (userId: string) =>
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: orderInclude,
    }),

  findById: (id: string) =>
    prisma.order.findUnique({ where: { id }, include: orderInclude }),

  create: async (data: OrderInput) => {
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
