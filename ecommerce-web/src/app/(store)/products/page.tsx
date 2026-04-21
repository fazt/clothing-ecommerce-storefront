import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { products } from "@/lib/products";

const filters = {
  categories: ["Mujer", "Hombre", "Accesorios", "Calzado"],
  sizes: ["XS", "S", "M", "L", "XL"],
  colors: [
    { name: "Negro", hex: "#111827" },
    { name: "Blanco", hex: "#f3f4f6" },
    { name: "Beige", hex: "#fde68a" },
    { name: "Azul", hex: "#1e3a8a" },
    { name: "Marrón", hex: "#78350f" },
  ],
};

export default function ProductsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="border-b py-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Tienda
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {products.length} productos disponibles
        </p>
      </div>

      <div className="flex gap-8 py-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <FilterSection title="Categoría" items={filters.categories} />
          <Separator className="my-6" />
          <div>
            <h3 className="mb-3 text-sm font-semibold">Talla</h3>
            <div className="flex flex-wrap gap-2">
              {filters.sizes.map((size) => (
                <button
                  key={size}
                  className="flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-xs font-medium hover:bg-accent"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <Separator className="my-6" />
          <div>
            <h3 className="mb-3 text-sm font-semibold">Color</h3>
            <div className="flex flex-wrap gap-2">
              {filters.colors.map((c) => (
                <button
                  key={c.name}
                  title={c.name}
                  className="h-7 w-7 rounded-full border-2 border-transparent ring-1 ring-border hover:border-foreground"
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>
          <Separator className="my-6" />
          <FilterSection
            title="Precio"
            items={[
              "Menos de $50",
              "$50 - $100",
              "$100 - $200",
              "Más de $200",
            ]}
          />
          <Button className="mt-6 w-full" variant="outline">
            Limpiar filtros
          </Button>
        </aside>

        <div className="flex-1">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="outline" size="sm" className="lg:hidden">
              Filtros
            </Button>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Ordenar:</span>
              <select className="rounded-md border bg-background px-3 py-1.5 text-sm">
                <option>Destacados</option>
                <option>Precio: menor a mayor</option>
                <option>Precio: mayor a menor</option>
                <option>Novedades</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item}>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              <input type="checkbox" className="h-4 w-4 rounded border" />
              {item}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
