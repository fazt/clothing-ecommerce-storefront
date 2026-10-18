import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { SimulatedPayment } from "./simulated-payment";

export const metadata = {
  title: "Pago simulado — Atelier",
  robots: { index: false },
};

export default async function SimulatedPaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=/checkout/simulated/${orderId}`);

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16 sm:px-6">
      <SimulatedPayment orderId={orderId} />
    </div>
  );
}
