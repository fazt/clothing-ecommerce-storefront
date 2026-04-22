import { PageHeader } from "@/components/dashboard/page-header";
import { UserForm } from "../user-form";
import { createUserAction } from "../actions";

export default function NewUserPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Nuevo usuario"
        description="Crea una cuenta con acceso a la plataforma."
      />
      <UserForm
        action={createUserAction}
        submitLabel="Crear usuario"
        mode="create"
      />
    </div>
  );
}
