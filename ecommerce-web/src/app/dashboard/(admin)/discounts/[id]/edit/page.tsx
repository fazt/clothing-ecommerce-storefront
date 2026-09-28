import Link from "next/link";
import { notFound, unstable_rethrow } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { discountsApi } from "@/lib/api";
import { DiscountForm } from "../../discount-form";

export default async function EditDiscountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const discount = await discountsApi.get(id).catch((e: unknown) => {
    // Keep the login redirect `discountsApi` throws on a 401.
    unstable_rethrow(e);
    return null;
  });
  if (!discount) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/dashboard/discounts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a descuentos
      </Link>
      <PageHeader title={`Editar: ${discount.code}`} description="Modifica el descuento." />
      <DiscountForm initial={discount} />
    </div>
  );
}
