"use client";

import { Bell } from "lucide-react";
import { CommandPalette } from "@/components/dashboard/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardHeader({ isAdmin }: { isAdmin: boolean }) {
  return (
    <header
      className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b px-5 md:px-8"
      style={{
        background: "var(--a-bg)",
        borderColor: "var(--a-border)",
      }}
    >
      <SidebarTrigger className="-ml-1 text-[color:var(--a-ink-2)]" />

      <CommandPalette isAdmin={isAdmin} />

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--a-card-muted)]"
          aria-label="Notificaciones"
        >
          <Bell className="h-[18px] w-[18px] text-[color:var(--a-ink-2)]" strokeWidth={1.8} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[color:var(--a-accent-red)]" />
        </button>
      </div>
    </header>
  );
}
