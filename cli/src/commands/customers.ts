import { date, keyValues, money, section, statusStyle, table } from "../output.js";
import { oneOf } from "../parsers.js";
import { resourceCommand } from "./resource.js";

interface CustomerOrder extends Record<string, unknown> {
  id: string;
  status: string;
  total: string;
  createdAt: string;
  items: { quantity: number }[];
}

interface Customer extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  ordersCount: number;
  totalSpent: number;
  segment: string;
  orders?: CustomerOrder[];
}

export const customersCommand = () =>
  resourceCommand<Customer>({
    command: "customers",
    path: "/customers",
    noun: "cliente",
    plural: "clientes",
    description: "Clientes de la tienda (requiere ADMIN)",
    label: (cu) => `"${cu.name}" <${cu.email}>`,
    columns: [
      { header: "ID", value: (cu) => cu.id },
      { header: "NOMBRE", value: (cu) => cu.name, max: 28 },
      { header: "EMAIL", value: (cu) => cu.email, max: 32 },
      { header: "PEDIDOS", value: (cu) => cu.ordersCount, align: "right" },
      { header: "GASTADO", value: (cu) => money(cu.totalSpent), align: "right" },
      { header: "SEGMENTO", value: (cu) => cu.segment, style: statusStyle },
    ],
    filters: [
      {
        flags: "--segment <segment>",
        param: "segment",
        description: "new | returning | vip",
        parse: oneOf(["new", "returning", "vip"]),
      },
    ],
    fields: [
      { flags: "--name <name>", key: "name", description: "nombre" },
      { flags: "--email <email>", key: "email", description: "email" },
    ],
    detail: (cu) => {
      keyValues(cu);
      if (!cu.orders?.length) return;
      section(`Pedidos (${cu.orders.length})`);
      table(cu.orders, [
        { header: "ID", value: (o) => o.id },
        { header: "ESTADO", value: (o) => o.status, style: statusStyle },
        { header: "TOTAL", value: (o) => money(o.total), align: "right" },
        { header: "UDS", value: (o) => o.items.reduce((n, i) => n + i.quantity, 0), align: "right" },
        { header: "FECHA", value: (o) => date(o.createdAt) },
      ]);
    },
  });
