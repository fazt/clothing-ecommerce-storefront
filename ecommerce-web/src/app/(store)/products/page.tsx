import { ProductCard } from "@/components/product-card";
import { fetchProducts } from "@/lib/products";

const filters = {
  categories: ["Mujer", "Hombre", "Accesorios", "Calzado"],
  sizes: ["XS", "S", "M", "L", "XL"],
  colors: [
    { name: "Tierra", hex: "#8a5d3b" },
    { name: "Arcilla", hex: "#b1562e" },
    { name: "Crema", hex: "#e8dfd1" },
    { name: "Musgo", hex: "#6e7240" },
    { name: "Tinta", hex: "#2a2018" },
  ],
  price: ["Menos de $50", "$50 – $100", "$100 – $200", "Más de $200"],
};

export default async function ProductsPage() {
  const products = await fetchProducts();
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Editorial header */}
      <header className="pt-16 pb-12 md:pt-24 md:pb-16 border-b hairline">
        <p className="label">— El catálogo</p>
        <div className="mt-6 grid gap-8 md:grid-cols-12 md:gap-12 md:items-end">
          <h1 className="md:col-span-8 font-display text-[clamp(2.75rem,7vw,5.5rem)] font-light leading-[0.95] tracking-tight text-[color:var(--ink)]">
            Una selección{" "}
            <span className="font-italic">curada</span> de
            <br />
            {products.length} piezas en temporada.
          </h1>
          <p className="md:col-span-4 font-italic text-lg text-[color:var(--ink-soft)] max-w-sm md:pb-3">
            Filtra por talla, color o categoría. Ordena por lo último en
            llegar, lo más ligero al bolsillo, o por lo que elige la casa.
          </p>
        </div>
      </header>

      <div className="grid gap-10 py-14 md:grid-cols-[16rem_1fr] md:gap-16 md:py-20">
        {/* Sidebar — typographic filters */}
        <aside className="hidden md:block md:sticky md:top-24 self-start">
          <FilterSection title="Categoría" items={filters.categories} />
          <Hairline />
          <div>
            <p className="label mb-4">Talla</p>
            <div className="flex flex-wrap gap-2">
              {filters.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className="flex h-8 min-w-8 items-center justify-center border px-2.5 text-[11px] tracking-[0.18em] uppercase hairline text-[color:var(--ink)] transition-colors hover:border-[color:var(--ink)]"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          <Hairline />
          <div>
            <p className="label mb-4">Color</p>
            <div className="flex flex-wrap gap-2.5">
              {filters.colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  title={c.name}
                  className="h-6 w-6 rounded-full transition-all hover:scale-110"
                  style={{
                    backgroundColor: c.hex,
                    boxShadow:
                      "inset 0 0 0 1px color-mix(in oklab, var(--ink) 14%, transparent)",
                  }}
                />
              ))}
            </div>
          </div>
          <Hairline />
          <FilterSection title="Precio" items={filters.price} />
        </aside>

        {/* Grid */}
        <div>
          <div className="mb-10 flex items-baseline justify-between">
            <p className="label-sm">
              Mostrando {products.length} piezas
            </p>
            <div className="flex items-baseline gap-3">
              <span className="label-sm">Ordenar</span>
              <select className="bg-transparent font-italic text-[15px] text-[color:var(--ink)] focus:outline-none cursor-pointer">
                <option>Curado por la casa</option>
                <option>Precio: menor a mayor</option>
                <option>Precio: mayor a menor</option>
                <option>Novedades</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-14 md:grid-cols-2 md:gap-x-8 lg:grid-cols-3 lg:gap-x-10">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Hairline() {
  return <div className="my-8 h-px w-full hairline border-t" />;
}

function FilterSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="label mb-4">{title}</p>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item}>
            <label className="flex cursor-pointer items-center gap-3 text-[14px] text-[color:var(--ink-soft)] transition-colors hover:text-[color:var(--ink)]">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 appearance-none border hairline-strong checked:bg-[color:var(--ink)] checked:border-[color:var(--ink)] transition-colors"
              />
              {item}
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
