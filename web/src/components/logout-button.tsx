"use client";

import { Power } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-logout";

export function LogoutButton() {
  const { logout, pending } = useLogout();
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={logout}
      disabled={pending}
      className="text-[color:var(--ink)] hover:bg-transparent"
      title="Cerrar sesión"
    >
      <Power className="h-5 w-5" strokeWidth={2} />
      <span className="sr-only">Cerrar sesión</span>
    </Button>
  );
}
