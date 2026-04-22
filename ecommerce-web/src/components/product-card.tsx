import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/lib/products";

interface ProductCardProps {
  product: Product;
  index?: number;
  originalPrice?: number;
}

export function ProductCard({ product }: ProductCardProps) {
  // Derive a "sale" discount percent (deterministic per product for UI only).
  const hasDiscount = product.isSale;
  const originalPrice = hasDiscount
    ? Math.round(product.price * 1.2)
    : undefined;
  const discount = originalPrice
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : 0;
  const rating = product.rating ?? 4.5;

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
        <div className="mt-2 flex items-center gap-2">
          <div className="flex gap-0.5">
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
            <span className="text-[color:var(--ink-faded)]"> /5</span>
          </span>
        </div>
        <div className="mt-2 flex items-center gap-2.5">
          <span className="price">${product.price.toFixed(0)}</span>
          {originalPrice ? (
            <span className="price-strike">${originalPrice}</span>
          ) : null}
          {discount > 0 ? (
            <span className="price-off">−{discount}%</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
