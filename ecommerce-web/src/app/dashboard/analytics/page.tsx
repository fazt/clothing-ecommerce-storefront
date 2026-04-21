import { ArrowUp, ArrowDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { salesSeries } from "@/lib/dashboard-data";

const channels = [
  { name: "Búsqueda orgánica", value: 42, revenue: 20298 },
  { name: "Directo", value: 23, revenue: 11115 },
  { name: "Redes sociales", value: 18, revenue: 8699 },
  { name: "Email", value: 11, revenue: 5316 },
  { name: "Referidos", value: 6, revenue: 2901 },
];

const devices = [
  { name: "Móvil", value: 64 },
  { name: "Desktop", value: 28 },
  { name: "Tablet", value: 8 },
];

const geoSales = [
  { country: "España", orders: 482, pct: 38 },
  { country: "México", orders: 321, pct: 25 },
  { country: "Argentina", orders: 218, pct: 17 },
  { country: "Chile", orders: 142, pct: 11 },
  { country: "Colombia", orders: 121, pct: 9 },
];

export default function DashboardAnalyticsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Analíticas"
        description="Entiende cómo se comporta tu tienda y tus clientes."
        actions={
          <select className="rounded-md border bg-background px-3 py-1.5 text-sm">
            <option>Últimos 30 días</option>
            <option>Últimos 7 días</option>
            <option>Este año</option>
          </select>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendencia de ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartBars data={salesSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dispositivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {devices.map((d) => (
              <div key={d.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span>{d.name}</span>
                  <span className="font-medium">{d.value}%</span>
                </div>
                <Progress value={d.value} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tráfico por canal</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Canal</th>
                  <th className="pb-2 font-medium">Peso</th>
                  <th className="pb-2 text-right font-medium">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((c) => (
                  <tr key={c.name} className="border-t">
                    <td className="py-2.5">{c.name}</td>
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full bg-foreground"
                            style={{ width: `${c.value}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {c.value}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 text-right font-semibold">
                      ${c.revenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ventas por país</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {geoSales.map((g) => (
              <div key={g.country}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{g.country}</span>
                  <span className="text-muted-foreground">
                    {g.orders} órdenes
                  </span>
                </div>
                <Progress value={g.pct} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat label="Sesiones" value="24,381" change={7.2} />
        <MiniStat label="Bounce rate" value="42.1%" change={-1.5} />
        <MiniStat label="Añadir al carrito" value="4,128" change={12.4} />
        <MiniStat label="Checkout iniciado" value="1,892" change={5.8} />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: number;
}) {
  const positive = change >= 0;
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-xl font-bold">{value}</span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-xs font-medium",
            positive ? "text-emerald-600" : "text-red-600",
          )}
        >
          {positive ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )}
          {Math.abs(change)}%
        </span>
      </div>
    </div>
  );
}

function ChartBars({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-48 items-end gap-1">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-foreground/80 transition-opacity hover:opacity-100"
          style={{ height: `${(v / max) * 100}%`, opacity: 0.5 + (v / max) * 0.5 }}
          title={`Día ${i + 1}: ${v}`}
        />
      ))}
    </div>
  );
}
