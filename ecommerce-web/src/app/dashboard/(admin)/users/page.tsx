import Link from "next/link";
import { AlertTriangle, Pencil, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { PageHeader } from "@/components/dashboard/page-header";
import { usersApi, type ApiUser } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { cn } from "@/lib/utils";
import { DeleteUserButton } from "./delete-user-button";

async function loadUsers(): Promise<
  { ok: true; users: ApiUser[] } | { ok: false; error: string }
> {
  try {
    return { ok: true, users: await usersApi.list() };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Error" };
  }
}

export default async function DashboardUsersPage() {
  const [result, sessionUser] = await Promise.all([
    loadUsers(),
    getSessionUser(),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Usuarios"
        description="Gestiona las cuentas con acceso a la plataforma."
        actions={
          <Link
            href="/dashboard/users/new"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo usuario
          </Link>
        }
      />
      {!result.ok ? (
        <ApiError message={result.error} />
      ) : (
        <UsersTable users={result.users} currentUserId={sessionUser?.id} />
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

function initials(user: ApiUser): string {
  const source = user.name?.trim() || user.email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

function UsersTable({
  users,
  currentUserId,
}: {
  users: ApiUser[];
  currentUserId?: string;
}) {
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const stats = [
    { label: "Total", value: users.length.toString() },
    { label: "Administradores", value: adminCount.toString() },
    { label: "Usuarios", value: (users.length - adminCount).toString() },
  ];

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border bg-background p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-2 text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border bg-background">
        {users.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Aún no hay usuarios.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-3 pl-4 font-medium">Usuario</th>
                  <th className="py-3 font-medium">Rol</th>
                  <th className="py-3 font-medium">Creado</th>
                  <th className="w-32 py-3 pr-4" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr
                      key={u.id}
                      className="border-b last:border-0 hover:bg-muted/30"
                    >
                      <td className="py-3 pl-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="text-xs">
                              {initials(u)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {u.name?.trim() || "—"}
                              {isSelf ? (
                                <span className="ml-2 text-xs font-normal text-muted-foreground">
                                  (tú)
                                </span>
                              ) : null}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            u.role === "ADMIN"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {u.role === "ADMIN" ? "Administrador" : "Usuario"}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/dashboard/users/${u.id}/edit`}
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                            )}
                            title="Editar usuario"
                          >
                            <Pencil className="h-3 w-3" />
                            <span className="sr-only">Editar</span>
                          </Link>
                          {isSelf ? null : (
                            <DeleteUserButton id={u.id} email={u.email} />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
