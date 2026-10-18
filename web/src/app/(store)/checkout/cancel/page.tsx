import { CancelView } from "./cancel-view";

export const metadata = {
  title: "Pago cancelado — Atelier",
  robots: { index: false },
};

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <CancelView orderId={order ?? null} />
    </div>
  );
}
