import { CaptureView } from "./capture-view";

export const metadata = {
  title: "Confirmación — Atelier",
};

export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; PayerID?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <CaptureView token={token ?? null} />
    </div>
  );
}
