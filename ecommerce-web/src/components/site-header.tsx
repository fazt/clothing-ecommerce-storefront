import Link from "next/link";
import {
  ChevronDown,
  Hexagon,
  LogOut,
  Menu,
  Search,
  User,
  Heart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { CartSheet } from "@/components/cart-sheet";
import { logoutAction } from "@/app/(auth)/actions";
import type { ApiUser } from "@/lib/api";

const navLinks = [
  { href: "/products", label: "Mujer" },
  { href: "/products", label: "Hombre" },
  { href: "/products", label: "Accesorios" },
  { href: "/products", label: "Calzado" },
  { href: "/products", label: "Ofertas" },
];

export function SiteHeader({ user }: { user: ApiUser | null }) {
  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
              />
            }
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-6">
            <SheetHeader className="px-0">
              <SheetTitle className="text-xl font-bold tracking-tight">
                martup
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1d3a55] text-white dark:bg-white dark:text-[#1d3a55]">
            <Hexagon className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-xl font-extrabold tracking-tight text-[#1d3a55] dark:text-white">
              martup
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Ecommerce Website
            </span>
          </span>
        </Link>

        <div className="mx-auto hidden w-full max-w-xl items-center rounded-full border border-border/60 bg-background px-1 py-1 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.12)] md:flex">
          <Sheet>
            <SheetTrigger
              render={
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                />
              }
            >
              <Menu className="h-4 w-4" />
              <span>Menu</span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-6">
              <SheetHeader className="px-0">
                <SheetTitle className="text-xl font-bold tracking-tight">
                  Categorías
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <span className="mx-1 h-6 w-px bg-border" />

          <input
            type="search"
            placeholder="Search"
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground transition hover:bg-muted"
            aria-label="Buscar"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="relative md:hidden"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </Button>

          <Link
            href="/products"
            className="relative hidden sm:inline-flex"
            aria-label="Favoritos"
          >
            <Heart className="h-6 w-6 text-[#1d3a55] dark:text-white" />
            <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#1d3a55] px-1 text-[10px] font-semibold text-white dark:bg-white dark:text-[#1d3a55]">
              05
            </span>
          </Link>

          <span className="hidden h-6 w-px bg-border sm:block" />

          <CartSheet />

          <span className="hidden h-6 w-px bg-border md:block" />

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              {user.role === "ADMIN" ? (
                <Link
                  href="/dashboard"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Dashboard
                </Link>
              ) : null}
              <span className="max-w-32 truncate text-xs text-muted-foreground">
                {user.name?.trim() || user.email}
              </span>
              <form action={logoutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  title="Cerrar sesión"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Cerrar sesión</span>
                </Button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex"
              aria-label="Iniciar sesión"
            >
              <Button variant="ghost" size="icon" render={<span />}>
                <User className="h-5 w-5" />
                <span className="sr-only">Iniciar sesión</span>
              </Button>
            </Link>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
