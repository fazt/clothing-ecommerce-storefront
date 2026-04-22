"use client";

import { Bell, Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function DashboardHeader() {
  return (
    <header
      className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b px-5 md:px-8"
      style={{
        background: "var(--a-bg)",
        borderColor: "var(--a-border)",
      }}
    >
      <SidebarTrigger className="-ml-1 text-[color:var(--a-ink-2)]" />

      <div
        className="ml-2 hidden items-center gap-2 rounded-xl border px-3 py-2 md:flex md:w-[360px]"
        style={{
          background: "var(--a-card)",
          borderColor: "var(--a-border)",
        }}
      >
        <Search className="h-4 w-4 text-[color:var(--a-ink-4)]" />
        <input
          type="search"
          placeholder="Search anything..."
          className="w-full bg-transparent text-sm text-[color:var(--a-ink)] placeholder:text-[color:var(--a-ink-4)] focus:outline-none"
          aria-label="Search"
        />
        <kbd className="hidden rounded-md border bg-[color:var(--a-card-muted)] px-1.5 py-0.5 text-[10px] font-mono text-[color:var(--a-ink-3)] md:inline-flex">
          ⌘K
        </kbd>
      </div>

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
