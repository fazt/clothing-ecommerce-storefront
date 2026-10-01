import { readFileSync } from "node:fs";
import { InvalidArgumentError } from "commander";
import { CliError } from "./errors.js";

export function toNumber(value: string): number {
  const n = Number(value);
  if (value.trim() === "" || !Number.isFinite(n)) throw new InvalidArgumentError("Debe ser un número.");
  return n;
}

export function toInt(value: string): number {
  const n = toNumber(value);
  if (!Number.isInteger(n)) throw new InvalidArgumentError("Debe ser un número entero.");
  return n;
}

export function toList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

/** Case-insensitive enum parser; returns the canonical spelling. */
export function oneOf(values: readonly string[]) {
  return (value: string) => {
    const match = values.find((v) => v.toLowerCase() === value.trim().toLowerCase());
    if (!match) throw new InvalidArgumentError(`Valores permitidos: ${values.join(", ")}.`);
    return match;
  };
}

export function collect<T>(parse: (value: string) => T) {
  return (value: string, previous: T[] = []) => [...previous, parse(value)];
}

/** `--data` accepts inline JSON or `@path/to/file.json`. */
export function parseData(value: string | undefined): Record<string, unknown> {
  if (!value) return {};
  let text = value;
  if (value.startsWith("@")) {
    try {
      text = readFileSync(value.slice(1), "utf8");
    } catch {
      throw new CliError(`No se pudo leer ${value.slice(1)}`);
    }
  }
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new CliError("--data no es JSON válido", `Ejemplo: --data '{"name":"Camiseta"}'`);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new CliError("--data debe ser un objeto JSON");
  }
  return data as Record<string, unknown>;
}

export interface CartItem {
  productId: string;
  quantity: number;
  variantId?: string;
}

/** `<productId>[:quantity[:variantId]]` */
export function toCartItem(value: string): CartItem {
  const [productId, quantity = "1", variantId] = value.split(":").map((v) => v.trim());
  const qty = Number(quantity);
  if (!productId || !Number.isInteger(qty) || qty < 1) {
    throw new InvalidArgumentError("Formato: <productId>[:cantidad[:variantId]]");
  }
  return variantId ? { productId, quantity: qty, variantId } : { productId, quantity: qty };
}
