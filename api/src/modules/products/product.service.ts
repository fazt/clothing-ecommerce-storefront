import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { contains, pageArgs, paginated } from "../../lib/pagination";
import {
  LOW_STOCK_THRESHOLD,
  type CreateProductInput,
  type ListProductsQuery,
  type ProductVariantInput,
  type UpdateProductInput,
} from "./product.schema";

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  variants: { orderBy: { createdAt: "asc" } },
} as const;

function mapVariant(v: ProductVariantInput) {
  return {
    size: v.size ?? null,
    color: v.color ?? null,
    sku: v.sku ?? null,
    stock: v.stock,
    price: v.price ?? null,
  };
}

function stockWhere(stock: ListProductsQuery["stock"]): Prisma.ProductWhereInput {
  switch (stock) {
    case "out":
      return { stock: { lte: 0 } };
    case "low":
      return { stock: { gt: 0, lt: LOW_STOCK_THRESHOLD } };
    case "in":
      return { stock: { gte: LOW_STOCK_THRESHOLD } };
    default:
      return {};
  }
}

export const productService = {
  findAll: async (query: ListProductsQuery) => {
    const where: Prisma.ProductWhereInput = {
      ...stockWhere(query.stock),
      ...(query.categoryId && { categoryId: query.categoryId }),
      ...(query.search && {
        OR: [{ name: contains(query.search) }, { description: contains(query.search) }],
      }),
    };
    const [products, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: productInclude,
        ...pageArgs(query),
      }),
      prisma.product.count({ where }),
    ]);
    return paginated(products, total, query);
  },

  findById: (id: string) =>
    prisma.product.findUnique({ where: { id }, include: productInclude }),

  create: async ({ variants, ...data }: CreateProductInput) =>
    prisma.product.create({
      data: {
        ...data,
        variants:
          variants && variants.length > 0
            ? { create: variants.map(mapVariant) }
            : undefined,
      },
      include: productInclude,
    }),

  update: async (id: string, { variants, ...data }: UpdateProductInput) =>
    prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data });

      if (variants !== undefined) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        if (variants.length > 0) {
          await tx.productVariant.createMany({
            data: variants.map((v) => ({ productId: id, ...mapVariant(v) })),
          });
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id },
        include: productInclude,
      });
    }),

  remove: (id: string) => prisma.product.delete({ where: { id } }),
};
