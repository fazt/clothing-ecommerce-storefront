import { Hero } from "@/components/hero";
import { BrandStrip } from "@/components/brand-strip";
import { DressStyleGrid } from "@/components/dress-style-grid";
import { ProductGrid } from "@/components/product-grid";
import { Newsletter } from "@/components/newsletter";
import { Testimonials } from "@/components/testimonials";
import { fetchProducts } from "@/lib/products";

export default async function Home() {
  const products = await fetchProducts();
  const newArrivals = products
    .filter((p) => p.isNew)
    .slice(0, 4);
  const fallbackNew = newArrivals.length > 0 ? newArrivals : products.slice(0, 4);
  const topSelling = products
    .filter((p) => p.isFeatured)
    .slice(0, 4);
  const fallbackTop = topSelling.length > 0 ? topSelling : products.slice(4, 8);

  return (
    <>
      <Hero />
      <BrandStrip />
      <ProductGrid products={fallbackNew} title="NEW ARRIVALS" />
      <ProductGrid products={fallbackTop} title="TOP SELLING" />
      <DressStyleGrid />
      <Testimonials />
      <Newsletter />
    </>
  );
}
