import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { categoriesApi, productsApi } from "@/lib/api";
import { ProductForm } from "../../product-form";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    productsApi.get(id).catch(() => null),
    categoriesApi.listAll().catch(() => []),
  ]);
  if (!product) notFound();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <Link
        href="/dashboard/products"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a productos
      </Link>
      <PageHeader title={`Editar: ${product.name}`} description="Modifica los datos del producto." />
      <ProductForm
        initial={product}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      />
    </div>
  );
}
