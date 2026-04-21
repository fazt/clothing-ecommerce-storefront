import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { cn } from "@/lib/utils";
import {
  metrics,
  orders,
  salesSeries,
  statusStyles,
  topProducts,
} from "@/lib/dashboard-data";

export default function DashboardOverviewPage() {
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Resumen"
        description="Vista general del rendimiento de tu tienda."
        actions={
          <select className="rounded-md border bg-background px-3 py-1.5 text-sm">
            <option>Últimos 30 días</option>
            <option>Últimos 7 días</option>
            <option>Hoy</option>
            <option>Este año</option>
          </select>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => {
          const positive = m.change >= 0;
          return (
            <Card key={m.label}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {m.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-2xl font-bold">{m.value}</span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium",
                      positive
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                        : "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
                    )}
                  >
                    {positive ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    )}
                    {Math.abs(m.change)}%
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{m.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ventas</CardTitle>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ingresos diarios · últimos 30 días
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Ingresos</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Sparkline data={salesSeries} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos más vendidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.sold} vendidos
                  </p>
                </div>
                <p className="text-sm font-semibold">
                  ${p.revenue.toLocaleString()}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Órdenes recientes</CardTitle>
              <Link
                href="/dashboard/orders"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "gap-1 text-xs",
                )}
              >
                Ver todas
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground">
                    <th className="pb-3 font-medium">Orden</th>
                    <th className="pb-3 font-medium">Cliente</th>
                    <th className="pb-3 font-medium">Fecha</th>
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => {
                    const s = statusStyles[o.status];
                    return (
                      <tr key={o.id} className="border-b last:border-0">
                        <td className="py-3 font-mono text-xs">{o.id}</td>
                        <td className="py-3">{o.customer.name}</td>
                        <td className="py-3 text-muted-foreground">{o.date}</td>
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const width = 800;
  const height = 200;
  const padding = 20;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const stepX = (width - padding * 2) / (data.length - 1);
  const toY = (v: number) =>
    padding + (1 - (v - min) / range) * (height - padding * 2);

  const points = data.map((v, i) => [padding + i * stepX, toY(v)]);
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`)
    .join(" ");
  const areaPath =
    linePath +
    ` L ${points[points.length - 1][0]} ${height - padding} L ${padding} ${height - padding} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-[200px]"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="fill-grad" x1="0" x2="0" y1="0" y2="1">
          <stop
            offset="0%"
            stopColor="currentColor"
            className="text-foreground"
            stopOpacity="0.15"
          />
          <stop
            offset="100%"
            stopColor="currentColor"
            className="text-foreground"
            stopOpacity="0"
          />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#fill-grad)" />
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-foreground"
        strokeLinejoin="round"
      />
    </svg>
  );
}
