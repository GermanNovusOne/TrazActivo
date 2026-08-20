import { describe, expect, it } from "vitest";

import {
  canonicalPlatformTarget,
  platformTargetViolations,
  redactPlatformDiagnostic,
  validatePlatformTarget,
} from "../infrastructure/platform-target.ts";

const validTarget = Object.freeze({
  ...canonicalPlatformTarget,
  password: "ValidPlatform1!Password",
  port: 14333,
});

describe("Platform Prisma target guard", () => {
  it("accepts only the canonical Platform reference and database", () => {
    expect(validatePlatformTarget(validTarget)).toEqual(validTarget);
  });

  it.each([
    ["client-a-local", "trazactivo_client_a"],
    ["client-b-local", "trazactivo_client_b"],
  ])("rejects Client target %s before Prisma construction", (reference, database) => {
    expect(() => validatePlatformTarget({ ...validTarget, database, reference })).toThrow(
      /DB001_PLATFORM_(?:DATABASE|REFERENCE)_REJECTED/u,
    );
  });

  it.each(["connectionString", "schema", "dockerHost"])(
    "rejects the arbitrary override %s",
    (key) => {
      expect(platformTargetViolations({ ...validTarget, [key]: "untrusted" })).toContain(
        `DB001_PLATFORM_TARGET_OVERRIDE_REJECTED key=${key}`,
      );
    },
  );

  it("rejects remote hosts and non-canonical SQL identities", () => {
    expect(platformTargetViolations({ ...validTarget, server: "db.example.test" })).toContain(
      "DB001_PLATFORM_SERVER_REJECTED",
    );
    expect(platformTargetViolations({ ...validTarget, user: "sa" })).toContain(
      "DB001_PLATFORM_USER_REJECTED",
    );
  });

  it("enforces the approved local password shape without exposing the value", () => {
    expect(platformTargetViolations({ ...validTarget, password: "weak" })).toEqual([
      "DB001_PLATFORM_PASSWORD_POLICY_REJECTED",
    ]);
  });

  it("redacts passwords and connection strings from diagnostics", () => {
    const secret = validTarget.password;
    const diagnostic = redactPlatformDiagnostic(
      `password=${secret} DATABASE_URL=sqlserver://localhost:14333;password=${secret}`,
      [secret],
    );

    expect(diagnostic).not.toContain(secret);
    expect(diagnostic).not.toContain("sqlserver://");
    expect(diagnostic).toContain("[REDACTED]");
  });
});
