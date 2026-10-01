import { Command } from "commander";
import { config, DEFAULT_API_URL } from "../config.js";
import { apiUrlFor, clientFor } from "../context.js";
import { CliError } from "../errors.js";
import { c, emit, keyValues, section, success, table } from "../output.js";
import { collect, oneOf, parseData } from "../parsers.js";

export function healthCommand(): Command {
  return new Command("health")
    .description("Comprueba que la API responde")
    .action(async (_opts, command: Command) => {
      const api = clientFor(command);
      const { message, ms } = await api.health();
      const session = config.session(api.baseUrl);
      emit({ ok: true, apiUrl: api.baseUrl, message, ms, session: session ? { email: session.email, role: session.role } : null }, () => {
        success(`${message ?? "API en línea"} · ${api.baseUrl} · ${ms} ms`);
        console.log(c.dim(session ? `Sesión: ${session.email} (${session.role})` : "Sin sesión: usa `ecom login`."));
      });
    });
}

export function configCommand(): Command {
  const cmd = new Command("config").description("Configuración del CLI (URL de la API y sesiones)");

  cmd
    .command("show", { isDefault: true })
    .description("Muestra la API en uso y las sesiones guardadas")
    .action((_opts, command: Command) => {
      const flag = command.optsWithGlobals().api as string | undefined;
      const source = flag
        ? "--api"
        : process.env.ECOM_API_URL
          ? "ECOM_API_URL"
          : config.savedApiUrl()
            ? "config"
            : "por defecto";
      const apiUrl = apiUrlFor(command);
      const sessions = Object.entries(config.sessions()).map(([url, s]) => ({ url, email: s.email, role: s.role }));
      emit({ apiUrl, source, path: config.path, sessions }, () => {
        keyValues({ api: `${apiUrl} ${c.dim(`(${source})`)}`, archivo: config.path });
        section("Sesiones");
        table(sessions, [
          { header: "API", value: (s) => s.url, style: (cell, s) => (s.url === apiUrl ? c.green(cell) : cell) },
          { header: "EMAIL", value: (s) => s.email },
          { header: "ROL", value: (s) => s.role },
        ]);
      });
    });

  cmd
    .command("set-url <url>")
    .description(`Guarda la URL de la API (por defecto ${DEFAULT_API_URL}); cada URL conserva su propia sesión`)
    .action((url: string) => {
      const saved = config.setApiUrl(url);
      const session = config.session(saved);
      emit({ apiUrl: saved }, () => {
        success(`API: ${saved}`);
        console.log(c.dim(session ? `Sesión: ${session.email} (${session.role})` : "Sin sesión: usa `ecom login`."));
      });
    });

  return cmd;
}

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

function toQueryPair(value: string): [string, string] {
  const index = value.indexOf("=");
  if (index < 1) throw new CliError(`Parámetro inválido: ${value}`, "Formato: --query clave=valor");
  return [value.slice(0, index), value.slice(index + 1)];
}

export function requestCommand(): Command {
  return new Command("request")
    .description("Petición cruda a la API con la sesión actual; imprime el JSON de respuesta")
    .argument("<method>", METHODS.join(" | "), oneOf(METHODS))
    .argument("<path>", "ruta bajo /api, ej. /products?search=camisa")
    .option("-d, --data <json>", "cuerpo JSON o @archivo.json")
    .option("-q, --query <clave=valor>", "parámetro de query (repetible)", collect(toQueryPair))
    .action(async (method: string, path: string, opts: { data?: string; query?: [string, string][] }, command: Command) => {
      const [pathname, search = ""] = path.split("?");
      const query = Object.fromEntries([...new URLSearchParams(search), ...(opts.query ?? [])]);
      const body = opts.data ? parseData(opts.data) : undefined;
      const result = await clientFor(command).request(method, pathname, { query, body });
      console.log(result === undefined ? "" : JSON.stringify(result, null, 2));
    });
}
