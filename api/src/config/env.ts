import { config } from "dotenv";
import { z } from "zod";

config({ quiet: true });

/** Cadena vacía o ausente → undefined. Los placeholders del .env.example también cuentan como vacíos. */
const optional = z
  .string()
  .optional()
  .transform((v) => {
    const value = v?.trim();
    if (!value || value.includes("placeholder")) return undefined;
    return value;
  });

const bool = z
  .enum(["true", "false", "1", "0", ""])
  .optional()
  .transform((v) => (v === undefined || v === "" ? undefined : v === "true" || v === "1"));

const csv = z
  .string()
  .optional()
  .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(4057),
  /** URL pública de la API (webhooks y retorno de PayPal). En producción, el mismo origen que la web. */
  API_URL: z.url().default("http://127.0.0.1:4057"),
  /** Origen público de la web (enlaces de emails, retorno de pasarelas y OAuth). */
  WEB_URL: z.url().default("http://127.0.0.1:5226"),
  /** Orígenes extra que pueden llamar a la API con credenciales (la WEB_URL siempre está permitida). */
  CORS_ORIGINS: csv,
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  /** Detrás de nginx: 1 salto de proxy para leer la IP real (rate limit). */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  JWT_SECRET: z.string().min(32, "JWT_SECRET debe tener al menos 32 caracteres"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  COOKIE_DOMAIN: optional,
  /** Cookie `Secure`: por defecto solo en producción. */
  COOKIE_SECURE: bool,

  APP_NAME: z.string().default("Atelier"),
  CURRENCY: z
    .string()
    .length(3)
    .transform((v) => v.toUpperCase())
    .default("USD"),
  /** Minutos que una orden pendiente retiene stock y cupón antes de vencer. */
  ORDER_RESERVATION_MINUTES: z.coerce.number().int().min(5).max(24 * 60).default(30),
  JOBS_ENABLED: bool,
  JOBS_INTERVAL_MS: z.coerce.number().int().min(1000).default(60_000),

  GOOGLE_CLIENT_ID: optional,
  GOOGLE_CLIENT_SECRET: optional,
  GOOGLE_CALLBACK_URL: optional,
  GITHUB_CLIENT_ID: optional,
  GITHUB_CLIENT_SECRET: optional,
  GITHUB_CALLBACK_URL: optional,

  /** Pasarela simulada: por defecto encendida en desarrollo/tests y APAGADA en producción. */
  PAYMENTS_SIMULATED_ENABLED: bool,
  STRIPE_SECRET_KEY: optional,
  STRIPE_WEBHOOK_SECRET: optional,
  PAYPAL_CLIENT_ID: optional,
  PAYPAL_CLIENT_SECRET: optional,
  PAYPAL_WEBHOOK_ID: optional,
  PAYPAL_ENV: z.enum(["sandbox", "live"]).default("sandbox"),
  MP_ACCESS_TOKEN: optional,
  MP_WEBHOOK_SECRET: optional,

  RESEND_API_KEY: optional,
  RESEND_FROM: z.string().default("Atelier <onboarding@resend.dev>"),

  /** `local` guarda en ./uploads y la API las sirve en /uploads; `spaces` usa DigitalOcean Spaces (S3). */
  STORAGE_DRIVER: z.enum(["local", "spaces"]).default("local"),
  DO_SPACES_ENDPOINT: optional,
  DO_SPACES_REGION: z.string().default("nyc3"),
  DO_SPACES_BUCKET: optional,
  DO_SPACES_KEY: optional,
  DO_SPACES_SECRET: optional,
  DO_SPACES_CDN_ENDPOINT: optional,

  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("Variables de entorno inválidas:\n" + z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

/** Orígenes permitidos por CORS: la web y los extra configurados. */
export const allowedOrigins = [...new Set([new URL(env.WEB_URL).origin, ...env.CORS_ORIGINS])];
