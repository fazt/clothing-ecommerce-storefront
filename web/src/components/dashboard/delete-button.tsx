"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  label,
  confirmMessage,
  onDelete,
  onDeleted,
}: {
  label: string;
  confirmMessage: string;
  onDelete: () => Promise<void>;
  onDeleted?: () => void;
}) {
  const [pending, setPending] = useState(false);

  async function onClick() {
    if (!confirm(confirmMessage)) return;
    setPending(true);
    try {
      await onDelete();
      onDeleted?.();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={pending} title={label}>
      <Trash2 className="h-3 w-3" />
      <span className="sr-only">{label}</span>
    </Button>
  );
}
