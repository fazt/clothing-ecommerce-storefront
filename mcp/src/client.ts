import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export type Query = Record<string, string | number | boolean | undefined>;

const DEFAULT_API_URL = "http://localhost:4000";
const TIMEOUT_MS = 15_000;

interface CliConfig {
  apiUrl?: string;
  sessions?: Record<string, { token: string }>;
}

/** The CLI's config file (`ecom login`), read on every call so a new login is picked up. */
function readCliConfig(): CliConfig {
  const path = process.env.ECOM_CONFIG || join(homedir(), ".ecom", "config.json");
  try {
    return JSON.parse(readFileSync(path, "utf8")) as CliConfig;
  } catch {
    return {};
  }
}

/** Same normalization as the CLI, so its sessions (keyed by URL) match. */
const normalize = (url: string) => url.trim().replace(/\/+$/, "").replace(/\/api$/, "");

/** `ECOM_API_URL` > URL saved by the CLI > localhost. */
export const apiUrl = normalize(
  process.env.ECOM_API_URL || readCliConfig().apiUrl || DEFAULT_API_URL,
);

function token(): string | undefined {
  return process.env.ECOM_TOKEN || readCliConfig().sessions?.[apiUrl]?.token;
}

function hint(status: number): string {
  if (status === 401) return ` Inicia sesión con \`ecom login --api ${apiUrl}\` o define ECOM_TOKEN.`;
  if (status === 403) return " Esta operación requiere un usuario ADMIN.";
  return "";
}

export async function request<T>(
  method: string,
  path: string,
  { query = {}, body }: { query?: Query; body?: unknown } = {},
): Promise<T> {
  const url = new URL(`${apiUrl}/api${path}`);
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = { accept: "application/json" };
  const bearer = token();
  if (bearer) headers.authorization = `Bearer ${bearer}`;
  if (body !== undefined) headers["content-type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new Error(`No se pudo conectar con ${apiUrl}. ¿Está corriendo la API?`);
  }

  const text = await res.text();
  if (!res.ok) throw new Error(`API ${res.status}: ${text || res.statusText}.${hint(res.status)}`);
  return (text ? JSON.parse(text) : undefined) as T;
}
