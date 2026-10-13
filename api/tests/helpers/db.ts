import { prisma } from "../../src/lib/prisma";

export { prisma };

/** Empties every table so each test starts from a clean database. */
export async function resetDb() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "OrderItem", "Order", "ProductVariant", "Product", "Category", "Customer",
      "password_reset_tokens", "users", "Discount", "newsletter_subscribers"
    RESTART IDENTITY CASCADE
  `);
}

let userSeq = 0;

export function createUser() {
  userSeq += 1;
  return prisma.user.create({
    data: { email: `buyer${userSeq}-${Date.now()}@test.local`, name: `Buyer ${userSeq}` },
  });
}

interface VariantData {
  size?: string;
  color?: string;
  stock: number;
  price?: number;
}

export function createProduct(
  data: { name?: string; price?: number; stock?: number; variants?: VariantData[] } = {},
) {
  return prisma.product.create({
    data: {
      name: data.name ?? "Camiseta básica",
      price: data.price ?? 20,
      stock: data.stock ?? 0,
      variants: data.variants ? { create: data.variants } : undefined,
    },
    include: { variants: { orderBy: [{ size: "asc" }, { color: "asc" }] } },
  });
}

export async function productStock(id: string) {
  return (await prisma.product.findUniqueOrThrow({ where: { id } })).stock;
}

export async function variantStock(id: string) {
  return (await prisma.productVariant.findUniqueOrThrow({ where: { id } })).stock;
}
