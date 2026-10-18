import { PageHeader } from "@/components/dashboard/page-header";
import { WishlistGrid } from "./wishlist-grid";

export const metadata = { title: "Favoritos — Atelier" };

export default function WishlistPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader title="Favoritos" description="Las prendas que guardaste para después." />
      <WishlistGrid />
    </div>
  );
}
