import { PageHeader } from "@/components/dashboard/page-header";
import { ShippingMethods } from "./shipping-methods";

export const metadata = { title: "Envíos — Atelier" };

export default function DashboardShippingPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Métodos de envío"
        description="Tarifas que ve el cliente en el checkout. El total siempre lo calcula la API."
      />
      <ShippingMethods />
    </div>
  );
}
