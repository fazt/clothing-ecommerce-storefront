import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt, { SignOptions } from "jsonwebtoken";
import { Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
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
}

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

const SALT_ROUNDS = 10;

const toPublic = (u: {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}): PublicUser => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  createdAt: u.createdAt,
  updatedAt: u.updatedAt,
});

function signToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token: string): TokenPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return jwt.verify(token, secret) as TokenPayload;
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
      .catch((e) => console.error("[auth.register] welcome email failed", e));
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
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
      data: { userId: user.id, token, expiresAt },
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
      where: { token },
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
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.delete({ where: { id: record.id } }),
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
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      const err = new Error("Invalid credentials");
      (err as Error & { code?: string }).code = "INVALID_CREDENTIALS";
      throw err;
    }
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    return { token, user: toPublic(user) };
  },

  async getMe(userId: string): Promise<PublicUser | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ? toPublic(user) : null;
  },
};
