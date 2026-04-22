import { prisma } from "../../lib/prisma";

export interface ProductVariantInput {
  id?: string;
  size?: string | null;
  color?: string | null;
  sku?: string | null;
  stock?: number;
  price?: number | string | null;
}

export interface ProductInput {
  name: string;
  description?: string | null;
  price: number | string;
  stock?: number;
  imageUrl?: string | null;
  images?: string[];
  isNew?: boolean;
  isSale?: boolean;
  isFeatured?: boolean;
  categoryId?: string | null;
  variants?: ProductVariantInput[];
}

const productInclude = {
  category: { select: { id: true, name: true, slug: true } },
  variants: { orderBy: { createdAt: "asc" } },
} as const;

function mapVariantCreate(v: ProductVariantInput) {
  return {
    size: v.size ?? null,
    color: v.color ?? null,
    sku: v.sku?.trim() ? v.sku.trim() : null,
    stock: typeof v.stock === "number" ? v.stock : Number(v.stock) || 0,
    price:
      v.price === null || v.price === undefined || v.price === ""
        ? null
        : v.price,
  };
}

export const productService = {
  findAll: () =>
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: productInclude,
    }),

  findById: (id: string) =>
    prisma.product.findUnique({ where: { id }, include: productInclude }),

  create: async (data: ProductInput) => {
    const {
      variants,
      images,
      isNew,
      isSale,
      isFeatured,
      categoryId,
      ...rest
    } = data;
    return prisma.product.create({
      data: {
        ...rest,
        images: images ?? [],
        isNew: !!isNew,
        isSale: !!isSale,
        isFeatured: !!isFeatured,
        categoryId: categoryId || null,
        variants: variants && variants.length > 0
          ? { create: variants.map(mapVariantCreate) }
          : undefined,
      },
      include: productInclude,
    });
  },

  update: async (id: string, data: Partial<ProductInput>) => {
    const {
      variants,
      images,
      isNew,
      isSale,
      isFeatured,
      categoryId,
      ...rest
    } = data;

    return prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          ...rest,
          ...(images !== undefined && { images }),
          ...(isNew !== undefined && { isNew }),
          ...(isSale !== undefined && { isSale }),
          ...(isFeatured !== undefined && { isFeatured }),
          ...(categoryId !== undefined && { categoryId: categoryId || null }),
        },
      });

      if (variants !== undefined) {
        await tx.productVariant.deleteMany({ where: { productId: id } });
        if (variants.length > 0) {
          await tx.productVariant.createMany({
            data: variants.map((v) => ({
              productId: id,
              ...mapVariantCreate(v),
            })),
          });
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id },
        include: productInclude,
      });
    });
  },

  remove: (id: string) => prisma.product.delete({ where: { id } }),
};
