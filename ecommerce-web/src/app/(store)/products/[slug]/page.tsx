import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, RotateCcw, Star, Truck } from "lucide-react";
import { Separator } from "@/components/ui/separator";
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
      <nav className="flex items-center gap-1 py-6 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/products" className="hover:text-foreground">
          Tienda
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 pb-12 lg:grid-cols-2 lg:gap-12">
        <ProductGallery
          images={product.images}
          alt={product.name}
          isNew={product.isNew}
          isSale={product.isSale}
        />

        <div className="flex flex-col">
          <p className="text-sm text-muted-foreground">{product.category}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(product.rating)
                      ? "fill-foreground text-foreground"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating} ({product.reviews} reseñas)
            </span>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            {product.description}
          </p>

          <ProductVariantSelector product={product} />

          <Separator className="my-8" />

          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <Truck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>Envío gratis</strong> en pedidos superiores a $80.
                Entrega estimada en 2–4 días laborables.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <RotateCcw className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>Devoluciones gratuitas</strong> durante 30 días desde la
                recepción.
              </span>
            </li>
          </ul>
        </div>
      </div>

      <Separator />

      <section className="py-12">
        <h2 className="mb-8 text-2xl font-bold tracking-tight sm:text-3xl">
          También te puede gustar
        </h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
