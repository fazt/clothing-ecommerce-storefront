import type { CookieOptions, Response } from "express";

export const AUTH_COOKIE = "auth-token";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// COOKIE_DOMAIN lets the web app (e.g. example.com) read a cookie issued by
// the API on a sibling subdomain (api.example.com). Leave it empty locally.
function baseOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    domain: process.env.COOKIE_DOMAIN || undefined,
  };
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE, token, { ...baseOptions(), maxAge: MAX_AGE_MS });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE, baseOptions());
}
