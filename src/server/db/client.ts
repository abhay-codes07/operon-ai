import { PrismaClient } from "@prisma/client";

type PrismaRuntimeClient = PrismaClient & Record<string, any>;

declare global {
  // eslint-disable-next-line no-var
  var __webopsPrismaClient: PrismaRuntimeClient | undefined;
}

export const prisma: any =
  global.__webopsPrismaClient ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

export const prismaClient: PrismaClient = prisma;

if (process.env.NODE_ENV !== "production") {
  global.__webopsPrismaClient = prisma as PrismaRuntimeClient;
}
