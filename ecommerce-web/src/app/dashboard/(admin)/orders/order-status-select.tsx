"use client";

import { useTransition } from "react";
import type { OrderStatus } from "@/lib/api";
import { updateOrderStatusAction } from "./actions";
import { orderStatusStyles } from "@/lib/status-ui";
import { cn } from "@/lib/utils";

const STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const [pending, startTransition] = useTransition();
  const s = orderStatusStyles[status];

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value as OrderStatus;
    if (next === status) return;
    startTransition(async () => {
      try {
        await updateOrderStatusAction(orderId, next);
      } catch (e) {
        alert(e instanceof Error ? e.message : "Error al actualizar estado");
      }
    });
  }

  return (
    <select
      value={status}
      onChange={onChange}
      disabled={pending}
      className={cn(
        "rounded-full border-0 px-2 py-0.5 text-xs font-medium",
        s.className,
      )}
    >
      {STATUSES.map((st) => (
        <option key={st} value={st}>
          {orderStatusStyles[st].label}
        </option>
      ))}
    </select>
  );
}
