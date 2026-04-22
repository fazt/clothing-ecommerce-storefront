"use client";

import * as React from "react";
import Link from "next/link";
import {
  BarChart3,
  LayoutDashboard,
  Package,
  Settings,
  ShieldUser,
  ShoppingBag,
  Store,
  Users,
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
  { title: "Resumen", url: "/dashboard", icon: LayoutDashboard },
  {
    title: "Catálogo",
    url: "/dashboard/products",
    icon: Package,
    items: [
      { title: "Productos", url: "/dashboard/products" },
      { title: "Categorías", url: "/dashboard/categories" },
      { title: "Descuentos", url: "/dashboard/discounts" },
    ],
  },
  { title: "Órdenes", url: "/dashboard/orders", icon: ShoppingBag },
  { title: "Clientes", url: "/dashboard/customers", icon: Users },
  { title: "Analíticas", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Usuarios", url: "/dashboard/users", icon: ShieldUser },
  { title: "Ajustes", url: "/dashboard/settings", icon: Settings },
];

const userNavItems: NavMainItem[] = [
  { title: "Mis pedidos", url: "/dashboard/my-orders", icon: ShoppingBag },
];

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: ApiUser }) {
  const isAdmin = user.role === "ADMIN";
  const navItems = isAdmin ? adminNavItems : userNavItems;
  const sectionLabel = isAdmin ? "Administración" : "Mi cuenta";
  const accountTag = isAdmin ? "Admin" : "Cliente";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Atelier"
              render={<Link href="/" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-foreground text-background">
                <Store className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Atelier</span>
                <span className="truncate text-xs">{accountTag}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label={sectionLabel} items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
