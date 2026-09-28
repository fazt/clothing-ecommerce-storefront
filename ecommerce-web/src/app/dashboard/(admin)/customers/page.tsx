import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { customersApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { CustomersTable } from "./customers-table";

async function loadStats() {
  try {
    // The segment is derived by the API, so aggregate the whole list here.
    const customers = await customersApi.listAll();
    const total = customers.length;
    const avgSpent = total > 0 ? customers.reduce((s, c) => s + c.totalSpent, 0) / total : 0;
    return [
      { label: "Total clientes", value: total.toString() },
      { label: "VIP", value: customers.filter((c) => c.segment === "vip").length.toString() },
      {
        label: "Recurrentes",
        value: customers.filter((c) => c.segment === "returning").length.toString(),
      },
      { label: "Gasto promedio", value: `$${avgSpent.toFixed(2)}` },
    ];
  } catch {
    return null;
  }
}

export default async function DashboardCustomersPage() {
  const stats = await loadStats();

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Clientes"
        description="Analiza y gestiona tu base de clientes."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Link href="/dashboard/customers/new" className={cn(buttonVariants({ size: "sm" }))}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo cliente
            </Link>
          </>
        }
      />
      {stats ? (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border bg-background p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-2 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      ) : null}
      <CustomersTable />
    </div>
  );
}
