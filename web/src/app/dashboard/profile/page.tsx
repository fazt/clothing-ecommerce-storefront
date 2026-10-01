import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { AvatarCard } from "./avatar-card";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";

export const metadata = {
  title: "Mi Perfil | Atelier",
  description: "Gestiona tu información personal y ajustes de seguridad.",
};

export default async function ProfilePage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/dashboard/profile");
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      <PageHeader
        title="Mi Perfil"
        description="Administra tu información personal, seguridad y preferencias de cuenta."
      />
      <div className="grid gap-6">
        <AvatarCard user={user} />
        <ProfileForm user={user} />
        <PasswordForm />
      </div>
    </div>
  );
}
