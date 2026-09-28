"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DeleteButton } from "@/components/dashboard/delete-button";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableQuery,
} from "@/components/dashboard/data-table";
import { api } from "@/lib/api-client";
import type { ApiCategory } from "@/lib/api-types";
import { cn } from "@/lib/utils";

const fetchCategories = (q: DataTableQuery) =>
  api.categories.list({
    page: q.page,
    pageSize: q.pageSize,
    search: q.search,
    isVisible: q.filters.isVisible ? q.filters.isVisible === "true" : undefined,
  });

const filters: DataTableFilter[] = [
  {
    key: "isVisible",
    label: "Visibilidad",
    options: [
      { value: "true", label: "Visible" },
      { value: "false", label: "Oculta" },
    ],
  },
];

const columns: DataTableColumn<ApiCategory>[] = [
  {
    key: "name",
    header: "Categoría",
    cell: (c) => (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
          {c.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.image} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <p className="font-medium">{c.name}</p>
      </div>
    ),
  },
  {
    key: "slug",
    header: "Slug",
    className: "text-muted-foreground",
    cell: (c) => `/${c.slug}`,
  },
  {
    key: "products",
    header: "Productos",
    className: "text-muted-foreground",
    cell: (c) => {
      const count = c._count?.products ?? 0;
      return `${count} producto${count === 1 ? "" : "s"}`;
    },
  },
  {
    key: "isVisible",
    header: "Visibilidad",
    cell: (c) => (
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium",
          c.isVisible
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
            : "bg-muted text-muted-foreground",
        )}
      >
        {c.isVisible ? "Visible" : "Oculta"}
      </span>
    ),
  },
];

export function CategoriesTable() {
  const router = useRouter();

  return (
    <DataTable
      columns={columns}
      fetchPage={fetchCategories}
      rowKey={(c) => c.id}
      filters={filters}
      searchPlaceholder="Buscar por nombre o slug..."
      emptyMessage="Aún no hay categorías."
      rowActions={(c, reload) => (
        <>
          <Link
            href={`/dashboard/categories/${c.id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            title="Editar categoría"
          >
            <Pencil className="h-3 w-3" />
            <span className="sr-only">Editar</span>
          </Link>
          <DeleteButton
            label="Eliminar categoría"
            confirmMessage={`¿Eliminar la categoría "${c.name}"?`}
            onDelete={() => api.categories.remove(c.id)}
            onDeleted={() => {
              reload();
              // Refresh the server-rendered stat cards too.
              router.refresh();
            }}
          />
        </>
      )}
    />
  );
}
