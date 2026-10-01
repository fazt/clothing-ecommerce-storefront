import crypto from "crypto";
import { randomToken } from "./oauth";

// GitHub OAuth App, web application flow, over plain fetch. OAuth Apps don't
// issue an OpenID Connect ID token: after redeeming the code, the profile comes
// from the REST API (`/user` and `/user/emails`).
const AUTHORIZE_URL = "https://github.com/login/oauth/authorize";
const TOKEN_URL = "https://github.com/login/oauth/access_token";
const API_BASE = "https://api.github.com";
// `user:email` is needed to list private addresses in `/user/emails`.
const SCOPES = ["read:user", "user:email"];
const REQUEST_TIMEOUT_MS = 10_000;

export type GithubErrorCode =
  | "GITHUB_NOT_CONFIGURED"
  | "GITHUB_REQUEST_FAILED"
  | "GITHUB_EMAIL_UNVERIFIED";

export class GithubAuthError extends Error {
  readonly code: GithubErrorCode;
  constructor(code: GithubErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface GithubProfile {
  /** GitHub's numeric user id, as text. */
  githubId: string;
  login: string;
  /** Primary and verified on GitHub, lowercased. */
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

function readConfig() {
  return {
    clientId: (process.env.GITHUB_CLIENT_ID ?? "").trim(),
    clientSecret: (process.env.GITHUB_CLIENT_SECRET ?? "").trim(),
    callbackUrl: (process.env.GITHUB_CALLBACK_URL ?? "").trim(),
  };
}

/** True when real credentials are set (placeholders from .env.example don't count). */
export function isGithubConfigured(): boolean {
  const { clientId, clientSecret, callbackUrl } = readConfig();
  return (
    Boolean(clientId && clientSecret && callbackUrl) &&
    !clientId.includes("placeholder") &&
    !clientSecret.includes("placeholder")
  );
}

function getConfig() {
  if (!isGithubConfigured()) {
    throw new GithubAuthError("GITHUB_NOT_CONFIGURED", "GitHub OAuth credentials are not configured");
  }
  return readConfig();
}

/**
 * Consent screen URL, plus the PKCE verifier the callback needs to redeem the
 * code. `redirect_uri` must match one of the OAuth App's callback URLs.
 */
export function createGithubAuthRequest(input: { state: string }) {
  const { clientId, callbackUrl } = getConfig();
  const codeVerifier = randomToken();
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    scope: SCOPES.join(" "),
    state: input.state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  // GitHub documents scopes separated by %20; URLSearchParams would emit "+".
  const url = `${AUTHORIZE_URL}?${params.toString().replace(/\+/g, "%20")}`;
  return { url, codeVerifier };
}

async function requestJson(url: string, init: RequestInit): Promise<{ status: number; body: unknown }> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new GithubAuthError("GITHUB_REQUEST_FAILED", `GitHub request failed: ${reason}`);
  }
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function redeemCode(code: string, codeVerifier: string): Promise<string> {
  const { clientId, clientSecret, callbackUrl } = getConfig();
  const { status, body } = await requestJson(TOKEN_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: callbackUrl,
      code_verifier: codeVerifier,
    }),
  });
  // Token errors (bad_verification_code, redirect_uri_mismatch…) come back
  // with HTTP 200 and an `error` field instead of `access_token`.
  const data = (body ?? {}) as { access_token?: string; error?: string; error_description?: string };
  if (status !== 200 || !data.access_token) {
    throw new GithubAuthError(
      "GITHUB_REQUEST_FAILED",
      `GitHub token exchange failed (${status}): ${data.error ?? "no access_token"} ${data.error_description ?? ""}`.trim(),
    );
  }
  return data.access_token;
}

interface GithubUserResponse {
  id?: number;
  login?: string;
  name?: string | null;
  avatar_url?: string | null;
}

interface GithubEmailResponse {
  email?: string;
  primary?: boolean;
  verified?: boolean;
}

/**
 * Redeems the authorization code and reads the GitHub user. Only the primary
 * address counts, and only when GitHub has verified it.
 */
export async function verifyGithubCode(input: {
  code: string;
  codeVerifier: string;
}): Promise<GithubProfile> {
  const accessToken = await redeemCode(input.code, input.codeVerifier);
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": process.env.APP_NAME || "ecommerce-api",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const [user, emails] = await Promise.all([
    requestJson(`${API_BASE}/user`, { headers }),
    requestJson(`${API_BASE}/user/emails`, { headers }),
  ]);

  const profile = (user.body ?? {}) as GithubUserResponse;
  if (user.status !== 200 || !profile.id || !profile.login) {
    throw new GithubAuthError("GITHUB_REQUEST_FAILED", `GitHub /user failed (${user.status})`);
  }
  // If the user unticked the `user:email` scope this answers 403/404: there
  // is then no verified address to trust.
  const list = emails.status === 200 && Array.isArray(emails.body) ? (emails.body as GithubEmailResponse[]) : [];
  const primary = list.find((e) => e.primary === true && e.verified === true && typeof e.email === "string");
  if (!primary?.email) {
    throw new GithubAuthError("GITHUB_EMAIL_UNVERIFIED", "GitHub account has no primary verified email");
  }

  return {
    githubId: String(profile.id),
    login: profile.login,
    email: primary.email.trim().toLowerCase(),
    name: profile.name?.trim().slice(0, 100) || null,
    avatarUrl: profile.avatar_url || null,
  };
}
