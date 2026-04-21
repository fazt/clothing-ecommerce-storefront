import { Hero } from "@/components/hero";
import { CategoryGrid } from "@/components/category-grid";
import { ProductGrid } from "@/components/product-grid";
import { ValueProps } from "@/components/value-props";
import { Newsletter } from "@/components/newsletter";
import { products } from "@/lib/products";

export default function Home() {
  const newArrivals = products.filter((p) => p.isNew);
  const featured = products.slice(0, 8);

  return (
    <>
      <Hero />
      <ValueProps />
      <CategoryGrid />
      <ProductGrid
        products={featured}
        title="Más vendidos"
        subtitle="Las prendas favoritas de nuestra comunidad."
      />
      {newArrivals.length > 0 && (
        <ProductGrid
          products={newArrivals}
          title="Novedades"
          subtitle="Lo último en llegar a tienda."
        />
      )}
      <Newsletter />
    </>
  );
}
