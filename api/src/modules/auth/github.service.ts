import { Prisma, type User } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { emailService } from "../email";
import { signToken, toPublic, type PublicUser } from "./auth.service";
import type { GithubProfile } from "./github.client";

function fail(code: string, message: string): never {
  const err = new Error(message);
  (err as Error & { code?: string }).code = code;
  throw err;
}

async function findOrCreateUser(profile: GithubProfile): Promise<{ user: User; created: boolean }> {
  const linked = await prisma.user.findUnique({ where: { githubId: profile.githubId } });
  if (linked) return { user: linked, created: false };

  // GitHub verified the primary email, so an account with the same address is
  // the same person: link it, keeping whatever name and avatar it already has.
  const existing = await prisma.user.findUnique({ where: { email: profile.email } });
  if (existing) {
    if (existing.githubId) {
      fail("GITHUB_ACCOUNT_CONFLICT", "The account is linked to another GitHub account");
    }
    const user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        githubId: profile.githubId,
        name: existing.name ?? profile.name ?? profile.login,
        avatarUrl: existing.avatarUrl ?? profile.avatarUrl,
      },
    });
    return { user, created: false };
  }

  const user = await prisma.user.create({
    data: {
      email: profile.email,
      githubId: profile.githubId,
      name: profile.name ?? profile.login,
      avatarUrl: profile.avatarUrl,
      role: "USER",
    },
  });
  return { user, created: true };
}

export const githubAuthService = {
  async signIn(profile: GithubProfile): Promise<{ token: string; user: PublicUser }> {
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
        .catch((e) => console.error("[auth.github] welcome email failed", e));
    }
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    return { token, user: toPublic(user) };
  },
};
