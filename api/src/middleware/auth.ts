import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../modules/auth/auth.service";
import { prisma } from "../lib/prisma";
import { AUTH_COOKIE } from "../lib/auth-cookie";

// Browser requests carry the HttpOnly cookie; server-side requests from the
// web app (RSC) forward it as a Bearer token.
function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header) {
    const [scheme, token] = header.split(" ");
    if (scheme?.toLowerCase() === "bearer" && token) return token.trim();
  }
  const cookie = req.cookies?.[AUTH_COOKIE];
  return typeof cookie === "string" && cookie ? cookie : null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "Missing authorization token" });
  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: "Invalid token" });
    req.user = { id: user.id, email: user.email, role: user.role };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  return next();
}
