"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteUserAction } from "./actions";

export function DeleteUserButton({
  id,
  email,
}: {
  id: string;
  email: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm(`¿Eliminar el usuario "${email}"?`)) return;
    startTransition(async () => {
      try {
        await deleteUserAction(id);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Error al eliminar");
      }
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      disabled={pending}
      title="Eliminar usuario"
    >
      <Trash2 className="h-3 w-3" />
      <span className="sr-only">Eliminar</span>
    </Button>
  );
}
