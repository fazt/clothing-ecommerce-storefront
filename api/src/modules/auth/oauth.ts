// Provider-agnostic pieces of the OAuth redirect flow: the short-lived state
// cookie and the URLs that send the browser back to the web app.
import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import type { CookieOptions, Request, Response } from "express";

const STATE_TTL_SECONDS = 10 * 60;

export interface OAuthState {
  state: string;
  nonce: string;
  codeVerifier: string;
  /** Internal web path to open after signing in. */
  redirect?: string;
}

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return secret;
}

const cookieName = (provider: string) => `oauth-${provider}`;
const audience = (provider: string) => `oauth-state:${provider}`;

// Host-only cookie scoped to the provider's routes (/api/auth/<provider>), so
// only its callback receives it. SameSite=Lax lets it travel on the top-level
// redirect back from the provider.
function stateCookieOptions(req: Request): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: req.baseUrl || "/",
  };
}

export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** Stores the state signed (JWT) so it can't be forged or used after its TTL. */
export function saveOAuthState(req: Request, res: Response, provider: string, state: OAuthState) {
  const value = jwt.sign(state, jwtSecret(), {
    expiresIn: STATE_TTL_SECONDS,
    audience: audience(provider),
  });
  res.cookie(cookieName(provider), value, {
    ...stateCookieOptions(req),
    maxAge: STATE_TTL_SECONDS * 1000,
  });
}

/** Reads and clears the state cookie. Null when missing, tampered with or expired. */
export function takeOAuthState(req: Request, res: Response, provider: string): OAuthState | null {
  const value: unknown = req.cookies?.[cookieName(provider)];
  res.clearCookie(cookieName(provider), stateCookieOptions(req));
  if (typeof value !== "string" || !value) return null;
  try {
    const payload = jwt.verify(value, jwtSecret(), { audience: audience(provider) });
    return payload as OAuthState;
  } catch {
    return null;
  }
}

export function stateMatches(expected: string, received: string | undefined): boolean {
  if (!received) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Landing page after signing in without a requested page, same as the password login. */
export function homeFor(role: Role): string {
  return role === "ADMIN" ? "/dashboard" : "/";
}

// WEB_URL, else the first CORS origin (the web app is always one of them).
function webOrigin(): string {
  const configured =
    process.env.WEB_URL?.trim() ||
    process.env.CORS_ORIGINS?.split(",")[0]?.trim() ||
    "http://localhost:3000";
  return new URL(configured).origin;
}

/** Absolute URL in the web app. A path that would leave its origin falls back to "/". */
export function webUrl(path: string, query: Record<string, string | undefined> = {}): string {
  const origin = webOrigin();
  let url = new URL(path, origin);
  if (url.origin !== origin) url = new URL("/", origin);
  for (const [key, value] of Object.entries(query)) {
    if (value) url.searchParams.set(key, value);
  }
  return url.toString();
}

/** Back to the web login with `?error=<provider>_<reason>`, keeping the requested page. */
export function redirectToLoginError(
  res: Response,
  provider: string,
  reason: string,
  next?: string,
) {
  try {
    return res.redirect(webUrl("/login", { error: `${provider}_${reason}`, next }));
  } catch (error) {
    // Only reachable with a malformed WEB_URL / CORS_ORIGINS.
    console.error("[auth.oauth] cannot build the web login URL", error);
    return res.status(500).json({ error: "WEB_URL no es una URL válida" });
  }
}

/** Message plus the provider's error body, without the request (it carries secrets). */
export function describeOAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const data = (error as { response?: { data?: unknown } }).response?.data;
  return data ? `${message} ${JSON.stringify(data)}` : message;
}
