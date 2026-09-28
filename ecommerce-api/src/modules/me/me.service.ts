import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import { SALT_ROUNDS, toPublic, type PublicUser } from "../auth/auth.service";
import type { ChangePasswordInput, UpdateMeInput } from "./me.schema";

function fail(code: string, message: string): never {
  const err = new Error(message);
  (err as Error & { code?: string }).code = code;
  throw err;
}

async function assertPassword(userId: string, password: string | undefined) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  if (!password || !(await bcrypt.compare(password, user.passwordHash))) {
    fail("INVALID_PASSWORD", "La contraseña actual no es correcta");
  }
  return user;
}

export const meService = {
  async get(userId: string): Promise<PublicUser | null> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    return user ? toPublic(user) : null;
  },

  async update(userId: string, input: UpdateMeInput): Promise<PublicUser> {
    const current = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const emailChanged = input.email !== undefined && input.email !== current.email;
    if (emailChanged) {
      await assertPassword(userId, input.currentPassword);
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(emailChanged && { email: input.email }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
      },
    });
    return toPublic(user);
  },

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    await assertPassword(userId, input.currentPassword);
    const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  },
};
