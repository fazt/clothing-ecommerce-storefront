import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { categoriesApi } from "@/lib/api";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  const categories = await categoriesApi.listAll().catch(() => []);

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href="/dashboard/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a productos
      </Link>
      <PageHeader title="Nuevo producto" description="Añade un nuevo producto al catálogo." />
      <ProductForm categories={categories.map(({ id, name }) => ({ id, name }))} />
    </div>
  );
}
