import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function withNeonWakeTimeout(connectionUrl: string | undefined) {
  if (!connectionUrl || /[?&]connect_timeout=/.test(connectionUrl)) return connectionUrl;
  return `${connectionUrl}${connectionUrl.includes("?") ? "&" : "?"}connect_timeout=15`;
}

const connectionUrl = withNeonWakeTimeout(process.env.DATABASE_URL);

export const db = globalForPrisma.prisma ?? new PrismaClient(
  connectionUrl ? { datasourceUrl: connectionUrl } : undefined,
);

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
