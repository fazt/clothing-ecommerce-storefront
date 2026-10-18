"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyEmail } from "@/components/dashboard/copy-email";
import { DeleteButton } from "@/components/dashboard/delete-button";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableQuery,
} from "@/components/dashboard/data-table";
import { api } from "@/lib/api-client";
import type { ApiOrder, OrderStatus } from "@/lib/api-types";
import { orderStatusStyles } from "@/lib/status-ui";
import { ORDER_STATUSES, OrderStatusSelect } from "./order-status-select";

const fetchOrders = (q: DataTableQuery) =>
  api.orders.list({
    page: q.page,
    pageSize: q.pageSize,
    search: q.search,
    status: q.filters.status as OrderStatus | undefined,
  });

const filters: DataTableFilter[] = [
  {
    key: "status",
    label: "Estado",
    options: ORDER_STATUSES.map((status) => ({
      value: status,
      label: orderStatusStyles[status].label,
    })),
  },
];

const orderNumber = (o: ApiOrder) => `#${o.number}`;
const PAID: OrderStatus[] = ["PROCESSING", "SHIPPED", "DELIVERED"];

export function OrdersTable() {
  const router = useRouter();
  // The page's stat cards are server-rendered; refresh them after a change.
  const refreshStats = () => router.refresh();

  const columns: DataTableColumn<ApiOrder>[] = [
    {
      key: "id",
      header: "Orden",
      cell: (o) => (
        <div>
          <span className="font-mono text-xs font-semibold">{orderNumber(o)}</span>
          {o.couponCode ? <p className="text-[11px] text-muted-foreground">Cupón {o.couponCode}</p> : null}
        </div>
      ),
    },
    {
      key: "customer",
      header: "Cliente",
      cell: (o) => (
        <div className="min-w-0">
          <p className="font-medium">{o.customer.name}</p>
          <CopyEmail email={o.customer.email} className="text-xs text-muted-foreground" />
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Fecha",
      className: "whitespace-nowrap text-muted-foreground",
      cell: (o) =>
        new Date(o.createdAt).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
    {
      key: "paymentMethod",
      header: "Método",
      className: "text-muted-foreground",
      cell: (o) => o.paymentMethod,
    },
    {
      key: "shipping",
      header: "Envío",
      className: "text-muted-foreground",
      cell: (o) => (
        <div className="text-xs">
          <p>{o.shippingMethod?.name ?? "—"}</p>
          {o.shippingCity ? <p>{[o.shippingCity, o.shippingCountry].filter(Boolean).join(", ")}</p> : null}
          {o.trackingNumber ? <p className="font-mono">{o.trackingNumber}</p> : null}
        </div>
      ),
    },
    {
      key: "items",
      header: "Items",
      cell: (o) => o.items.reduce((sum, item) => sum + item.quantity, 0),
    },
    {
      key: "status",
      header: "Estado",
      cell: (o) => (
        <OrderStatusSelect
          key={o.status}
          orderId={o.id}
          status={o.status}
          onUpdated={refreshStats}
        />
      ),
    },
    {
      key: "total",
      header: "Total",
      className: "text-right",
      cell: (o) => <span className="font-semibold">${Number(o.total).toFixed(2)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      fetchPage={fetchOrders}
      rowKey={(o) => o.id}
      filters={filters}
      searchPlaceholder="Buscar por número, cliente o email..."
      emptyMessage="No hay órdenes todavía."
      rowActions={(o, reload) =>
        PAID.includes(o.status) ? (
          <RefundButton
            order={o}
            onRefunded={() => {
              reload();
              refreshStats();
            }}
          />
        ) : o.status === "CANCELLED" ? (
          <DeleteButton
            label="Eliminar orden"
            confirmMessage={`¿Eliminar la orden ${orderNumber(o)}?`}
            onDelete={() => api.orders.remove(o.id)}
            onDeleted={() => {
              reload();
              refreshStats();
            }}
          />
        ) : null
      }
    />
  );
}

/** Reembolso total por la misma pasarela con la que se cobró. */
function RefundButton({ order, onRefunded }: { order: ApiOrder; onRefunded: () => void }) {
  const [pending, setPending] = useState(false);
  async function refund() {
    const total = `$${Number(order.total).toFixed(2)}`;
    if (!window.confirm(`¿Reembolsar ${total} de la orden ${orderNumber(order)} por ${order.paymentMethod}?`)) return;
    setPending(true);
    try {
      await api.orders.refund(order.id);
      onRefunded();
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo reembolsar");
    } finally {
      setPending(false);
    }
  }
  return (
    <Button variant="ghost" size="sm" onClick={refund} disabled={pending} aria-label="Reembolsar orden" title="Reembolsar">
      <Undo2 className="h-4 w-4" />
    </Button>
  );
}
