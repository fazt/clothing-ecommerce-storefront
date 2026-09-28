import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { ordersApi, type OrderStatus } from "@/lib/api";
import { OrdersTable } from "./orders-table";

async function loadStats() {
  try {
    const orders = await ordersApi.listAll();
    const count = (status: OrderStatus) => orders.filter((o) => o.status === status).length;
    return [
      { label: "Todas", value: orders.length },
      { label: "Pendientes", value: count("PENDING") },
      { label: "En preparación", value: count("PROCESSING") },
      { label: "Enviadas", value: count("SHIPPED") },
      { label: "Entregadas", value: count("DELIVERED") },
    ];
  } catch {
    return null;
  }
}

export default async function DashboardOrdersPage() {
  const stats = await loadStats();

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Órdenes"
        description="Revisa y gestiona los pedidos recibidos."
        actions={
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        }
      />
      {stats ? (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border bg-background p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-2 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      ) : null}
      <OrdersTable />
    </div>
  );
}
