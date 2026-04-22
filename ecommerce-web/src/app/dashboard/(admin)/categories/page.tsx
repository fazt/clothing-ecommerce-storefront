import Link from "next/link";
import { AlertTriangle, Pencil, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { categoriesApi, type ApiCategory } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DeleteCategoryButton } from "./delete-category-button";

async function loadCategories(): Promise<
  { ok: true; categories: ApiCategory[] } | { ok: false; error: string }
> {
  try {
    return { ok: true, categories: await categoriesApi.list() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export default async function DashboardCategoriesPage() {
  const result = await loadCategories();

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Categorías"
        description="Organiza tu catálogo en colecciones y categorías."
        actions={
          <Link
            href="/dashboard/categories/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva categoría
          </Link>
        }
      />
      {!result.ok ? (
        <ApiError message={result.error} />
      ) : (
        <CategoriesGrid categories={result.categories} />
      )}
    </div>
  );
}

function ApiError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-10 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="font-semibold">No se pudo conectar con la API</p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function CategoriesGrid({ categories }: { categories: ApiCategory[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {categories.map((cat) => {
        const count = cat._count?.products ?? 0;
        return (
          <div
            key={cat.id}
            className="overflow-hidden rounded-lg border bg-background"
          >
            <div className="relative aspect-[4/3] bg-muted">
              {cat.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Sin imagen
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{cat.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    /{cat.slug} · {count} producto{count === 1 ? "" : "s"}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    cat.isVisible
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {cat.isVisible ? "Visible" : "Oculta"}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/dashboard/categories/${cat.id}/edit`}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "flex-1 justify-center",
                  )}
                >
                  <Pencil className="mr-1.5 h-3 w-3" />
                  Editar
                </Link>
                <DeleteCategoryButton id={cat.id} name={cat.name} />
              </div>
            </div>
          </div>
        );
      })}

      <Link
        href="/dashboard/categories/new"
        className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-muted/30 p-6 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
          <Plus className="h-4 w-4" />
        </div>
        <p className="text-sm font-medium">Crear nueva categoría</p>
      </Link>
    </div>
  );
}
