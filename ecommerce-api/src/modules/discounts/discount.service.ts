import { DiscountStatus, DiscountType } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export interface DiscountInput {
  code: string;
  description?: string | null;
  type: DiscountType;
  value: number | string;
  limit?: number | null;
  status?: DiscountStatus;
  expiresAt?: Date | string | null;
}

export const discountService = {
  findAll: () =>
    prisma.discount.findMany({ orderBy: { createdAt: "desc" } }),

  findById: (id: string) => prisma.discount.findUnique({ where: { id } }),

  create: (data: DiscountInput) =>
    prisma.discount.create({
      data: {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      },
    }),

  update: (id: string, data: Partial<DiscountInput>) =>
    prisma.discount.update({
      where: { id },
      data: {
        ...data,
        ...(data.expiresAt !== undefined && {
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        }),
      },
    }),

  remove: (id: string) => prisma.discount.delete({ where: { id } }),
};
