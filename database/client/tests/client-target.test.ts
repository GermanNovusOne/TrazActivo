import { describe, expect, it } from "vitest";

import {
  canonicalClientTargets,
  clientAdministrativeTargetViolations,
  redactClientDiagnostic,
  validateClientAdministrativeTarget,
} from "../infrastructure/client-target.ts";

const canonicalPort = 14333;
const validPassword = "ValidClient1!Password";

function target(reference: "client-a-local" | "client-b-local") {
  const canonical = canonicalClientTargets.find((entry) => entry.reference === reference);
  if (!canonical) {
    throw new Error("DB002_TEST_TARGET_MISSING");
  }
  return Object.freeze({ ...canonical, password: validPassword, port: canonicalPort });
}

describe("Client Prisma administrative target guard", () => {
  it.each(["client-a-local", "client-b-local"] as const)(
    "accepts canonical target %s independently",
    (reference) => {
      const input = target(reference);
      expect(validateClientAdministrativeTarget(input, canonicalPort)).toEqual(input);
    },
  );

  it("rejects Platform reference, database and user", () => {
    expect(
      clientAdministrativeTargetViolations(
        {
          database: "platform_catalog",
          password: validPassword,
          port: canonicalPort,
          reference: "platform-local",
          server: "127.0.0.1",
          user: "trazactivo_platform_local",
        },
        canonicalPort,
      ),
    ).toEqual(
      expect.arrayContaining([
        "DB002_CLIENT_DATABASE_REJECTED",
        "DB002_CLIENT_REFERENCE_REJECTED",
        "DB002_CLIENT_USER_REJECTED",
      ]),
    );
  });

  it.each([
    ["client-a-local", "trazactivo_client_b", "trazactivo_client_b_local"],
    ["client-b-local", "trazactivo_client_a", "trazactivo_client_a_local"],
  ] as const)("rejects crossed tuple for %s", (reference, database, user) => {
    expect(
      clientAdministrativeTargetViolations({ ...target(reference), database, user }, canonicalPort),
    ).toEqual(
      expect.arrayContaining([
        "DB002_CLIENT_TARGET_TUPLE_REJECTED field=database",
        "DB002_CLIENT_TARGET_TUPLE_REJECTED field=user",
      ]),
    );
  });

  it("rejects arbitrary reference and database", () => {
    expect(
      clientAdministrativeTargetViolations(
        {
          ...target("client-a-local"),
          database: "untrusted_database",
          reference: "untrusted-reference",
        },
        canonicalPort,
      ),
    ).toEqual(
      expect.arrayContaining(["DB002_CLIENT_DATABASE_REJECTED", "DB002_CLIENT_REFERENCE_REJECTED"]),
    );
  });

  it("rejects arbitrary host, user and port", () => {
    const input = target("client-a-local");
    expect(
      clientAdministrativeTargetViolations(
        { ...input, port: 14334, server: "db.example.test", user: "sa" },
        canonicalPort,
      ),
    ).toEqual(
      expect.arrayContaining([
        "DB002_CLIENT_PORT_REJECTED",
        "DB002_CLIENT_SERVER_REJECTED",
        "DB002_CLIENT_TARGET_TUPLE_REJECTED field=user",
      ]),
    );
  });

  it.each(["connectionString", "schema", "dockerHost", "config", "clientId"])(
    "rejects arbitrary selector or override property %s",
    (key) => {
      expect(
        clientAdministrativeTargetViolations(
          { ...target("client-a-local"), [key]: "untrusted" },
          canonicalPort,
        ),
      ).toContain(`DB002_CLIENT_TARGET_OVERRIDE_REJECTED key=${key}`);
    },
  );

  it.each(["header", "query", "body", "cookie", "browserState", "requestInput"])(
    "rejects request-derived selector property %s",
    (key) => {
      expect(
        clientAdministrativeTargetViolations(
          { ...target("client-b-local"), [key]: "client-a-local" },
          canonicalPort,
        ),
      ).toContain(`DB002_CLIENT_TARGET_OVERRIDE_REJECTED key=${key}`);
    },
  );

  it("enforces password policy without exposing the value", () => {
    expect(
      clientAdministrativeTargetViolations(
        { ...target("client-a-local"), password: "weak" },
        canonicalPort,
      ),
    ).toEqual(["DB002_CLIENT_PASSWORD_POLICY_REJECTED"]);
  });

  it("redacts passwords and connection strings", () => {
    const diagnostic = redactClientDiagnostic(
      `password=${validPassword} connectionString=sqlserver://localhost:14333;password=${validPassword}`,
      [validPassword],
    );

    expect(diagnostic).not.toContain(validPassword);
    expect(diagnostic).not.toContain("sqlserver://");
    expect(diagnostic).toContain("[REDACTED]");
  });
});
