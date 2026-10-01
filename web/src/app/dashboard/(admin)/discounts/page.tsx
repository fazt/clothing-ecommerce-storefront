import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { cn } from "@/lib/utils";
import { DiscountsTable } from "./discounts-table";

export default function DashboardDiscountsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Descuentos"
        description="Crea y administra cupones y promociones."
        actions={
          <Link href="/dashboard/discounts/new" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="mr-2 h-4 w-4" />
            Crear descuento
          </Link>
        }
      />
      <DiscountsTable />
    </div>
  );
}
