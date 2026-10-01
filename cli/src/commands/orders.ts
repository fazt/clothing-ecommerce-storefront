import type { Command } from "commander";
import { clientFor } from "../context.js";
import { c, date, emit, keyValues, money, section, statusStyle, success, table, type Column } from "../output.js";
import { collect, oneOf, parseData, toCartItem, type CartItem } from "../parsers.js";
import { resourceCommand } from "./resource.js";

export const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

interface OrderItem extends Record<string, unknown> {
  quantity: number;
  unitPrice: string;
  sizeLabel: string | null;
  colorLabel: string | null;
  product: { id: string; name: string };
}

export interface Order extends Record<string, unknown> {
  id: string;
  status: string;
  total: string;
  paymentMethod: string;
  createdAt: string;
  customer?: { id: string; name: string; email: string };
  items: OrderItem[];
}

const units = (o: Order) => o.items.reduce((n, i) => n + i.quantity, 0);

/** Shared by `orders list` and `me orders`. */
export const orderColumns: Column<Order>[] = [
  { header: "ID", value: (o) => o.id },
  { header: "ESTADO", value: (o) => o.status, style: statusStyle },
  { header: "TOTAL", value: (o) => money(o.total), align: "right" },
  { header: "PAGO", value: (o) => o.paymentMethod },
  { header: "UDS", value: units, align: "right" },
  { header: "FECHA", value: (o) => date(o.createdAt) },
];

export function printOrder(o: Order) {
  keyValues(o);
  section(`Productos (${units(o)} uds)`);
  table(o.items, [
    { header: "PRODUCTO", value: (i) => i.product.name, max: 36 },
    { header: "TALLA", value: (i) => i.sizeLabel },
    { header: "COLOR", value: (i) => i.colorLabel },
    { header: "CANT", value: (i) => i.quantity, align: "right" },
    { header: "PRECIO", value: (i) => money(i.unitPrice), align: "right" },
    { header: "SUBTOTAL", value: (i) => money(i.quantity * Number(i.unitPrice)), align: "right" },
  ]);
}

export function ordersCommand(): Command {
  const cmd = resourceCommand<Order>({
    command: "orders",
    path: "/orders",
    noun: "pedido",
    plural: "pedidos",
    description: "Pedidos de la tienda (requiere ADMIN)",
    label: (o) => `${o.id} (${o.customer?.name ?? "—"}, ${money(o.total)})`,
    columns: [
      orderColumns[0],
      { header: "CLIENTE", value: (o) => o.customer?.name, max: 24 },
      ...orderColumns.slice(1),
    ],
    filters: [
      {
        flags: "--status <status>",
        param: "status",
        description: ORDER_STATUSES.join(" | "),
        parse: oneOf(ORDER_STATUSES),
      },
    ],
    detail: printOrder,
  });

  cmd
    .command("status <id> <status>")
    .description(`Cambia el estado de un pedido (${ORDER_STATUSES.join(" | ")})`)
    .action(async (id: string, status: string, _opts, command: Command) => {
      const value = oneOf(ORDER_STATUSES)(status);
      const order = await clientFor(command).patch<Order>(`/orders/${encodeURIComponent(id)}`, {
        status: value,
      });
      emit(order, () => success(`Pedido ${order.id} → ${statusStyle(order.status)}`));
    });

  cmd
    .command("create")
    .description("Crea un pedido manual; el precio sale del producto si no se indica")
    .option("--customer <id>", "ID del cliente")
    .option("--payment <method>", "método de pago (ej. manual, paypal, stripe)")
    .option("--item <productId[:qty[:variantId]]>", "producto del pedido (repetible)", collect(toCartItem))
    .option("--status <status>", ORDER_STATUSES.join(" | "), oneOf(ORDER_STATUSES))
    .option("-d, --data <json>", "cuerpo JSON extra o @archivo.json (las opciones tienen prioridad)")
    .action(async (opts: { customer?: string; payment?: string; item?: CartItem[]; status?: string; data?: string }, command: Command) => {
      const body = parseData(opts.data);
      if (opts.customer) body.customerId = opts.customer;
      if (opts.payment) body.paymentMethod = opts.payment;
      if (opts.item) body.items = opts.item;
      if (opts.status) body.status = opts.status;
      const order = await clientFor(command).post<Order>("/orders", body);
      emit(order, () => success(`Pedido creado: ${order.id} ${c.dim(`total ${money(order.total)}`)}`));
    });

  return cmd;
}
