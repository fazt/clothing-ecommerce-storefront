import { Download, Mail, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/dashboard/page-header";
import { customers, segmentStyles } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

export default function DashboardCustomersPage() {
  const stats = [
    { label: "Total clientes", value: customers.length.toString() },
    {
      label: "VIP",
      value: customers.filter((c) => c.segment === "vip").length.toString(),
    },
    {
      label: "Recurrentes",
      value: customers
        .filter((c) => c.segment === "returning")
        .length.toString(),
    },
    {
      label: "Gasto promedio",
      value: `$${(
        customers.reduce((s, c) => s + c.spent, 0) / customers.length
      ).toFixed(2)}`,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Clientes"
        description="Analiza y gestiona tu base de clientes."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Añadir cliente
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-background p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-background">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar clientes..." className="pl-9" />
          </div>
          <div className="flex gap-2">
            <select className="h-8 rounded-md border bg-background px-3 text-sm">
              <option>Todos los segmentos</option>
              <option>Nuevos</option>
              <option>Recurrentes</option>
              <option>VIP</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-3 pl-4 font-medium">Cliente</th>
                <th className="py-3 font-medium">Segmento</th>
                <th className="py-3 font-medium">Órdenes</th>
                <th className="py-3 font-medium">Total gastado</th>
                <th className="py-3 font-medium">Última compra</th>
                <th className="w-16 py-3 pr-4" />
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const seg = segmentStyles[c.segment];
                const initials = c.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2);
                return (
                  <tr
                    key={c.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="py-3 pl-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          seg.className,
                        )}
                      >
                        {seg.label}
                      </span>
                    </td>
                    <td className="py-3 font-medium">{c.orders}</td>
                    <td className="py-3 font-semibold">
                      ${c.spent.toFixed(2)}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {c.lastOrder}
                    </td>
                    <td className="py-3 pr-4">
                      <Button variant="ghost" size="icon-sm">
                        <Mail className="h-3.5 w-3.5" />
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
