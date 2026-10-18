import { prisma } from "../../lib/prisma";
import { PAID_STATUSES } from "../payments";

// Solo cuentan las ventas cobradas: ni pendientes, ni canceladas, ni reembolsadas.
const paid = { status: { in: PAID_STATUSES } };

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export const analyticsService = {
  summary: async () => {
    const now = new Date();
    const today = startOfDay(now);
    const thirtyAgo = new Date(today.getTime() - 29 * DAY_MS);
    const sixtyAgo = new Date(today.getTime() - 59 * DAY_MS);

    const [
      currentOrders,
      previousOrders,
      newCustomersCurrent,
      newCustomersPrevious,
      seriesRows,
      topProducts,
    ] = await Promise.all([
      prisma.order.findMany({
        where: { ...paid, createdAt: { gte: thirtyAgo } },
        select: { total: true, createdAt: true },
      }),
      prisma.order.findMany({
        where: { ...paid, createdAt: { gte: sixtyAgo, lt: thirtyAgo } },
        select: { total: true, createdAt: true },
      }),
      prisma.customer.count({ where: { createdAt: { gte: thirtyAgo } } }),
      prisma.customer.count({
        where: { createdAt: { gte: sixtyAgo, lt: thirtyAgo } },
      }),
      prisma.order.findMany({
        where: { ...paid, createdAt: { gte: thirtyAgo } },
        select: { total: true, createdAt: true },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: { order: { ...paid, createdAt: { gte: thirtyAgo } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
    ]);

    const revenueCurrent = currentOrders.reduce(
      (s, o) => s + Number(o.total),
      0,
    );
    const revenuePrevious = previousOrders.reduce(
      (s, o) => s + Number(o.total),
      0,
    );
    const ordersCountCurrent = currentOrders.length;
    const ordersCountPrevious = previousOrders.length;

    // Build 30-day sales series (bucket by day)
    const buckets = new Array(30).fill(0);
    for (const o of seriesRows) {
      const dayIdx = Math.floor(
        (startOfDay(o.createdAt).getTime() - thirtyAgo.getTime()) / DAY_MS,
      );
      if (dayIdx >= 0 && dayIdx < 30) {
        buckets[dayIdx] += Number(o.total);
      }
    }
    const salesSeries = buckets.map((v) => Number(v.toFixed(2)));

    // Hydrate topProducts with names and revenue
    const productIds = topProducts.map((t) => t.productId);
    const productInfos = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(productInfos.map((p) => [p.id, p.name]));

    const topProductsDetailed = await Promise.all(
      topProducts.map(async (t) => {
        const items = await prisma.orderItem.findMany({
          where: {
            productId: t.productId,
            order: { ...paid, createdAt: { gte: thirtyAgo } },
          },
          select: { quantity: true, unitPrice: true },
        });
        const revenue = items.reduce(
          (s, i) => s + i.quantity * Number(i.unitPrice),
          0,
        );
        return {
          productId: t.productId,
          name: nameMap.get(t.productId) ?? "—",
          sold: t._sum.quantity ?? 0,
          revenue: Number(revenue.toFixed(2)),
        };
      }),
    );

    // «Tasa de pago»: órdenes cobradas sobre órdenes creadas en el periodo (checkouts completados).
    const [createdCurrent, createdPrevious] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: thirtyAgo } } }),
      prisma.order.count({ where: { createdAt: { gte: sixtyAgo, lt: thirtyAgo } } }),
    ]);
    const rate = (paidCount: number, created: number) =>
      created === 0 ? 0 : Number(((paidCount / created) * 100).toFixed(1));
    const conversionRate = rate(ordersCountCurrent, createdCurrent);
    const conversionPrev = rate(ordersCountPrevious, createdPrevious);

    return {
      metrics: {
        revenue: {
          current: Number(revenueCurrent.toFixed(2)),
          previous: Number(revenuePrevious.toFixed(2)),
          change: percentChange(revenueCurrent, revenuePrevious),
        },
        orders: {
          current: ordersCountCurrent,
          previous: ordersCountPrevious,
          change: percentChange(ordersCountCurrent, ordersCountPrevious),
        },
        newCustomers: {
          current: newCustomersCurrent,
          previous: newCustomersPrevious,
          change: percentChange(newCustomersCurrent, newCustomersPrevious),
        },
        conversionRate: {
          current: conversionRate,
          previous: conversionPrev,
          change: percentChange(conversionRate, conversionPrev),
        },
      },
      salesSeries,
      topProducts: topProductsDetailed,
    };
  },
};
