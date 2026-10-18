import type { MetadataRoute } from "next";
import { fetchProducts } from "@/lib/products";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:5226";

// Se regenera cada hora (el catálogo cambia desde el panel).
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchProducts();
  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/products`, changeFrequency: "daily", priority: 0.9 },
    ...products.map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
