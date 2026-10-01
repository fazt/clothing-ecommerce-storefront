"use client";

import * as React from "react";
import Link from "next/link";

import { NavMain } from "@/components/dashboard/nav-main";
import { adminNavItems, supportItems, userNavItems } from "@/components/dashboard/nav-config";
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
