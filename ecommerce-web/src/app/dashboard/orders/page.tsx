import { Search, Download, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/dashboard/page-header";
import { orders, statusStyles } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

export default function DashboardOrdersPage() {
  const totals = {
    all: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
  };

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

      <div className="mb-4 flex flex-wrap gap-2 border-b pb-3">
        <TabChip label="Todas" count={totals.all} active />
        <TabChip label="Pendientes" count={totals.pending} />
        <TabChip label="En preparación" count={totals.processing} />
        <TabChip label="Enviadas" count={totals.shipped} />
        <TabChip label="Entregadas" count={totals.delivered} />
      </div>

      <div className="rounded-lg border bg-background">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por número, cliente..." className="pl-9" />
          </div>
          <div className="flex gap-2">
            <select className="h-8 rounded-md border bg-background px-3 text-sm">
              <option>Todas las fechas</option>
              <option>Hoy</option>
              <option>Últimos 7 días</option>
              <option>Últimos 30 días</option>
            </select>
            <select className="h-8 rounded-md border bg-background px-3 text-sm">
              <option>Todos los métodos</option>
              <option>Visa</option>
              <option>Mastercard</option>
              <option>PayPal</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-3 pl-4 font-medium">Orden</th>
                <th className="py-3 font-medium">Cliente</th>
                <th className="py-3 font-medium">Fecha</th>
                <th className="py-3 font-medium">Método</th>
                <th className="py-3 font-medium">Items</th>
                <th className="py-3 font-medium">Estado</th>
                <th className="py-3 text-right font-medium">Total</th>
                <th className="w-10 py-3 pr-4" />
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const s = statusStyles[o.status];
                return (
                  <tr
                    key={o.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="py-3 pl-4 font-mono text-xs">{o.id}</td>
                    <td className="py-3">
                      <p className="font-medium">{o.customer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.customer.email}
                      </p>
                    </td>
                    <td className="py-3 text-muted-foreground">{o.date}</td>
                    <td className="py-3 text-muted-foreground">
                      {o.paymentMethod}
                    </td>
                    <td className="py-3">{o.items}</td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          s.className,
                        )}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold">
                      ${o.total.toFixed(2)}
                    </td>
                    <td className="py-3 pr-4">
                      <Button variant="ghost" size="icon-sm">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TabChip({
  label,
  count,
  active,
}: {
  label: string;
  count: number;
  active?: boolean;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 text-[10px] font-semibold",
          active ? "bg-background/20" : "bg-muted",
        )}
      >
        {count}
      </span>
    </button>
  );
}
