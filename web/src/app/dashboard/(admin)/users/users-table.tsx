"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CopyEmail } from "@/components/dashboard/copy-email";
import { DeleteButton } from "@/components/dashboard/delete-button";
import {
  DataTable,
  type DataTableColumn,
  type DataTableFilter,
  type DataTableQuery,
} from "@/components/dashboard/data-table";
import { api } from "@/lib/api-client";
import type { ApiUser, Role } from "@/lib/api-types";
import { cn } from "@/lib/utils";

const fetchUsers = (q: DataTableQuery) =>
  api.users.list({
    page: q.page,
    pageSize: q.pageSize,
    search: q.search,
    role: q.filters.role as Role | undefined,
  });

const filters: DataTableFilter[] = [
  {
    key: "role",
    label: "Rol",
    options: [
      { value: "ADMIN", label: "Administrador" },
      { value: "USER", label: "Usuario" },
    ],
  },
];

function initials(user: ApiUser): string {
  const source = user.name?.trim() || user.email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function UsersTable({ currentUserId }: { currentUserId?: string }) {
  const columns: DataTableColumn<ApiUser>[] = [
    {
      key: "name",
      header: "Usuario",
      cell: (u) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt="" /> : null}
            <AvatarFallback className="text-xs">{initials(u)}</AvatarFallback>
          </Avatar>
          <p className="font-medium">
            {u.name?.trim() || "—"}
            {u.id === currentUserId ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">(tú)</span>
            ) : null}
          </p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      cell: (u) => <CopyEmail email={u.email} className="text-muted-foreground" />,
    },
    {
      key: "role",
      header: "Rol",
      cell: (u) => (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-medium",
            u.role === "ADMIN"
              ? "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
              : "bg-muted text-muted-foreground",
          )}
        >
          {u.role === "ADMIN" ? "Administrador" : "Usuario"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Creado",
      className: "whitespace-nowrap text-muted-foreground",
      cell: (u) =>
        new Date(u.createdAt).toLocaleDateString("es-ES", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
    },
  ];

  return (
    <DataTable
      columns={columns}
      fetchPage={fetchUsers}
      rowKey={(u) => u.id}
      filters={filters}
      searchPlaceholder="Buscar por nombre o email..."
      emptyMessage="Aún no hay usuarios."
      rowActions={(u, reload) => (
        <>
          <Link
            href={`/dashboard/users/${u.id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            title="Editar usuario"
          >
            <Pencil className="h-3 w-3" />
            <span className="sr-only">Editar</span>
          </Link>
          {u.id === currentUserId ? null : (
            <DeleteButton
              label="Eliminar usuario"
              confirmMessage={`¿Eliminar el usuario "${u.email}"?`}
              onDelete={() => api.users.remove(u.id)}
              onDeleted={reload}
            />
          )}
        </>
      )}
    />
  );
}
