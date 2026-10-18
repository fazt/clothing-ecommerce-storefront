import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { contains, pageArgs, paginated } from "../../lib/pagination";
import type {
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from "./category.schema";

const include = { _count: { select: { products: true } } } as const;

export const categoryService = {
  findAll: async (query: ListCategoriesQuery) => {
    const where: Prisma.CategoryWhereInput = {
      ...(query.isVisible !== undefined && { isVisible: query.isVisible }),
      ...(query.search && {
        OR: [{ name: contains(query.search) }, { slug: contains(query.search) }],
      }),
    };
    const [categories, total] = await prisma.$transaction([
      prisma.category.findMany({
        where,
        orderBy: { name: "asc" },
        include,
        ...pageArgs(query),
      }),
      prisma.category.count({ where }),
    ]);
    return paginated(categories, total, query);
  },

  findById: (id: string) => prisma.category.findUnique({ where: { id }, include }),

  create: (data: CreateCategoryInput) => prisma.category.create({ data }),

  update: (id: string, data: UpdateCategoryInput) =>
    prisma.category.update({ where: { id }, data }),

  remove: (id: string) => prisma.category.delete({ where: { id } }),
};
