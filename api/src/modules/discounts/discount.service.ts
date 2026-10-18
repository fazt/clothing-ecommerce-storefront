import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { contains, pageArgs, paginated } from "../../lib/pagination";
import type {
  CreateDiscountInput,
  ListDiscountsQuery,
  UpdateDiscountInput,
} from "./discount.schema";

export const discountService = {
  findAll: async (query: ListDiscountsQuery) => {
    const where: Prisma.DiscountWhereInput = {
      ...(query.type && { type: query.type }),
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [{ code: contains(query.search) }, { description: contains(query.search) }],
      }),
    };
    const [discounts, total] = await prisma.$transaction([
      prisma.discount.findMany({ where, orderBy: { createdAt: "desc" }, ...pageArgs(query) }),
      prisma.discount.count({ where }),
    ]);
    return paginated(discounts, total, query);
  },

  findById: (id: string) => prisma.discount.findUnique({ where: { id } }),

  create: (data: CreateDiscountInput) => prisma.discount.create({ data }),

  update: (id: string, data: UpdateDiscountInput) =>
    prisma.discount.update({ where: { id }, data }),

  remove: (id: string) => prisma.discount.delete({ where: { id } }),
};
