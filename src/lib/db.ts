import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

if (typeof (globalThis as typeof globalThis & { __internal?: object }).__internal === "undefined") {
  (globalThis as typeof globalThis & { __internal?: object }).__internal = {};
}

const prisma = globalThis.prisma ?? new PrismaClient({});

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
