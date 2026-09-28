"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CopyEmail } from "@/components/dashboard/copy-email";
import { DeleteButton } from "@/components/dashboard/delete-button";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableQuery,
} from "@/components/dashboard/data-table";
import { api } from "@/lib/api-client";
import type { ApiCustomer, CustomerSegment } from "@/lib/api-types";
import { customerSegmentStyles } from "@/lib/status-ui";
import { cn } from "@/lib/utils";

const fetchCustomers = (q: DataTableQuery) =>
  api.customers.list({
    page: q.page,
    pageSize: q.pageSize,
    search: q.search,
    segment: q.filters.segment as CustomerSegment | undefined,
  });

const SEGMENTS: CustomerSegment[] = ["new", "returning", "vip"];

const filters: DataTableFilter[] = [
  {
    key: "segment",
    label: "Segmento",
    options: SEGMENTS.map((segment) => ({
      value: segment,
      label: customerSegmentStyles[segment].label,
    })),
  },
];

function initials(customer: ApiCustomer): string {
  const source = customer.name.trim() || customer.email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function CustomersTable() {
  const router = useRouter();

  const columns: DataTableColumn<ApiCustomer>[] = [
    {
      key: "name",
      header: "Cliente",
      cell: (c) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs">{initials(c)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium">{c.name}</p>
            <CopyEmail email={c.email} className="text-xs text-muted-foreground" />
          </div>
        </div>
      ),
    },
    {
      key: "segment",
      header: "Segmento",
      cell: (c) => {
        const seg = customerSegmentStyles[c.segment];
        return (
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", seg.className)}>
            {seg.label}
          </span>
        );
      },
    },
    {
      key: "ordersCount",
      header: "Órdenes",
      cell: (c) => <span className="font-medium">{c.ordersCount}</span>,
    },
    {
      key: "totalSpent",
      header: "Total gastado",
      cell: (c) => <span className="font-semibold">${c.totalSpent.toFixed(2)}</span>,
    },
    {
      key: "lastOrder",
      header: "Última compra",
      className: "whitespace-nowrap text-muted-foreground",
      cell: (c) =>
        c.lastOrder
          ? new Date(c.lastOrder).toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—",
    },
  ];

  return (
    <DataTable
      columns={columns}
      fetchPage={fetchCustomers}
      rowKey={(c) => c.id}
      filters={filters}
      searchPlaceholder="Buscar por nombre o email..."
      emptyMessage="Aún no hay clientes."
      rowActions={(c, reload) => (
        <>
          <Link
            href={`/dashboard/customers/${c.id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            title="Editar cliente"
          >
            <Pencil className="h-3 w-3" />
            <span className="sr-only">Editar</span>
          </Link>
          {/* The API answers 409 for customers with orders; DeleteButton alerts it. */}
          <DeleteButton
            label="Eliminar cliente"
            confirmMessage={`¿Eliminar el cliente "${c.email}"?`}
            onDelete={() => api.customers.remove(c.id)}
            onDeleted={() => {
              reload();
              // The page's stat cards are server-rendered.
              router.refresh();
            }}
          />
        </>
      )}
    />
  );
}
