import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { contains, paginated } from "../../lib/pagination";
import type {
  CreateCustomerInput,
  CustomerSegment,
  ListCustomersQuery,
  UpdateCustomerInput,
} from "./customer.schema";

function deriveSegment(orders: number, totalSpent: number): CustomerSegment {
  if (orders >= 5 || totalSpent >= 1000) return "vip";
  if (orders >= 1) return "returning";
  return "new";
}

export const customerService = {
  // The segment is derived from order totals, so filtering and paging happen
  // in memory after aggregating. Fine for a store-sized customer base.
  findAll: async (query: ListCustomersQuery) => {
    const where: Prisma.CustomerWhereInput = query.search
      ? { OR: [{ name: contains(query.search) }, { email: contains(query.search) }] }
      : {};
    const customers = await prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        orders: {
          select: { total: true, createdAt: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const rows = customers
      .map((c) => {
        const totalSpent = c.orders.reduce((sum, o) => sum + Number(o.total), 0);
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
      })
      .filter((c) => !query.segment || c.segment === query.segment);

    const start = (query.page - 1) * query.pageSize;
    return paginated(rows.slice(start, start + query.pageSize), rows.length, query);
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

  create: (data: CreateCustomerInput) => prisma.customer.create({ data }),

  update: (id: string, data: UpdateCustomerInput) =>
    prisma.customer.update({ where: { id }, data }),

  remove: (id: string) => prisma.customer.delete({ where: { id } }),
};
