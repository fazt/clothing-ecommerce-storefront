import { Resend } from "resend";

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

function getApiKey(): string {
  return (process.env.RESEND_API_KEY ?? "").trim();
}

function getFrom(): string {
  return (process.env.RESEND_FROM ?? "onboarding@resend.dev").trim();
}

export function isConfigured(): boolean {
  const key = getApiKey();
  return key.length > 0 && !key.includes("placeholder");
}

function getClient(): Resend {
  if (!cachedClient) {
    cachedClient = new Resend(getApiKey());
  }
  return cachedClient;
}

export async function send(payload: EmailPayload): Promise<SendResult> {
  if (!isConfigured()) {
    console.log(
      `[email skipped (Resend not configured)] to=${payload.to} subject="${payload.subject}"`,
    );
    return { ok: false, skipped: true, reason: "RESEND_NOT_CONFIGURED" };
  }
  try {
    const client = getClient();
    const result = await client.emails.send({
      from: getFrom(),
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    if (result.error) {
      console.error("[email error]", result.error);
      return { ok: false, error: result.error.message };
    }
    console.log(
      `[email sent] to=${payload.to} subject="${payload.subject}" id=${result.data?.id}`,
    );
    return { ok: true, id: result.data?.id ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[email send exception]", message);
    return { ok: false, error: message };
  }
}
