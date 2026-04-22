import { productsApi, type ApiProduct, type ApiProductVariant } from "@/lib/api";

export interface ProductVariant {
  id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  stock: number;
  price: number | null;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  image: string;
  images: string[];
  colors: string[];
  sizes: string[];
  isNew: boolean;
  isSale: boolean;
  isFeatured: boolean;
  rating: number;
  reviews: number;
  description: string;
  stock: number;
  variants: ProductVariant[];
}

export const categories = [
  {
    slug: "men",
    name: "Hombre",
    image:
      "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=800&auto=format&fit=crop&q=80",
  },
  {
    slug: "women",
    name: "Mujer",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&auto=format&fit=crop&q=80",
  },
  {
    slug: "accessories",
    name: "Accesorios",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80",
  },
  {
    slug: "shoes",
    name: "Calzado",
    image:
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800&auto=format&fit=crop&q=80",
  },
];

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800&auto=format&fit=crop&q=80";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function mapVariant(v: ApiProductVariant): ProductVariant {
  return {
    id: v.id,
    size: v.size,
    color: v.color,
    sku: v.sku,
    stock: v.stock,
    price: v.price !== null ? Number(v.price) : null,
  };
}

function uniqueStrings(values: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const v of values) {
    if (typeof v === "string" && v.trim()) seen.add(v);
  }
  return Array.from(seen);
}

function mapApiProduct(p: ApiProduct): Product {
  const price = Number(p.price);
  const rating = 4 + (hashString(p.id) % 10) / 10;
  const reviews = 20 + (hashString(p.id) % 280);
  const variants = (p.variants ?? []).map(mapVariant);
  const sizes = uniqueStrings(variants.map((v) => v.size));
  const colors = uniqueStrings(variants.map((v) => v.color));
  const galleryImages = p.images ?? [];
  const mainImage = p.imageUrl ?? galleryImages[0] ?? FALLBACK_IMAGE;
  const images = [mainImage, ...galleryImages.filter((i) => i !== mainImage)];

  return {
    id: p.id,
    slug: slugify(p.name) || p.id,
    name: p.name,
    category: p.category?.name ?? "Tienda",
    price,
    image: mainImage,
    images,
    colors,
    sizes,
    isNew: !!p.isNew,
    isSale: !!p.isSale,
    isFeatured: !!p.isFeatured,
    rating,
    reviews,
    description:
      p.description ??
      "Pieza contemporánea de nuestra colección actual. Materiales de calidad y confección cuidada.",
    stock: p.stock ?? 0,
    variants,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  try {
    const apiProducts = await productsApi.list();
    return apiProducts.map(mapApiProduct);
  } catch (e) {
    console.error("[products] failed to fetch catalog", e);
    return [];
  }
}

export async function getProductBySlug(
  slug: string,
): Promise<Product | null> {
  const products = await fetchProducts();
  return products.find((p) => p.slug === slug) ?? null;
}
