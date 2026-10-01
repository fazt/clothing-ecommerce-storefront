import { prisma } from "../../lib/prisma";

export const newsletterService = {
  subscribe: (email: string) =>
    prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {},
      create: { email },
    }),
};
