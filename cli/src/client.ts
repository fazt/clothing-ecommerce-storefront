import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { ApiError, CliError } from "./errors.js";

/** Must match AUTH_COOKIE in api/src/lib/auth-cookie.ts. */
const AUTH_COOKIE = "auth-token";

const IMAGE_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

export type Query = Record<string, string | number | boolean | undefined>;

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

interface RequestOptions {
  query?: Query;
  body?: unknown;
  form?: FormData;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  const data = text ? parseJson(text) : undefined;
  if (!res.ok) {
    const message =
      (data as { error?: unknown } | undefined)?.error ?? `${res.status} ${res.statusText}`;
    throw new ApiError(res.status, String(message), data);
  }
  return data as T;
}

/** The API only returns the JWT as an HttpOnly cookie, so read it from Set-Cookie. */
function readAuthCookie(res: Response): string | null {
  for (const cookie of res.headers.getSetCookie()) {
    const [pair] = cookie.split(";");
    const [name, ...value] = pair.split("=");
    if (name.trim() === AUTH_COOKIE) return decodeURIComponent(value.join("=").trim());
  }
  return null;
}

export class ApiClient {
  constructor(
    readonly baseUrl: string,
    private readonly token?: string,
  ) {}

  get isAuthenticated() {
    return Boolean(this.token);
  }

  private async send(method: string, url: URL, { body, form }: RequestOptions) {
    const headers: Record<string, string> = { accept: "application/json" };
    if (this.token) headers.authorization = `Bearer ${this.token}`;

    let payload: string | FormData | undefined;
    if (form) {
      payload = form;
    } else if (body !== undefined) {
      headers["content-type"] = "application/json";
      payload = JSON.stringify(body);
    }

    try {
      return await fetch(url, { method, headers, body: payload });
    } catch {
      throw new CliError(
        `No se pudo conectar con ${this.baseUrl}`,
        "¿Está corriendo la API? Revisa la URL con `ecom config show` o usa --api <url>.",
      );
    }
  }

  private url(path: string, query: Query = {}) {
    // Accept both "/products" and "/api/products".
    const clean = `/${path.replace(/^\/+/, "").replace(/^api(\/|$)/, "")}`;
    const url = new URL(`${this.baseUrl}/api${clean === "/" ? "" : clean}`);
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
    return url;
  }

  async request<T>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const res = await this.send(method, this.url(path, options.query), options);
    return parseResponse<T>(res);
  }

  get<T>(path: string, query?: Query) {
    return this.request<T>("GET", path, { query });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, { body });
  }

  patch<T>(path: string, body: unknown) {
    return this.request<T>("PATCH", path, { body });
  }

  put<T>(path: string, body: unknown) {
    return this.request<T>("PUT", path, { body });
  }

  delete<T>(path: string) {
    return this.request<T>("DELETE", path);
  }

  /** Walks every page of a paginated endpoint (pageSize is capped at 100 by the API). */
  async getAll<T>(path: string, query: Query = {}): Promise<Paginated<T>> {
    const data: T[] = [];
    let page = 1;
    let result: Paginated<T>;
    do {
      result = await this.get<Paginated<T>>(path, { ...query, page, pageSize: 100 });
      data.push(...result.data);
      page += 1;
    } while (page <= result.meta.totalPages);
    return { data, meta: { ...result.meta, page: 1, pageSize: data.length } };
  }

  /** GET / on the API origin (outside /api). */
  async health(): Promise<{ message?: string; ms: number }> {
    const started = performance.now();
    const res = await this.send("GET", new URL(`${this.baseUrl}/`), {});
    const data = await parseResponse<{ message?: string }>(res);
    return { ...data, ms: Math.round(performance.now() - started) };
  }

  /** Login or register; both answer `{ user }` and set the session cookie. */
  async authenticate(
    path: "/auth/login" | "/auth/register",
    body: Record<string, unknown>,
  ): Promise<{ user: AuthUser; token: string }> {
    const res = await this.send("POST", this.url(path), { body });
    const { user } = await parseResponse<{ user: AuthUser }>(res);
    const token = readAuthCookie(res);
    if (!token) throw new CliError("La API no devolvió el token de sesión (cookie auth-token).");
    return { user, token };
  }

  async upload<T>(filePath: string, folder: string): Promise<T> {
    const type = IMAGE_TYPES[extname(filePath).toLowerCase()];
    if (!type) {
      throw new CliError(
        `Tipo de archivo no soportado: ${basename(filePath)}`,
        `Formatos permitidos: ${Object.keys(IMAGE_TYPES).join(", ")}`,
      );
    }
    let bytes: Buffer;
    try {
      bytes = await readFile(filePath);
    } catch {
      throw new CliError(`No se pudo leer el archivo: ${filePath}`);
    }
    const form = new FormData();
    form.append("folder", folder);
    form.append("file", new Blob([new Uint8Array(bytes)], { type }), basename(filePath));
    return this.request<T>("POST", "/uploads", { form });
  }
}
