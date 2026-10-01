import { styleText } from "node:util";
import type { Paginated } from "./client.js";

type Style = Parameters<typeof styleText>[0];

// styleText drops the colors when stdout is not a TTY or NO_COLOR is set.
const paint = (style: Style) => (text: string) => styleText(style, text);

export const c = {
  bold: paint("bold"),
  dim: paint("dim"),
  red: paint("red"),
  green: paint("green"),
  yellow: paint("yellow"),
  cyan: paint("cyan"),
};

let jsonMode = false;

export function setJsonMode(enabled: boolean) {
  jsonMode = enabled;
}

export function isJsonMode() {
  return jsonMode;
}

/** Prints `data` as JSON with --json; otherwise runs the human renderer. */
export function emit(data: unknown, human: () => void) {
  if (jsonMode) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }
  human();
}

export function success(message: string) {
  console.log(`${c.green("✔")} ${message}`);
}

export function money(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : "—";
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export function date(value: unknown): string {
  if (typeof value !== "string" || !ISO_DATE.test(value)) return "—";
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "sí" : "no";
  if (typeof value === "string" && ISO_DATE.test(value)) return date(value);
  if (Array.isArray(value)) return value.length ? value.map(formatValue).join(", ") : "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export interface Column<T> {
  header: string;
  value: (row: T) => unknown;
  align?: "right";
  /** Truncates longer cells with an ellipsis. */
  max?: number;
  /** Colors the already padded cell. */
  style?: (cell: string, row: T) => string;
}

function truncate(text: string, max?: number) {
  return max && text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function table<T>(rows: T[], columns: Column<T>[]) {
  if (!rows.length) {
    console.log(c.dim("Sin resultados."));
    return;
  }
  const cells = rows.map((row) =>
    columns.map((col) => truncate(formatValue(col.value(row)), col.max)),
  );
  const widths = columns.map((col, i) =>
    Math.max(col.header.length, ...cells.map((row) => row[i].length)),
  );
  const pad = (text: string, i: number) =>
    columns[i].align === "right" ? text.padStart(widths[i]) : text.padEnd(widths[i]);

  console.log(c.bold(columns.map((col, i) => pad(col.header, i)).join("  ").trimEnd()));
  console.log(c.dim(widths.map((w) => "─".repeat(w)).join("  ")));
  cells.forEach((row, r) => {
    const line = row.map((cell, i) => {
      const padded = pad(cell, i);
      const style = columns[i].style;
      return style ? style(padded, rows[r]) : padded;
    });
    console.log(line.join("  ").trimEnd());
  });
}

export function pageFooter({ meta }: Paginated<unknown>) {
  if (!meta.total) return;
  const pages = meta.totalPages > 1 ? `página ${meta.page}/${meta.totalPages} · ` : "";
  console.log(c.dim(`\n${pages}${meta.total} en total`));
}

/** Aligned `key  value` lines; nested objects are flattened one level. */
export function keyValues(record: Record<string, unknown>, omit: string[] = []) {
  const rows: [string, string][] = [];
  for (const [key, value] of Object.entries(record)) {
    if (omit.includes(key)) continue;
    if (Array.isArray(value) && value.some((v) => v && typeof v === "object")) continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [sub, v] of Object.entries(value)) rows.push([`${key}.${sub}`, formatValue(v)]);
      continue;
    }
    rows.push([key, formatValue(value)]);
  }
  const width = Math.max(...rows.map(([key]) => key.length));
  for (const [key, value] of rows) console.log(`${c.dim(key.padEnd(width))}  ${value}`);
}

export function section(title: string) {
  console.log(`\n${c.bold(title)}`);
}

const SPARKS = "▁▂▃▄▅▆▇█";

export function sparkline(values: number[]): string {
  const max = Math.max(...values);
  if (!values.length || max <= 0) return SPARKS[0].repeat(values.length);
  return values.map((v) => SPARKS[Math.round((v / max) * (SPARKS.length - 1))]).join("");
}

const STATUS_STYLES: Record<string, (text: string) => string> = {
  PENDING: c.yellow,
  PROCESSING: c.cyan,
  SHIPPED: c.cyan,
  DELIVERED: c.green,
  CANCELLED: c.red,
  ACTIVE: c.green,
  SCHEDULED: c.yellow,
  EXPIRED: c.dim,
  ADMIN: c.cyan,
  vip: c.green,
};

/** Column style that colors well-known status values. */
export function statusStyle(cell: string) {
  const style = STATUS_STYLES[cell.trim()];
  return style ? style(cell) : cell;
}
