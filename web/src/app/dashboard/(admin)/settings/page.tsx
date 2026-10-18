import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/dashboard/page-header";
import { paymentsApi, type PaymentProviderId } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Todas las pasarelas soportadas y las variables que las activan (ver api/.env.example). */
const GATEWAYS: { id: PaymentProviderId; name: string; desc: string; env: string }[] = [
  {
    id: "STRIPE",
    name: "Stripe",
    desc: "Tarjetas con Stripe Checkout. Webhook: /api/webhooks/stripe",
    env: "STRIPE_SECRET_KEY · STRIPE_WEBHOOK_SECRET",
  },
  {
    id: "PAYPAL",
    name: "PayPal",
    desc: "Orders v2 con captura al volver y webhook /api/webhooks/paypal",
    env: "PAYPAL_CLIENT_ID · PAYPAL_CLIENT_SECRET · PAYPAL_WEBHOOK_ID",
  },
  {
    id: "MERCADOPAGO",
    name: "Mercado Pago",
    desc: "Checkout Pro (tarjetas, Yape, efectivo). Webhook: /api/webhooks/mercadopago",
    env: "MP_ACCESS_TOKEN · MP_WEBHOOK_SECRET",
  },
  {
    id: "SIMULATED",
    name: "Pago simulado",
    desc: "Solo para demos: el comprador aprueba o rechaza en una pantalla de prueba.",
    env: "PAYMENTS_SIMULATED_ENABLED=true (apagada por defecto en producción)",
  },
];

export const metadata = { title: "Ajustes — Atelier" };

export default async function DashboardSettingsPage() {
  const { methods } = await paymentsApi.methods().catch((e: unknown) => {
    unstable_rethrow(e);
    return { methods: [] as { id: PaymentProviderId; label: string }[] };
  });
  const enabled = new Set(methods.map((m) => m.id));

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="Ajustes"
        description="Estado de las integraciones de la tienda. Las credenciales se configuran con variables de entorno en la API (nunca en el repositorio)."
      />

      <Card>
        <CardHeader>
          <CardTitle>Pasarelas de pago</CardTitle>
          <CardDescription>
            Cada pasarela aparece en el checkout solo si la API tiene sus credenciales. Los montos se calculan en el
            servidor y los webhooks se verifican con firma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {GATEWAYS.map((g) => {
            const active = enabled.has(g.id);
            return (
              <div key={g.id} className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {active ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <CircleDashed className="h-4 w-4 text-muted-foreground" />
                    )}
                    {g.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{g.desc}</p>
                  <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">{g.env}</p>
                </div>
                <span
                  className={cn(
                    "w-fit shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    active
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {active ? "Activa" : "Sin configurar"}
                </span>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Envíos</CardTitle>
            <CardDescription>Tarifas, envío gratis desde un monto y tiempos de entrega.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/shipping" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Gestionar métodos de envío
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Cupones</CardTitle>
            <CardDescription>Porcentaje, monto fijo o envío gratis, con mínimo de compra y límite de usos.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/discounts" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Gestionar cupones
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
