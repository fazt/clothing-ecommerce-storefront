import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/page-header";
import { usersApi } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { UsersTable } from "./users-table";

async function loadStats() {
  try {
    // pageSize=1: only `meta.total` matters here.
    const [all, admins] = await Promise.all([
      usersApi.list({ pageSize: 1 }),
      usersApi.list({ pageSize: 1, role: "ADMIN" }),
    ]);
    return { total: all.meta.total, admins: admins.meta.total };
  } catch (e) {
    unstable_rethrow(e);
    return null;
  }
}

export default async function DashboardUsersPage() {
  const [stats, sessionUser] = await Promise.all([loadStats(), getSessionUser()]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Usuarios"
        description="Gestiona las cuentas con acceso a la plataforma."
        actions={
          <Link href="/dashboard/users/new" className={cn(buttonVariants({ size: "sm" }))}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo usuario
          </Link>
        }
      />
      {stats ? (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
          {[
            { label: "Total", value: stats.total },
            { label: "Administradores", value: stats.admins },
            { label: "Usuarios", value: stats.total - stats.admins },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border bg-background p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-2 text-2xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      ) : null}
      <UsersTable currentUserId={sessionUser?.id} />
    </div>
  );
}
