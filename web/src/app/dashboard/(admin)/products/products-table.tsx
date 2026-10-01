"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageOff, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { DeleteButton } from "@/components/dashboard/delete-button";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableQuery,
} from "@/components/dashboard/data-table";
import { api } from "@/lib/api-client";
import type { ApiCategory, ApiProduct, StockFilter } from "@/lib/api-types";
import { LOW_STOCK_THRESHOLD } from "@/lib/schemas/product";
import { cn } from "@/lib/utils";

const fetchProducts = (q: DataTableQuery) =>
  api.products.list({
    page: q.page,
    pageSize: q.pageSize,
    search: q.search,
    categoryId: q.filters.categoryId,
    stock: q.filters.stock as StockFilter | undefined,
  });

const stockFilter: DataTableFilter = {
  key: "stock",
  label: "Stock",
  options: [
    { value: "in", label: "En stock" },
    { value: "low", label: "Stock bajo" },
    { value: "out", label: "Agotado" },
  ],
};

const flags = [
  {
    key: "isNew",
    label: "Nuevo",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  },
  {
    key: "isSale",
    label: "Oferta",
    className: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  },
  {
    key: "isFeatured",
    label: "Destacado",
    className: "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
  },
] as const;

const isOut = (p: ApiProduct) => p.stock <= 0;
const isLow = (p: ApiProduct) => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD;

const columns: DataTableColumn<ApiProduct>[] = [
  {
    key: "name",
    header: "Producto",
    cell: (p) => (
      <div className="flex items-center gap-3">
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
          {p.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImageOff className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{p.name}</p>
          <p className="truncate font-mono text-[11px] text-muted-foreground">{p.id}</p>
        </div>
      </div>
    ),
  },
  {
    key: "category",
    header: "Categoría",
    className: "text-muted-foreground",
    cell: (p) => p.category?.name ?? <span className="text-xs italic">sin asignar</span>,
  },
  {
    key: "price",
    header: "Precio",
    className: "whitespace-nowrap font-semibold",
    cell: (p) => `$${Number(p.price).toFixed(2)}`,
  },
  {
    key: "stock",
    header: "Stock",
    cell: (p) => (
      <span
        className={cn("font-medium", isLow(p) && "text-amber-600", isOut(p) && "text-red-600")}
      >
        {p.stock}
      </span>
    ),
  },
  {
    key: "status",
    header: "Estado",
    cell: (p) =>
      isOut(p) ? (
        <Badge variant="destructive">Sin stock</Badge>
      ) : isLow(p) ? (
        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
          Stock bajo
        </Badge>
      ) : (
        <Badge variant="secondary">Activo</Badge>
      ),
  },
  {
    key: "flags",
    header: "Etiquetas",
    cell: (p) => {
      const active = flags.filter((f) => p[f.key]);
      if (active.length === 0) return <span className="text-muted-foreground">—</span>;
      return (
        <div className="flex flex-wrap gap-1">
          {active.map((f) => (
            <span
              key={f.key}
              className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", f.className)}
            >
              {f.label}
            </span>
          ))}
        </div>
      );
    },
  },
  {
    key: "updatedAt",
    header: "Actualizado",
    className: "whitespace-nowrap text-xs text-muted-foreground",
    cell: (p) =>
      new Date(p.updatedAt).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
  },
];

export function ProductsTable({
  categories,
}: {
  categories: Pick<ApiCategory, "id" | "name">[];
}) {
  const router = useRouter();
  const filters: DataTableFilter[] = [
    {
      key: "categoryId",
      label: "Categoría",
      options: categories.map((c) => ({ value: c.id, label: c.name })),
    },
    stockFilter,
  ];

  return (
    <DataTable
      columns={columns}
      fetchPage={fetchProducts}
      rowKey={(p) => p.id}
      filters={filters}
      searchPlaceholder="Buscar por nombre o descripción..."
      emptyMessage="Todavía no hay productos."
      rowActions={(p, reload) => (
        <>
          <Link
            href={`/dashboard/products/${p.id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            title="Editar producto"
          >
            <Pencil className="h-3 w-3" />
            <span className="sr-only">Editar</span>
          </Link>
          <DeleteButton
            label="Eliminar producto"
            confirmMessage={`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`}
            onDelete={() => api.products.remove(p.id)}
            onDeleted={() => {
              reload();
              // Re-render the server shell so the stat boxes stay in sync.
              router.refresh();
            }}
          />
        </>
      )}
    />
  );
}
