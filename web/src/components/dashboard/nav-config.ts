import {
  BarChart3,
  LayoutDashboard,
  MessageSquare,
  Package,
  Settings,
  ShieldUser,
  ShoppingBag,
  Users,
  User,
} from "lucide-react";
import type { NavMainItem } from "@/components/dashboard/nav-main";

// Shared by the sidebar and the command palette.
export const adminNavItems: NavMainItem[] = [
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

export const supportItems: NavMainItem[] = [
  { title: "Users", url: "/dashboard/users", icon: ShieldUser },
  { title: "Settings", url: "/dashboard/settings", icon: Settings },
];

export const userNavItems: NavMainItem[] = [
  { title: "Perfil", url: "/dashboard/profile", icon: User },
  { title: "Mis pedidos", url: "/dashboard/my-orders", icon: ShoppingBag },
];
