import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

export function DashboardTopbar() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar pedidos, productos, clientes..."
          className="pl-9"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
          <span className="sr-only">Notificaciones</span>
        </Button>
        <div className="ml-2 flex items-center gap-3 border-l pl-4">
          <div className="hidden flex-col items-end leading-tight sm:flex">
            <span className="text-sm font-medium">Fazt</span>
            <span className="text-xs text-muted-foreground">Administrador</span>
          </div>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-foreground text-background">
              FZ
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
