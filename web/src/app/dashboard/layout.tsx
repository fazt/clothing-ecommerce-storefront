import { Inter } from "next/font/google";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getSessionUser } from "@/lib/session";
import "./analytics.css";

const analyticsFont = Inter({
  subsets: ["latin"],
  variable: "--font-analytics",
  display: "swap",
});

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/dashboard");

  return (
    <div className={`analytics ${analyticsFont.variable}`}>
      <SidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset className="bg-[color:var(--a-bg)]">
          <DashboardHeader isAdmin={user.role === "ADMIN"} />
          <div className="flex flex-1 flex-col gap-4 p-5 md:p-8">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
