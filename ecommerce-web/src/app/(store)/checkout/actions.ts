"use server";

import { redirect } from "next/navigation";
import { paymentsApi, type PaypalItemInput } from "@/lib/api";
import { getSessionUser } from "@/lib/session";

export type StartCheckoutResult =
  | { ok: true; approveUrl: string }
  | { ok: false; error: string; code?: string };

export async function startPaypalCheckoutAction(
  items: PaypalItemInput[],
): Promise<StartCheckoutResult> {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?next=/checkout");
  }
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Tu carrito está vacío." };
  }

  try {
    const result = await paymentsApi.createPaypal(items);
    return { ok: true, approveUrl: result.approveUrl };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    if (message.includes("API 503") || message.includes("PAYPAL_NOT_CONFIGURED")) {
      return {
        ok: false,
        code: "PAYPAL_NOT_CONFIGURED",
        error:
          "PayPal aún no está configurado. Añade PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET al .env de la API.",
      };
    }
    if (message.includes("API 502")) {
      return {
        ok: false,
        error:
          "PayPal rechazó la solicitud. Revisa que las credenciales sean del entorno sandbox correcto.",
      };
    }
    return { ok: false, error: "No se pudo iniciar el pago con PayPal." };
  }
}
