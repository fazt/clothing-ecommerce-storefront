import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import {
  capturePaypalOrder,
  createPaypalOrder,
} from "./paypal.client";
import { getStripe } from "./stripe.client";
import { emailService } from "../email";

export interface CheckoutItemInput {
  productId: string;
  quantity: number;
  variantId?: string | null;
  sizeLabel?: string | null;
  colorLabel?: string | null;
}

export interface CreateCheckoutInput {
  userId: string;
  userEmail: string;
  userName: string | null;
  items: CheckoutItemInput[];
}

const CURRENCY = "USD";

const orderInclude = {
  items: {
    include: {
      product: { select: { id: true, name: true, imageUrl: true } },
    },
  },
  customer: { select: { id: true, name: true, email: true } },
} as const;

type OrderWithItems = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

function fail(code: string, message: string): never {
  const err = new Error(message);
  (err as Error & { code?: string }).code = code;
  throw err;
}

/**
 * Validates the cart against the database and creates a PENDING order.
 * Prices always come from the database, never from the client.
 */
async function createPendingOrder(input: CreateCheckoutInput, paymentMethod: string) {
  if (!input.items || input.items.length === 0) {
    fail("EMPTY_CART", "Cart is empty");
  }

  const productIds = [...new Set(input.items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  if (products.length !== productIds.length) {
    fail("INVALID_PRODUCT", "One or more products do not exist");
  }

  const productById = new Map(products.map((p) => [p.id, p]));

  const variantIds = [
    ...new Set(
      input.items
        .map((i) => i.variantId)
        .filter((v): v is string => !!v),
    ),
  ];
  const variants = variantIds.length
    ? await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: { id: true, productId: true, price: true },
      })
    : [];
  const variantById = new Map(variants.map((v) => [v.id, v]));
  const invalidVariant = input.items.some((i) => {
    if (!i.variantId) return false;
    return variantById.get(i.variantId)?.productId !== i.productId;
  });
  if (invalidVariant) {
    fail("INVALID_VARIANT", "One or more variants are invalid");
  }

  const lines = input.items
    .filter((i) => i.quantity > 0)
    .map((i) => {
      const product = productById.get(i.productId)!;
      const variantPrice = i.variantId ? variantById.get(i.variantId)?.price : null;
      const labels = [i.sizeLabel, i.colorLabel].filter(Boolean).join(" · ");
      return {
        name: labels ? `${product.name} (${labels})` : product.name,
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: Number(variantPrice ?? product.price),
        variantId: i.variantId ?? null,
        sizeLabel: i.sizeLabel ?? null,
        colorLabel: i.colorLabel ?? null,
      };
    });

  const total = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
  if (total <= 0) {
    fail("INVALID_TOTAL", "Total must be greater than zero");
  }

  const customer = await prisma.customer.upsert({
    where: { email: input.userEmail },
    update: { name: input.userName || undefined },
    create: {
      email: input.userEmail,
      name: input.userName || input.userEmail.split("@")[0],
    },
  });

  const order = await prisma.order.create({
    data: {
      customerId: customer.id,
      userId: input.userId,
      status: "PENDING",
      paymentMethod,
      total,
      items: {
        create: lines.map(({ name: _name, ...item }) => item),
      },
    },
  });

  return { order, lines, total };
}

/** Drops an order whose payment session could not be opened. */
async function discardOrder(orderId: string) {
  await prisma.order.delete({ where: { id: orderId } }).catch(() => undefined);
}

async function findOwnedOrder(where: Prisma.OrderWhereUniqueInput, userId: string) {
  const order = await prisma.order.findUnique({ where, include: orderInclude });
  if (!order) fail("ORDER_NOT_FOUND", "Order not found");
  if (order.userId && order.userId !== userId) {
    fail("FORBIDDEN", "Order does not belong to this user");
  }
  return order;
}

/**
 * Moves an order from PENDING to PROCESSING. The conditional update makes it
 * safe to call from both the return page and the webhook: only the call that
 * performs the transition sends the confirmation email.
 */
async function markPaid(orderId: string, data: Prisma.OrderUpdateManyMutationInput) {
  const { count } = await prisma.order.updateMany({
    where: { id: orderId, status: "PENDING" },
    data: { ...data, status: "PROCESSING" },
  });
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    include: orderInclude,
  });
  if (count === 1) sendConfirmation(order);
  return order;
}

// Fail-safe: confirmation email never breaks the payment flow
function sendConfirmation(order: OrderWithItems) {
  if (!order.userId) return;
  prisma.user
    .findUnique({ where: { id: order.userId } })
    .then((user) => {
      if (!user) return;
      return emailService.sendOrderConfirmation(order, {
        email: user.email,
        name: user.name,
      });
    })
    .catch((e) => console.error("[payment] confirmation email failed", e));
}

function withQueryParam(url: string, param: string): string {
  return `${url}${url.includes("?") ? "&" : "?"}${param}`;
}

function paymentIntentId(session: Stripe.Checkout.Session): string | null {
  const intent = session.payment_intent;
  return typeof intent === "string" ? intent : intent?.id ?? null;
}

export const paymentService = {
  async createCheckout(input: CreateCheckoutInput) {
    const { order, total } = await createPendingOrder(input, "PayPal");
    try {
      const paypal = await createPaypalOrder({
        amount: total.toFixed(2),
        currency: CURRENCY,
        description: `Atelier order ${order.id.slice(0, 8)}`,
        returnUrl:
          process.env.PAYPAL_RETURN_URL ||
          "http://localhost:3000/checkout/return",
        cancelUrl:
          process.env.PAYPAL_CANCEL_URL ||
          "http://localhost:3000/checkout/cancel",
      });

      await prisma.order.update({
        where: { id: order.id },
        data: { paypalOrderId: paypal.id },
      });

      return {
        orderId: order.id,
        paypalOrderId: paypal.id,
        approveUrl: paypal.approveUrl,
      };
    } catch (error) {
      await discardOrder(order.id);
      throw error;
    }
  },

  async capture(paypalOrderId: string, userId: string) {
    const order = await findOwnedOrder({ paypalOrderId }, userId);
    if (order.status !== "PENDING") {
      return order;
    }

    const capture = await capturePaypalOrder(paypalOrderId);
    if (capture.status !== "COMPLETED") {
      fail("CAPTURE_NOT_COMPLETED", `Unexpected capture status: ${capture.status}`);
    }

    return markPaid(order.id, { paypalCaptureId: capture.captureId });
  },

  async createStripeCheckout(input: CreateCheckoutInput) {
    const { order, lines } = await createPendingOrder(input, "Stripe");
    try {
      const session = await getStripe().checkout.sessions.create(
        {
          mode: "payment",
          customer_email: input.userEmail,
          client_reference_id: order.id,
          metadata: { orderId: order.id },
          line_items: lines.map((line) => ({
            quantity: line.quantity,
            price_data: {
              currency: CURRENCY.toLowerCase(),
              unit_amount: Math.round(line.unitPrice * 100),
              product_data: { name: line.name },
            },
          })),
          success_url: withQueryParam(
            process.env.STRIPE_SUCCESS_URL || "http://localhost:3000/checkout/return",
            "session_id={CHECKOUT_SESSION_ID}",
          ),
          cancel_url:
            process.env.STRIPE_CANCEL_URL || "http://localhost:3000/checkout/cancel",
        },
        { idempotencyKey: `checkout-${order.id}` },
      );
      if (!session.url) fail("STRIPE_NO_URL", "Stripe did not return a checkout URL");

      await prisma.order.update({
        where: { id: order.id },
        data: { stripeSessionId: session.id },
      });

      return { orderId: order.id, sessionId: session.id, url: session.url };
    } catch (error) {
      await discardOrder(order.id);
      throw error;
    }
  },

  async confirmStripeSession(sessionId: string, userId: string) {
    const order = await findOwnedOrder({ stripeSessionId: sessionId }, userId);
    if (order.status !== "PENDING") {
      return order;
    }

    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid") {
      fail("PAYMENT_NOT_COMPLETED", "El pago aún no se ha completado");
    }

    return markPaid(order.id, { stripePaymentIntentId: paymentIntentId(session) });
  },

  /** Webhook: completes the order even if the buyer never returns to the store. */
  async handleStripeEvent(event: Stripe.Event) {
    if (
      event.type !== "checkout.session.completed" &&
      event.type !== "checkout.session.async_payment_succeeded"
    ) {
      return;
    }
    const session = event.data.object;
    if (session.payment_status !== "paid") return;

    const order = await prisma.order.findUnique({
      where: { stripeSessionId: session.id },
      select: { id: true },
    });
    // Sessions created by anything else on the same Stripe account are ignored.
    if (!order) return;

    await markPaid(order.id, { stripePaymentIntentId: paymentIntentId(session) });
  },
};
