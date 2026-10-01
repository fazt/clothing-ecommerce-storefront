import { Prisma, type User } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { emailService } from "../email";
import { signToken, toPublic, type PublicUser } from "./auth.service";
import type { GoogleProfile } from "./google.client";

function fail(code: string, message: string): never {
  const err = new Error(message);
  (err as Error & { code?: string }).code = code;
  throw err;
}

async function findOrCreateUser(profile: GoogleProfile): Promise<{ user: User; created: boolean }> {
  const linked = await prisma.user.findUnique({ where: { googleId: profile.googleId } });
  if (linked) return { user: linked, created: false };

  // Google verified the email, so an account with the same address is the
  // same person: link it, keeping whatever name and avatar it already has.
  const existing = await prisma.user.findUnique({ where: { email: profile.email } });
  if (existing) {
    if (existing.googleId) {
      fail("GOOGLE_ACCOUNT_CONFLICT", "The account is linked to another Google account");
    }
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        googleId: profile.googleId,
        name: existing.name ?? profile.name,
        avatarUrl: existing.avatarUrl ?? profile.picture,
      },
    });
    return { user, created: false };
  }

  const user = await prisma.user.create({
    data: {
      email: profile.email,
      googleId: profile.googleId,
      name: profile.name,
      avatarUrl: profile.picture,
      role: "USER",
    },
  });
  return { user, created: true };
}

export const googleAuthService = {
  async signIn(profile: GoogleProfile): Promise<{ token: string; user: PublicUser }> {
    let result: { user: User; created: boolean };
    try {
      result = await findOrCreateUser(profile);
    } catch (error) {
      // Two callbacks raced to create or link the same user; the retry finds it.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        result = await findOrCreateUser(profile);
      } else {
        throw error;
      }
    }
    const { user, created } = result;
    if (created) {
      // Fail-safe: the welcome email never breaks the sign-in
      emailService
        .sendWelcome({ email: user.email, name: user.name })
        .catch((e) => console.error("[auth.google] welcome email failed", e));
    }
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    return { token, user: toPublic(user) };
  },
};
