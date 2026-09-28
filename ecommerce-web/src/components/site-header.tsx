import Link from "next/link";
import { Menu, Search, User } from "lucide-react";
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
import { LogoutButton } from "@/components/logout-button";
import type { ApiUser } from "@/lib/api";

const navLinks = [
  { href: "/products", label: "Shop" },
  { href: "/products", label: "On Sale" },
  { href: "/products", label: "New Arrivals" },
  { href: "/products", label: "Brands" },
];

export function SiteHeader({ user }: { user: ApiUser | null }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b hairline bg-[color:var(--bg)]">
      <div className="mx-auto flex h-20 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="text-[color:var(--ink)] hover:bg-transparent md:hidden"
              />
            }
          >
            <Menu className="h-5 w-5" strokeWidth={2} />
            <span className="sr-only">Abrir menú</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-80 bg-[color:var(--bg)] p-8">
            <SheetHeader className="px-0">
              <SheetTitle className="font-integral text-[24px]">
                SHOP.CO
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="py-3 border-b hairline text-[color:var(--ink)] text-[15px]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="font-integral text-[24px] md:text-[28px] shrink-0">
          SHOP.CO
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[15px] font-normal text-[color:var(--ink)] hover:opacity-70 transition-opacity"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <div
          className="ml-auto hidden flex-1 items-center gap-2.5 rounded-full px-4 py-3 md:flex md:max-w-[580px]"
          style={{ backgroundColor: "var(--bg-soft)" }}
        >
          <Search className="h-5 w-5 shrink-0 text-[color:var(--ink-faded)]" strokeWidth={2} />
          <input
            type="search"
            placeholder="Search for products..."
            className="w-full bg-transparent text-[15px] text-[color:var(--ink)] placeholder:text-[color:var(--ink-faded)] focus:outline-none"
            aria-label="Search"
          />
        </div>

        {/* Right icons */}
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <Button
            variant="ghost"
            size="icon"
            className="text-[color:var(--ink)] hover:bg-transparent md:hidden"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" strokeWidth={2} />
          </Button>
          <CartSheet />
          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <span
                className="max-w-[7rem] truncate text-[13px] text-[color:var(--ink-soft)]"
                title={user.name?.trim() || user.email}
              >
                {user.name?.trim()?.split(" ")[0] || user.email.split("@")[0]}
              </span>
              {user.role === "ADMIN" ? (
                <Link
                  href="/dashboard"
                  className="text-[12px] font-medium text-[color:var(--ink)] underline underline-offset-2"
                >
                  Dashboard
                </Link>
              ) : null}
              <LogoutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex"
              aria-label="Iniciar sesión"
            >
              <Button
                variant="ghost"
                size="icon"
                className="text-[color:var(--ink)] hover:bg-transparent"
                render={<span />}
              >
                <User className="h-5 w-5" strokeWidth={2} />
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
