"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Paginated } from "@/lib/api-types";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
}

export interface DataTableFilter {
  /** Query param sent to the API, e.g. "role". */
  key: string;
  /** Column the filter applies to; shown as the select's label. */
  label: string;
  options: { value: string; label: string }[];
}

export interface DataTableQuery {
  page: number;
  pageSize: number;
  search?: string;
  filters: Record<string, string>;
}

export const selectClassName =
  "h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

const SEARCH_DEBOUNCE_MS = 300;

/**
 * Server-paginated table: search, per-column filters and pagination are sent
 * to the API. `fetchPage` must be stable (module-level or memoized).
 */
export function DataTable<T>({
  columns,
  fetchPage,
  rowKey,
  filters = [],
  searchPlaceholder = "Buscar...",
  rowActions,
  emptyMessage = "No hay resultados.",
  pageSizeOptions = [10, 20, 50],
}: {
  columns: DataTableColumn<T>[];
  fetchPage: (query: DataTableQuery) => Promise<Paginated<T>>;
  rowKey: (row: T) => string;
  filters?: DataTableFilter[];
  searchPlaceholder?: string;
  rowActions?: (row: T, reload: () => void) => ReactNode;
  emptyMessage?: string;
  pageSizeOptions?: number[];
}) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeOptions[0]);
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{
    key: string;
    result: Paginated<T> | null;
    error: string | null;
  }>({ key: "", result: null, error: null });

  const query = useMemo<DataTableQuery>(
    () => ({ page, pageSize, search: search || undefined, filters: filterValues }),
    [page, pageSize, search, filterValues],
  );
  const requestKey = `${JSON.stringify(query)}#${version}`;
  const loading = state.key !== requestKey;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    fetchPage(query).then(
      (result) => {
        if (cancelled) return;
        // Deleting the last row of the last page leaves us past the end.
        if (result.meta.page > result.meta.totalPages) {
          setPage(result.meta.totalPages);
          return;
        }
        setState({ key: requestKey, result, error: null });
      },
      (e: unknown) => {
        if (cancelled) return;
        setState((prev) => ({
          key: requestKey,
          result: prev.result,
          error: e instanceof Error ? e.message : "No se pudieron cargar los datos",
        }));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [fetchPage, query, requestKey]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  function setFilter(key: string, value: string) {
    setFilterValues((current) => {
      const next = { ...current };
      if (value) next[key] = value;
      else delete next[key];
      return next;
    });
    setPage(1);
  }

  function clearAll() {
    setSearchInput("");
    setSearch("");
    setFilterValues({});
    setPage(1);
  }

  const hasActiveFilters = Boolean(searchInput) || Object.keys(filterValues).length > 0;
  const result = state.result;
  const meta = result?.meta;
  const rows = result?.data ?? [];
  const colSpan = columns.length + (rowActions ? 1 : 0);
  const from = meta && meta.total > 0 ? (meta.page - 1) * meta.pageSize + 1 : 0;
  const to = meta ? Math.min(meta.page * meta.pageSize, meta.total) : 0;

  return (
    <div className="rounded-lg border bg-background">
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <div className="relative min-w-48 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.currentTarget.value)}
            placeholder={searchPlaceholder}
            aria-label="Buscar"
            className="pl-8"
          />
        </div>
        {filters.map((filter) => (
          <label key={filter.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>{filter.label}</span>
            <select
              value={filterValues[filter.key] ?? ""}
              onChange={(e) => setFilter(filter.key, e.currentTarget.value)}
              className={cn(selectClassName, "text-foreground")}
            >
              <option value="">Todos</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        {hasActiveFilters ? (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="mr-1 h-3.5 w-3.5" />
            Limpiar
          </Button>
        ) : null}
      </div>

      {state.error && !loading ? (
        <div className="flex flex-col items-center gap-3 p-10 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="font-semibold">No se pudieron cargar los datos</p>
          <p className="max-w-md text-sm text-muted-foreground">{state.error}</p>
          <Button variant="outline" size="sm" onClick={reload}>
            Reintentar
          </Button>
        </div>
      ) : (
        // `relative` keeps absolutely positioned children (sr-only labels) inside
        // the scroll box; otherwise they widen the whole page on mobile.
        <div className="relative overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn("px-4 py-3 font-medium", column.className)}
                  >
                    {column.header}
                  </th>
                ))}
                {rowActions ? <th className="w-28 px-4 py-3" /> : null}
              </tr>
            </thead>
            <tbody className={cn("transition-opacity", loading && result && "opacity-60")}>
              {!result ? (
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td colSpan={colSpan} className="px-4 py-3">
                      <Skeleton className="h-6 w-full" />
                    </td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="p-12 text-center text-sm text-muted-foreground">
                    {hasActiveFilters ? "Ningún resultado coincide con la búsqueda." : emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={rowKey(row)} className="border-b last:border-0 hover:bg-muted/30">
                    {columns.map((column) => (
                      <td key={column.key} className={cn("px-4 py-3", column.className)}>
                        {column.cell(row)}
                      </td>
                    ))}
                    {rowActions ? (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">{rowActions(row, reload)}</div>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs text-muted-foreground">
        <span>
          {meta ? `Mostrando ${from}–${to} de ${meta.total}` : "Cargando..."}
        </span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5">
            <span className="hidden sm:inline">Filas por página</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.currentTarget.value));
                setPage(1);
              }}
              className={cn(selectClassName, "text-foreground")}
              aria-label="Filas por página"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <span>
            Página {meta?.page ?? page} de {meta?.totalPages ?? 1}
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta || meta.page <= 1}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta || meta.page >= meta.totalPages}
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
