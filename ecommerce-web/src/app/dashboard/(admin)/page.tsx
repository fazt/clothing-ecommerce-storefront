import Link from "next/link";
import {
  AlertTriangle,
  ChevronDown,
  Download,
  Info,
  Triangle,
} from "lucide-react";
import {
  analyticsApi,
  customersApi,
  ordersApi,
  productsApi,
  type AnalyticsSummary,
  type ApiCustomer,
  type ApiOrder,
  type ApiProduct,
} from "@/lib/api";

async function loadOverview(): Promise<
  | {
      ok: true;
      summary: AnalyticsSummary;
      orders: ApiOrder[];
      products: ApiProduct[];
      customers: ApiCustomer[];
    }
  | { ok: false; error: string }
> {
  try {
    const [summary, orders, products, customers] = await Promise.all([
      analyticsApi.summary(),
      ordersApi.list(),
      productsApi.list(),
      customersApi.list(),
    ]);
    return { ok: true, summary, orders, products, customers };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export default async function DashboardOverviewPage() {
  const result = await loadOverview();

  return (
    <div className="mx-auto w-full max-w-[1380px]">
      <div className="mb-7 flex items-center justify-between">
        <h1 className="a-h1">Reports</h1>
        <button type="button" className="a-btn-outline">
          <Download className="h-4 w-4" />
          Download
        </button>
      </div>

      {!result.ok ? (
        <ApiError message={result.error} />
      ) : (
        <Overview
          summary={result.summary}
          orders={result.orders}
          products={result.products}
          customers={result.customers}
        />
      )}
    </div>
  );
}

function Filters() {
  const filters = [
    { label: "Timeframe", value: "All-time" },
    { label: "People", value: "All" },
    { label: "Topic", value: "All" },
  ];
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-3">
      {filters.map((f) => (
        <button key={f.label} type="button" className="a-pill w-full">
          <span>
            <span className="a-pill-label">{f.label}: </span>
            <span className="a-pill-value">{f.value}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-[color:var(--a-ink-4)]" />
        </button>
      ))}
    </div>
  );
}

function ApiError({ message }: { message: string }) {
  return (
    <div
      className="flex flex-col items-center gap-3 rounded-[20px] border p-10 text-center"
      style={{
        borderColor: "var(--a-border)",
        background: "var(--a-card)",
      }}
    >
      <AlertTriangle className="h-8 w-8" style={{ color: "var(--a-down)" }} />
      <p className="a-h2">No se pudo conectar con la API</p>
      <p className="max-w-md text-sm a-muted">{message}</p>
    </div>
  );
}

function Overview({
  summary,
  orders,
  products,
  customers,
}: {
  summary: AnalyticsSummary;
  orders: ApiOrder[];
  products: ApiProduct[];
  customers: ApiCustomer[];
}) {
  const activeCustomers = new Set(orders.map((o) => o.customerId)).size;
  const avgTicket =
    orders.length === 0
      ? 0
      : orders.reduce((s, o) => s + Number(o.total), 0) / orders.length;

  const monthLabels = [
    "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
  ];
  const now = new Date();
  const monthlySeries = Array.from({ length: 12 }).map((_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const count = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return (
        d.getMonth() === month.getMonth() &&
        d.getFullYear() === month.getFullYear()
      );
    }).length;
    return { label: monthLabels[month.getMonth()], value: count };
  });

  const lowStock = [...products]
    .filter((p) => p.stock > 0 && p.stock < 10)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 3);
  const lowStockMax = Math.max(...lowStock.map((p) => p.stock), 10);

  const topProducts = summary.topProducts.slice(0, 3);
  const topRevenueMax = Math.max(...topProducts.map((p) => p.revenue), 1);

  const topCustomers = [...customers]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 4);
  const recentOrders = orders.slice(0, 4);

  return (
    <>
      <Filters />

      {/* Row 1 — 3 numeric + 1 bar chart */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clientes activos" value={`${activeCustomers}`} sub={`/${customers.length}`} />
        <StatCard label="Órdenes" value={orders.length.toLocaleString()} />
        <StatCard label="Ticket promedio" value={`$${avgTicket.toFixed(2)}`} />
        <BarChartCard title="Activity" series={monthlySeries} />
      </div>

      {/* Row 2 — sparkline cards */}
      <div className="mt-5 grid gap-5 md:grid-cols-3">
        <SparkMetric
          label="Ingresos"
          value={`$${summary.metrics.revenue.current.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`}
          change={summary.metrics.revenue.change}
          series={summary.salesSeries}
        />
        <SparkMetric
          label="Órdenes"
          value={summary.metrics.orders.current.toLocaleString()}
          change={summary.metrics.orders.change}
          series={summary.salesSeries.slice().reverse()}
        />
        <SparkMetric
          label="Clientes nuevos"
          value={`+${summary.metrics.newCustomers.current}`}
          change={summary.metrics.newCustomers.change}
          series={summary.salesSeries}
        />
      </div>

      {/* Row 3 — topic progress lists */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <CardShell title="Weakest stock">
          {lowStock.length === 0 ? (
            <p className="text-sm a-muted">Sin productos con stock crítico.</p>
          ) : (
            <div className="space-y-5">
              {lowStock.map((p) => (
                <ProgressRow
                  key={p.id}
                  image={p.imageUrl ?? undefined}
                  title={p.name}
                  trailing={`${p.stock} unidades`}
                  value={(p.stock / lowStockMax) * 100}
                  color="warn"
                />
              ))}
            </div>
          )}
        </CardShell>

        <CardShell title="Strongest products">
          {topProducts.length === 0 ? (
            <p className="text-sm a-muted">Sin ventas aún.</p>
          ) : (
            <div className="space-y-5">
              {topProducts.map((p) => (
                <ProgressRow
                  key={p.productId}
                  title={p.name}
                  trailing={`${p.sold} vendidos`}
                  value={(p.revenue / topRevenueMax) * 100}
                  color="good"
                />
              ))}
            </div>
          )}
        </CardShell>
      </div>

      {/* Row 4 — leaderboards */}
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <CardShell title="User leaderboard">
          {topCustomers.length === 0 ? (
            <p className="text-sm a-muted">Sin clientes aún.</p>
          ) : (
            <ul>
              {topCustomers.map((c, i) => (
                <LeaderRow
                  key={c.id}
                  rank={i + 1}
                  trend={i === 0 ? "up" : i === 1 ? "down" : i === 2 ? "up" : "flat"}
                  title={c.name}
                  meta={`${c.ordersCount} órdenes · $${c.totalSpent.toFixed(0)} gastados`}
                />
              ))}
            </ul>
          )}
        </CardShell>

        <CardShell
          title="Groups leaderboard"
          action={
            <Link
              href="/dashboard/orders"
              className="text-xs font-medium text-[color:var(--a-primary)] hover:underline"
            >
              See all
            </Link>
          }
        >
          {recentOrders.length === 0 ? (
            <p className="text-sm a-muted">Sin órdenes.</p>
          ) : (
            <ul>
              {recentOrders.map((o, i) => (
                <LeaderRow
                  key={o.id}
                  rank={i + 1}
                  trend={
                    o.status === "DELIVERED"
                      ? "up"
                      : o.status === "CANCELLED"
                        ? "down"
                        : "flat"
                  }
                  title={o.customer.name}
                  meta={`#${o.id.slice(0, 8).toUpperCase()} · $${Number(o.total).toFixed(2)}`}
                />
              ))}
            </ul>
          )}
        </CardShell>
      </div>
    </>
  );
}

/* ---------- primitives ---------- */

function CardShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="a-card">
      <header className="mb-5 flex items-center justify-between">
        <h2 className="a-h2">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="a-card flex flex-col justify-between">
      <p className="text-sm a-muted">{label}</p>
      <p className="a-stat mt-5 flex items-baseline gap-1">
        {value}
        {sub ? <span className="text-lg font-medium a-muted-2">{sub}</span> : null}
      </p>
    </div>
  );
}

function BarChartCard({
  title,
  series,
}: {
  title: string;
  series: { label: string; value: number }[];
}) {
  const max = Math.max(...series.map((s) => s.value), 1);
  return (
    <div className="a-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="a-h2">{title}</h2>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs font-medium a-muted"
        >
          Month <ChevronDown className="h-3 w-3" />
        </button>
      </div>
      <div className="flex h-28 items-end justify-between gap-1.5">
        {series.map((s, i) => {
          const h = (s.value / max) * 100;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="relative flex h-full w-full items-end">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: "var(--a-primary-soft)" }}
                />
                <div
                  className="relative w-full rounded-full"
                  style={{
                    height: `${Math.max(h, 6)}%`,
                    background: "var(--a-primary)",
                  }}
                />
              </div>
              <span className="text-[9px] font-medium a-muted-2">{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SparkMetric({
  label,
  value,
  change,
  series,
}: {
  label: string;
  value: string;
  change: number;
  series: number[];
}) {
  const isUp = change >= 0;
  return (
    <div className="a-card">
      <div className="flex items-center gap-1.5">
        <p className="text-sm a-muted">{label}</p>
        <Info className="h-3.5 w-3.5 text-[color:var(--a-ink-4)]" />
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="a-stat">{value}</span>
        <span className={isUp ? "a-delta-up" : "a-delta-down"}>
          {isUp ? "+" : ""}
          {change.toFixed(0)}%
        </span>
      </div>
      <div className="mt-4">
        <Sparkline data={series} />
      </div>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const width = 320;
  const height = 60;
  const padding = 2;
  if (data.length === 0) return <div className="h-[60px] w-full" />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = (width - padding * 2) / Math.max(data.length - 1, 1);
  const toY = (v: number) =>
    padding + (1 - (v - min) / range) * (height - padding * 2);
  const points = data.map((v, i) => [padding + i * stepX, toY(v)] as const);
  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`)
    .join(" ");
  const area =
    line +
    ` L ${points[points.length - 1]?.[0] ?? padding} ${height - padding} L ${padding} ${height - padding} Z`;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[60px] w-full"
      preserveAspectRatio="none"
      style={{ color: "var(--a-primary)" }}
    >
      <defs>
        <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.24" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark)" />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProgressRow({
  title,
  trailing,
  value,
  color,
  image,
}: {
  title: string;
  trailing: string;
  value: number;
  color: "warn" | "good";
  image?: string;
}) {
  const track = color === "warn" ? "var(--a-warn-soft)" : "var(--a-good-soft)";
  const bar = color === "warn" ? "var(--a-warn)" : "var(--a-good)";
  return (
    <div className="flex items-center gap-4">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
        style={{ background: "var(--a-card-muted)" }}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] font-semibold a-muted">
            {title.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold">{title}</p>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ background: track }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, Math.max(4, value))}%`,
              background: bar,
            }}
          />
        </div>
      </div>
      <p className="shrink-0 text-sm font-medium a-muted">{trailing}</p>
    </div>
  );
}

function LeaderRow({
  rank,
  trend,
  title,
  meta,
}: {
  rank: number;
  trend: "up" | "down" | "flat";
  title: string;
  meta: string;
}) {
  const initials = title
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <li
      className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 border-b last:border-0"
      style={{ borderColor: "var(--a-border)" }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
        style={{
          background: "var(--a-primary-soft)",
          color: "var(--a-primary)",
        }}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate text-xs a-muted">{meta}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-bold tabular-nums">{rank}</span>
        {trend === "up" ? (
          <Triangle
            className="h-3 w-3"
            fill="var(--a-good)"
            style={{ color: "var(--a-good)" }}
          />
        ) : trend === "down" ? (
          <Triangle
            className="h-3 w-3 rotate-180"
            fill="var(--a-down)"
            style={{ color: "var(--a-down)" }}
          />
        ) : (
          <span
            className="h-0.5 w-3 rounded-full"
            style={{ background: "var(--a-ink-4)" }}
          />
        )}
      </div>
    </li>
  );
}
