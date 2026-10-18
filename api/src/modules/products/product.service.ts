import { Prisma } from "../../generated/prisma/client";
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

  create: async ({ variants, ...data }: CreateProductInput) => {
    const rows = variants ?? [];
    return prisma.product.create({
      data: {
        ...data,
        // Con variantes, el stock del producto es la suma de las variantes.
        ...(rows.length > 0 && { stock: rows.reduce((sum, v) => sum + v.stock, 0) }),
        variants: rows.length > 0 ? { create: rows.map(mapVariant) } : undefined,
      },
      include: productInclude,
    });
  },

  /**
   * Las variantes se sincronizan por (talla, color): las existentes se ACTUALIZAN (conservan su id,
   * así los carritos y los pedidos siguen apuntando a ellas), las nuevas se crean y las que ya no
   * vienen se borran (los pedidos antiguos conservan las etiquetas de talla y color).
   */
  update: async (id: string, { variants, ...data }: UpdateProductInput) =>
    prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id }, data });

      if (variants !== undefined) {
        const existing = await tx.productVariant.findMany({ where: { productId: id } });
        const key = (v: { size: string | null; color: string | null }) => `${v.size ?? ""}|${v.color ?? ""}`;
        const byKey = new Map(existing.map((v) => [key(v), v]));
        const keep = new Set<string>();

        for (const input of variants.map(mapVariant)) {
          const k = key(input);
          keep.add(k);
          const current = byKey.get(k);
          if (current) {
            await tx.productVariant.update({ where: { id: current.id }, data: input });
          } else {
            await tx.productVariant.create({ data: { productId: id, ...input } });
          }
        }
        const removed = existing.filter((v) => !keep.has(key(v))).map((v) => v.id);
        if (removed.length > 0) await tx.productVariant.deleteMany({ where: { id: { in: removed } } });

        if (variants.length > 0) {
          await tx.product.update({
            where: { id },
            data: { stock: variants.reduce((sum, v) => sum + v.stock, 0) },
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
