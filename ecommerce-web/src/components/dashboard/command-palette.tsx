"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  CircleUser,
  FileText,
  LogOut,
  Plus,
  Search,
  Store,
  SunMoon,
  type LucideIcon,
} from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import type { NavMainItem } from "@/components/dashboard/nav-main";
import { adminNavItems, supportItems, userNavItems } from "@/components/dashboard/nav-config";
import { useLogout } from "@/hooks/use-logout";

interface PaletteLink {
  title: string;
  url: string;
  icon: LucideIcon;
}

/** Flattens nav groups into one entry per distinct page. */
function pagesFrom(items: NavMainItem[]): PaletteLink[] {
  const seen = new Set<string>();
  const pages: PaletteLink[] = [];
  for (const item of items) {
    const entries = item.items?.length ? item.items : [item];
    for (const entry of entries) {
      if (seen.has(entry.url)) continue;
      seen.add(entry.url);
      pages.push({ title: entry.title, url: entry.url, icon: item.icon ?? FileText });
    }
  }
  return pages;
}

/** Lowercase and strip accents so "categoria" finds "categoría". */
function normalize(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Substring match on every word. cmdk's default fuzzy scoring ranks loose
// subsequences first ("cerrar" → "Categories /dashboard/categories").
function filterItems(value: string, search: string): number {
  const haystack = normalize(value);
  return normalize(search)
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => haystack.includes(term))
    ? 1
    : 0;
}

const adminPages = pagesFrom([...adminNavItems, ...supportItems]);
const userPages = pagesFrom(userNavItems);

const createActions: PaletteLink[] = [
  { title: "Nuevo producto", url: "/dashboard/products/new", icon: Plus },
  { title: "Nueva categoría", url: "/dashboard/categories/new", icon: Plus },
  { title: "Nuevo descuento", url: "/dashboard/discounts/new", icon: Plus },
  { title: "Nuevo cliente", url: "/dashboard/customers/new", icon: Plus },
  { title: "Nuevo usuario", url: "/dashboard/users/new", icon: Plus },
];

export function CommandPalette({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { logout } = useLogout();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function run(action: () => void) {
    setOpen(false);
    action();
  }

  const pages = isAdmin ? adminPages : userPages;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-2 hidden items-center gap-2 rounded-xl border px-3 py-2 text-left md:flex md:w-[360px]"
        style={{ background: "var(--a-card)", borderColor: "var(--a-border)" }}
      >
        <Search className="h-4 w-4 text-[color:var(--a-ink-4)]" />
        <span className="flex-1 text-sm text-[color:var(--a-ink-4)]">
          Buscar páginas y acciones...
        </span>
        <kbd className="rounded-md border bg-[color:var(--a-card-muted)] px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--a-ink-3)]">
          ⌘K
        </kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--a-card-muted)] md:hidden"
        aria-label="Abrir búsqueda"
      >
        <Search className="h-[18px] w-[18px] text-[color:var(--a-ink-2)]" />
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Buscar"
        description="Navega a cualquier página o ejecuta una acción"
      >
        <Command filter={filterItems}>
          <CommandInput placeholder="Busca una página o acción..." />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup heading="Páginas">
              {pages.map((page) => (
                <CommandItem
                  key={page.url}
                  value={`${page.title} ${page.url}`}
                  onSelect={() => run(() => router.push(page.url))}
                >
                  <page.icon />
                  {page.title}
                  <CommandShortcut>{page.url.replace("/dashboard", "") || "/"}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
            {isAdmin ? (
              <CommandGroup heading="Crear">
                {createActions.map((action) => (
                  <CommandItem
                    key={action.url}
                    value={`${action.title} ${action.url}`}
                    onSelect={() => run(() => router.push(action.url))}
                  >
                    <action.icon />
                    {action.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
            <CommandGroup heading="Cuenta">
              {isAdmin ? (
                <CommandItem
                  value="Mi perfil profile"
                  onSelect={() => run(() => router.push("/dashboard/profile"))}
                >
                  <CircleUser />
                  Mi perfil
                </CommandItem>
              ) : null}
              <CommandItem value="Ir a la tienda store" onSelect={() => run(() => router.push("/"))}>
                <Store />
                Ir a la tienda
              </CommandItem>
              <CommandItem
                value="Cambiar tema claro oscuro theme"
                onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
              >
                <SunMoon />
                Cambiar tema
              </CommandItem>
              <CommandItem value="Cerrar sesión logout" onSelect={() => run(logout)}>
                <LogOut />
                Cerrar sesión
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
