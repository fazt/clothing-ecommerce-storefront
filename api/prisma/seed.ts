import { PrismaClient, OrderStatus, DiscountType, DiscountStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Auth users (idempotent via upsert)
  const [adminHash, userHash] = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("user123", 10),
  ]);
  await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: { passwordHash: adminHash, role: "ADMIN", name: "Admin" },
    create: {
      email: "admin@admin.com",
      passwordHash: adminHash,
      name: "Admin",
      role: "ADMIN",
    },
  });
  await prisma.user.upsert({
    where: { email: "user@user.com" },
    update: { passwordHash: userHash, role: "USER", name: "Usuario" },
    create: {
      email: "user@user.com",
      passwordHash: userHash,
      name: "Usuario",
      role: "USER",
    },
  });

  // Clear (respecting FKs)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.discount.deleteMany();
  // Don't delete products; just set categoryId to null before nuking categories
  await prisma.product.updateMany({ data: { categoryId: null } });
  await prisma.category.deleteMany();

  // Categories
  const [women, men, accessories, shoes] = await Promise.all([
    prisma.category.create({
      data: {
        slug: "women",
        name: "Mujer",
        image:
          "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80",
      },
    }),
    prisma.category.create({
      data: {
        slug: "men",
        name: "Hombre",
        image:
          "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&auto=format&fit=crop&q=80",
      },
    }),
    prisma.category.create({
      data: {
        slug: "accessories",
        name: "Accesorios",
        image:
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
      },
    }),
    prisma.category.create({
      data: {
        slug: "shoes",
        name: "Calzado",
        image:
          "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&auto=format&fit=crop&q=80",
      },
    }),
  ]);

  // Upsert demo products and assign categories
  const productSeeds = [
    {
      name: "Oversized Cotton Tee",
      description: "Camiseta oversized de algodón 100% orgánico.",
      price: 29.99,
      stock: 45,
      imageUrl:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&auto=format&fit=crop&q=80",
      isNew: true,
      isFeatured: true,
      categoryId: men.id,
    },
    {
      name: "Vestido de Lino Verano",
      description: "Vestido midi de lino ligero.",
      price: 79.0,
      stock: 12,
      imageUrl:
        "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&auto=format&fit=crop&q=80",
      isNew: true,
      isSale: true,
      isFeatured: true,
      categoryId: women.id,
    },
    {
      name: "Chaqueta Denim Clásica",
      description: "Chaqueta de mezclilla con corte regular.",
      price: 119.0,
      stock: 22,
      imageUrl:
        "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&auto=format&fit=crop&q=80",
      isSale: true,
      isFeatured: true,
      categoryId: men.id,
    },
    {
      name: "Bolso Crossbody Piel",
      description: "Bolso crossbody de piel genuina.",
      price: 149.0,
      stock: 18,
      imageUrl:
        "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&auto=format&fit=crop&q=80",
      isNew: true,
      categoryId: accessories.id,
    },
    {
      name: "Sneakers Blancos Minimal",
      description: "Zapatillas minimalistas de cuero.",
      price: 99.0,
      stock: 30,
      imageUrl:
        "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&auto=format&fit=crop&q=80",
      isNew: true,
      categoryId: shoes.id,
    },
    {
      name: "Suéter Tejido Lana",
      description: "Suéter de lana merino con cuello alto.",
      price: 89.5,
      stock: 8,
      imageUrl:
        "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&auto=format&fit=crop&q=80",
      isSale: true,
      categoryId: women.id,
    },
    {
      name: "Chinos Slim Fit",
      description: "Pantalones chinos de corte slim.",
      price: 59.0,
      stock: 40,
      imageUrl:
        "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&auto=format&fit=crop&q=80",
      isFeatured: true,
      categoryId: men.id,
    },
  ];

  const createdProducts = [];
  for (const p of productSeeds) {
    // Upsert by name
    const existing = await prisma.product.findFirst({
      where: { name: p.name },
    });
    const product = existing
      ? await prisma.product.update({ where: { id: existing.id }, data: p })
      : await prisma.product.create({ data: p });
    createdProducts.push(product);
  }

  const [tee, dress, denim, bag, sneakers, sweater, chinos] = createdProducts;

  // Customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: { email: "maria.g@email.com", name: "María González" },
    }),
    prisma.customer.create({
      data: { email: "c.ruiz@email.com", name: "Carlos Ruiz" },
    }),
    prisma.customer.create({
      data: { email: "laura.f@email.com", name: "Laura Fernández" },
    }),
    prisma.customer.create({
      data: { email: "diego.m@email.com", name: "Diego Martínez" },
    }),
    prisma.customer.create({
      data: { email: "ana.torres@email.com", name: "Ana Torres" },
    }),
    prisma.customer.create({
      data: { email: "p.sanchez@email.com", name: "Pedro Sánchez" },
    }),
    prisma.customer.create({
      data: { email: "isa.m@email.com", name: "Isabel Moreno" },
    }),
  ]);

  const [mariaC, carlos, laura, diego, ana, pedro, isa] = customers;

  // Orders with items — spread across last 30 days for analytics
  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000);

  const orderSpecs: Array<{
    customer: { id: string };
    status: OrderStatus;
    paymentMethod: string;
    createdAt: Date;
    items: { product: { id: string; price: unknown }; quantity: number }[];
  }> = [
    {
      customer: mariaC,
      status: "PROCESSING",
      paymentMethod: "Visa ···4242",
      createdAt: daysAgo(0),
      items: [
        { product: tee, quantity: 2 },
        { product: chinos, quantity: 1 },
        { product: sneakers, quantity: 1 },
      ],
    },
    {
      customer: carlos,
      status: "SHIPPED",
      paymentMethod: "Mastercard ···8821",
      createdAt: daysAgo(0),
      items: [{ product: denim, quantity: 1 }],
    },
    {
      customer: laura,
      status: "DELIVERED",
      paymentMethod: "PayPal",
      createdAt: daysAgo(1),
      items: [{ product: sweater, quantity: 1 }],
    },
    {
      customer: diego,
      status: "PENDING",
      paymentMethod: "Visa ···1029",
      createdAt: daysAgo(1),
      items: [
        { product: bag, quantity: 1 },
        { product: chinos, quantity: 2 },
        { product: tee, quantity: 1 },
      ],
    },
    {
      customer: ana,
      status: "DELIVERED",
      paymentMethod: "Mastercard ···3910",
      createdAt: daysAgo(2),
      items: [{ product: chinos, quantity: 1 }],
    },
    {
      customer: pedro,
      status: "CANCELLED",
      paymentMethod: "Visa ···7654",
      createdAt: daysAgo(2),
      items: [{ product: bag, quantity: 1 }],
    },
    {
      customer: isa,
      status: "SHIPPED",
      paymentMethod: "PayPal",
      createdAt: daysAgo(3),
      items: [{ product: sneakers, quantity: 1 }],
    },
    {
      customer: mariaC,
      status: "DELIVERED",
      paymentMethod: "Visa ···4242",
      createdAt: daysAgo(5),
      items: [
        { product: dress, quantity: 1 },
        { product: sneakers, quantity: 1 },
      ],
    },
    {
      customer: isa,
      status: "DELIVERED",
      paymentMethod: "PayPal",
      createdAt: daysAgo(7),
      items: [
        { product: bag, quantity: 1 },
        { product: sweater, quantity: 2 },
      ],
    },
    {
      customer: diego,
      status: "DELIVERED",
      paymentMethod: "Visa ···1029",
      createdAt: daysAgo(10),
      items: [{ product: denim, quantity: 1 }],
    },
    {
      customer: mariaC,
      status: "DELIVERED",
      paymentMethod: "Visa ···4242",
      createdAt: daysAgo(14),
      items: [{ product: sneakers, quantity: 1 }],
    },
    {
      customer: isa,
      status: "DELIVERED",
      paymentMethod: "PayPal",
      createdAt: daysAgo(20),
      items: [
        { product: dress, quantity: 1 },
        { product: bag, quantity: 1 },
      ],
    },
  ];

  for (const spec of orderSpecs) {
    const itemsData = spec.items.map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
      unitPrice: Number((i.product as { price: unknown }).price),
    }));
    const total = itemsData.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    await prisma.order.create({
      data: {
        customerId: spec.customer.id,
        status: spec.status,
        paymentMethod: spec.paymentMethod,
        total,
        createdAt: spec.createdAt,
        items: { create: itemsData },
      },
    });
  }

  // Discounts
  const discounts: Array<{
    code: string;
    description: string;
    type: DiscountType;
    value: number;
    limit?: number | null;
    status: DiscountStatus;
    expiresAt?: Date | null;
  }> = [
    {
      code: "WELCOME10",
      description: "10% off para nuevos clientes",
      type: "PERCENT",
      value: 10,
      status: "ACTIVE",
      expiresAt: new Date("2026-12-31"),
    },
    {
      code: "SUMMER25",
      description: "Colección primavera-verano",
      type: "PERCENT",
      value: 25,
      limit: 500,
      status: "ACTIVE",
      expiresAt: new Date("2026-06-30"),
    },
    {
      code: "FREESHIP80",
      description: "Envío gratis sobre $80",
      type: "SHIPPING",
      value: 0,
      status: "ACTIVE",
    },
    {
      code: "BLACKFRIDAY",
      description: "Black Friday 2026",
      type: "PERCENT",
      value: 40,
      limit: 2000,
      status: "SCHEDULED",
      expiresAt: new Date("2026-11-28"),
    },
    {
      code: "EASTER20",
      description: "Pascua 2026",
      type: "FIXED",
      value: 20,
      limit: 1000,
      status: "EXPIRED",
      expiresAt: new Date("2026-04-05"),
    },
  ];
  for (const d of discounts) {
    await prisma.discount.create({ data: d });
  }

  console.log("Seed complete:");
  console.log(
    `  ${await prisma.user.count()} usuarios, ${await prisma.category.count()} categorías, ${await prisma.product.count()} productos, ${await prisma.customer.count()} clientes, ${await prisma.order.count()} órdenes, ${await prisma.discount.count()} descuentos.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
