import { prisma } from "../../lib/prisma";

export interface CustomerInput {
  email: string;
  name: string;
}

export type CustomerSegment = "new" | "returning" | "vip";

function deriveSegment(orders: number, totalSpent: number): CustomerSegment {
  if (orders >= 5 || totalSpent >= 1000) return "vip";
  if (orders >= 1) return "returning";
  return "new";
}

export const customerService = {
  findAll: async () => {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          select: { total: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return customers.map((c) => {
      const totalSpent = c.orders.reduce(
        (sum, o) => sum + Number(o.total),
        0,
      );
      const ordersCount = c.orders.length;
      return {
        id: c.id,
        email: c.email,
        name: c.name,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        ordersCount,
        totalSpent,
        lastOrder: c.orders[0]?.createdAt ?? null,
        segment: deriveSegment(ordersCount, totalSpent),
      };
    });
  },

  findById: async (id: string) => {
    const c = await prisma.customer.findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          include: {
            items: { include: { product: { select: { name: true } } } },
          },
        },
      },
    });
    if (!c) return null;
    const totalSpent = c.orders.reduce((sum, o) => sum + Number(o.total), 0);
    return {
      ...c,
      ordersCount: c.orders.length,
      totalSpent,
      lastOrder: c.orders[0]?.createdAt ?? null,
      segment: deriveSegment(c.orders.length, totalSpent),
    };
  },

  create: (data: CustomerInput) => prisma.customer.create({ data }),

  update: (id: string, data: Partial<CustomerInput>) =>
    prisma.customer.update({ where: { id }, data }),

  remove: (id: string) => prisma.customer.delete({ where: { id } }),
};
