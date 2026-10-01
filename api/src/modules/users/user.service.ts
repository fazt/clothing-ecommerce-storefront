import bcrypt from "bcrypt";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { contains, pageArgs, paginated } from "../../lib/pagination";
import { SALT_ROUNDS } from "../auth/auth.service";
import type { CreateUserInput, ListUsersQuery, UpdateUserInput } from "./user.schema";

const publicSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export const userService = {
  findAll: async (query: ListUsersQuery) => {
    const where: Prisma.UserWhereInput = {
      ...(query.role && { role: query.role }),
      ...(query.search && {
        OR: [{ name: contains(query.search) }, { email: contains(query.search) }],
      }),
    };
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: publicSelect,
        ...pageArgs(query),
      }),
      prisma.user.count({ where }),
    ]);
    return paginated(users, total, query);
  },

  findById: (id: string) =>
    prisma.user.findUnique({ where: { id }, select: publicSelect }),

  create: async (input: CreateUserInput) => {
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    return prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name ?? null,
        role: input.role,
      },
      select: publicSelect,
    });
  },

  update: async (id: string, input: UpdateUserInput) => {
    const data: Prisma.UserUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.role !== undefined) data.role = input.role;
    if (input.password) data.passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    return prisma.user.update({ where: { id }, data, select: publicSelect });
  },

  remove: (id: string) => prisma.user.delete({ where: { id } }),
};
