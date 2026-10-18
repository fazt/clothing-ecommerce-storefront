import { send, type SendResult } from "./resend.client";
import {
  orderConfirmationEmail,
  passwordResetEmail,
  welcomeEmail,
  type ConfirmationItem,
} from "./templates";

interface UserLike {
  email: string;
  name: string | null;
}

interface OrderLike {
  id: string;
  total: unknown;
  paymentMethod: string;
  items: Array<{
    quantity: number;
    unitPrice: unknown;
    product: { name: string } | null;
  }>;
}

async function safeSend(
  label: string,
  to: string,
  template: { subject: string; html: string; text: string },
): Promise<SendResult> {
  const result = await send({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
  if ("error" in result) {
    console.error(`[email:${label}] failed for ${to}: ${result.error}`);
  }
  return result;
}

export const emailService = {
  async sendWelcome(user: UserLike): Promise<SendResult> {
    const template = welcomeEmail({ name: user.name, email: user.email });
    return safeSend("welcome", user.email, template);
  },

  async sendPasswordReset(
    user: UserLike,
    token: string,
  ): Promise<SendResult> {
    const base =
      process.env.RESET_PASSWORD_URL || "http://localhost:3000/reset-password";
    const resetUrl = `${base}?token=${encodeURIComponent(token)}`;
    const template = passwordResetEmail({ name: user.name, resetUrl });
    return safeSend("password-reset", user.email, template);
  },

  async sendOrderConfirmation(
    order: OrderLike,
    user: UserLike,
  ): Promise<SendResult> {
    const items: ConfirmationItem[] = order.items.map((i) => ({
      name: i.product?.name ?? "Producto",
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
    }));
    const template = orderConfirmationEmail({
      name: user.name,
      orderId: order.id,
      total: Number(order.total),
      paymentMethod: order.paymentMethod,
      items,
    });
    return safeSend("order-confirmation", user.email, template);
  },
};
