import type { CustomerSegment, DiscountStatus, DiscountType, OrderStatus } from "@/lib/api";

export const orderStatusStyles: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Pendiente",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  },
  PROCESSING: {
    label: "En preparación",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  },
  SHIPPED: {
    label: "Enviado",
    className:
      "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
  },
  DELIVERED: {
    label: "Entregado",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  CANCELLED: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  },
};

export const customerSegmentStyles: Record<
  CustomerSegment,
  { label: string; className: string }
> = {
  new: {
    label: "Nuevo",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  },
  returning: {
    label: "Recurrente",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  vip: {
    label: "VIP",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  },
};

export const discountStatusStyles: Record<DiscountStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: "Activo",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  SCHEDULED: {
    label: "Programado",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  },
  EXPIRED: {
    label: "Expirado",
    className: "bg-muted text-muted-foreground",
  },
};

export const discountTypeLabel: Record<DiscountType, string> = {
  PERCENT: "Porcentaje",
  FIXED: "Monto fijo",
  SHIPPING: "Envío",
};
