import Link from "next/link";
import { AlertTriangle, Copy, Pencil, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";
import { discountsApi, type ApiDiscount } from "@/lib/api";
import { discountStatusStyles, discountTypeLabel } from "@/lib/status-ui";
import { cn } from "@/lib/utils";
import { DeleteDiscountButton } from "./delete-discount-button";

async function loadDiscounts(): Promise<
  { ok: true; discounts: ApiDiscount[] } | { ok: false; error: string }
> {
  try {
    return { ok: true, discounts: await discountsApi.list() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export default async function DashboardDiscountsPage() {
  const result = await loadDiscounts();

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Descuentos"
        description="Crea y administra cupones y promociones."
        actions={
          <Link
            href="/dashboard/discounts/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear descuento
          </Link>
        }
      />
      {!result.ok ? (
        <ApiError message={result.error} />
      ) : (
        <DiscountsTable discounts={result.discounts} />
      )}
    </div>
  );
}

function ApiError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-10 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="font-semibold">No se pudo conectar con la API</p>
      <p className="max-w-md text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

function DiscountsTable({ discounts }: { discounts: ApiDiscount[] }) {
  if (discounts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border bg-background p-16 text-center">
        <p className="text-sm font-medium">Aún no hay descuentos</p>
        <Link
          href="/dashboard/discounts/new"
          className={cn(buttonVariants({ size: "sm" }), "mt-2")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Crear el primero
        </Link>
      </div>
    );
  }

  function formatValue(d: ApiDiscount) {
    if (d.type === "PERCENT") return `${Number(d.value)}%`;
    if (d.type === "FIXED") return `$${Number(d.value).toFixed(2)}`;
    return "Envío";
  }

  return (
    <div className="rounded-lg border bg-background">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted-foreground">
              <th className="py-3 pl-4 font-medium">Código</th>
              <th className="py-3 font-medium">Tipo</th>
              <th className="py-3 font-medium">Valor</th>
              <th className="py-3 font-medium">Usos</th>
              <th className="py-3 font-medium">Estado</th>
              <th className="py-3 font-medium">Expira</th>
              <th className="w-24 py-3 pr-4" />
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => {
              const st = discountStatusStyles[d.status];
              return (
                <tr
                  key={d.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="py-3 pl-4">
                    <p className="font-mono text-xs font-semibold">{d.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.description ?? "—"}
                    </p>
                  </td>
                  <td className="py-3">
                    <Badge variant="secondary">
                      {discountTypeLabel[d.type]}
                    </Badge>
                  </td>
                  <td className="py-3 font-semibold">{formatValue(d)}</td>
                  <td className="py-3 text-muted-foreground">
                    {d.usesCount}
                    {d.limit ? ` / ${d.limit}` : ""}
                  </td>
                  <td className="py-3">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        st.className,
                      )}
                    >
                      {st.label}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">
                    {d.expiresAt
                      ? new Date(d.expiresAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Link
                        href={`/dashboard/discounts/${d.id}/edit`}
                        className={cn(
                          buttonVariants({ variant: "ghost", size: "icon-sm" }),
                        )}
                        aria-label={`Editar ${d.code}`}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Link>
                      <DeleteDiscountButton id={d.id} code={d.code} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
