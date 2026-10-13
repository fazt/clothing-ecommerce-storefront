import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  createProductBody,
  listProductsQuery,
  updateProductBody,
} from "../../src/modules/products/product.schema";
import { productService } from "../../src/modules/products/product.service";
import { createProduct, prisma, resetDb } from "../helpers/db";

const base = { name: "Camiseta", price: 20 };

describe("validación del stock (zod)", () => {
  it("el stock del producto vale 0 por defecto", () => {
    const parsed = createProductBody.parse(base);
    expect(parsed.stock).toBe(0);
  });

  it("convierte el stock enviado como texto en entero", () => {
    expect(createProductBody.parse({ ...base, stock: "12" }).stock).toBe(12);
  });

  it("rechaza stock negativo en el producto", () => {
    const result = createProductBody.safeParse({ ...base, stock: -1 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("El stock no puede ser negativo");
  });

  it("rechaza stock con decimales", () => {
    expect(createProductBody.safeParse({ ...base, stock: 1.5 }).success).toBe(false);
  });

  it("rechaza stock negativo en una variante", () => {
    const result = createProductBody.safeParse({
      ...base,
      variants: [{ size: "M", color: "Negro", stock: -3 }],
    });
    expect(result.success).toBe(false);
  });

  it("el stock de una variante vale 0 por defecto y se descartan filas sin talla ni color", () => {
    const parsed = createProductBody.parse({
      ...base,
      variants: [{ size: "M" }, { sku: "SIN-TALLA", stock: 5 }],
    });
    expect(parsed.variants).toEqual([
      expect.objectContaining({ size: "M", stock: 0 }),
    ]);
  });

  it("la edición (PATCH) rechaza stock negativo y no inventa stock si no se envía", () => {
    expect(updateProductBody.safeParse({ stock: -5 }).success).toBe(false);
    expect(updateProductBody.parse({ name: "Otro nombre" })).not.toHaveProperty("stock");
  });

  it("el filtro de stock del listado solo acepta in, low u out", () => {
    expect(listProductsQuery.safeParse({ stock: "low" }).success).toBe(true);
    expect(listProductsQuery.safeParse({ stock: "all" }).success).toBe(false);
  });
});

describe("productService y el stock en la base de datos", () => {
  beforeEach(resetDb);
  afterAll(() => prisma.$disconnect());

  it("crea un producto con el stock del producto y de cada variante", async () => {
    const input = createProductBody.parse({
      ...base,
      stock: 7,
      variants: [
        { size: "S", color: "Blanco", stock: 3 },
        { size: "M", color: "Blanco", stock: 4, sku: "CAM-M-BL" },
      ],
    });
    const product = await productService.create(input);

    expect(product.stock).toBe(7);
    expect(product.variants.map((v) => [v.size, v.stock])).toEqual([
      ["S", 3],
      ["M", 4],
    ]);
  });

  it("no permite dos variantes con la misma talla y color", async () => {
    const input = createProductBody.parse({
      ...base,
      variants: [
        { size: "M", color: "Negro", stock: 1 },
        { size: "M", color: "Negro", stock: 2 },
      ],
    });
    await expect(productService.create(input)).rejects.toThrow();
    expect(await prisma.product.count()).toBe(0);
  });

  // BUG: la restricción @@unique([productId, size, color]) de
  // prisma/schema.prisma no protege variantes con solo talla o solo color:
  // en PostgreSQL los NULL son distintos entre sí. Dos filas "M" sin color
  // se guardan como dos variantes con stock separado. Ni el esquema zod
  // (product.schema.ts:53-55) ni el servicio detectan el duplicado.
  it.fails("no permite dos variantes con la misma talla cuando no tienen color", async () => {
    const input = createProductBody.parse({
      ...base,
      variants: [
        { size: "M", stock: 1 },
        { size: "M", stock: 2 },
      ],
    });
    await expect(productService.create(input)).rejects.toThrow();
  });

  it("editar solo el stock no toca las variantes", async () => {
    const product = await createProduct({ stock: 5, variants: [{ size: "M", stock: 2 }] });
    const updated = await productService.update(product.id, updateProductBody.parse({ stock: 9 }));

    expect(updated.stock).toBe(9);
    expect(updated.variants).toHaveLength(1);
    expect(updated.variants[0]).toMatchObject({ id: product.variants[0].id, stock: 2 });
  });

  it("editar las variantes reemplaza su stock", async () => {
    const product = await createProduct({ variants: [{ size: "M", stock: 2 }] });
    const updated = await productService.update(
      product.id,
      updateProductBody.parse({ variants: [{ size: "M", stock: 10 }, { size: "L", stock: 0 }] }),
    );

    expect(updated.variants.map((v) => [v.size, v.stock])).toEqual([
      ["M", 10],
      ["L", 0],
    ]);
  });

  it("una edición inválida no deja el producto a medias (transacción)", async () => {
    const product = await createProduct({ stock: 5, variants: [{ size: "M", stock: 2 }] });
    await expect(
      productService.update(
        product.id,
        updateProductBody.parse({
          stock: 1,
          variants: [
            { size: "M", color: "Negro", stock: 1 },
            { size: "M", color: "Negro", stock: 1 },
          ],
        }),
      ),
    ).rejects.toThrow();

    const after = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      include: { variants: true },
    });
    expect(after.stock).toBe(5);
    expect(after.variants).toHaveLength(1);
    expect(after.variants[0].stock).toBe(2);
  });

  it("el filtro de stock separa agotados, stock bajo (< 15) y en stock", async () => {
    for (const stock of [0, 1, 14, 15, 30]) {
      await createProduct({ name: `P${stock}`, stock });
    }
    const stocks = async (stock: "in" | "low" | "out") => {
      const page = await productService.findAll(listProductsQuery.parse({ stock, pageSize: 50 }));
      return page.data.map((p) => p.stock).sort((a, b) => a - b);
    };

    expect(await stocks("out")).toEqual([0]);
    expect(await stocks("low")).toEqual([1, 14]);
    expect(await stocks("in")).toEqual([15, 30]);
  });

  // BUG: productService.update borra y vuelve a crear todas las variantes
  // (src/modules/products/product.service.ts:81-87). Como OrderItem.variantId
  // es onDelete: SetNull, cualquier edición de variantes deja los pedidos ya
  // hechos sin variante, y los carritos abiertos con el id viejo fallan con
  // INVALID_VARIANT. Las variantes que siguen existiendo deberían actualizarse
  // en su sitio (upsert por talla/color o por id).
  it.fails("editar el stock de una variante conserva la variante de los pedidos ya hechos", async () => {
    const product = await createProduct({ variants: [{ size: "M", color: "Negro", stock: 5 }] });
    const variant = product.variants[0];
    const customer = await prisma.customer.create({ data: { email: "c@test.local", name: "C" } });
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        total: 20,
        paymentMethod: "PayPal",
        status: "PROCESSING",
        items: {
          create: [{ productId: product.id, variantId: variant.id, quantity: 1, unitPrice: 20 }],
        },
      },
      include: { items: true },
    });

    await productService.update(
      product.id,
      updateProductBody.parse({ variants: [{ size: "M", color: "Negro", stock: 4 }] }),
    );

    const item = await prisma.orderItem.findUniqueOrThrow({ where: { id: order.items[0].id } });
    expect(item.variantId).toBe(variant.id);
  });
});
