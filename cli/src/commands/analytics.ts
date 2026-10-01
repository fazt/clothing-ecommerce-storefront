import { Command } from "commander";
import { clientFor } from "../context.js";
import { c, emit, money, section, sparkline, table } from "../output.js";

interface Metric {
  current: number;
  previous: number;
  change: number;
}

interface Summary {
  metrics: { revenue: Metric; orders: Metric; newCustomers: Metric; conversionRate: Metric };
  salesSeries: number[];
  topProducts: { productId: string; name: string; sold: number; revenue: number }[];
}

const percent = (n: number) => `${n.toFixed(2)}%`;

function change(n: number) {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

export function analyticsCommand(): Command {
  return new Command("analytics")
    .description("Resumen de ventas de los últimos 30 días (requiere ADMIN)")
    .action(async (_opts, command: Command) => {
      const summary = await clientFor(command).get<Summary>("/analytics/summary");
      emit(summary, () => {
        const { metrics } = summary;
        const rows = [
          { label: "Ingresos", metric: metrics.revenue, format: money },
          { label: "Pedidos", metric: metrics.orders, format: String },
          { label: "Clientes nuevos", metric: metrics.newCustomers, format: String },
          // The API returns a fixed placeholder: it has no session tracking.
          { label: "Conversión (aprox.)", metric: metrics.conversionRate, format: percent },
        ];

        section("Últimos 30 días vs. 30 anteriores");
        table(rows, [
          { header: "MÉTRICA", value: (r) => r.label },
          { header: "ACTUAL", value: (r) => r.format(r.metric.current), align: "right" },
          { header: "ANTERIOR", value: (r) => r.format(r.metric.previous), align: "right" },
          {
            header: "CAMBIO",
            value: (r) => change(r.metric.change),
            align: "right",
            style: (cell, r) => (r.metric.change > 0 ? c.green(cell) : r.metric.change < 0 ? c.red(cell) : cell),
          },
        ]);

        const series = summary.salesSeries;
        section("Ventas diarias");
        console.log(`${c.cyan(sparkline(series))}  ${c.dim(`máx. ${money(Math.max(0, ...series))}/día`)}`);

        section("Productos más vendidos");
        table(summary.topProducts, [
          { header: "PRODUCTO", value: (p) => p.name, max: 36 },
          { header: "VENDIDOS", value: (p) => p.sold, align: "right" },
          { header: "INGRESOS", value: (p) => money(p.revenue), align: "right" },
        ]);
      });
    });
}
