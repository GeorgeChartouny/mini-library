import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  // Resolve file: path to absolute for better-sqlite3 (strip query params like ?mode=ro)
  const filePath = url.replace(/^file:/, "").trim().split("?")[0];
  const absolutePath =
    path.isAbsolute(filePath) || filePath === ":memory:"
      ? filePath
      : path.resolve(process.cwd(), filePath);
  const adapterUrl = filePath === ":memory:" ? ":memory:" : `file:${absolutePath}`;
  const adapter = new PrismaBetterSqlite3({ url: adapterUrl });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
