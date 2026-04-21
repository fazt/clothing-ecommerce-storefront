import Image from "next/image";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { categories, products } from "@/lib/products";

export default function DashboardCategoriesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Categorías"
        description="Organiza tu catálogo en colecciones y categorías."
        actions={
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nueva categoría
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {categories.map((cat) => {
          const count = products.filter(
            (p) => p.category.toLowerCase() === cat.name.toLowerCase(),
          ).length;
          return (
            <div
              key={cat.slug}
              className="overflow-hidden rounded-lg border bg-background"
            >
              <div className="relative aspect-[4/3] bg-muted">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{cat.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      /{cat.slug} · {count} productos
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                    Visible
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 justify-center"
                  >
                    <Pencil className="mr-1.5 h-3 w-3" />
                    Editar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        <button className="flex min-h-[240px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-muted/30 p-6 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
            <Plus className="h-4 w-4" />
          </div>
          <p className="text-sm font-medium">Crear nueva categoría</p>
        </button>
      </div>
    </div>
  );
}
