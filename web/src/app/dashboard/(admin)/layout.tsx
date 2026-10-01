import { requireAdminPage } from "@/lib/session";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminPage();
  return <>{children}</>;
}
