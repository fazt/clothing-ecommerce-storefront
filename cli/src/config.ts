import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { CliError } from "./errors.js";

export const DEFAULT_API_URL = "http://localhost:4000";

export interface Session {
  token: string;
  email: string;
  role: string;
}

interface ConfigFile {
  apiUrl?: string;
  // Keyed by API URL so a staging login is never sent to production.
  sessions?: Record<string, Session>;
}

const CONFIG_PATH = process.env.ECOM_CONFIG || join(homedir(), ".ecom", "config.json");

function read(): ConfigFile {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf8")) as ConfigFile;
  } catch {
    return {};
  }
}

function write(file: ConfigFile) {
  mkdirSync(dirname(CONFIG_PATH), { recursive: true });
  // The file holds bearer tokens: keep it private to the current user.
  writeFileSync(CONFIG_PATH, `${JSON.stringify(file, null, 2)}\n`, { mode: 0o600 });
}

/** Accepts the API origin with or without the `/api` prefix. */
export function normalizeApiUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "").replace(/\/api$/, "");
  try {
    new URL(trimmed);
  } catch {
    throw new CliError(`URL de API inválida: ${url}`, "Ejemplo: http://localhost:4000");
  }
  return trimmed;
}

export const config = {
  path: CONFIG_PATH,

  /** `--api` flag > ECOM_API_URL > saved URL > default. */
  apiUrl(override?: string): string {
    return normalizeApiUrl(
      override || process.env.ECOM_API_URL || read().apiUrl || DEFAULT_API_URL,
    );
  },

  savedApiUrl(): string | undefined {
    return read().apiUrl;
  },

  setApiUrl(url: string): string {
    const file = read();
    file.apiUrl = normalizeApiUrl(url);
    write(file);
    return file.apiUrl;
  },

  session(apiUrl: string): Session | undefined {
    return read().sessions?.[apiUrl];
  },

  sessions(): Record<string, Session> {
    return read().sessions ?? {};
  },

  saveSession(apiUrl: string, session: Session) {
    const file = read();
    file.sessions = { ...file.sessions, [apiUrl]: session };
    write(file);
  },

  clearSession(apiUrl: string): boolean {
    const file = read();
    if (!file.sessions?.[apiUrl]) return false;
    delete file.sessions[apiUrl];
    write(file);
    return true;
  },
};
