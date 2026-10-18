import {
  BarChart3,
  Heart,
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
  { title: "Resumen", url: "/dashboard", icon: LayoutDashboard },
  {
    title: "Catálogo",
    url: "/dashboard/products",
    icon: Package,
    items: [
      { title: "Productos", url: "/dashboard/products" },
      { title: "Categorías", url: "/dashboard/categories" },
      { title: "Cupones", url: "/dashboard/discounts" },
      { title: "Envíos", url: "/dashboard/shipping" },
      { title: "Reseñas", url: "/dashboard/reviews" },
    ],
  },
  { title: "Pedidos", url: "/dashboard/orders", icon: ShoppingBag },
  { title: "Clientes", url: "/dashboard/customers", icon: Users },
  { title: "Analíticas", url: "/dashboard/analytics", icon: BarChart3 },
  { title: "Chat", url: "/dashboard/chat", icon: MessageSquare },
];

export const supportItems: NavMainItem[] = [
  { title: "Usuarios", url: "/dashboard/users", icon: ShieldUser },
  { title: "Ajustes", url: "/dashboard/settings", icon: Settings },
];

export const userNavItems: NavMainItem[] = [
  { title: "Perfil", url: "/dashboard/profile", icon: User },
  { title: "Mis pedidos", url: "/dashboard/my-orders", icon: ShoppingBag },
  { title: "Favoritos", url: "/dashboard/wishlist", icon: Heart },
];
