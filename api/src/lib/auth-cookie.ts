import type { CookieOptions, Response } from "express";
import { env, isProd } from "../config/env";

export const AUTH_COOKIE = "auth-token";

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// En producción web y API comparten origen (nginx). COOKIE_DOMAIN solo hace falta si la API
// vive en un subdominio hermano (api.example.com) y la web debe leer la cookie.
function baseOptions(): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: env.COOKIE_SECURE ?? isProd,
    path: "/",
    domain: env.COOKIE_DOMAIN || undefined,
  };
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE, token, { ...baseOptions(), maxAge: MAX_AGE_MS });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE, baseOptions());
}
