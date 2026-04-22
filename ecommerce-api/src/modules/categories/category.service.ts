import { prisma } from "../../lib/prisma";

export interface CategoryInput {
  slug: string;
  name: string;
  image?: string | null;
  isVisible?: boolean;
}

export const categoryService = {
  findAll: () =>
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    }),

  findById: (id: string) =>
    prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    }),

  create: (data: CategoryInput) => prisma.category.create({ data }),

  update: (id: string, data: Partial<CategoryInput>) =>
    prisma.category.update({ where: { id }, data }),

  remove: (id: string) => prisma.category.delete({ where: { id } }),
};
