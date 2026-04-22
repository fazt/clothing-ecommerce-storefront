import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export interface UserCreateInput {
  email: string;
  password: string;
  name?: string | null;
  role?: Role;
}

export interface UserUpdateInput {
  name?: string | null;
  role?: Role;
  password?: string;
}

const SALT_ROUNDS = 10;

const publicSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const userService = {
  findAll: () =>
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: publicSelect,
    }),

  findById: (id: string) =>
    prisma.user.findUnique({ where: { id }, select: publicSelect }),

  create: async (input: UserCreateInput) => {
    const email = input.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    return prisma.user.create({
      data: {
        email,
        passwordHash,
        name: input.name?.trim() || null,
        role: input.role ?? "USER",
      },
      select: publicSelect,
    });
  },

  update: async (id: string, input: UserUpdateInput) => {
    const data: {
      name?: string | null;
      role?: Role;
      passwordHash?: string;
    } = {};
    if (input.name !== undefined) data.name = input.name?.trim() || null;
    if (input.role !== undefined) data.role = input.role;
    if (input.password) data.passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    return prisma.user.update({ where: { id }, data, select: publicSelect });
  },

  remove: (id: string) => prisma.user.delete({ where: { id } }),
};
