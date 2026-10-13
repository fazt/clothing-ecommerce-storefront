import type Stripe from "stripe";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { orderService } from "../../src/modules/orders/order.service";
import { paymentService } from "../../src/modules/payments/payment.service";
import {
  createProduct,
  createUser,
  prisma,
  productStock,
  resetDb,
  variantStock,
} from "../helpers/db";

// Only the payment providers and the email are mocked: orders and stock go
// through the real services against the test database.
const mocks = vi.hoisted(() => {
  let seq = 0;
  const next = () => `${++seq}-${Date.now()}`;
  return {
    createPaypalOrder: vi.fn(async () => ({
      id: `PAYPAL-${next()}`,
      approveUrl: "https://paypal.test/approve",
      raw: {},
    })),
    capturePaypalOrder: vi.fn(async (id: string) => ({
      status: "COMPLETED",
      captureId: `CAPTURE-${id}`,
    })),
    stripeCreate: vi.fn(async () => ({
      id: `cs_test_${next()}`,
      url: "https://stripe.test/checkout",
    })),
    stripeRetrieve: vi.fn(async (id: string) => ({
      id,
      payment_status: "paid",
      payment_intent: `pi_${id}`,
    })),
    sendOrderConfirmation: vi.fn(async () => undefined),
  };
});

vi.mock("../../src/modules/payments/paypal.client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/modules/payments/paypal.client")>()),
  createPaypalOrder: mocks.createPaypalOrder,
  capturePaypalOrder: mocks.capturePaypalOrder,
}));

vi.mock("../../src/modules/payments/stripe.client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/modules/payments/stripe.client")>()),
  getStripe: () => ({
    checkout: { sessions: { create: mocks.stripeCreate, retrieve: mocks.stripeRetrieve } },
  }),
}));

vi.mock("../../src/modules/email", () => ({
  emailService: { sendOrderConfirmation: mocks.sendOrderConfirmation },
}));


type Item = { productId: string; quantity: number; variantId?: string | null };
type User = Awaited<ReturnType<typeof createUser>>;

function checkoutInput(user: User, items: Item[]) {
  return { userId: user.id, userEmail: user.email, userName: user.name, items };
}

/** A whole PayPal purchase: open the checkout, then capture the payment. */
async function buyWithPaypal(items: Item[]) {
  const user = await createUser();
  const { paypalOrderId } = await paymentService.createCheckout(checkoutInput(user, items));
  return paymentService.capture(paypalOrderId, user.id);
}

/** A whole Stripe purchase: open the session, then confirm it from the return page. */
async function buyWithStripe(items: Item[]) {
  const user = await createUser();
  const { sessionId } = await paymentService.createStripeCheckout(checkoutInput(user, items));
  return paymentService.confirmStripeSession(sessionId, user.id);
}

beforeEach(async () => {
  await resetDb();
  vi.clearAllMocks();
});

afterAll(() => prisma.$disconnect());

describe("checkout: validación del carrito", () => {
  it("crea un pedido PENDING con el precio de la base de datos", async () => {
    const product = await createProduct({ price: 25, stock: 10 });
    const user = await createUser();

    const { orderId } = await paymentService.createCheckout(
      checkoutInput(user, [{ productId: product.id, quantity: 2 }]),
    );

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });
    expect(order.status).toBe("PENDING");
    expect(Number(order.total)).toBe(50);
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toMatchObject({ productId: product.id, quantity: 2 });
  });

  it("usa el precio de la variante cuando lo tiene", async () => {
    const product = await createProduct({
      price: 20,
      variants: [{ size: "XL", stock: 5, price: 30 }],
    });
    const user = await createUser();
    const { orderId } = await paymentService.createCheckout(
      checkoutInput(user, [
        { productId: product.id, quantity: 1, variantId: product.variants[0].id },
      ]),
    );
    const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
    expect(Number(order.total)).toBe(30);
  });

  it("rechaza un producto que no existe", async () => {
    const user = await createUser();
    await expect(
      paymentService.createCheckout(
        checkoutInput(user, [{ productId: "00000000-0000-0000-0000-000000000000", quantity: 1 }]),
      ),
    ).rejects.toMatchObject({ code: "INVALID_PRODUCT" });
    expect(await prisma.order.count()).toBe(0);
  });

  it("rechaza una variante que pertenece a otro producto", async () => {
    const shirt = await createProduct({ stock: 5 });
    const pants = await createProduct({ name: "Pantalón", variants: [{ size: "32", stock: 5 }] });
    const user = await createUser();
    await expect(
      paymentService.createCheckout(
        checkoutInput(user, [
          { productId: shirt.id, quantity: 1, variantId: pants.variants[0].id },
        ]),
      ),
    ).rejects.toMatchObject({ code: "INVALID_VARIANT" });
  });

  // BUG: createPendingOrder (src/modules/payments/payment.service.ts:49-131)
  // nunca lee Product.stock: se puede comprar más unidades de las que hay.
  it.fails("rechaza una cantidad mayor que el stock del producto", async () => {
    const product = await createProduct({ stock: 2 });
    const user = await createUser();
    await expect(
      paymentService.createCheckout(checkoutInput(user, [{ productId: product.id, quantity: 3 }])),
    ).rejects.toThrow();
    expect(await prisma.order.count()).toBe(0);
  });

  // BUG: mismo origen; un producto agotado (stock 0) se puede pagar igual.
  it.fails("rechaza un producto agotado", async () => {
    const product = await createProduct({ stock: 0 });
    const user = await createUser();
    await expect(
      paymentService.createCheckout(checkoutInput(user, [{ productId: product.id, quantity: 1 }])),
    ).rejects.toThrow();
  });

  // BUG: la consulta de variantes (payment.service.ts:72-75) solo selecciona
  // id, productId y price; el stock de la talla/color nunca se comprueba.
  it.fails("rechaza una cantidad mayor que el stock de la variante (talla/color)", async () => {
    const product = await createProduct({
      stock: 100,
      variants: [{ size: "M", color: "Rojo", stock: 1 }],
    });
    const user = await createUser();
    await expect(
      paymentService.createCheckout(
        checkoutInput(user, [
          { productId: product.id, quantity: 2, variantId: product.variants[0].id },
        ]),
      ),
    ).rejects.toThrow();
  });
});

describe("pago y descuento de stock", () => {
  it("si PayPal falla al abrir el pago, el pedido se descarta y el stock queda intacto", async () => {
    mocks.createPaypalOrder.mockRejectedValueOnce(new Error("PayPal no responde"));
    const product = await createProduct({ stock: 3 });
    const user = await createUser();

    await expect(
      paymentService.createCheckout(checkoutInput(user, [{ productId: product.id, quantity: 1 }])),
    ).rejects.toThrow("PayPal no responde");

    expect(await prisma.order.count()).toBe(0);
    expect(await productStock(product.id)).toBe(3);
  });

  it("capturar dos veces el mismo pago lo marca pagado una sola vez", async () => {
    const product = await createProduct({ stock: 5 });
    const user = await createUser();
    const { paypalOrderId } = await paymentService.createCheckout(
      checkoutInput(user, [{ productId: product.id, quantity: 1 }]),
    );

    const first = await paymentService.capture(paypalOrderId, user.id);
    const second = await paymentService.capture(paypalOrderId, user.id);

    expect(first.status).toBe("PROCESSING");
    expect(second.status).toBe("PROCESSING");
    expect(mocks.capturePaypalOrder).toHaveBeenCalledTimes(1);
    expect(mocks.sendOrderConfirmation).toHaveBeenCalledTimes(1);
  });

  // BUG: markPaid (payment.service.ts:152-163) solo cambia el estado a
  // PROCESSING; ningún código hace decrement de Product.stock.
  it.fails("al capturar el pago de PayPal se descuenta el stock del producto", async () => {
    const product = await createProduct({ stock: 5 });
    const order = await buyWithPaypal([{ productId: product.id, quantity: 2 }]);

    expect(order.status).toBe("PROCESSING");
    expect(await productStock(product.id)).toBe(3);
  });

  // BUG: mismo origen; tampoco se descuenta ProductVariant.stock.
  it.fails("al confirmar el pago de Stripe se descuenta el stock de la variante", async () => {
    const product = await createProduct({
      stock: 10,
      variants: [
        { size: "S", stock: 4 },
        { size: "M", stock: 4 },
      ],
    });
    const [small, medium] = product.variants;
    await buyWithStripe([{ productId: product.id, quantity: 1, variantId: small.id }]);

    expect(await variantStock(small.id)).toBe(3);
    expect(await variantStock(medium.id)).toBe(4);
  });

  // BUG: mismo origen; el webhook de Stripe también pasa por markPaid.
  it.fails("el webhook checkout.session.completed descuenta el stock", async () => {
    const product = await createProduct({ stock: 5 });
    const user = await createUser();
    const { sessionId } = await paymentService.createStripeCheckout(
      checkoutInput(user, [{ productId: product.id, quantity: 1 }]),
    );

    await paymentService.handleStripeEvent({
      type: "checkout.session.completed",
      data: { object: { id: sessionId, payment_status: "paid", payment_intent: "pi_1" } },
    } as unknown as Stripe.Event);

    const order = await prisma.order.findUniqueOrThrow({ where: { stripeSessionId: sessionId } });
    expect(order.status).toBe("PROCESSING");
    expect(await productStock(product.id)).toBe(4);
  });

  // BUG: sin comprobación ni decrement condicional (UPDATE ... WHERE stock >= n)
  // dentro de una transacción, cinco compradores pagan la última unidad.
  it.fails("concurrencia: cinco compras simultáneas de la última unidad, solo una se cobra", async () => {
    const product = await createProduct({ stock: 1 });

    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => buyWithPaypal([{ productId: product.id, quantity: 1 }])),
    );

    const paid = results.filter((r) => r.status === "fulfilled" && r.value.status === "PROCESSING");
    expect(paid).toHaveLength(1);
    expect(await prisma.order.count({ where: { status: "PROCESSING" } })).toBe(1);
    expect(await productStock(product.id)).toBe(0);
  });

  it("el stock nunca queda negativo tras compras simultáneas", async () => {
    const product = await createProduct({ stock: 1 });
    await Promise.allSettled(
      Array.from({ length: 5 }, () => buyWithPaypal([{ productId: product.id, quantity: 1 }])),
    );
    expect(await productStock(product.id)).toBeGreaterThanOrEqual(0);
  });
});

describe("cancelaciones y pedidos manuales", () => {
  // BUG: orderService.updateStatus (src/modules/orders/order.service.ts:90-95)
  // solo cambia el estado; al cancelar un pedido pagado no se repone el stock.
  // (Hoy el stock ni siquiera se descuenta al pagar: ver los tests de arriba.)
  it.fails("cancelar un pedido pagado devuelve las unidades al stock", async () => {
    const product = await createProduct({ stock: 5 });
    const order = await buyWithPaypal([{ productId: product.id, quantity: 2 }]);
    expect(await productStock(product.id)).toBe(3);

    await orderService.updateStatus(order.id, "CANCELLED");
    expect(await productStock(product.id)).toBe(5);
  });

  // BUG: orderService.create (order.service.ts:50-88), usado por POST /api/orders
  // del panel, crea pedidos de cualquier cantidad sin mirar ni descontar stock.
  it.fails("un pedido creado desde el panel no puede superar el stock", async () => {
    const product = await createProduct({ stock: 1 });
    const customer = await prisma.customer.create({
      data: { email: "tienda@test.local", name: "Cliente mostrador" },
    });

    await expect(
      orderService.create({
        customerId: customer.id,
        paymentMethod: "Efectivo",
        status: "PROCESSING",
        items: [{ productId: product.id, quantity: 5 }],
      }),
    ).rejects.toThrow();
    expect(await productStock(product.id)).toBe(1);
  });
});
