import { date, money, statusStyle } from "../output.js";
import { oneOf, toInt, toNumber } from "../parsers.js";
import { resourceCommand } from "./resource.js";

const TYPES = ["PERCENT", "FIXED", "SHIPPING"] as const;
const STATUSES = ["ACTIVE", "SCHEDULED", "EXPIRED"] as const;

interface Discount extends Record<string, unknown> {
  id: string;
  code: string;
  type: (typeof TYPES)[number];
  value: string;
  usesCount: number;
  limit: number | null;
  status: string;
  expiresAt: string | null;
}

function discountValue(d: Discount) {
  if (d.type === "PERCENT") return `${Number(d.value)}%`;
  if (d.type === "SHIPPING") return "envío gratis";
  return money(d.value);
}

export const discountsCommand = () =>
  resourceCommand<Discount>({
    command: "discounts",
    path: "/discounts",
    noun: "descuento",
    plural: "descuentos",
    description: "Códigos de descuento (requiere ADMIN)",
    label: (d) => d.code,
    columns: [
      { header: "ID", value: (d) => d.id },
      { header: "CÓDIGO", value: (d) => d.code },
      { header: "TIPO", value: (d) => d.type },
      { header: "VALOR", value: discountValue, align: "right" },
      { header: "USOS", value: (d) => `${d.usesCount}/${d.limit ?? "∞"}`, align: "right" },
      { header: "ESTADO", value: (d) => d.status, style: statusStyle },
      { header: "EXPIRA", value: (d) => date(d.expiresAt) },
    ],
    filters: [
      { flags: "--type <type>", param: "type", description: TYPES.join(" | "), parse: oneOf(TYPES) },
      { flags: "--status <status>", param: "status", description: STATUSES.join(" | "), parse: oneOf(STATUSES) },
    ],
    fields: [
      { flags: "--code <code>", key: "code", description: "código (letras, números, - y _)" },
      { flags: "--description <text>", key: "description", description: "descripción" },
      { flags: "--type <type>", key: "type", description: TYPES.join(" | "), parse: oneOf(TYPES) },
      { flags: "--value <n>", key: "value", description: "porcentaje o importe", parse: toNumber },
      { flags: "--limit <n>", key: "limit", description: "usos máximos", parse: toInt },
      { flags: "--status <status>", key: "status", description: STATUSES.join(" | "), parse: oneOf(STATUSES) },
      { flags: "--expires <date>", key: "expiresAt", description: 'fecha de expiración, ej. 2026-12-31 ("" la quita)' },
    ],
  });
