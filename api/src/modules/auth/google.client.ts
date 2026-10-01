import { CodeChallengeMethod, OAuth2Client } from "google-auth-library";

const SCOPES = ["openid", "email", "profile"];
const ISSUERS = ["accounts.google.com", "https://accounts.google.com"];

export type GoogleErrorCode =
  | "GOOGLE_NOT_CONFIGURED"
  | "GOOGLE_INVALID_TOKEN"
  | "GOOGLE_EMAIL_UNVERIFIED";

export class GoogleAuthError extends Error {
  readonly code: GoogleErrorCode;
  constructor(code: GoogleErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export interface GoogleProfile {
  googleId: string;
  /** Verified by Google, lowercased. */
  email: string;
  name: string | null;
  picture: string | null;
}

function readConfig() {
  return {
    clientId: (process.env.GOOGLE_CLIENT_ID ?? "").trim(),
    clientSecret: (process.env.GOOGLE_CLIENT_SECRET ?? "").trim(),
    callbackUrl: (process.env.GOOGLE_CALLBACK_URL ?? "").trim(),
  };
}

/** True when real credentials are set (placeholders from .env.example don't count). */
export function isGoogleConfigured(): boolean {
  const { clientId, clientSecret, callbackUrl } = readConfig();
  return (
    Boolean(clientId && clientSecret && callbackUrl) &&
    !clientId.includes("placeholder") &&
    !clientSecret.includes("placeholder")
  );
}

let cachedClient: OAuth2Client | null = null;

// One client per process: it caches Google's signing certificates between sign-ins.
function getClient(): OAuth2Client {
  if (!isGoogleConfigured()) {
    throw new GoogleAuthError("GOOGLE_NOT_CONFIGURED", "Google OAuth credentials are not configured");
  }
  if (!cachedClient) {
    const { clientId, clientSecret, callbackUrl } = readConfig();
    cachedClient = new OAuth2Client({ clientId, clientSecret, redirectUri: callbackUrl });
  }
  return cachedClient;
}

/** Consent screen URL, plus the PKCE verifier the callback needs to redeem the code. */
export async function createGoogleAuthRequest(input: { state: string; nonce: string }) {
  const client = getClient();
  const { codeVerifier, codeChallenge } = await client.generateCodeVerifierAsync();
  if (!codeChallenge) throw new Error("Could not derive the PKCE code challenge");
  const url = client.generateAuthUrl({
    scope: SCOPES,
    state: input.state,
    nonce: input.nonce,
    prompt: "select_account",
    code_challenge_method: CodeChallengeMethod.S256,
    code_challenge: codeChallenge,
  });
  return { url, codeVerifier };
}

/**
 * Redeems the authorization code and verifies the ID token: signature against
 * Google's certificates, audience, issuer, expiry and our nonce.
 */
export async function verifyGoogleCode(input: {
  code: string;
  codeVerifier: string;
  nonce: string;
}): Promise<GoogleProfile> {
  const client = getClient();
  const { tokens } = await client.getToken({ code: input.code, codeVerifier: input.codeVerifier });
  if (!tokens.id_token) {
    throw new GoogleAuthError("GOOGLE_INVALID_TOKEN", "Google did not return an ID token");
  }
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: readConfig().clientId,
  });
  const payload = ticket.getPayload();
  if (
    !payload?.sub ||
    !payload.email ||
    !ISSUERS.includes(payload.iss) ||
    payload.nonce !== input.nonce
  ) {
    throw new GoogleAuthError("GOOGLE_INVALID_TOKEN", "Invalid Google ID token");
  }
  if (payload.email_verified !== true) {
    throw new GoogleAuthError("GOOGLE_EMAIL_UNVERIFIED", "Google email is not verified");
  }
  return {
    googleId: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: payload.name?.trim().slice(0, 100) || null,
    picture: payload.picture || null,
  };
}
