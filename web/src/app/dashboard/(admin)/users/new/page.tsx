import { PageHeader } from "@/components/dashboard/page-header";
import { UserForm } from "../user-form";

export default function NewUserPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title="Nuevo usuario" description="Crea una cuenta con acceso a la plataforma." />
      <UserForm />
    </div>
  );
}
