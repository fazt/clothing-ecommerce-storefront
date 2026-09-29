import { CaptureView } from "./capture-view";

export const metadata = {
  title: "Confirmación — Atelier",
};

export default async function CheckoutReturnPage({
  searchParams,
}: {
  // PayPal returns `token` (+ PayerID); Stripe returns `session_id`.
  searchParams: Promise<{ token?: string; PayerID?: string; session_id?: string }>;
}) {
  const { token, session_id } = await searchParams;
  const payment = session_id
    ? ({ provider: "stripe", id: session_id } as const)
    : token
      ? ({ provider: "paypal", id: token } as const)
      : null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <CaptureView payment={payment} />
    </div>
  );
}
