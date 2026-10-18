import { Resend } from "resend";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export type SendResult =
  | { ok: true; id: string | null }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; error: string };

let cachedClient: Resend | null = null;

/** Sin RESEND_API_KEY los emails no se envían: se registran en el log (modo demo). */
export function isConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY);
}

function getClient(): Resend {
  cachedClient ??= new Resend(env.RESEND_API_KEY);
  return cachedClient;
}

export async function send(payload: EmailPayload): Promise<SendResult> {
  if (!isConfigured()) {
    // Solo el asunto: el cuerpo puede llevar enlaces con tokens (restablecer contraseña).
    logger.info({ to: payload.to, subject: payload.subject }, "email omitido (Resend sin configurar)");
    return { ok: false, skipped: true, reason: "RESEND_NOT_CONFIGURED" };
  }
  try {
    const result = await getClient().emails.send({
      from: env.RESEND_FROM,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    if (result.error) {
      return { ok: false, error: result.error.message };
    }
    logger.info({ to: payload.to, subject: payload.subject, id: result.data?.id }, "email enviado");
    return { ok: true, id: result.data?.id ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: message };
  }
}
