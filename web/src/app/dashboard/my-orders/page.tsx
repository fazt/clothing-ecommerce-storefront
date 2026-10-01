import Link from "next/link";
import { AlertTriangle, ShoppingBag } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { meApi, type ApiOrder } from "@/lib/api";
import { orderStatusStyles } from "@/lib/status-ui";
import { cn } from "@/lib/utils";

async function loadMyOrders(): Promise<
  { ok: true; orders: ApiOrder[] } | { ok: false; error: string }
> {
  try {
    return { ok: true, orders: await meApi.ordersAll() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export default async function MyOrdersPage() {
  const result = await loadMyOrders();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title="Mis pedidos"
        description="Consulta el estado y los detalles de tus compras."
      />
      {!result.ok ? (
        <ApiError message={result.error} />
      ) : result.orders.length === 0 ? (
        <EmptyState />
      ) : (
        <OrdersTable orders={result.orders} />
      )}
    </div>
  );
}

function ApiError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-10 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="font-semibold">No se pudo cargar tus pedidos</p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border bg-background p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <ShoppingBag className="h-7 w-7 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold">Todavía no tienes pedidos</h2>
      <p className="max-w-md text-sm text-muted-foreground">
        Cuando completes tu primera compra aparecerá aquí.
      </p>
      <Link
        href="/products"
        className={cn(buttonVariants({ variant: "default" }))}
      >
        Ir a la tienda
      </Link>
    </div>
  );
}

function OrdersTable({ orders }: { orders: ApiOrder[] }) {
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const stats = [
    { label: "Pedidos", value: orders.length.toString() },
    { label: "Total gastado", value: `$${totalSpent.toFixed(2)}` },
    {
      label: "Último pedido",
      value:
        orders[0]?.createdAt
          ? new Date(orders[0].createdAt).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
    },
  ];

  return (
    <>
      <div className="mb-6 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-background p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-lg font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-background">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-3 pl-4 font-medium">Pedido</th>
                <th className="py-3 font-medium">Fecha</th>
                <th className="py-3 font-medium">Productos</th>
                <th className="py-3 font-medium">Método</th>
                <th className="py-3 font-medium">Estado</th>
                <th className="py-3 pr-4 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => {
                const style = orderStatusStyles[o.status];
                const itemsCount = o.items.reduce(
                  (s, i) => s + i.quantity,
                  0,
                );
                const firstItem = o.items[0]?.product?.name ?? "—";
                return (
                  <tr
                    key={o.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="py-3 pl-4 font-mono text-xs">
                      #{o.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(o.createdAt).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3">
                      <p className="font-medium">{firstItem}</p>
                      {itemsCount > 1 ? (
                        <p className="text-xs text-muted-foreground">
                          + {itemsCount - (o.items[0]?.quantity ?? 0)} más
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {o.paymentMethod}
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          style.className,
                        )}
                      >
                        {style.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-right font-semibold">
                      ${Number(o.total).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
