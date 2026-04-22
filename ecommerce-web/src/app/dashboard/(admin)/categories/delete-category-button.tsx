"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCategoryAction } from "./actions";

export function DeleteCategoryButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;
    startTransition(async () => {
      try {
        await deleteCategoryAction(id);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Error al eliminar");
      }
    });
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={pending}>
      <Trash2 className="h-3 w-3" />
      <span className="sr-only">Eliminar</span>
    </Button>
  );
}
