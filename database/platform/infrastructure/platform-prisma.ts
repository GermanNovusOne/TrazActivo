import { PrismaMssql } from "@prisma/adapter-mssql";

import { PrismaClient } from "../generated/client/client.ts";
import {
  PlatformTargetError,
  type PlatformTarget,
  validatePlatformTarget,
} from "./platform-target.ts";

export interface PlatformDatabaseEvidence {
  disconnected: true;
  observedDatabase: "platform_catalog";
  reference: "platform-local";
}

export function createPlatformPrismaClient(targetInput: unknown): PrismaClient {
  const target = validatePlatformTarget(targetInput);
  const adapter = new PrismaMssql({
    database: target.database,
    options: {
      encrypt: true,
      trustServerCertificate: true,
    },
    password: target.password,
    port: target.port,
    server: target.server,
    user: target.user,
  });

  return new PrismaClient({ adapter });
}

export async function verifyPlatformDatabase(
  targetInput: PlatformTarget,
): Promise<PlatformDatabaseEvidence> {
  const target = validatePlatformTarget(targetInput);
  const client = createPlatformPrismaClient(target);
  let observedDatabase: string | undefined;

  try {
    await client.$connect();
    const rows = await client.$queryRaw<Array<{ database_name: string | null }>>`
      SELECT DB_NAME() AS database_name
    `;
    observedDatabase = rows[0]?.database_name ?? undefined;
    if (observedDatabase !== target.database) {
      throw new PlatformTargetError("DB001_PLATFORM_DATABASE_IDENTITY_MISMATCH");
    }
  } finally {
    await client.$disconnect();
  }

  if (observedDatabase !== "platform_catalog") {
    throw new PlatformTargetError("DB001_PLATFORM_DATABASE_IDENTITY_MISMATCH");
  }

  return {
    disconnected: true,
    observedDatabase,
    reference: "platform-local",
  };
}
