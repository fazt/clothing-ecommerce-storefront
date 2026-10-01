import { notFound, unstable_rethrow } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { usersApi } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { UserForm } from "../../user-form";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [user, session] = await Promise.all([
    usersApi.get(id).catch((e: unknown) => {
      // Keep the login redirect `usersApi` throws on a 401.
      unstable_rethrow(e);
      return null;
    }),
    getSessionUser(),
  ]);
  if (!user) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title="Editar usuario" description={user.email} />
      <UserForm initial={user} isSelf={session?.id === user.id} />
    </div>
  );
}
