import { prisma } from "../../lib/prisma";
import {
  capturePaypalOrder,
  createPaypalOrder,
} from "./paypal.client";
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

export const paymentService = {
  async createCheckout(input: CreateCheckoutInput) {
    if (!input.items || input.items.length === 0) {
      const err = new Error("Cart is empty");
      (err as Error & { code?: string }).code = "EMPTY_CART";
      throw err;
    }

    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    if (products.length !== productIds.length) {
      const err = new Error("One or more products do not exist");
      (err as Error & { code?: string }).code = "INVALID_PRODUCT";
      throw err;
    }

    const priceById = new Map(products.map((p) => [p.id, Number(p.price)]));

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
    const variantPriceById = new Map(
      variants.map((v) => [v.id, v.price !== null ? Number(v.price) : null]),
    );
    const variantProductIds = new Set(variants.map((v) => v.productId));
    const invalidVariantRef = input.items.some(
      (i) => i.variantId && !variantPriceById.has(i.variantId),
    );
    const variantProductMismatch = input.items.some((i) => {
      if (!i.variantId) return false;
      const v = variants.find((x) => x.id === i.variantId);
      return !v || v.productId !== i.productId;
    });
    if (invalidVariantRef || variantProductMismatch) {
      const err = new Error("One or more variants are invalid");
      (err as Error & { code?: string }).code = "INVALID_VARIANT";
      throw err;
    }

    const itemsData = input.items
      .filter((i) => i.quantity > 0)
      .map((i) => {
        const variantOverride = i.variantId
          ? variantPriceById.get(i.variantId) ?? null
          : null;
        return {
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: variantOverride ?? priceById.get(i.productId) ?? 0,
          variantId: i.variantId ?? null,
          sizeLabel: i.sizeLabel ?? null,
          colorLabel: i.colorLabel ?? null,
        };
      });

    const total = itemsData.reduce(
      (sum, i) => sum + i.quantity * Number(i.unitPrice),
      0,
    );
    if (total <= 0) {
      const err = new Error("Total must be greater than zero");
      (err as Error & { code?: string }).code = "INVALID_TOTAL";
      throw err;
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
        paymentMethod: "PayPal",
        total,
        items: { create: itemsData },
      },
    });

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
  },

  async capture(paypalOrderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { paypalOrderId },
      include: orderInclude,
    });
    if (!order) {
      const err = new Error("Order not found");
      (err as Error & { code?: string }).code = "ORDER_NOT_FOUND";
      throw err;
    }
    if (order.userId && order.userId !== userId) {
      const err = new Error("Order does not belong to this user");
      (err as Error & { code?: string }).code = "FORBIDDEN";
      throw err;
    }
    if (order.status !== "PENDING") {
      return order;
    }

    const capture = await capturePaypalOrder(paypalOrderId);
    if (capture.status !== "COMPLETED") {
      const err = new Error(`Unexpected capture status: ${capture.status}`);
      (err as Error & { code?: string }).code = "CAPTURE_NOT_COMPLETED";
      throw err;
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PROCESSING",
        paypalCaptureId: capture.captureId,
      },
      include: orderInclude,
    });

    // Fail-safe: confirmation email never breaks the capture flow
    if (updated.userId) {
      prisma.user
        .findUnique({ where: { id: updated.userId } })
        .then((user) => {
          if (!user) return;
          return emailService.sendOrderConfirmation(updated, {
            email: user.email,
            name: user.name,
          });
        })
        .catch((e) =>
          console.error("[payment.capture] confirmation email failed", e),
        );
    }

    return updated;
  },
};
