import { AlertTriangle, Download, Mail, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/dashboard/page-header";
import { customersApi, type ApiCustomer } from "@/lib/api";
import { customerSegmentStyles } from "@/lib/status-ui";
import { cn } from "@/lib/utils";

async function loadCustomers(): Promise<
  { ok: true; customers: ApiCustomer[] } | { ok: false; error: string }
> {
  try {
    return { ok: true, customers: await customersApi.list() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export default async function DashboardCustomersPage() {
  const result = await loadCustomers();

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
      {!result.ok ? (
        <ApiError message={result.error} />
      ) : (
        <CustomersContent customers={result.customers} />
      )}
    </div>
  );
}

function ApiError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-10 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="font-semibold">No se pudo conectar con la API</p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function CustomersContent({ customers }: { customers: ApiCustomer[] }) {
  const vipCount = customers.filter((c) => c.segment === "vip").length;
  const returningCount = customers.filter((c) => c.segment === "returning").length;
  const avgSpent =
    customers.length > 0
      ? customers.reduce((s, c) => s + c.totalSpent, 0) / customers.length
      : 0;

  const stats = [
    { label: "Total clientes", value: customers.length.toString() },
    { label: "VIP", value: vipCount.toString() },
    { label: "Recurrentes", value: returningCount.toString() },
    { label: "Gasto promedio", value: `$${avgSpent.toFixed(2)}` },
  ];

  return (
    <>
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

        {customers.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Aún no hay clientes.
          </div>
        ) : (
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
                  const seg = customerSegmentStyles[c.segment];
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
                      <td className="py-3 font-medium">{c.ordersCount}</td>
                      <td className="py-3 font-semibold">
                        ${c.totalSpent.toFixed(2)}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {c.lastOrder
                          ? new Date(c.lastOrder).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
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
        )}
      </div>
    </>
  );
}
