import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { DiscountForm } from "../discount-form";

export default function NewDiscountPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <Link
        href="/dashboard/discounts"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver a descuentos
      </Link>
      <PageHeader title="Nuevo descuento" description="Crea un cupón o promoción." />
      <DiscountForm />
    </div>
  );
}
