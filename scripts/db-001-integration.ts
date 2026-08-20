import {
  canonicalPlatformTarget,
  redactPlatformDiagnostic,
  validatePlatformTarget,
} from "../database/platform/infrastructure/platform-target.ts";
import { verifyPlatformDatabase } from "../database/platform/infrastructure/platform-prisma.ts";
import { inspectCanonicalResources, localPreflight } from "./fnd-005-runtime.mjs";
import { canonicalTopology } from "./fnd-005-rules.mjs";

function rejectClientTargets(password: string, port: number): void {
  for (const entry of canonicalTopology.databases.filter(({ role }) => role !== "platform")) {
    try {
      validatePlatformTarget({
        database: entry.database,
        password,
        port,
        reference: entry.reference,
        server: canonicalPlatformTarget.server,
        user: entry.user,
      });
      throw new Error("DB001_CLIENT_TARGET_UNEXPECTEDLY_ACCEPTED");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes("DB001_PLATFORM_")) {
        throw error;
      }
      console.log(
        `[test:integration] TARGET_REJECTED project=platform-prisma-foundation reference=${entry.reference} database=${entry.database}`,
      );
    }
  }
}

try {
  if (process.argv.slice(2).length > 0) {
    throw new Error("DB001_INTEGRATION_ARGUMENTS_REJECTED");
  }
  const configuration = await localPreflight({ argv: [], checkPort: false });
  inspectCanonicalResources(configuration, { requireAll: true });
  const platform = canonicalTopology.databases.find(({ role }) => role === "platform");
  if (!platform) {
    throw new Error("DB001_PLATFORM_TOPOLOGY_MISSING");
  }
  const password = configuration.values[platform.passwordVariable];
  if (typeof password !== "string") {
    throw new Error("DB001_PLATFORM_SECRET_MISSING");
  }

  rejectClientTargets(password, configuration.port);
  const evidence = await verifyPlatformDatabase({
    ...canonicalPlatformTarget,
    password,
    port: configuration.port,
  });
  const redactionProbe = redactPlatformDiagnostic(
    `password=${password} DATABASE_URL=sqlserver://untrusted;password=${password}`,
    [password],
  );
  if (redactionProbe.includes(password) || redactionProbe.includes("sqlserver://")) {
    throw new Error("DB001_DIAGNOSTIC_REDACTION_FAILED");
  }

  console.log(
    `[test:integration] PLATFORM_DATABASE_VERIFIED project=platform-prisma-foundation reference=${evidence.reference} database=${evidence.observedDatabase}`,
  );
  console.log(
    `[test:integration] PRISMA_CLIENT_LIFECYCLE project=platform-prisma-foundation connect=PASS disconnect=${evidence.disconnected ? "PASS" : "FAIL"}`,
  );
  console.log(
    "[test:integration] PROJECT_COMPLETE project=platform-prisma-foundation result=PASS targets_rejected=2 secrets=REDACTED",
  );
} catch (error) {
  const values = [
    process.env.MSSQL_SA_PASSWORD,
    process.env.TRAZACTIVO_PLATFORM_DB_PASSWORD,
    process.env.TRAZACTIVO_CLIENT_A_DB_PASSWORD,
    process.env.TRAZACTIVO_CLIENT_B_DB_PASSWORD,
  ].filter((value): value is string => typeof value === "string");
  console.error(
    redactPlatformDiagnostic(
      error instanceof Error ? error.message : "DB001_INTEGRATION_FAILED",
      values,
    ),
  );
  process.exitCode = 1;
}
