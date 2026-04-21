import Image from "next/image";
import Link from "next/link";
import { categories } from "@/lib/products";

export function CategoryGrid() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Compra por categoría
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Encuentra tu estilo en nuestras colecciones.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href="/products"
            className="group relative aspect-[3/4] overflow-hidden rounded-xl bg-muted"
          >
            <Image
              src={cat.image}
              alt={cat.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
              <h3 className="text-lg font-semibold text-white md:text-xl">
                {cat.name}
              </h3>
              <span className="mt-1 inline-block text-xs text-white/80 underline-offset-4 group-hover:underline">
                Comprar ahora →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
