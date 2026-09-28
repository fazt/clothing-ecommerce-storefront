"use client";

import { useRouter } from "next/navigation";
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

const orderNumber = (o: ApiOrder) => `#${o.id.slice(0, 8).toUpperCase()}`;

export function OrdersTable() {
  const router = useRouter();
  // The page's stat cards are server-rendered; refresh them after a change.
  const refreshStats = () => router.refresh();

  const columns: DataTableColumn<ApiOrder>[] = [
    {
      key: "id",
      header: "Orden",
      cell: (o) => <span className="font-mono text-[11px]">{orderNumber(o)}</span>,
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
      rowActions={(o, reload) => (
        <DeleteButton
          label="Eliminar orden"
          confirmMessage={`¿Eliminar la orden ${orderNumber(o)}?`}
          onDelete={() => api.orders.remove(o.id)}
          onDeleted={() => {
            reload();
            refreshStats();
          }}
        />
      )}
    />
  );
}
