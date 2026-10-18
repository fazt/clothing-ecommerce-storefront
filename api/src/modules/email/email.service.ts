import { send, type SendResult } from "./resend.client";
import {
  orderConfirmationEmail,
  orderRefundedEmail,
  orderShippedEmail,
  passwordResetEmail,
  welcomeEmail,
  type ConfirmationItem,
} from "./templates";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";

interface UserLike {
  email: string;
  name: string | null;
}

interface OrderLike {
  number: number;
  subtotal: unknown;
  discountTotal: unknown;
  shippingTotal: unknown;
  total: unknown;
  paymentMethod: string;
  couponCode: string | null;
  items: Array<{
    quantity: number;
    unitPrice: unknown;
    sizeLabel?: string | null;
    colorLabel?: string | null;
    product: { name: string } | null;
  }>;
}

async function safeSend(
  label: string,
  to: string,
  template: { subject: string; html: string; text: string },
): Promise<SendResult> {
  const result = await send({ to, subject: template.subject, html: template.html, text: template.text });
  if ("error" in result) {
    logger.error({ template: label, error: result.error }, "email: no se pudo enviar");
  }
  return result;
}

export const emailService = {
  async sendWelcome(user: UserLike): Promise<SendResult> {
    return safeSend("welcome", user.email, welcomeEmail({ name: user.name, email: user.email }));
  },

  async sendPasswordReset(user: UserLike, token: string): Promise<SendResult> {
    const resetUrl = `${new URL(env.WEB_URL).origin}/reset-password?token=${encodeURIComponent(token)}`;
    return safeSend("password-reset", user.email, passwordResetEmail({ name: user.name, resetUrl }));
  },

  async sendOrderConfirmation(order: OrderLike, user: UserLike): Promise<SendResult> {
    const items: ConfirmationItem[] = order.items.map((i) => {
      const labels = [i.sizeLabel, i.colorLabel].filter(Boolean).join(" · ");
      const name = i.product?.name ?? "Producto";
      return { name: labels ? `${name} (${labels})` : name, quantity: i.quantity, unitPrice: Number(i.unitPrice) };
    });
    const template = orderConfirmationEmail({
      name: user.name,
      orderNumber: order.number,
      subtotal: Number(order.subtotal),
      discount: Number(order.discountTotal),
      shipping: Number(order.shippingTotal),
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      couponCode: order.couponCode,
      items,
    });
    return safeSend("order-confirmation", user.email, template);
  },

  async sendOrderShipped(
    order: { number: number; trackingNumber: string | null; shippingMethod: { name: string } | null },
    user: UserLike,
  ): Promise<SendResult> {
    const template = orderShippedEmail({
      name: user.name,
      orderNumber: order.number,
      shippingMethod: order.shippingMethod?.name ?? null,
      trackingNumber: order.trackingNumber,
    });
    return safeSend("order-shipped", user.email, template);
  },

  async sendOrderRefunded(
    order: { number: number; total: unknown; paymentMethod: string },
    user: UserLike,
  ): Promise<SendResult> {
    const template = orderRefundedEmail({
      name: user.name,
      orderNumber: order.number,
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
    });
    return safeSend("order-refunded", user.email, template);
  },
};
