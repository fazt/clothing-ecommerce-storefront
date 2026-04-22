import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { discountsApi } from "@/lib/api";
import { DiscountForm } from "../../discount-form";
import { updateDiscountAction } from "../../actions";

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let discount;
  try {
    discount = await discountsApi.get(id);
  } catch {
    notFound();
  }

  async function action(formData: FormData) {
    "use server";
    await updateDiscountAction(id, formData);
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/dashboard/discounts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a descuentos
      </Link>
      <PageHeader
        title={`Editar: ${discount.code}`}
        description="Modifica el descuento."
      />
      <DiscountForm
        initial={discount}
        action={action}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
