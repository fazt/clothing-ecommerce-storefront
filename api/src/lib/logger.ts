import pino from "pino";
import { env, isProd, isTest } from "../config/env";

/** Logger estructurado (JSON en producción). En test se silencia. */
export const logger = pino({
  level: isTest ? "silent" : (env.LOG_LEVEL ?? (isProd ? "info" : "debug")),
  base: { service: "atelier-api" },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      'req.headers["stripe-signature"]',
      'req.headers["x-signature"]',
      'req.headers["paypal-transmission-sig"]',
      'res.headers["set-cookie"]',
    ],
    censor: "[oculto]",
  },
});

/** Ruta sin query string: los tokens de enlaces (reset, OAuth `code`, `session_id`) no llegan a los logs. */
export function pathOnly(url: string | undefined): string {
  if (!url) return "";
  const i = url.indexOf("?");
  return i === -1 ? url : url.slice(0, i);
}
