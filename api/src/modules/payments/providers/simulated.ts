import { env, isProd } from "../../../config/env";
import type { CheckoutRequest, CheckoutSession, PaymentEvent, PaymentProvider } from "./types";

/** ¿Está encendida? Por defecto sí en desarrollo/tests y NO en producción. */
export const simulatedEnabled = () => env.PAYMENTS_SIMULATED_ENABLED ?? !isProd;

/**
 * Pasarela simulada para la demo: lleva al comprador a /checkout/simulated/:orderId, donde aprueba
 * o rechaza el pago. Apagada en producción salvo PAYMENTS_SIMULATED_ENABLED=true (demo pública).
 */
export class SimulatedProvider implements PaymentProvider {
  readonly id = "SIMULATED" as const;
  readonly label = "Pago simulado (demo)";

  isEnabled() {
    return simulatedEnabled();
  }

  async createCheckout(r: CheckoutRequest): Promise<CheckoutSession> {
    return {
      providerRef: `sim_${r.orderId}`,
      url: `${new URL(env.WEB_URL).origin}/checkout/simulated/${r.orderId}`,
    };
  }

  /** El resultado lo decide el comprador en la pantalla simulada (ver checkoutService.simulate). */
  async confirm(): Promise<PaymentEvent | null> {
    return null;
  }

  async parseWebhook(): Promise<PaymentEvent> {
    throw new Error("La pasarela simulada no recibe webhooks");
  }

  async refund() {
    // Nada que devolver: el dinero nunca se movió.
  }
}
