import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/lib/products";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product }: ProductCardProps) {
  // Valoración real (promedio de reseñas publicadas). Sin reseñas no se pinta nada inventado.
  const rating = product.rating;
  const hasReviews = product.reviews > 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col"
    >
      <div
        className="relative aspect-square w-full overflow-hidden rounded-[20px]"
        style={{ backgroundColor: "var(--bg-soft)" }}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>

      <div className="pt-4">
        <h3 className="text-[18px] md:text-[20px] font-bold leading-tight line-clamp-1">
          {product.name}
        </h3>
        {hasReviews ? (
        <div className="mt-2 flex items-center gap-2" aria-label={`${rating.toFixed(1)} de 5 estrellas`}>
          <div className="flex gap-0.5" aria-hidden>
            {Array.from({ length: 5 }).map((_, i) => {
              const fill = i < Math.round(rating);
              return (
                <Star
                  key={i}
                  className="h-[16px] w-[16px]"
                  fill={fill ? "var(--star)" : "transparent"}
                  style={{ color: "var(--star)" }}
                  strokeWidth={fill ? 0 : 1.5}
                />
              );
            })}
          </div>
          <span className="text-[13px] text-[color:var(--ink-soft)]">
            {rating.toFixed(1)}
            <span className="text-[color:var(--ink-faded)]"> ({product.reviews})</span>
          </span>
        </div>
        ) : null}
        <div className="mt-2 flex items-center gap-2.5">
          <span className="price">${product.price.toFixed(2)}</span>
          {product.isSale ? <span className="price-off">Oferta</span> : null}
        </div>
      </div>
    </Link>
  );
}
