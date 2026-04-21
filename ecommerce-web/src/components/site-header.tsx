import Link from "next/link";
import { Menu, Search, ShoppingBag, User, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";

const navLinks = [
  { href: "/products", label: "Mujer" },
  { href: "/products", label: "Hombre" },
  { href: "/products", label: "Accesorios" },
  { href: "/products", label: "Calzado" },
  { href: "/products", label: "Ofertas" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="ghost" size="icon" className="md:hidden" />
            }
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-6">
            <SheetHeader className="px-0">
              <SheetTitle className="text-xl font-bold tracking-tight">
                ATELIER
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

        <Link href="/" className="text-xl font-bold tracking-tight">
          ATELIER
        </Link>

        <nav className="ml-6 hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <div className="relative hidden lg:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar prendas..." className="w-64 pl-9" />
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Search className="h-5 w-5" />
            <span className="sr-only">Buscar</span>
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
            <User className="h-5 w-5" />
            <span className="sr-only">Cuenta</span>
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
            <Heart className="h-5 w-5" />
            <span className="sr-only">Favoritos</span>
          </Button>
          <ThemeToggle />

          <Sheet>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="relative" />
              }
            >
              <ShoppingBag className="h-5 w-5" />
              <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-[10px]">
                2
              </Badge>
              <span className="sr-only">Carrito</span>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-full flex-col sm:max-w-md"
            >
              <SheetHeader>
                <SheetTitle>Tu carrito (2)</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <CartItem
                  image="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&auto=format&fit=crop&q=80"
                  name="Oversized Cotton Tee"
                  variant="Negro · M"
                  price={29.99}
                />
                <CartItem
                  image="https://images.unsplash.com/photo-1591561954557-26941169b49e?w=200&auto=format&fit=crop&q=80"
                  name="Bolso Crossbody Piel"
                  variant="Marrón · Única"
                  price={149.0}
                />
              </div>
              <div className="border-t p-6">
                <div className="mb-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">$178.99</span>
                </div>
                <Button className="w-full" size="lg">
                  Ir al checkout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function CartItem({
  image,
  name,
  variant,
  price,
}: {
  image: string;
  name: string;
  variant: string;
  price: number;
}) {
  return (
    <div className="flex gap-4 border-b py-4 last:border-0">
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={name} className="h-full w-full object-cover" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{variant}</p>
          </div>
          <p className="text-sm font-medium">${price.toFixed(2)}</p>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center rounded-md border">
            <button className="px-2 py-1 text-sm">−</button>
            <span className="px-2 text-sm">1</span>
            <button className="px-2 py-1 text-sm">+</button>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  );
}
