import { prisma } from "../../lib/prisma";

export interface ProductInput {
  name: string;
  description?: string | null;
  price: number | string;
  stock?: number;
  imageUrl?: string | null;
}

export const productService = {
  findAll: () =>
    prisma.product.findMany({ orderBy: { createdAt: "desc" } }),

  findById: (id: string) =>
    prisma.product.findUnique({ where: { id } }),

  create: (data: ProductInput) =>
    prisma.product.create({ data }),

  update: (id: string, data: Partial<ProductInput>) =>
    prisma.product.update({ where: { id }, data }),

  remove: (id: string) =>
    prisma.product.delete({ where: { id } }),
};
