import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/products";

export function ProductGrid({
  products,
  title,
  viewAllHref = "/products",
}: {
  products: Product[];
  title?: string;
  subtitle?: string;
  viewAllHref?: string;
  lead?: boolean;
  density?: "default" | "tight";
}) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 md:py-20 lg:px-8">
      {title ? (
        <h2 className="font-integral text-center text-[32px] md:text-[48px] leading-none mb-10 md:mb-14">
          {title}
        </h2>
      ) : null}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
        {products.slice(0, 4).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {title ? (
        <div className="mt-10 flex justify-center">
          <Link href={viewAllHref} className="btn-outline">
            View All
          </Link>
        </div>
      ) : null}
      <div
        className="mx-auto mt-16 h-px max-w-7xl"
        style={{ backgroundColor: "var(--border)" }}
      />
    </section>
  );
}
