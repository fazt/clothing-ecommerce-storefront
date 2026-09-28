import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { categoriesApi, productsApi } from "@/lib/api";
import { LOW_STOCK_THRESHOLD } from "@/lib/schemas/product";
import { cn } from "@/lib/utils";
import { ProductsTable } from "./products-table";

async function loadStats() {
  try {
    // Small catalog: one pass over every product gives all the counters.
    const products = await productsApi.listAll();
    const out = products.filter((p) => p.stock <= 0).length;
    const low = products.filter((p) => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD).length;
    return { total: products.length, active: products.length - out - low, low, out };
  } catch {
    return null;
  }
}

async function loadCategories() {
  try {
    const categories = await categoriesApi.listAll();
    return categories.map(({ id, name }) => ({ id, name }));
  } catch {
    return [];
  }
}

export default async function DashboardProductsPage() {
  const [stats, categories] = await Promise.all([loadStats(), loadCategories()]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Productos"
        description="Gestiona el catálogo de tu tienda."
        actions={
          <Link href="/dashboard/products/new" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Link>
        }
      />
      {stats ? (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatBox label="Total" value={stats.total} />
          <StatBox label="Activos" value={stats.active} tone="emerald" />
          <StatBox label="Stock bajo" value={stats.low} tone="amber" />
          <StatBox label="Sin stock" value={stats.out} tone="red" />
        </div>
      ) : null}
      <ProductsTable categories={categories} />
    </div>
  );
}

const toneStyles = {
  emerald: {
    label: "ok",
    className: "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  amber: {
    label: "atención",
    className: "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  },
  red: {
    label: "urgente",
    className: "bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300",
  },
} as const;

function StatBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: keyof typeof toneStyles;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {tone ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              toneStyles[tone].className,
            )}
          >
            {toneStyles[tone].label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
