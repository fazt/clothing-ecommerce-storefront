import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const discount = product.originalPrice
    ? Math.round(
        ((product.originalPrice - product.price) / product.originalPrice) * 100,
      )
    : 0;

  return (
    <div className="group flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-[3/4] overflow-hidden rounded-lg bg-muted"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {product.isNew && (
            <Badge className="bg-foreground text-background">Nuevo</Badge>
          )}
          {product.isSale && discount > 0 && (
            <Badge variant="destructive">−{discount}%</Badge>
          )}
        </div>
        <Button
          size="icon"
          variant="secondary"
          className="absolute right-3 top-3 h-8 w-8 rounded-full opacity-0 shadow transition-opacity group-hover:opacity-100"
        >
          <Heart className="h-4 w-4" />
          <span className="sr-only">Añadir a favoritos</span>
        </Button>
      </Link>

      <div className="mt-3 flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">{product.category}</p>
        <Link
          href={`/products/${product.slug}`}
          className="text-sm font-medium hover:underline"
        >
          {product.name}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            ${product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-xs text-muted-foreground line-through">
              ${product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>
        <div className="mt-1 flex gap-1">
          {product.colors.map((c) => (
            <span
              key={c}
              className="h-3 w-3 rounded-full border"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
