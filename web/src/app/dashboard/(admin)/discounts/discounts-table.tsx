"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/dashboard/delete-button";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableQuery,
} from "@/components/dashboard/data-table";
import { api } from "@/lib/api-client";
import type { ApiDiscount, DiscountStatus, DiscountType } from "@/lib/api-types";
import { discountStatusStyles, discountTypeLabel } from "@/lib/status-ui";
import { cn } from "@/lib/utils";

const fetchDiscounts = (q: DataTableQuery) =>
  api.discounts.list({
    page: q.page,
    pageSize: q.pageSize,
    search: q.search,
    type: q.filters.type as DiscountType | undefined,
    status: q.filters.status as DiscountStatus | undefined,
  });

const filters: DataTableFilter[] = [
  {
    key: "type",
    label: "Tipo",
    options: (Object.keys(discountTypeLabel) as DiscountType[]).map((value) => ({
      value,
      label: discountTypeLabel[value],
    })),
  },
  {
    key: "status",
    label: "Estado",
    options: (Object.keys(discountStatusStyles) as DiscountStatus[]).map((value) => ({
      value,
      label: discountStatusStyles[value].label,
    })),
  },
];

function formatValue(d: ApiDiscount) {
  if (d.type === "PERCENT") return `${Number(d.value)}%`;
  if (d.type === "FIXED") return `$${Number(d.value).toFixed(2)}`;
  return "Envío";
}

const columns: DataTableColumn<ApiDiscount>[] = [
  {
    key: "code",
    header: "Código",
    cell: (d) => (
      <>
        <p className="font-mono text-xs font-semibold">{d.code}</p>
        <p className="text-xs text-muted-foreground">{d.description ?? "—"}</p>
      </>
    ),
  },
  {
    key: "type",
    header: "Tipo",
    cell: (d) => <Badge variant="secondary">{discountTypeLabel[d.type]}</Badge>,
  },
  {
    key: "value",
    header: "Valor",
    className: "font-semibold",
    cell: formatValue,
  },
  {
    key: "uses",
    header: "Usos",
    className: "text-muted-foreground",
    cell: (d) => `${d.usesCount}${d.limit ? ` / ${d.limit}` : ""}`,
  },
  {
    key: "status",
    header: "Estado",
    cell: (d) => {
      const st = discountStatusStyles[d.status];
      return (
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", st.className)}>
          {st.label}
        </span>
      );
    },
  },
  {
    key: "expiresAt",
    header: "Expira",
    className: "whitespace-nowrap text-muted-foreground",
    // Stored as a calendar date at UTC midnight; format it in UTC so it doesn't
    // shift a day in negative-offset time zones.
    cell: (d) =>
      d.expiresAt
        ? new Date(d.expiresAt).toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            timeZone: "UTC",
          })
        : "—",
  },
];

export function DiscountsTable() {
  return (
    <DataTable
      columns={columns}
      fetchPage={fetchDiscounts}
      rowKey={(d) => d.id}
      filters={filters}
      searchPlaceholder="Buscar por código o descripción..."
      emptyMessage="Aún no hay descuentos."
      rowActions={(d, reload) => (
        <>
          <Link
            href={`/dashboard/discounts/${d.id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            title="Editar descuento"
          >
            <Pencil className="h-3 w-3" />
            <span className="sr-only">Editar {d.code}</span>
          </Link>
          <DeleteButton
            label="Eliminar descuento"
            confirmMessage={`¿Eliminar el descuento ${d.code}?`}
            onDelete={() => api.discounts.remove(d.id)}
            onDeleted={reload}
          />
        </>
      )}
    />
  );
}
