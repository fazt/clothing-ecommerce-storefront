"use client";

import { useState } from "react";
import { BadgeCheck, Eye, EyeOff, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/dashboard/delete-button";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableQuery,
} from "@/components/dashboard/data-table";
import { api } from "@/lib/api-client";
import type { ApiAdminReview, ReviewStatus } from "@/lib/api-types";
import { cn } from "@/lib/utils";

const fetchReviews = (q: DataTableQuery) =>
  api.reviews.adminList({
    page: q.page,
    pageSize: q.pageSize,
    search: q.search,
    status: q.filters.status as ReviewStatus | undefined,
  });

const filters: DataTableFilter[] = [
  {
    key: "status",
    label: "Estado",
    options: [
      { value: "PUBLISHED", label: "Publicadas" },
      { value: "HIDDEN", label: "Ocultas" },
    ],
  },
];

const columns: DataTableColumn<ApiAdminReview>[] = [
  {
    key: "product",
    header: "Producto",
    cell: (r) => <span className="font-medium">{r.product.name}</span>,
  },
  {
    key: "rating",
    header: "Nota",
    cell: (r) => (
      <span className="inline-flex items-center gap-1 whitespace-nowrap">
        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {r.rating}
      </span>
    ),
  },
  {
    key: "body",
    header: "Reseña",
    className: "max-w-md",
    cell: (r) => (
      <div className="min-w-0">
        {r.title ? <p className="font-medium">{r.title}</p> : null}
        <p className="line-clamp-2 text-xs text-muted-foreground">{r.body}</p>
      </div>
    ),
  },
  {
    key: "user",
    header: "Autor",
    cell: (r) => (
      <div className="text-xs">
        <p>{r.user.name ?? "—"}</p>
        <p className="text-muted-foreground">{r.user.email}</p>
        {r.verified ? (
          <p className="mt-0.5 inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
            <BadgeCheck className="h-3 w-3" /> Compra verificada
          </p>
        ) : null}
      </div>
    ),
  },
  {
    key: "status",
    header: "Estado",
    cell: (r) => (
      <span
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium",
          r.status === "PUBLISHED"
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
            : "bg-zinc-200 text-zinc-700 dark:bg-zinc-500/20 dark:text-zinc-300",
        )}
      >
        {r.status === "PUBLISHED" ? "Publicada" : "Oculta"}
      </span>
    ),
  },
];

function ModerateButton({ review, onDone }: { review: ApiAdminReview; onDone: () => void }) {
  const [pending, setPending] = useState(false);
  const hide = review.status === "PUBLISHED";
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={hide ? "Ocultar reseña" : "Publicar reseña"}
      title={hide ? "Ocultar" : "Publicar"}
      onClick={async () => {
        setPending(true);
        try {
          await api.reviews.moderate(review.id, hide ? "HIDDEN" : "PUBLISHED");
          onDone();
        } catch (e) {
          alert(e instanceof Error ? e.message : "No se pudo moderar la reseña");
        } finally {
          setPending(false);
        }
      }}
    >
      {hide ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </Button>
  );
}

export function ReviewsTable() {
  return (
    <DataTable
      columns={columns}
      fetchPage={fetchReviews}
      rowKey={(r) => r.id}
      filters={filters}
      searchPlaceholder="Buscar por texto o producto..."
      emptyMessage="Todavía no hay reseñas."
      rowActions={(r, reload) => (
        <div className="flex items-center justify-end">
          <ModerateButton review={r} onDone={reload} />
          <DeleteButton
            label="Eliminar reseña"
            confirmMessage="¿Eliminar esta reseña? No se puede deshacer."
            onDelete={() => api.reviews.remove(r.id)}
            onDeleted={reload}
          />
        </div>
      )}
    />
  );
}
