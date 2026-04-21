import Image from "next/image";
import {
  Plus,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  Pencil,
  Copy,
  Trash2,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { products } from "@/lib/products";
import { cn } from "@/lib/utils";

export default function DashboardProductsPage() {
  const totalProducts = products.length;
  const activeProducts = products.length;
  const outOfStock = 0;
  const lowStock = 2;

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
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Añadir producto
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatBox label="Total" value={totalProducts.toString()} />
        <StatBox label="Activos" value={activeProducts.toString()} tone="emerald" />
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
              <option>Todas las categorías</option>
              <option>Mujer</option>
              <option>Hombre</option>
              <option>Accesorios</option>
              <option>Calzado</option>
            </select>
            <select className="h-8 rounded-md border bg-background px-3 text-sm">
              <option>Todos los estados</option>
              <option>Activo</option>
              <option>Borrador</option>
              <option>Archivado</option>
            </select>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

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
                <th className="w-10 py-3 pr-4" />
              </tr>
            </thead>
            <tbody>
              {products.map((p, i) => {
                const stock = 20 + ((i * 7) % 40);
                const stockLow = stock < 15;
                return (
                  <tr key={p.id} className="border-b text-sm last:border-0 hover:bg-muted/30">
                    <td className="py-3 pl-4">
                      <input type="checkbox" className="h-4 w-4 rounded border" />
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted">
                          <Image
                            src={p.image}
                            alt={p.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-muted-foreground">{p.category}</td>
                    <td className="py-3">
                      <span className="font-semibold">${p.price.toFixed(2)}</span>
                      {p.originalPrice && (
                        <span className="ml-2 text-xs text-muted-foreground line-through">
                          ${p.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "font-medium",
                          stockLow && "text-amber-600",
                        )}
                      >
                        {stock}
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge variant="secondary">Activo</Badge>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm">
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t p-4 text-sm">
          <p className="text-muted-foreground">
            Mostrando <span className="font-medium text-foreground">1–{products.length}</span> de {products.length} productos
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
      </div>
    </div>
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
              : tone === "red"
                ? "urgente"
                : ""}
        </span>
      </div>
    </div>
  );
}
