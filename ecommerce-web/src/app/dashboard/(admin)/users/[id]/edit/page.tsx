import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { usersApi } from "@/lib/api";
import { getSessionUser } from "@/lib/session";
import { UserForm } from "../../user-form";
import { updateUserAction } from "../../actions";

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let user;
  try {
    user = await usersApi.get(id);
  } catch {
    notFound();
  }

  const session = await getSessionUser();
  const isSelf = session?.id === user.id;
  const action = updateUserAction.bind(null, id);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Editar usuario"
        description={user.email}
      />
      <UserForm
        initial={user}
        action={action}
        submitLabel="Guardar cambios"
        mode="edit"
        isSelf={isSelf}
      />
    </div>
  );
}
