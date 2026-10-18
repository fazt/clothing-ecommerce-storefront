import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { evaluateCoupon, mergeItems } from "../src/modules/payments/pricing";
import { verifyStripeSignature } from "../src/modules/payments/providers/stripe";
import { verifyMpSignature } from "../src/modules/payments/providers/mercadopago";

const coupon = (overrides: Partial<Parameters<typeof evaluateCoupon>[0]> = {}) => ({
  type: "PERCENT" as const,
  value: 10 as unknown as Parameters<typeof evaluateCoupon>[0]["value"],
  status: "ACTIVE" as const,
  limit: null,
  usesCount: 0,
  startsAt: null,
  expiresAt: null,
  minSubtotal: null,
  ...overrides,
});

describe("evaluateCoupon", () => {
  it("porcentaje sobre el subtotal", () => {
    expect(evaluateCoupon(coupon(), 10_000, 500)).toEqual({ discountCents: 1000 });
  });

  it("monto fijo nunca supera el subtotal", () => {
    expect(evaluateCoupon(coupon({ type: "FIXED", value: 50 as never }), 3000, 0)).toEqual({ discountCents: 3000 });
  });

  it("envío gratis descuenta el costo del envío", () => {
    expect(evaluateCoupon(coupon({ type: "SHIPPING", value: 0 as never }), 3000, 699)).toEqual({ discountCents: 699 });
  });

  it("rechaza cupones vencidos, agotados, programados o bajo el mínimo", () => {
    expect(evaluateCoupon(coupon({ expiresAt: new Date(Date.now() - 1000) }), 5000, 0)).toHaveProperty("error");
    expect(evaluateCoupon(coupon({ limit: 2, usesCount: 2 }), 5000, 0)).toHaveProperty("error");
    expect(evaluateCoupon(coupon({ startsAt: new Date(Date.now() + 60_000) }), 5000, 0)).toHaveProperty("error");
    expect(evaluateCoupon(coupon({ minSubtotal: 100 as never }), 5000, 0)).toHaveProperty("error");
    expect(evaluateCoupon(coupon({ status: "EXPIRED" }), 5000, 0)).toHaveProperty("error");
  });
});

describe("mergeItems", () => {
  it("junta líneas repetidas de la misma variante", () => {
    const merged = mergeItems([
      { productId: "p1", variantId: "v1", quantity: 1 },
      { productId: "p1", variantId: "v1", quantity: 2 },
      { productId: "p1", variantId: "v2", quantity: 1 },
    ]);
    expect(merged).toEqual([
      { productId: "p1", variantId: "v1", quantity: 3 },
      { productId: "p1", variantId: "v2", quantity: 1 },
    ]);
  });
});

describe("firmas de webhooks", () => {
  it("Stripe: acepta la firma correcta y rechaza otra o una vieja", () => {
    const body = Buffer.from('{"id":"evt_1"}');
    const t = Math.floor(Date.now() / 1000);
    const sig = crypto.createHmac("sha256", "whsec_x").update(`${t}.${body.toString()}`).digest("hex");
    expect(verifyStripeSignature(body, `t=${t},v1=${sig}`, "whsec_x")).toBe(true);
    expect(verifyStripeSignature(body, `t=${t},v1=${sig}`, "otro")).toBe(false);
    expect(verifyStripeSignature(body, `t=${t - 3600},v1=${sig}`, "whsec_x")).toBe(false);
    expect(verifyStripeSignature(body, undefined, "whsec_x")).toBe(false);
  });

  it("Mercado Pago: valida x-signature con la plantilla id/request-id/ts", () => {
    const ts = String(Math.floor(Date.now() / 1000));
    const manifest = `id:12345;request-id:req-1;ts:${ts};`;
    const v1 = crypto.createHmac("sha256", "mp_secret").update(manifest).digest("hex");
    const ok = verifyMpSignature({ secret: "mp_secret", signatureHeader: `ts=${ts},v1=${v1}`, requestId: "req-1", dataId: "12345" });
    const bad = verifyMpSignature({ secret: "mp_secret", signatureHeader: `ts=${ts},v1=${v1}`, requestId: "req-2", dataId: "12345" });
    expect(ok).toBe(true);
    expect(bad).toBe(false);
  });
});
