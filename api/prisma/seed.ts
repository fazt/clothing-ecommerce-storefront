/**
 * Datos de demo: usuarios, catálogo con variantes (talla/color) y stock por variante, métodos de
 * envío, cupones, órdenes repartidas en los últimos 30 días, reseñas y wishlist.
 * Borra todo lo que no sean usuarios y lo vuelve a crear (idempotente).
 *
 *   pnpm --filter ecommerce-api db:seed
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  type DiscountStatus,
  type DiscountType,
  type OrderStatus,
  type PaymentProviderId,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Falta DATABASE_URL");
  process.exit(1);
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const img = (id: string, w = 800) => `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop&q=80`;

const SIZES_TOP = ["S", "M", "L", "XL"];
const SIZES_SHOES = ["38", "39", "40", "41", "42"];

/** Stock pseudoaleatorio pero estable (para que las capturas no cambien en cada seed). */
function stockFor(seed: string): number {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const n = Math.abs(h) % 14;
  return n < 2 ? 0 : n; // algunas combinaciones agotadas
}

async function main() {
  console.log("Sembrando datos de demo...");

  const [adminHash, userHash, demoHash] = await Promise.all([
    bcrypt.hash("admin123", 10),
    bcrypt.hash("user123", 10),
    bcrypt.hash("demo1234", 10),
  ]);
  const admin = await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: { passwordHash: adminHash, role: "ADMIN", name: "Admin Atelier" },
    create: { email: "admin@admin.com", passwordHash: adminHash, name: "Admin Atelier", role: "ADMIN" },
  });
  const user = await prisma.user.upsert({
    where: { email: "user@user.com" },
    update: { passwordHash: userHash, role: "USER", name: "Valentina Rojas" },
    create: { email: "user@user.com", passwordHash: userHash, name: "Valentina Rojas", role: "USER" },
  });
  const reviewerSeeds = [
    { email: "camila.torres@demo.dev", name: "Camila Torres" },
    { email: "mateo.gomez@demo.dev", name: "Mateo Gómez" },
    { email: "lucia.paredes@demo.dev", name: "Lucía Paredes" },
    { email: "santiago.diaz@demo.dev", name: "Santiago Díaz" },
  ];
  const reviewers = [];
  for (const r of reviewerSeeds) {
    reviewers.push(
      await prisma.user.upsert({
        where: { email: r.email },
        update: { name: r.name },
        create: { ...r, passwordHash: demoHash, role: "USER" },
      }),
    );
  }

  // Limpieza respetando FKs (los usuarios se conservan).
  await prisma.paymentEvent.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.discount.deleteMany();
  await prisma.shippingMethod.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();

  const [women, men, accessories, shoes] = await Promise.all([
    prisma.category.create({ data: { slug: "women", name: "Mujer", image: img("photo-1483985988355-763728e1935b") } }),
    prisma.category.create({ data: { slug: "men", name: "Hombre", image: img("photo-1516257984-b1b4d707412e") } }),
    prisma.category.create({
      data: { slug: "accessories", name: "Accesorios", image: img("photo-1584917865442-de89df76afd3") },
    }),
    prisma.category.create({ data: { slug: "shoes", name: "Calzado", image: img("photo-1460353581641-37baddab0fa2") } }),
  ]);

  const productSeeds: Array<{
    name: string;
    description: string;
    price: number;
    image: string;
    categoryId: string;
    isNew?: boolean;
    isSale?: boolean;
    isFeatured?: boolean;
    sizes?: string[];
    colors?: string[];
    /** Sin variantes: stock del producto. */
    stock?: number;
  }> = [
    {
      name: "Polo Oversize de Algodón Pima",
      description: "Polo de corte amplio en algodón pima peruano de 180 g. Suave, fresco y con caída perfecta.",
      price: 29.99,
      image: img("photo-1521572163474-6864f9cf17ab"),
      categoryId: men.id,
      isNew: true,
      isFeatured: true,
      sizes: SIZES_TOP,
      colors: ["Blanco", "Negro", "Arena"],
    },
    {
      name: "Vestido Midi de Lino",
      description: "Vestido midi de lino lavado con tirantes regulables y bolsillos laterales. Ideal para el verano.",
      price: 79,
      image: img("photo-1515372039744-b8f02a3ae446"),
      categoryId: women.id,
      isNew: true,
      isSale: true,
      isFeatured: true,
      sizes: ["XS", "S", "M", "L"],
      colors: ["Terracota", "Crudo"],
    },
    {
      name: "Casaca Denim Clásica",
      description: "Casaca de mezclilla 100% algodón con corte regular, botones metálicos y lavado medio.",
      price: 119,
      image: img("photo-1544022613-e87ca75a784a"),
      categoryId: men.id,
      isSale: true,
      isFeatured: true,
      sizes: SIZES_TOP,
      colors: ["Azul medio", "Azul oscuro"],
    },
    {
      name: "Bolso Bandolera de Cuero",
      description: "Bolso bandolera de cuero curtido vegetal, con correa ajustable y cierre magnético.",
      price: 149,
      image: img("photo-1591561954557-26941169b49e"),
      categoryId: accessories.id,
      isNew: true,
      colors: ["Coñac", "Negro"],
    },
    {
      name: "Zapatillas Blancas Minimal",
      description: "Zapatillas de cuero napa con suela de caucho cosida. Combinan con todo.",
      price: 99,
      image: img("photo-1525966222134-fcfa99b8ae77"),
      categoryId: shoes.id,
      isNew: true,
      isFeatured: true,
      sizes: SIZES_SHOES,
      colors: ["Blanco"],
    },
    {
      name: "Chompa Cuello Alto de Alpaca",
      description: "Chompa tejida en mezcla de alpaca y lana merino. Abriga sin pesar.",
      price: 89.5,
      image: img("photo-1434389677669-e08b4cac3105"),
      categoryId: women.id,
      isSale: true,
      sizes: ["S", "M", "L"],
      colors: ["Camel", "Gris jaspe"],
    },
    {
      name: "Pantalón Chino Slim",
      description: "Chino de gabardina con elastano, corte slim y basta ligeramente tapered.",
      price: 59,
      image: img("photo-1473966968600-fa801b869a1a"),
      categoryId: men.id,
      isFeatured: true,
      sizes: ["28", "30", "32", "34", "36"],
      colors: ["Beige", "Verde oliva", "Azul marino"],
    },
  ];

  const products = [];
  for (const p of productSeeds) {
    const variants: { size: string | null; color: string | null; sku: string; stock: number }[] = [];
    const sizes = p.sizes ?? [null];
    const colors = p.colors ?? [null];
    const base = p.name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z]/g, "")
      .slice(0, 6)
      .toUpperCase();
    for (const color of colors) {
      for (const size of sizes) {
        if (!size && !color) continue;
        const sku = [base, color?.slice(0, 3).toUpperCase(), size].filter(Boolean).join("-");
        variants.push({ size, color, sku, stock: stockFor(sku) });
      }
    }
    const stock = variants.length ? variants.reduce((s, v) => s + v.stock, 0) : (p.stock ?? 20);
    products.push(
      await prisma.product.create({
        data: {
          name: p.name,
          description: p.description,
          price: p.price,
          stock,
          imageUrl: p.image,
          images: [p.image],
          isNew: p.isNew ?? false,
          isSale: p.isSale ?? false,
          isFeatured: p.isFeatured ?? false,
          categoryId: p.categoryId,
          variants: variants.length ? { create: variants } : undefined,
        },
        include: { variants: true },
      }),
    );
  }
  const [polo, dress, denim, bag, sneakers, sweater, chinos] = products;

  // Envíos
  const [standard, express, pickup] = await Promise.all([
    prisma.shippingMethod.create({
      data: {
        name: "Envío estándar",
        description: "Courier a domicilio",
        price: 6.99,
        freeOver: 80,
        minDays: 3,
        maxDays: 5,
        sortOrder: 0,
      },
    }),
    prisma.shippingMethod.create({
      data: { name: "Envío express", description: "Entrega prioritaria", price: 14.9, minDays: 1, maxDays: 2, sortOrder: 1 },
    }),
    prisma.shippingMethod.create({
      data: { name: "Recojo en tienda", description: "Av. Larco 345, Miraflores", price: 0, minDays: 1, maxDays: 1, sortOrder: 2 },
    }),
  ]);

  // Cupones
  const now = Date.now();
  const days = (d: number) => new Date(now + d * 24 * 60 * 60 * 1000);
  const discounts: Array<{
    code: string;
    description: string;
    type: DiscountType;
    value: number;
    limit?: number | null;
    minSubtotal?: number | null;
    status: DiscountStatus;
    startsAt?: Date | null;
    expiresAt?: Date | null;
  }> = [
    { code: "BIENVENIDA10", description: "10% en tu primera compra", type: "PERCENT", value: 10, status: "ACTIVE", expiresAt: days(90) },
    { code: "VERANO25", description: "Colección verano", type: "PERCENT", value: 25, limit: 500, minSubtotal: 60, status: "ACTIVE", expiresAt: days(45) },
    { code: "ENVIOGRATIS", description: "Envío gratis sin mínimo", type: "SHIPPING", value: 0, status: "ACTIVE" },
    { code: "AHORRA20", description: "$20 de descuento sobre $100", type: "FIXED", value: 20, minSubtotal: 100, limit: 3, status: "ACTIVE" },
    { code: "CYBERWOW", description: "Cyber Wow (próximamente)", type: "PERCENT", value: 40, limit: 2000, status: "SCHEDULED", startsAt: days(20), expiresAt: days(23) },
    { code: "PASCUA20", description: "Campaña de Pascua", type: "FIXED", value: 20, limit: 1000, status: "EXPIRED", expiresAt: days(-150) },
  ];
  const createdDiscounts = [];
  for (const d of discounts) createdDiscounts.push(await prisma.discount.create({ data: d }));
  const welcome = createdDiscounts[0];

  // Clientes y órdenes (pagadas por distintas pasarelas, repartidas en 30 días)
  const customerSeeds = [
    { email: user.email, name: user.name ?? "Valentina Rojas", userId: user.id },
    { email: "maria.gonzalez@demo.dev", name: "María González" },
    { email: "carlos.ruiz@demo.dev", name: "Carlos Ruiz" },
    { email: "laura.fernandez@demo.dev", name: "Laura Fernández" },
    { email: "diego.martinez@demo.dev", name: "Diego Martínez" },
    { email: "ana.quispe@demo.dev", name: "Ana Quispe" },
    { email: "pedro.sanchez@demo.dev", name: "Pedro Sánchez" },
  ];
  const customers = [];
  for (const c of customerSeeds) {
    customers.push({ ...(await prisma.customer.create({ data: { email: c.email, name: c.name } })), userId: c.userId ?? null });
  }
  const [vale, maria, carlos, laura, diego, ana, pedro] = customers;

  const ago = (d: number, h = 0) => new Date(now - d * 24 * 60 * 60 * 1000 - h * 60 * 60 * 1000);
  const variantOf = (p: (typeof products)[number], i = 0) => p.variants[i % Math.max(p.variants.length, 1)] ?? null;
  const PROVIDER_LABEL: Record<PaymentProviderId, string> = {
    STRIPE: "Tarjeta (Stripe)",
    PAYPAL: "PayPal",
    MERCADOPAGO: "Mercado Pago",
    SIMULATED: "Pago simulado (demo)",
  };

  const orderSpecs: Array<{
    customer: (typeof customers)[number];
    status: OrderStatus;
    provider: PaymentProviderId;
    createdAt: Date;
    shipping: typeof standard;
    coupon?: typeof welcome;
    tracking?: string;
    items: { product: (typeof products)[number]; variant?: number; quantity: number }[];
  }> = [
    { customer: vale, status: "DELIVERED", provider: "STRIPE", createdAt: ago(18), shipping: standard, items: [{ product: dress, quantity: 1 }, { product: polo, variant: 1, quantity: 2 }] },
    { customer: vale, status: "SHIPPED", provider: "MERCADOPAGO", createdAt: ago(2), shipping: express, tracking: "OLV-48213977", coupon: welcome, items: [{ product: sneakers, variant: 2, quantity: 1 }] },
    { customer: maria, status: "PROCESSING", provider: "STRIPE", createdAt: ago(0, 3), shipping: standard, items: [{ product: polo, quantity: 2 }, { product: chinos, variant: 2, quantity: 1 }, { product: sneakers, variant: 1, quantity: 1 }] },
    { customer: carlos, status: "SHIPPED", provider: "PAYPAL", createdAt: ago(0, 9), shipping: express, tracking: "SRV-7781204", items: [{ product: denim, variant: 1, quantity: 1 }] },
    { customer: laura, status: "DELIVERED", provider: "PAYPAL", createdAt: ago(1), shipping: pickup, items: [{ product: sweater, quantity: 1 }] },
    { customer: diego, status: "PENDING", provider: "MERCADOPAGO", createdAt: ago(0, 1), shipping: standard, items: [{ product: bag, quantity: 1 }, { product: chinos, quantity: 1 }] },
    { customer: ana, status: "DELIVERED", provider: "MERCADOPAGO", createdAt: ago(4), shipping: standard, items: [{ product: chinos, variant: 4, quantity: 1 }] },
    { customer: pedro, status: "CANCELLED", provider: "STRIPE", createdAt: ago(5), shipping: standard, items: [{ product: bag, variant: 1, quantity: 1 }] },
    { customer: maria, status: "DELIVERED", provider: "STRIPE", createdAt: ago(7), shipping: standard, items: [{ product: dress, variant: 2, quantity: 1 }, { product: sneakers, quantity: 1 }] },
    { customer: laura, status: "REFUNDED", provider: "PAYPAL", createdAt: ago(9), shipping: express, items: [{ product: sweater, variant: 3, quantity: 1 }] },
    { customer: diego, status: "DELIVERED", provider: "STRIPE", createdAt: ago(12), shipping: standard, items: [{ product: denim, quantity: 1 }] },
    { customer: ana, status: "DELIVERED", provider: "MERCADOPAGO", createdAt: ago(21), shipping: pickup, items: [{ product: dress, quantity: 1 }, { product: bag, quantity: 1 }] },
    { customer: carlos, status: "DELIVERED", provider: "PAYPAL", createdAt: ago(26), shipping: standard, items: [{ product: polo, variant: 5, quantity: 3 }] },
  ];

  for (const spec of orderSpecs) {
    const lines = spec.items.map((i) => {
      const variant = i.variant !== undefined || i.product.variants.length ? variantOf(i.product, i.variant ?? 0) : null;
      const unitCents = Math.round(Number(variant?.price ?? i.product.price) * 100);
      return {
        productId: i.product.id,
        variantId: variant?.id ?? null,
        sizeLabel: variant?.size ?? null,
        colorLabel: variant?.color ?? null,
        quantity: i.quantity,
        unitCents,
      };
    });
    const subtotalCents = lines.reduce((s, l) => s + l.unitCents * l.quantity, 0);
    const shipPrice = Math.round(Number(spec.shipping.price) * 100);
    const freeOver = spec.shipping.freeOver === null ? null : Math.round(Number(spec.shipping.freeOver) * 100);
    const shippingCents = freeOver !== null && subtotalCents >= freeOver ? 0 : shipPrice;
    const discountCents = spec.coupon ? Math.round((subtotalCents * Number(spec.coupon.value)) / 100) : 0;
    const totalCents = subtotalCents + shippingCents - discountCents;
    const paid = ["PROCESSING", "SHIPPED", "DELIVERED", "REFUNDED"].includes(spec.status);
    const ref = `demo_${spec.provider.toLowerCase()}_${Math.random().toString(36).slice(2, 10)}`;

    await prisma.order.create({
      data: {
        customerId: spec.customer.id,
        userId: spec.customer.userId,
        status: spec.status,
        currency: "USD",
        subtotal: (subtotalCents / 100).toFixed(2),
        discountTotal: (discountCents / 100).toFixed(2),
        shippingTotal: (shippingCents / 100).toFixed(2),
        total: (totalCents / 100).toFixed(2),
        paymentMethod: PROVIDER_LABEL[spec.provider],
        provider: spec.provider,
        providerRef: ref,
        paymentRef: paid ? `${ref}_pay` : null,
        paidAt: paid ? spec.createdAt : null,
        // La orden pendiente de demo vence en 30 min (el job la cancela y no retiene stock real).
        expiresAt: spec.status === "PENDING" ? new Date(now + 30 * 60_000) : null,
        stockReserved: false,
        discountId: spec.coupon?.id ?? null,
        couponCode: spec.coupon?.code ?? null,
        shippingMethodId: spec.shipping.id,
        shippingName: spec.customer.name,
        shippingPhone: "+51 987 654 321",
        shippingLine1: "Av. José Larco 1232, dpto. 502",
        shippingCity: "Lima",
        shippingRegion: "Lima",
        shippingPostal: "15074",
        shippingCountry: "Perú",
        trackingNumber: spec.tracking ?? null,
        createdAt: spec.createdAt,
        items: {
          create: lines.map(({ unitCents, ...l }) => ({ ...l, unitPrice: (unitCents / 100).toFixed(2) })),
        },
      },
    });
    if (spec.coupon) {
      await prisma.discount.update({ where: { id: spec.coupon.id }, data: { usesCount: { increment: 1 } } });
    }
  }

  // Reseñas (las de compradores reales quedan como «compra verificada»)
  const reviewSeeds: Array<{ product: (typeof products)[number]; userId: string; rating: number; title: string; body: string; verified: boolean }> = [
    { product: dress, userId: user.id, rating: 5, title: "Fresco y elegante", body: "La tela de lino es liviana y no transparenta. Lo usé en una boda de día y me llovieron cumplidos.", verified: true },
    { product: dress, userId: reviewers[0].id, rating: 4, title: "Muy lindo", body: "Talla un poco grande, pedí S y me quedó holgado. La calidad del lino es excelente.", verified: false },
    { product: polo, userId: user.id, rating: 5, title: "El mejor polo básico", body: "El algodón pima se siente premium y no se deformó después de varias lavadas.", verified: true },
    { product: polo, userId: reviewers[1].id, rating: 4, title: "Buen corte oversize", body: "Me gusta el largo y la caída. Ojalá tuviera más colores.", verified: false },
    { product: sneakers, userId: reviewers[2].id, rating: 5, title: "Cómodas desde el día uno", body: "No necesitaron ablande. El cuero es suave y la suela cosida se ve durable.", verified: false },
    { product: sneakers, userId: user.id, rating: 4, title: "Bonitas", body: "Talla exacta. Se ensucian fácil por ser blancas, pero se limpian con un paño húmedo.", verified: true },
    { product: denim, userId: reviewers[3].id, rating: 5, title: "Clásica de verdad", body: "La mezclilla es gruesa y el lavado se ve auténtico. Vale cada sol.", verified: false },
    { product: sweater, userId: reviewers[0].id, rating: 3, title: "Abriga, pero pica un poco", body: "Es calientita, aunque al inicio pica en el cuello. Con una lavada mejoró.", verified: false },
    { product: chinos, userId: reviewers[1].id, rating: 4, title: "Buen calce", body: "El elastano ayuda mucho. El verde oliva es más oscuro que en la foto.", verified: false },
  ];
  for (const r of reviewSeeds) {
    await prisma.review.create({
      data: { productId: r.product.id, userId: r.userId, rating: r.rating, title: r.title, body: r.body, verified: r.verified },
    });
  }
  for (const p of products) {
    const agg = await prisma.review.aggregate({
      where: { productId: p.id, status: "PUBLISHED" },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await prisma.product.update({
      where: { id: p.id },
      data: { ratingAvg: Number((agg._avg.rating ?? 0).toFixed(2)), ratingCount: agg._count._all },
    });
  }

  // Wishlist del usuario demo
  for (const p of [bag, denim, sweater]) {
    await prisma.wishlistItem.create({ data: { userId: user.id, productId: p.id } });
  }

  await prisma.newsletterSubscriber.upsert({
    where: { email: "maria.gonzalez@demo.dev" },
    update: {},
    create: { email: "maria.gonzalez@demo.dev" },
  });

  console.log("Seed listo:");
  console.log(
    `  ${await prisma.user.count()} usuarios (admin: ${admin.email}), ${await prisma.category.count()} categorías, ` +
      `${await prisma.product.count()} productos, ${await prisma.productVariant.count()} variantes, ` +
      `${await prisma.order.count()} órdenes, ${await prisma.discount.count()} cupones, ${await prisma.review.count()} reseñas.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
