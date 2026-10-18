import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { Role } from "../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import { emailService } from "../email";

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: Role;
  /** Versión del token del usuario (User.tokenVersion). */
  tv?: number;
}

/** SHA-256 del token de restablecimiento: en la base solo se guarda el hash. */
export const hashResetToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

/** Token de sesión para un usuario de la base. */
export const sessionToken = (u: { id: string; email: string; role: Role; tokenVersion: number }) =>
  signToken({ sub: u.id, email: u.email, role: u.role, tv: u.tokenVersion });

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export const SALT_ROUNDS = 10;

export const toPublic = (u: PublicUser): PublicUser => ({
  id: u.id,
  email: u.email,
  name: u.name,
  avatarUrl: u.avatarUrl,
  role: u.role,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

export function signToken(payload: TokenPayload): string {
  const expiresIn = env.JWT_EXPIRES_IN as SignOptions["expiresIn"];
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}

export const authService = {
  async register(input: RegisterInput): Promise<{ token: string; user: PublicUser }> {
    const email = input.email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      const err = new Error("Email already registered");
      (err as Error & { code?: string }).code = "EMAIL_TAKEN";
      throw err;
    }
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: input.name?.trim() || null,
        role: "USER",
      },
    });
    // Fail-safe: welcome email never breaks the registration
    emailService
      .sendWelcome({ email: user.email, name: user.name })
      .catch((err) => logger.error({ err }, "auth.register: falló el email de bienvenida"));
    const token = sessionToken(user);
    return { token, user: toPublic(user) };
  },

  async requestPasswordReset(email: string): Promise<void> {
    const normalized = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalized } });
    if (!user) return; // Silent — do not reveal existence
    // Invalidate previous tokens for the same user
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h
    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: hashResetToken(token), expiresAt },
    });
    await emailService.sendPasswordReset(
      { email: user.email, name: user.name },
      token,
    );
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    if (!token || typeof token !== "string") {
      const err = new Error("Invalid token");
      (err as Error & { code?: string }).code = "INVALID_TOKEN";
      throw err;
    }
    if (!newPassword || newPassword.length < 6) {
      const err = new Error("Password must be at least 6 characters");
      (err as Error & { code?: string }).code = "INVALID_PASSWORD";
      throw err;
    }
    const record = await prisma.passwordResetToken.findUnique({
      where: { token: hashResetToken(token) },
    });
    if (!record || record.expiresAt < new Date()) {
      if (record) {
        await prisma.passwordResetToken.delete({ where: { id: record.id } });
      }
      const err = new Error("Token inválido o expirado");
      (err as Error & { code?: string }).code = "INVALID_TOKEN";
      throw err;
    }
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.$transaction([
      // tokenVersion++ cierra las sesiones abiertas (p. ej. de quien robó la contraseña anterior).
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash, tokenVersion: { increment: 1 } },
      }),
      prisma.passwordResetToken.deleteMany({ where: { userId: record.userId } }),
    ]);
  },

  async login(input: LoginInput): Promise<{ token: string; user: PublicUser }> {
    const email = input.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const err = new Error("Invalid credentials");
      (err as Error & { code?: string }).code = "INVALID_CREDENTIALS";
      throw err;
    }
    // Accounts created with Google have no password until the owner sets one
    // through the reset-password flow.
    if (!user.passwordHash) {
      const err = new Error("Password not set");
      (err as Error & { code?: string }).code = "PASSWORD_NOT_SET";
      throw err;
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      const err = new Error("Invalid credentials");
      (err as Error & { code?: string }).code = "INVALID_CREDENTIALS";
      throw err;
    }
    const token = sessionToken(user);
    return { token, user: toPublic(user) };
  },
};
