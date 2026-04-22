"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteDiscountAction } from "./actions";

export function DeleteDiscountButton({
  id,
  code,
}: {
  id: string;
  code: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm(`¿Eliminar el descuento ${code}?`)) return;
    startTransition(async () => {
      try {
        await deleteDiscountAction(id);
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
      aria-label="Eliminar descuento"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
