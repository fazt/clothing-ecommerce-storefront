export const metrics = [
  {
    label: "Ingresos",
    value: "$48,329.50",
    change: 12.5,
    hint: "vs. mes anterior",
  },
  {
    label: "Órdenes",
    value: "1,284",
    change: 8.2,
    hint: "vs. mes anterior",
  },
  {
    label: "Clientes nuevos",
    value: "342",
    change: -3.4,
    hint: "vs. mes anterior",
  },
  {
    label: "Tasa de conversión",
    value: "3.42%",
    change: 0.8,
    hint: "vs. mes anterior",
  },
];

export const salesSeries = [
  32, 45, 38, 52, 48, 61, 58, 72, 65, 78, 82, 75, 89, 92, 85, 98, 102, 94, 110,
  108, 115, 122, 118, 125, 132, 128, 142, 138, 145, 156,
];

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  customer: { name: string; email: string };
  date: string;
  total: number;
  items: number;
  status: OrderStatus;
  paymentMethod: string;
}

export const orders: Order[] = [
  {
    id: "#AT-10482",
    customer: { name: "María González", email: "maria.g@email.com" },
    date: "2026-04-20",
    total: 248.99,
    items: 3,
    status: "processing",
    paymentMethod: "Visa ···4242",
  },
  {
    id: "#AT-10481",
    customer: { name: "Carlos Ruiz", email: "c.ruiz@email.com" },
    date: "2026-04-20",
    total: 119.0,
    items: 1,
    status: "shipped",
    paymentMethod: "Mastercard ···8821",
  },
  {
    id: "#AT-10480",
    customer: { name: "Laura Fernández", email: "laura.f@email.com" },
    date: "2026-04-19",
    total: 89.5,
    items: 1,
    status: "delivered",
    paymentMethod: "PayPal",
  },
  {
    id: "#AT-10479",
    customer: { name: "Diego Martínez", email: "diego.m@email.com" },
    date: "2026-04-19",
    total: 378.0,
    items: 4,
    status: "pending",
    paymentMethod: "Visa ···1029",
  },
  {
    id: "#AT-10478",
    customer: { name: "Ana Torres", email: "ana.torres@email.com" },
    date: "2026-04-18",
    total: 59.0,
    items: 1,
    status: "delivered",
    paymentMethod: "Mastercard ···3910",
  },
  {
    id: "#AT-10477",
    customer: { name: "Pedro Sánchez", email: "p.sanchez@email.com" },
    date: "2026-04-18",
    total: 149.0,
    items: 1,
    status: "cancelled",
    paymentMethod: "Visa ···7654",
  },
  {
    id: "#AT-10476",
    customer: { name: "Isabel Moreno", email: "isa.m@email.com" },
    date: "2026-04-17",
    total: 99.0,
    items: 1,
    status: "shipped",
    paymentMethod: "PayPal",
  },
  {
    id: "#AT-10475",
    customer: { name: "Javier López", email: "javier.l@email.com" },
    date: "2026-04-17",
    total: 218.5,
    items: 2,
    status: "delivered",
    paymentMethod: "Visa ···2233",
  },
];

export interface Customer {
  id: string;
  name: string;
  email: string;
  orders: number;
  spent: number;
  lastOrder: string;
  segment: "new" | "returning" | "vip";
}

export const customers: Customer[] = [
  {
    id: "c-001",
    name: "María González",
    email: "maria.g@email.com",
    orders: 12,
    spent: 2489.5,
    lastOrder: "2026-04-20",
    segment: "vip",
  },
  {
    id: "c-002",
    name: "Carlos Ruiz",
    email: "c.ruiz@email.com",
    orders: 6,
    spent: 918.0,
    lastOrder: "2026-04-20",
    segment: "returning",
  },
  {
    id: "c-003",
    name: "Laura Fernández",
    email: "laura.f@email.com",
    orders: 1,
    spent: 89.5,
    lastOrder: "2026-04-19",
    segment: "new",
  },
  {
    id: "c-004",
    name: "Diego Martínez",
    email: "diego.m@email.com",
    orders: 8,
    spent: 1472.3,
    lastOrder: "2026-04-19",
    segment: "returning",
  },
  {
    id: "c-005",
    name: "Ana Torres",
    email: "ana.torres@email.com",
    orders: 3,
    spent: 312.0,
    lastOrder: "2026-04-18",
    segment: "returning",
  },
  {
    id: "c-006",
    name: "Pedro Sánchez",
    email: "p.sanchez@email.com",
    orders: 1,
    spent: 149.0,
    lastOrder: "2026-04-18",
    segment: "new",
  },
  {
    id: "c-007",
    name: "Isabel Moreno",
    email: "isa.m@email.com",
    orders: 14,
    spent: 3210.0,
    lastOrder: "2026-04-17",
    segment: "vip",
  },
];

export const topProducts = [
  { name: "Oversized Cotton Tee", sold: 482, revenue: 14459.18 },
  { name: "Sneakers Blancos Minimal", sold: 318, revenue: 31482.0 },
  { name: "Chinos Slim Fit", sold: 276, revenue: 16284.0 },
  { name: "Chaqueta Denim Clásica", sold: 194, revenue: 23086.0 },
  { name: "Vestido de Lino Verano", sold: 152, revenue: 12008.0 },
];

export const statusStyles: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pendiente",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
  },
  processing: {
    label: "En preparación",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300",
  },
  shipped: {
    label: "Enviado",
    className:
      "bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-300",
  },
  delivered: {
    label: "Entregado",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300",
  },
};

export const segmentStyles = {
  new: { label: "Nuevo", className: "bg-blue-100 text-blue-800" },
  returning: { label: "Recurrente", className: "bg-emerald-100 text-emerald-800" },
  vip: { label: "VIP", className: "bg-amber-100 text-amber-800" },
};
