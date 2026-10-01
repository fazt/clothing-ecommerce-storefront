import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { categoriesApi } from "@/lib/api";
import { CategoryForm } from "../../category-form";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await categoriesApi.get(id).catch((e: unknown) => {
    // Keep the login redirect `categoriesApi` throws on a 401.
    unstable_rethrow(e);
    return null;
  });
  if (!category) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/dashboard/categories"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a categorías
      </Link>
      <PageHeader
        title={`Editar: ${category.name}`}
        description="Actualiza los datos de la categoría."
      />
      <CategoryForm initial={category} />
    </div>
  );
}
