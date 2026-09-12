import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let Client = PrismaClient;

function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma && (globalForPrisma.prisma as any).appSetting) {
    return globalForPrisma.prisma;
  }

  try {
    if (globalForPrisma.prisma) {
      globalForPrisma.prisma.$disconnect();
    }
  } catch {}

  try {
    // Clear node cache for prisma
    if (typeof require !== "undefined" && require.cache) {
      Object.keys(require.cache).forEach((k) => {
        if (k.includes(".prisma") || k.includes("@prisma")) {
          delete require.cache[k];
        }
      });
      Client = require("@prisma/client").PrismaClient;
    }
  } catch {}

  const newClient = new Client({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = newClient;
  }
  return newClient;
}

export const prisma = getPrismaClient();
