"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProductAction } from "./actions";

export function DeleteProductButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`))
      return;
    startTransition(async () => {
      try {
        await deleteProductAction(id);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Error al eliminar");
      }
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      disabled={pending}
      aria-label="Eliminar producto"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
