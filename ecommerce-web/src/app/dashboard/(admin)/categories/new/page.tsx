import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { CategoryForm } from "../category-form";
import { createCategoryAction } from "../actions";

export default function NewCategoryPage() {
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
        title="Nueva categoría"
        description="Crea una nueva agrupación para tus productos."
      />
      <CategoryForm
        action={createCategoryAction}
        submitLabel="Crear categoría"
      />
    </div>
  );
}
