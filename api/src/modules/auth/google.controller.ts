import { Request, Response } from "express";
import { setAuthCookie } from "../../lib/auth-cookie";
import { createGoogleAuthRequest, isGoogleConfigured, verifyGoogleCode } from "./google.client";
import { googleAuthService } from "./google.service";
import {
  describeOAuthError,
  homeFor,
  randomToken,
  redirectToLoginError,
  saveOAuthState,
  stateMatches,
  takeOAuthState,
  webUrl,
} from "./oauth";
import type { GoogleCallbackQuery, GoogleStartQuery } from "./google.schema";

const PROVIDER = "google";

// Error code → reason in the `?error=google_<reason>` the web login shows.
const REASON_BY_CODE: Record<string, string> = {
  GOOGLE_NOT_CONFIGURED: "unavailable",
  GOOGLE_EMAIL_UNVERIFIED: "email_unverified",
  GOOGLE_ACCOUNT_CONFLICT: "account_conflict",
};

export const googleController = {
  /** GET /auth/google — sends the browser to Google's consent screen. */
  start: async (req: Request, res: Response) => {
    const { redirect } = req.query as GoogleStartQuery;
    if (!isGoogleConfigured()) {
      return redirectToLoginError(res, PROVIDER, "unavailable", redirect);
    }
    try {
      const state = randomToken();
      const nonce = randomToken();
      const { url, codeVerifier } = await createGoogleAuthRequest({ state, nonce });
      saveOAuthState(req, res, PROVIDER, { state, nonce, codeVerifier, redirect });
      return res.redirect(url);
    } catch (error) {
      console.error("[auth.google] could not start sign-in:", describeOAuthError(error));
      return redirectToLoginError(res, PROVIDER, "failed", redirect);
    }
  },

  /** GET /auth/google/callback — Google sends the browser back here. */
  callback: async (req: Request, res: Response) => {
    const { code, state, error } = req.query as GoogleCallbackQuery;
    const saved = takeOAuthState(req, res, PROVIDER);
    const redirect = saved?.redirect;

    if (error) {
      const reason = error === "access_denied" ? "cancelled" : "failed";
      return redirectToLoginError(res, PROVIDER, reason, redirect);
    }
    if (!saved || !code || !stateMatches(saved.state, state)) {
      return redirectToLoginError(res, PROVIDER, "state", redirect);
    }

    try {
      const profile = await verifyGoogleCode({
        code,
        codeVerifier: saved.codeVerifier,
        nonce: saved.nonce,
      });
      const { token, user } = await googleAuthService.signIn(profile);
      const destination = webUrl(redirect ?? homeFor(user.role));
      setAuthCookie(res, token);
      return res.redirect(destination);
    } catch (err) {
      const reason = REASON_BY_CODE[(err as { code?: string }).code ?? ""];
      if (!reason) console.error("[auth.google] sign-in failed:", describeOAuthError(err));
      return redirectToLoginError(res, PROVIDER, reason ?? "failed", redirect);
    }
  },
};
