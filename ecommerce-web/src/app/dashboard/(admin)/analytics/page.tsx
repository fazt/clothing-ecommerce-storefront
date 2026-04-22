import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/dashboard/page-header";
import { analyticsApi, type AnalyticsSummary } from "@/lib/api";
import { cn } from "@/lib/utils";

async function loadSummary(): Promise<
  { ok: true; summary: AnalyticsSummary } | { ok: false; error: string }
> {
  try {
    return { ok: true, summary: await analyticsApi.summary() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

// Estos bloques no se derivan de la DB (no hay tracking de sesiones/dispositivos/geo).
// Se mantienen como placeholders hasta que se añada un sistema de eventos.
const devices = [
  { name: "Móvil", value: 64 },
  { name: "Desktop", value: 28 },
  { name: "Tablet", value: 8 },
];
const channels = [
  { name: "Búsqueda orgánica", value: 42, revenue: 20298 },
  { name: "Directo", value: 23, revenue: 11115 },
  { name: "Redes sociales", value: 18, revenue: 8699 },
  { name: "Email", value: 11, revenue: 5316 },
  { name: "Referidos", value: 6, revenue: 2901 },
];
const geoSales = [
  { country: "España", orders: 482, pct: 38 },
  { country: "México", orders: 321, pct: 25 },
  { country: "Argentina", orders: 218, pct: 17 },
  { country: "Chile", orders: 142, pct: 11 },
  { country: "Colombia", orders: 121, pct: 9 },
];

export default async function DashboardAnalyticsPage() {
  const result = await loadSummary();

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Analíticas"
        description="Entiende cómo se comporta tu tienda y tus clientes."
        actions={
          <select className="rounded-md border bg-background px-3 py-1.5 text-sm">
            <option>Últimos 30 días</option>
          </select>
        }
      />
      {!result.ok ? (
        <ApiError message={result.error} />
      ) : (
        <AnalyticsContent summary={result.summary} />
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

function AnalyticsContent({ summary }: { summary: AnalyticsSummary }) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tendencia de ingresos</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Últimos 30 días · ${summary.metrics.revenue.current.toLocaleString()}
            </p>
          </CardHeader>
          <CardContent>
            <ChartBars data={summary.salesSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dispositivos</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Placeholder · requiere tracking
            </p>
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
            <CardTitle>Top productos (por unidades vendidas)</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.topProducts.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Sin datos aún — crea órdenes para ver ventas por producto.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Producto</th>
                    <th className="pb-2 font-medium">Vendidos</th>
                    <th className="pb-2 text-right font-medium">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.topProducts.map((p) => (
                    <tr key={p.productId} className="border-t">
                      <td className="py-2.5">{p.name}</td>
                      <td className="py-2.5">{p.sold}</td>
                      <td className="py-2.5 text-right font-semibold">
                        ${p.revenue.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tráfico por canal</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Placeholder · requiere tracking
            </p>
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
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Ventas por país</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              Placeholder · requiere tracking
            </p>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
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
        <MiniStat
          label="Ingresos 30d"
          value={`$${summary.metrics.revenue.current.toLocaleString()}`}
          change={summary.metrics.revenue.change}
        />
        <MiniStat
          label="Órdenes 30d"
          value={summary.metrics.orders.current.toString()}
          change={summary.metrics.orders.change}
        />
        <MiniStat
          label="Clientes nuevos 30d"
          value={summary.metrics.newCustomers.current.toString()}
          change={summary.metrics.newCustomers.change}
        />
        <MiniStat
          label="Tasa conversión"
          value={`${summary.metrics.conversionRate.current}%`}
          change={summary.metrics.conversionRate.change}
        />
      </div>
    </>
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
  const max = Math.max(...data, 1);
  return (
    <div className="flex h-48 items-end gap-1">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t bg-foreground/80 transition-opacity"
          style={{
            height: `${(v / max) * 100}%`,
            opacity: 0.4 + (v / max) * 0.6,
          }}
          title={`Día ${i + 1}: $${v}`}
        />
      ))}
    </div>
  );
}
