"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import type { OrderStatus } from "@/lib/api-types";
import { ORDER_NEXT_STATUSES, orderStatusStyles } from "@/lib/status-ui";
import { cn } from "@/lib/utils";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

// Shows the new status right away and rolls back if the API rejects it.
// Remount it (via `key`) when the row's status changes from outside.
export function OrderStatusSelect({
  orderId,
  status,
  onUpdated,
}: {
  orderId: string;
  status: OrderStatus;
  onUpdated?: () => void;
}) {
  const [current, setCurrent] = useState(status);
  const [pending, setPending] = useState(false);

  async function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.currentTarget.value as OrderStatus;
    if (next === current) return;
    let trackingNumber: string | null | undefined;
    if (next === "SHIPPED") {
      // El número de seguimiento llega al cliente en el email de «pedido enviado».
      const value = window.prompt("Número de seguimiento del courier (opcional):", "");
      if (value === null) return;
      trackingNumber = value.trim() || null;
    }
    if (next === "CANCELLED" && !window.confirm("¿Cancelar la orden? Se devolverá el stock reservado.")) return;
    const previous = current;
    setCurrent(next);
    setPending(true);
    try {
      await api.orders.updateStatus(orderId, next, trackingNumber);
      onUpdated?.();
    } catch (e) {
      setCurrent(previous);
      alert(e instanceof Error ? e.message : "Error al actualizar estado");
    } finally {
      setPending(false);
    }
  }

  return (
    <select
      value={current}
      onChange={onChange}
      disabled={pending || ORDER_NEXT_STATUSES[current].length === 0}
      aria-label="Estado de la orden"
      className={cn(
        "rounded-full border-0 px-2 py-0.5 text-xs font-medium disabled:opacity-60",
        orderStatusStyles[current].className,
      )}
    >
      {[current, ...ORDER_NEXT_STATUSES[current]].map((st) => (
        <option key={st} value={st}>
          {orderStatusStyles[st].label}
        </option>
      ))}
    </select>
  );
}
