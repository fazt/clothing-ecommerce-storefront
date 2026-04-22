import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, RotateCcw, Truck } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ProductGallery } from "@/components/product-gallery";
import { ProductVariantSelector } from "@/components/product-variant-selector";
import { fetchProducts, getProductBySlug } from "@/lib/products";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const allProducts = await fetchProducts();
  const related = allProducts.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      <nav className="flex items-center gap-1 pt-10 label-sm">
        <Link href="/" className="hover:text-[color:var(--ink)]">
          Inicio
        </Link>
        <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
        <Link href="/products" className="hover:text-[color:var(--ink)]">
          Tienda
        </Link>
        <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
        <span style={{ color: "var(--ink)" }}>{product.name}</span>
      </nav>

      <div className="grid gap-12 py-12 pb-20 lg:grid-cols-[1.1fr_1fr] lg:gap-20 md:py-20">
        <ProductGallery
          images={product.images}
          alt={product.name}
          isNew={product.isNew}
          isSale={product.isSale}
        />

        <div className="flex flex-col">
          <p className="label">— {product.category}</p>
          <h1 className="font-display mt-5 text-[clamp(2.5rem,5vw,4rem)] font-light leading-[1] tracking-tight text-[color:var(--ink)]">
            {product.name}
          </h1>

          <div className="mt-8 flex items-baseline gap-3">
            <span className="font-italic text-3xl text-[color:var(--ink)]">
              ${product.price.toFixed(2)}
            </span>
            {product.reviews ? (
              <span className="label-sm">
                · {product.rating.toFixed(1)} ({product.reviews})
              </span>
            ) : null}
          </div>

          <p className="font-italic mt-8 text-[17px] leading-relaxed text-[color:var(--ink-soft)] max-w-md">
            {product.description}
          </p>

          <div className="mt-10 border-t hairline pt-8">
            <ProductVariantSelector product={product} />
          </div>

          <ul className="mt-14 space-y-0 text-sm">
            <MetaItem
              icon={<Truck className="h-4 w-4" strokeWidth={1.5} />}
              title="Envío gratis desde $80"
              note="Entrega estimada 2–4 días laborables."
            />
            <MetaItem
              icon={<RotateCcw className="h-4 w-4" strokeWidth={1.5} />}
              title="Devoluciones en 30 días"
              note="Si no te convence, nos la llevamos de vuelta."
            />
            <MetaItem
              title="Hecho a mano"
              note="Tejido y cortado en lotes pequeños en nuestro taller."
            />
          </ul>
        </div>
      </div>

      <section className="border-t hairline py-20 md:py-28">
        <header className="mb-14 flex flex-col items-start gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="label">— También te puede gustar</p>
            <h2 className="font-display mt-4 text-[clamp(1.75rem,4vw,3rem)] font-light leading-[1] tracking-tight text-[color:var(--ink)]">
              <span className="font-italic">Otras piezas</span> del estudio.
            </h2>
          </div>
          <Link href="/products" className="link-under whitespace-nowrap">
            Ver todas <span aria-hidden>→</span>
          </Link>
        </header>
        <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4 md:gap-x-8 lg:gap-x-10">
          {related.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}

function MetaItem({
  icon,
  title,
  note,
}: {
  icon?: React.ReactNode;
  title: string;
  note: string;
}) {
  return (
    <li className="flex items-start gap-4 border-b hairline py-4 last:border-b-0">
      {icon ? (
        <span className="mt-0.5 shrink-0 text-[color:var(--ink)]">{icon}</span>
      ) : (
        <span className="mt-0.5 shrink-0 text-[color:var(--clay)] font-italic">·</span>
      )}
      <div className="min-w-0">
        <p className="label-sm">{title}</p>
        <p className="mt-1 text-[14px] text-[color:var(--ink-soft)]">{note}</p>
      </div>
    </li>
  );
}
