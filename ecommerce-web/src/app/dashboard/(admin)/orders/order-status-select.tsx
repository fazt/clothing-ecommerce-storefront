"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import type { OrderStatus } from "@/lib/api-types";
import { orderStatusStyles } from "@/lib/status-ui";
import { cn } from "@/lib/utils";

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
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
    const previous = current;
    setCurrent(next);
    setPending(true);
    try {
      await api.orders.updateStatus(orderId, next);
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
      disabled={pending}
      aria-label="Estado de la orden"
      className={cn(
        "rounded-full border-0 px-2 py-0.5 text-xs font-medium disabled:opacity-60",
        orderStatusStyles[current].className,
      )}
    >
      {ORDER_STATUSES.map((st) => (
        <option key={st} value={st}>
          {orderStatusStyles[st].label}
        </option>
      ))}
    </select>
  );
}
