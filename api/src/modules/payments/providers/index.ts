import { MercadoPagoProvider } from "./mercadopago";
import { PaypalProvider } from "./paypal";
import { SimulatedProvider } from "./simulated";
import { StripeProvider } from "./stripe";
import type { PaymentProvider, ProviderId } from "./types";

const registry: Record<ProviderId, PaymentProvider> = {
  STRIPE: new StripeProvider(),
  PAYPAL: new PaypalProvider(),
  MERCADOPAGO: new MercadoPagoProvider(),
  SIMULATED: new SimulatedProvider(),
};

/** Orden en el checkout: primero las reales, la simulada al final. */
const ORDER: ProviderId[] = ["STRIPE", "PAYPAL", "MERCADOPAGO", "SIMULATED"];

export const allProviders = () => ORDER.map((id) => registry[id]);

/** Pasarelas con credenciales (la simulada solo si está encendida). */
export const enabledProviders = () => allProviders().filter((p) => p.isEnabled());

/** Proveedor de una orden ya creada (confirmar, reembolsar), aunque hoy esté desactivado. */
export const providerById = (id: ProviderId) => registry[id];

/** Proveedor para cobrar: el elegido si está activo, o el primero disponible. */
export function resolveProvider(requested?: ProviderId | null): PaymentProvider | null {
  const enabled = enabledProviders();
  if (requested) return enabled.find((p) => p.id === requested) ?? null;
  return enabled[0] ?? null;
}

/** Ruta del webhook → proveedor. */
export const WEBHOOK_PROVIDERS: Record<string, ProviderId> = {
  stripe: "STRIPE",
  paypal: "PAYPAL",
  mercadopago: "MERCADOPAGO",
};

export * from "./types";
