import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../modules/auth/auth.service";
import { prisma } from "../lib/prisma";
import { AUTH_COOKIE } from "../lib/auth-cookie";

// El navegador manda la cookie HttpOnly; las peticiones server-side de la web (RSC)
// la reenvían como Bearer.
function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header) {
    const [scheme, token] = header.split(" ");
    if (scheme?.toLowerCase() === "bearer" && token) return token.trim();
  }
  const cookie = req.cookies?.[AUTH_COOKIE];
  return typeof cookie === "string" && cookie ? cookie : null;
}

/** Usuario de la petición: el rol y la versión del token se leen SIEMPRE de la base. */
async function resolveUser(req: Request) {
  const token = extractToken(req);
  if (!token) return { error: "Missing authorization token" as const };
  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, tokenVersion: true },
    });
    // Un cambio de contraseña sube tokenVersion e invalida las sesiones anteriores.
    if (!user || (payload.tv ?? 0) !== user.tokenVersion) return { error: "Invalid token" as const };
    return { user: { id: user.id, email: user.email, role: user.role } };
  } catch {
    return { error: "Invalid or expired token" as const };
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const result = await resolveUser(req);
  if (!result.user) return res.status(401).json({ error: result.error });
  req.user = result.user;
  return next();
}

/** Igual que requireAuth pero sin exigir sesión (rutas públicas que personalizan si hay usuario). */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const result = await resolveUser(req);
  if (result.user) req.user = result.user;
  return next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  return next();
}
