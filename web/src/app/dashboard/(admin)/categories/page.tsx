import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { categoriesApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CategoriesTable } from "./categories-table";

async function loadStats() {
  try {
    const categories = await categoriesApi.listAll();
    const visible = categories.filter((c) => c.isVisible).length;
    return { total: categories.length, visible };
  } catch {
    return null;
  }
}

export default async function DashboardCategoriesPage() {
  const stats = await loadStats();

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Categorías"
        description="Organiza tu catálogo en colecciones y categorías."
        actions={
          <Link href="/dashboard/categories/new" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva categoría
          </Link>
        }
      />
      {stats ? (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          {[
            { label: "Total", value: stats.total },
            { label: "Visibles", value: stats.visible },
            { label: "Ocultas", value: stats.total - stats.visible },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-background p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-2 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      ) : null}
      <CategoriesTable />
    </div>
  );
}
