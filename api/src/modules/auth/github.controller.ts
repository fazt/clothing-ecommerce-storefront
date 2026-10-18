import { Request, Response } from "express";
import { setAuthCookie } from "../../lib/auth-cookie";
import { createGithubAuthRequest, isGithubConfigured, verifyGithubCode } from "./github.client";
import { githubAuthService } from "./github.service";
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
import type { GithubCallbackQuery, GithubStartQuery } from "./github.schema";

const PROVIDER = "github";

// Error code → reason in the `?error=github_<reason>` the web login shows.
const REASON_BY_CODE: Record<string, string> = {
  GITHUB_NOT_CONFIGURED: "unavailable",
  GITHUB_EMAIL_UNVERIFIED: "email_unverified",
  GITHUB_ACCOUNT_CONFLICT: "account_conflict",
};

export const githubController = {
  /** GET /auth/github — sends the browser to GitHub's consent screen. */
  start: (req: Request, res: Response) => {
    const { redirect } = req.query as GithubStartQuery;
    if (!isGithubConfigured()) {
      return redirectToLoginError(res, PROVIDER, "unavailable", redirect);
    }
    try {
      const state = randomToken();
      const { url, codeVerifier } = createGithubAuthRequest({ state });
      // GitHub OAuth Apps have no ID token, so there is no nonce to check.
      saveOAuthState(req, res, PROVIDER, { state, nonce: "", codeVerifier, redirect });
      return res.redirect(url);
    } catch (error) {
      console.error("[auth.github] could not start sign-in:", describeOAuthError(error));
      return redirectToLoginError(res, PROVIDER, "failed", redirect);
    }
  },

  /** GET /auth/github/callback — GitHub sends the browser back here. */
  callback: async (req: Request, res: Response) => {
    const { code, state, error } = req.query as GithubCallbackQuery;
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
      const profile = await verifyGithubCode({ code, codeVerifier: saved.codeVerifier });
      const { token, user } = await githubAuthService.signIn(profile);
      const destination = webUrl(redirect ?? homeFor(user.role));
      setAuthCookie(res, token);
      return res.redirect(destination);
    } catch (err) {
      const reason = REASON_BY_CODE[(err as { code?: string }).code ?? ""];
      if (!reason) console.error("[auth.github] sign-in failed:", describeOAuthError(err));
      return redirectToLoginError(res, PROVIDER, reason ?? "failed", redirect);
    }
  },
};
