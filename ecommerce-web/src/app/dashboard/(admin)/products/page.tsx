import Link from "next/link";
import {
  Plus,
  Search,
  SlidersHorizontal,
  Pencil,
  Download,
  ImageOff,
  AlertTriangle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { productsApi, type ApiProduct } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DeleteProductButton } from "./delete-button";

async function loadProducts(): Promise<
  { ok: true; products: ApiProduct[] } | { ok: false; error: string }
> {
  try {
    const products = await productsApi.list();
    return { ok: true, products };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export default async function DashboardProductsPage() {
  const result = await loadProducts();

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Productos"
        description="Gestiona el catálogo de tu tienda."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Link
              href="/dashboard/products/new"
              className={cn(buttonVariants({ size: "sm" }))}
            >
              <Plus className="mr-2 h-4 w-4" />
              Añadir producto
            </Link>
          </>
        }
      />

      {!result.ok ? (
        <ApiErrorCard message={result.error} />
      ) : (
        <ProductsContent products={result.products} />
      )}
    </div>
  );
}

function ApiErrorCard({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-10 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="font-semibold">No se pudo conectar con la API</p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      <p className="text-xs text-muted-foreground">
        Verifica que el backend esté corriendo en{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
          {process.env.API_URL ?? "http://localhost:4000/api"}
        </code>
      </p>
    </div>
  );
}

function ProductsContent({ products }: { products: ApiProduct[] }) {
  const lowStock = products.filter((p) => p.stock > 0 && p.stock < 15).length;
  const outOfStock = products.filter((p) => p.stock === 0).length;

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatBox label="Total" value={products.length.toString()} />
        <StatBox label="Activos" value={products.length.toString()} tone="emerald" />
        <StatBox label="Stock bajo" value={lowStock.toString()} tone="amber" />
        <StatBox label="Sin stock" value={outOfStock.toString()} tone="red" />
      </div>

      <div className="rounded-lg border bg-background">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar productos..." className="pl-9" />
          </div>
          <div className="flex gap-2">
            <select className="h-8 rounded-md border bg-background px-3 text-sm">
              <option>Todos los estados</option>
              <option>Con stock</option>
              <option>Sin stock</option>
            </select>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-16 text-center">
            <p className="text-sm font-medium">Todavía no hay productos</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Crea tu primer producto y empezarás a verlo aquí.
            </p>
            <Link
              href="/dashboard/products/new"
              className={cn(buttonVariants({ size: "sm" }), "mt-2")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear producto
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="w-10 py-3 pl-4">
                    <input type="checkbox" className="h-4 w-4 rounded border" />
                  </th>
                  <th className="py-3 font-medium">Producto</th>
                  <th className="py-3 font-medium">Categoría</th>
                  <th className="py-3 font-medium">Precio</th>
                  <th className="py-3 font-medium">Stock</th>
                  <th className="py-3 font-medium">Estado</th>
                  <th className="py-3 font-medium">Actualizado</th>
                  <th className="w-24 py-3 pr-4" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const stockLow = p.stock > 0 && p.stock < 15;
                  const stockOut = p.stock === 0;
                  return (
                    <tr
                      key={p.id}
                      className="border-b text-sm last:border-0 hover:bg-muted/30"
                    >
                      <td className="py-3 pl-4">
                        <input type="checkbox" className="h-4 w-4 rounded border" />
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                            {p.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                <ImageOff className="h-4 w-4" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{p.name}</p>
                            <p className="truncate font-mono text-[11px] text-muted-foreground">
                              {p.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {p.category?.name ?? (
                          <span className="text-xs italic">sin asignar</span>
                        )}
                      </td>
                      <td className="py-3 font-semibold">
                        ${Number(p.price).toFixed(2)}
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            "font-medium",
                            stockLow && "text-amber-600",
                            stockOut && "text-red-600",
                          )}
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="py-3">
                        {stockOut ? (
                          <Badge variant="destructive">Sin stock</Badge>
                        ) : stockLow ? (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                            Stock bajo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Activo</Badge>
                        )}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {new Date(p.updatedAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/dashboard/products/${p.id}/edit`}
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "icon-sm" }),
                            )}
                            aria-label={`Editar ${p.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <DeleteProductButton id={p.id} name={p.name} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {products.length > 0 && (
          <div className="flex items-center justify-between border-t p-4 text-sm">
            <p className="text-muted-foreground">
              Mostrando{" "}
              <span className="font-medium text-foreground">
                1–{products.length}
              </span>{" "}
              de {products.length} productos
            </p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled>
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function StatBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "emerald" | "amber" | "red";
}) {
  const toneClasses =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"
      : tone === "amber"
        ? "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
        : tone === "red"
          ? "bg-red-50 text-red-800 dark:bg-red-500/10 dark:text-red-300"
          : "bg-muted text-foreground";
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-2xl font-bold">{value}</span>
        {tone && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              toneClasses,
            )}
          >
            {tone === "emerald"
              ? "ok"
              : tone === "amber"
                ? "atención"
                : "urgente"}
          </span>
        )}
      </div>
    </div>
  );
}
