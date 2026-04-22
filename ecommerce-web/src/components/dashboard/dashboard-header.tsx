"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const segmentLabels: Record<string, string> = {
  dashboard: "Dashboard",
  products: "Productos",
  categories: "Categorías",
  orders: "Órdenes",
  customers: "Clientes",
  discounts: "Descuentos",
  analytics: "Analíticas",
  users: "Usuarios",
  settings: "Ajustes",
  "my-orders": "Mis pedidos",
};

function labelFor(segment: string): string {
  return segmentLabels[segment] ?? segment.replace(/-/g, " ");
}

export function DashboardHeader() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;
    return { segment, href, isLast, label: labelFor(segment) };
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b bg-background/80 backdrop-blur transition-[width,height] ease-linear supports-[backdrop-filter]:bg-background/60 group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {crumbs.map((crumb, index) => (
              <BreadcrumbListItem
                key={crumb.href}
                crumb={crumb}
                showSeparator={index < crumbs.length - 1}
              />
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="ml-auto flex items-center gap-2 px-4">
        <div className="relative hidden w-full max-w-xs md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="h-9 pl-9"
          />
        </div>
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
          <span className="sr-only">Notificaciones</span>
        </Button>
      </div>
    </header>
  );
}

function BreadcrumbListItem({
  crumb,
  showSeparator,
}: {
  crumb: { href: string; isLast: boolean; label: string };
  showSeparator: boolean;
}) {
  return (
    <>
      <BreadcrumbItem className={crumb.isLast ? "" : "hidden md:block"}>
        {crumb.isLast ? (
          <BreadcrumbPage className="capitalize">{crumb.label}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink
            render={<Link href={crumb.href} />}
            className="capitalize"
          >
            {crumb.label}
          </BreadcrumbLink>
        )}
      </BreadcrumbItem>
      {showSeparator ? (
        <BreadcrumbSeparator className="hidden md:block" />
      ) : null}
    </>
  );
}
