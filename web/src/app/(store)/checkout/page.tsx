import { redirect, unstable_rethrow } from "next/navigation";
import { CheckoutView } from "./checkout-view";
import { paymentsApi } from "@/lib/api";
import { getSessionUser } from "@/lib/session";

export const metadata = {
  title: "Checkout — Atelier",
};

export default async function CheckoutPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/checkout");

  const methods = await paymentsApi.methods().catch((e: unknown) => {
    unstable_rethrow(e);
    return { paypal: false, stripe: false };
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold tracking-tight">Checkout</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Revisa tu pedido y elige cómo pagar.
      </p>
      <CheckoutView methods={methods} />
    </div>
  );
}
