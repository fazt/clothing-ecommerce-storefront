"use client";

import * as React from "react";
import Link from "next/link";
import {
  BarChart3,
  LayoutDashboard,
  LifeBuoy,
  MessageSquare,
  Package,
  Settings,
  ShieldUser,
  ShoppingBag,
  Users,
  User,
} from "lucide-react";

import { NavMain, type NavMainItem } from "@/components/dashboard/nav-main";
import { NavUser } from "@/components/dashboard/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { ApiUser } from "@/lib/api";

const adminNavItems: NavMainItem[] = [
  { title: "Reports", url: "/dashboard", icon: LayoutDashboard },
  {
    title: "Library",
    url: "/dashboard/products",
    icon: Package,
    items: [
      { title: "Products", url: "/dashboard/products" },
      { title: "Categories", url: "/dashboard/categories" },
      { title: "Discounts", url: "/dashboard/discounts" },
    ],
  },
  { title: "Orders", url: "/dashboard/orders", icon: ShoppingBag },
  { title: "People", url: "/dashboard/customers", icon: Users },
  { title: "Activities", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Chat", url: "/dashboard/chat", icon: MessageSquare },
];

const supportItems: NavMainItem[] = [
  { title: "Get Started", url: "/dashboard/settings", icon: LifeBuoy },
  { title: "Users", url: "/dashboard/users", icon: ShieldUser },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

const userNavItems: NavMainItem[] = [
  { title: "Perfil", url: "/dashboard/profile", icon: User },
  { title: "Mis pedidos", url: "/dashboard/my-orders", icon: ShoppingBag },
];

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: ApiUser }) {
  const isAdmin = user.role === "ADMIN";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="pb-2 pt-5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Atelier"
              className="hover:bg-transparent data-[active=true]:bg-transparent"
              render={<Link href="/" />}
            >
              <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-[color:var(--a-accent-red)] text-white">
                <span className="text-[10px] font-black tracking-[0.08em]">
                  ATELIER
                </span>
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-base font-bold tracking-tight">
                  Atelier
                </span>
                <span className="truncate text-xs text-[color:var(--a-ink-3)]">
                  {isAdmin ? "Admin workspace" : "Mi cuenta"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {isAdmin ? (
          <>
            <NavMain label="Main" items={adminNavItems} />
            <NavMain label="Support" items={supportItems} />
          </>
        ) : (
          <NavMain label="Mi cuenta" items={userNavItems} />
        )}
      </SidebarContent>
      <SidebarFooter className="border-t border-[color:var(--a-border)]">
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
