import crypto from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { checkoutService } from "../src/modules/payments/checkout.service";
import {
  adminUser,
  app,
  prisma,
  productWithVariant,
  registerUser,
  request,
  resetDatabase,
  shippingAddress,
} from "./helpers";

function checkout(token: string, body: Record<string, unknown>) {
  return request(app)
    .post("/api/checkout")
    .set("Authorization", `Bearer ${token}`)
    .send({ provider: "SIMULATED", shipping: shippingAddress, ...body });
}

describe("checkout", () => {
  beforeEach(resetDatabase);

  it("calcula el total en el servidor con envío y cupón", async () => {
    const { product, variant } = await productWithVariant(10, 40);
    await prisma.shippingMethod.create({ data: { name: "Estándar", price: 5, freeOver: 100 } });
    await prisma.discount.create({ data: { code: "DIEZ", type: "PERCENT", value: 10 } });

    const res = await request(app)
      .post("/api/checkout/quote")
      .send({ items: [{ productId: product.id, variantId: variant.id, quantity: 2 }], couponCode: "diez" })
      .expect(200);
    expect(res.body.subtotalCents).toBe(8000);
    expect(res.body.shippingCents).toBe(500);
    expect(res.body.discountCents).toBe(800);
    expect(res.body.totalCents).toBe(7700);
  });

  it("exige elegir variante cuando el producto tiene tallas/colores", async () => {
    const { product } = await productWithVariant(5);
    const { token } = await registerUser();
    const res = await checkout(token, { items: [{ productId: product.id, quantity: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe("VARIANT_REQUIRED");
  });

  it("no sobrevende: 8 compras simultáneas de 3 unidades → solo 3 órdenes", async () => {
    const { product, variant } = await productWithVariant(3);
    const buyers = await Promise.all(Array.from({ length: 8 }, (_, i) => registerUser(`Comprador ${i}`)));

    const results = await Promise.all(
      buyers.map((b) => checkout(b.token, { items: [{ productId: product.id, variantId: variant.id, quantity: 1 }] })),
    );

    const ok = results.filter((r) => r.status === 201);
    const soldOut = results.filter((r) => r.status === 409);
    expect(ok).toHaveLength(3);
    expect(soldOut).toHaveLength(5);
    const after = await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } });
    expect(after.stock).toBe(0);
    expect(await prisma.order.count({ where: { status: "PENDING" } })).toBe(3);
  });

  it("el límite de usos del cupón es atómico", async () => {
    const { product, variant } = await productWithVariant(20);
    await prisma.discount.create({ data: { code: "UNO", type: "FIXED", value: 5, limit: 1 } });
    const buyers = await Promise.all(Array.from({ length: 5 }, () => registerUser()));

    const results = await Promise.all(
      buyers.map((b) =>
        checkout(b.token, { items: [{ productId: product.id, variantId: variant.id, quantity: 1 }], couponCode: "UNO" }),
      ),
    );
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    const coupon = await prisma.discount.findUniqueOrThrow({ where: { code: "UNO" } });
    expect(coupon.usesCount).toBe(1);
  });

  it("pago simulado aprobado → PROCESSING; rechazado → stock y cupón devueltos", async () => {
    const { product, variant } = await productWithVariant(5);
    await prisma.discount.create({ data: { code: "OK5", type: "FIXED", value: 5, limit: 10 } });
    const { token } = await registerUser();

    const a = await checkout(token, { items: [{ productId: product.id, variantId: variant.id, quantity: 2 }] }).expect(201);
    expect(a.body.url).toContain(`/checkout/simulated/${a.body.orderId}`);
    const approved = await request(app)
      .post(`/api/checkout/orders/${a.body.orderId}/simulate`)
      .set("Authorization", `Bearer ${token}`)
      .send({ action: "approve" })
      .expect(200);
    expect(approved.body.status).toBe("PROCESSING");

    const b = await checkout(token, {
      items: [{ productId: product.id, variantId: variant.id, quantity: 2 }],
      couponCode: "OK5",
    }).expect(201);
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock).toBe(1);
    const rejected = await request(app)
      .post(`/api/checkout/orders/${b.body.orderId}/simulate`)
      .set("Authorization", `Bearer ${token}`)
      .send({ action: "reject" })
      .expect(200);
    expect(rejected.body.status).toBe("CANCELLED");
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock).toBe(3);
    expect((await prisma.discount.findUniqueOrThrow({ where: { code: "OK5" } })).usesCount).toBe(0);
  });

  it("otro usuario no puede ver ni pagar una orden ajena", async () => {
    const { product, variant } = await productWithVariant(5);
    const owner = await registerUser();
    const other = await registerUser();
    const order = await checkout(owner.token, { items: [{ productId: product.id, variantId: variant.id, quantity: 1 }] }).expect(201);
    await request(app)
      .post(`/api/checkout/orders/${order.body.orderId}/simulate`)
      .set("Authorization", `Bearer ${other.token}`)
      .send({ action: "approve" })
      .expect(404);
  });

  it("las órdenes vencidas liberan el stock", async () => {
    const { product, variant } = await productWithVariant(4);
    const { token } = await registerUser();
    const res = await checkout(token, { items: [{ productId: product.id, variantId: variant.id, quantity: 4 }] }).expect(201);
    await prisma.order.update({ where: { id: res.body.orderId }, data: { expiresAt: new Date(Date.now() - 1000) } });

    expect(await checkoutService.expireStaleOrders()).toBe(1);
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock).toBe(4);
    // Una segunda pasada no devuelve el stock dos veces.
    expect(await checkoutService.expireStaleOrders()).toBe(0);
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock).toBe(4);
  });

  it("webhook de Stripe: firma obligatoria y evento procesado una sola vez", async () => {
    const { product, variant } = await productWithVariant(5, 30);
    const buyer = await registerUser();
    const customer = await prisma.customer.create({ data: { email: buyer.email, name: "Comprador" } });
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        userId: buyer.user.id,
        total: 30,
        subtotal: 30,
        paymentMethod: "Tarjeta (Stripe)",
        provider: "STRIPE",
        providerRef: "cs_test_123",
        stockReserved: true,
        items: { create: [{ productId: product.id, variantId: variant.id, quantity: 1, unitPrice: 30 }] },
      },
    });

    const payload = JSON.stringify({
      id: "evt_test_1",
      type: "checkout.session.completed",
      data: {
        object: {
          id: "cs_test_123",
          payment_status: "paid",
          payment_intent: "pi_test_1",
          amount_total: 3000,
          currency: "usd",
          metadata: { orderId: order.id },
        },
      },
    });
    const t = Math.floor(Date.now() / 1000);
    const sig = crypto.createHmac("sha256", "whsec_test_secret").update(`${t}.${payload}`).digest("hex");

    await request(app)
      .post("/api/webhooks/stripe")
      .set("Content-Type", "application/json")
      .set("Stripe-Signature", `t=${t},v1=${"0".repeat(64)}`)
      .send(payload)
      .expect(400);

    for (let i = 0; i < 2; i++) {
      await request(app)
        .post("/api/webhooks/stripe")
        .set("Content-Type", "application/json")
        .set("Stripe-Signature", `t=${t},v1=${sig}`)
        .send(payload)
        .expect(200);
    }

    const paid = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(paid.status).toBe("PROCESSING");
    expect(paid.paymentRef).toBe("pi_test_1");
    expect(await prisma.paymentEvent.count({ where: { orderId: order.id } })).toBe(1);
  });

  it("el panel reembolsa una orden pagada y devuelve el stock si no se envió", async () => {
    const { product, variant } = await productWithVariant(3);
    const buyer = await registerUser();
    const admin = await adminUser();
    const order = await checkout(buyer.token, { items: [{ productId: product.id, variantId: variant.id, quantity: 1 }] }).expect(201);
    await request(app)
      .post(`/api/checkout/orders/${order.body.orderId}/simulate`)
      .set("Authorization", `Bearer ${buyer.token}`)
      .send({ action: "approve" })
      .expect(200);

    // Cancelar una orden pagada no está permitido: se reembolsa.
    await request(app)
      .patch(`/api/orders/${order.body.orderId}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ status: "CANCELLED" })
      .expect(409);

    const refunded = await request(app)
      .post(`/api/orders/${order.body.orderId}/refund`)
      .set("Authorization", `Bearer ${admin.token}`)
      .expect(200);
    expect(refunded.body.status).toBe("REFUNDED");
    expect((await prisma.productVariant.findUniqueOrThrow({ where: { id: variant.id } })).stock).toBe(3);
  });
});
