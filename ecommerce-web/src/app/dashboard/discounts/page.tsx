import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";

interface Discount {
  code: string;
  description: string;
  type: "percent" | "fixed" | "shipping";
  value: string;
  uses: number;
  limit: number | null;
  status: "active" | "scheduled" | "expired";
  expires: string;
}

const discounts: Discount[] = [
  {
    code: "WELCOME10",
    description: "10% off para nuevos clientes",
    type: "percent",
    value: "10%",
    uses: 342,
    limit: null,
    status: "active",
    expires: "2026-12-31",
  },
  {
    code: "SUMMER25",
    description: "Colección primavera-verano",
    type: "percent",
    value: "25%",
    uses: 128,
    limit: 500,
    status: "active",
    expires: "2026-06-30",
  },
  {
    code: "FREESHIP80",
    description: "Envío gratis sobre $80",
    type: "shipping",
    value: "Envío",
    uses: 892,
    limit: null,
    status: "active",
    expires: "—",
  },
  {
    code: "BLACKFRIDAY",
    description: "Black Friday 2026",
    type: "percent",
    value: "40%",
    uses: 0,
    limit: 2000,
    status: "scheduled",
    expires: "2026-11-28",
  },
  {
    code: "EASTER20",
    description: "Pascua 2026",
    type: "fixed",
    value: "$20",
    uses: 412,
    limit: 1000,
    status: "expired",
    expires: "2026-04-05",
  },
];

const statusStyle = {
  active: "bg-emerald-100 text-emerald-800",
  scheduled: "bg-blue-100 text-blue-800",
  expired: "bg-muted text-muted-foreground",
};

const statusLabel = {
  active: "Activo",
  scheduled: "Programado",
  expired: "Expirado",
};

export default function DashboardDiscountsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Descuentos"
        description="Crea y administra cupones y promociones."
        actions={
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Crear descuento
          </Button>
        }
      />

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
                <th className="w-20 py-3 pr-4" />
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => (
                <tr
                  key={d.code}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="py-3 pl-4">
                    <p className="font-mono text-xs font-semibold">{d.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.description}
                    </p>
                  </td>
                  <td className="py-3">
                    <Badge variant="secondary" className="capitalize">
                      {d.type === "percent"
                        ? "Porcentaje"
                        : d.type === "fixed"
                          ? "Monto fijo"
                          : "Envío"}
                    </Badge>
                  </td>
                  <td className="py-3 font-semibold">{d.value}</td>
                  <td className="py-3 text-muted-foreground">
                    {d.uses}
                    {d.limit ? ` / ${d.limit}` : ""}
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle[d.status]}`}
                    >
                      {statusLabel[d.status]}
                    </span>
                  </td>
                  <td className="py-3 text-muted-foreground">{d.expires}</td>
                  <td className="py-3 pr-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon-sm">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
