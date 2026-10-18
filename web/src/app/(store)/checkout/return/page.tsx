import { CaptureView } from "./capture-view";

export const metadata = {
  title: "Confirmación — Atelier",
  robots: { index: false },
};

export default async function CheckoutReturnPage({
  searchParams,
}: {
  // `order` lo pone la tienda; Stripe añade `session_id`, PayPal `token` y Mercado Pago `payment_id`.
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const orderId = first(params.order) ?? null;
  const providerParams = {
    session_id: first(params.session_id),
    token: first(params.token),
    payment_id: first(params.payment_id),
    collection_id: first(params.collection_id),
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <CaptureView orderId={orderId} params={providerParams} />
    </div>
  );
}
