import { PageHeader } from "@/components/dashboard/page-header";
import { ReviewsTable } from "./reviews-table";

export const metadata = { title: "Reseñas — Atelier" };

export default function DashboardReviewsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Reseñas"
        description="Modera las opiniones de los clientes. Ocultar una reseña la saca del promedio del producto."
      />
      <ReviewsTable />
    </div>
  );
}
