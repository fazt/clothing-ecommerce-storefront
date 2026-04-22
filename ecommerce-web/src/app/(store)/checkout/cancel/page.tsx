import Link from "next/link";
import { XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Pago cancelado — Atelier",
};

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-4 rounded-xl border bg-background p-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <XCircle className="h-7 w-7 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold">Pago cancelado</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          No se realizó ningún cargo. Tu carrito sigue intacto por si quieres
          intentarlo de nuevo.
        </p>
        <div className="flex gap-2">
          <Link
            href="/checkout"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            Volver al checkout
          </Link>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Seguir comprando
          </Link>
        </div>
      </div>
    </div>
  );
}
