import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Heart,
  RotateCcw,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductCard } from "@/components/product-card";
import { getProductBySlug, products } from "@/lib/products";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  if (!product) notFound();

  const related = products.filter((p) => p.id !== product.id).slice(0, 4);
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

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
        <div className="space-y-3">
          <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-muted">
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="absolute left-4 top-4 flex flex-col gap-1">
              {product.isNew && (
                <Badge className="bg-foreground text-background">Nuevo</Badge>
              )}
              {product.isSale && discount > 0 && (
                <Badge variant="destructive">−{discount}%</Badge>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[product.image, product.image, product.image, product.image].map(
              (src, i) => (
                <div
                  key={i}
                  className="relative aspect-square overflow-hidden rounded-md bg-muted ring-1 ring-border hover:ring-foreground"
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="120px"
                    className="object-cover"
                  />
                </div>
              ),
            )}
          </div>
        </div>

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

          <div className="mt-5 flex items-end gap-3">
            <span className="text-3xl font-bold">
              ${product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-lg text-muted-foreground line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            {product.description}
          </p>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Color</h3>
              <span className="text-xs text-muted-foreground">
                {product.colors.length} opciones
              </span>
            </div>
            <div className="mt-3 flex gap-2">
              {product.colors.map((c, i) => (
                <button
                  key={c}
                  className={`h-10 w-10 rounded-full ring-1 ring-border hover:ring-foreground ${
                    i === 0 ? "ring-2 ring-foreground" : ""
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Talla</h3>
              <button className="text-xs text-muted-foreground underline">
                Guía de tallas
              </button>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6">
              {product.sizes.map((size, i) => (
                <button
                  key={size}
                  className={`flex h-11 items-center justify-center rounded-md border text-sm font-medium hover:border-foreground ${
                    i === 1 ? "border-foreground bg-foreground text-background" : ""
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button size="lg" className="flex-1">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Añadir al carrito
            </Button>
            <Button size="lg" variant="outline">
              <Heart className="h-4 w-4" />
              <span className="sr-only">Favorito</span>
            </Button>
          </div>

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
