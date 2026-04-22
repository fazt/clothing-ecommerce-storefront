import Link from "next/link";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { paymentsApi, type ApiOrder } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CartClearer } from "./cart-clearer";

export const metadata = {
  title: "Confirmación — Atelier",
};

async function capture(token: string): Promise<
  { ok: true; order: ApiOrder } | { ok: false; error: string }
> {
  try {
    return { ok: true, order: await paymentsApi.capturePaypal(token) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export default async function CheckoutReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; PayerID?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorPanel message="No recibimos el identificador de PayPal. Vuelve al carrito e inténtalo de nuevo." />
      </div>
    );
  }

  const result = await capture(token);

  if (!result.ok) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <ErrorPanel message={result.error} />
      </div>
    );
  }

  const order = result.order;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <CartClearer />
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-background p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-semibold">¡Pago confirmado!</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Tu pedido{" "}
          <span className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>{" "}
          se ha registrado por un total de ${Number(order.total).toFixed(2)}.
        </p>
        <ul className="w-full divide-y rounded-lg border text-left">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 px-4 py-3 text-sm"
            >
              <span className="font-medium">{item.product?.name ?? "Producto"}</span>
              <span className="text-muted-foreground">
                x{item.quantity} · ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-2">
          <Link
            href="/dashboard/my-orders"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Ver mis pedidos
          </Link>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="text-2xl font-semibold">No pudimos confirmar el pago</h1>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
      <Link
        href="/checkout"
        className={cn(buttonVariants({ variant: "default" }))}
      >
        Volver al checkout
      </Link>
    </div>
  );
}
