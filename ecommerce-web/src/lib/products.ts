export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  colors: string[];
  sizes: string[];
  isNew?: boolean;
  isSale?: boolean;
  rating: number;
  reviews: number;
  description: string;
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

export const products: Product[] = [
  {
    id: "1",
    slug: "oversized-cotton-tee",
    name: "Oversized Cotton Tee",
    category: "Hombre",
    price: 29.99,
    originalPrice: 39.99,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop&q=80",
    colors: ["#111827", "#f3f4f6", "#64748b"],
    sizes: ["XS", "S", "M", "L", "XL"],
    isSale: true,
    rating: 4.6,
    reviews: 128,
    description:
      "Camiseta oversized de algodón 100% orgánico con caída fluida y cuello reforzado.",
  },
  {
    id: "2",
    slug: "linen-summer-dress",
    name: "Vestido de Lino Verano",
    category: "Mujer",
    price: 79.0,
    image:
      "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&auto=format&fit=crop&q=80",
    colors: ["#fef3c7", "#fde68a", "#111827"],
    sizes: ["XS", "S", "M", "L"],
    isNew: true,
    rating: 4.9,
    reviews: 87,
    description:
      "Vestido midi de lino ligero con tirantes ajustables y acabado relajado para el verano.",
  },
  {
    id: "3",
    slug: "classic-denim-jacket",
    name: "Chaqueta Denim Clásica",
    category: "Hombre",
    price: 119.0,
    image:
      "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=800&auto=format&fit=crop&q=80",
    colors: ["#1e3a8a", "#111827"],
    sizes: ["S", "M", "L", "XL"],
    rating: 4.7,
    reviews: 214,
    description:
      "Chaqueta de mezclilla de corte regular con costuras reforzadas y bolsillos frontales.",
  },
  {
    id: "4",
    slug: "knitted-wool-sweater",
    name: "Suéter Tejido Lana",
    category: "Mujer",
    price: 89.5,
    originalPrice: 110.0,
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&auto=format&fit=crop&q=80",
    colors: ["#fde68a", "#f3f4f6", "#292524"],
    sizes: ["S", "M", "L"],
    isSale: true,
    rating: 4.8,
    reviews: 156,
    description:
      "Suéter de lana merino con tejido grueso y cuello alto, perfecto para el invierno.",
  },
  {
    id: "5",
    slug: "leather-crossbody-bag",
    name: "Bolso Crossbody Piel",
    category: "Accesorios",
    price: 149.0,
    image:
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&auto=format&fit=crop&q=80",
    colors: ["#292524", "#78350f"],
    sizes: ["Única"],
    isNew: true,
    rating: 4.9,
    reviews: 62,
    description:
      "Bolso crossbody de piel genuina con correa ajustable y herrajes metálicos en oro mate.",
  },
  {
    id: "6",
    slug: "white-minimalist-sneakers",
    name: "Sneakers Blancos Minimal",
    category: "Calzado",
    price: 99.0,
    image:
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&auto=format&fit=crop&q=80",
    colors: ["#f3f4f6", "#111827"],
    sizes: ["38", "39", "40", "41", "42", "43"],
    rating: 4.5,
    reviews: 341,
    description:
      "Zapatillas minimalistas de cuero con suela de goma flexible y plantilla acolchada.",
  },
  {
    id: "7",
    slug: "wool-tailored-coat",
    name: "Abrigo de Lana Entallado",
    category: "Mujer",
    price: 259.0,
    image:
      "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=800&auto=format&fit=crop&q=80",
    colors: ["#292524", "#78716c"],
    sizes: ["XS", "S", "M", "L"],
    rating: 4.8,
    reviews: 44,
    description:
      "Abrigo de lana con corte entallado, botonadura simple y solapas clásicas de estilo atemporal.",
  },
  {
    id: "8",
    slug: "slim-fit-chinos",
    name: "Chinos Slim Fit",
    category: "Hombre",
    price: 59.0,
    originalPrice: 79.0,
    image:
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80",
    colors: ["#78716c", "#111827", "#1e40af"],
    sizes: ["28", "30", "32", "34", "36"],
    isSale: true,
    rating: 4.4,
    reviews: 98,
    description:
      "Pantalones chinos de corte slim en algodón elástico, ideales para un look casual refinado.",
  },
];

export const getProductBySlug = (slug: string) =>
  products.find((p) => p.slug === slug);
