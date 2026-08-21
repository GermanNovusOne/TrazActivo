const safePasswordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!%+\-=@_])[A-Za-z\d!%+\-=@_]{16,128}$/u;

export const canonicalClientTargets = Object.freeze([
  Object.freeze({
    database: "trazactivo_client_a",
    reference: "client-a-local",
    server: "127.0.0.1",
    user: "trazactivo_client_a_local",
  }),
  Object.freeze({
    database: "trazactivo_client_b",
    reference: "client-b-local",
    server: "127.0.0.1",
    user: "trazactivo_client_b_local",
  }),
]);

const allowedTargetKeys = new Set(["database", "password", "port", "reference", "server", "user"]);

export interface ClientAdministrativeTarget {
  database: string;
  password: string;
  port: number;
  reference: string;
  server: string;
  user: string;
}

export class ClientAdministrativeTargetError extends Error {
  public constructor(code: string) {
    super(code);
    this.name = "ClientAdministrativeTargetError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function clientAdministrativeTargetViolations(
  value: unknown,
  canonicalPort: number,
): string[] {
  if (!isRecord(value)) {
    return ["DB002_CLIENT_TARGET_OBJECT_REQUIRED"];
  }

  const violations: string[] = [];
  for (const key of Object.keys(value)) {
    if (!allowedTargetKeys.has(key)) {
      violations.push(`DB002_CLIENT_TARGET_OVERRIDE_REJECTED key=${key}`);
    }
  }

  const expected = canonicalClientTargets.find(({ reference }) => reference === value.reference);
  if (!expected) {
    violations.push("DB002_CLIENT_REFERENCE_REJECTED");
    if (!canonicalClientTargets.some(({ database }) => database === value.database)) {
      violations.push("DB002_CLIENT_DATABASE_REJECTED");
    }
    if (!canonicalClientTargets.some(({ user }) => user === value.user)) {
      violations.push("DB002_CLIENT_USER_REJECTED");
    }
  } else {
    if (value.database !== expected.database) {
      violations.push("DB002_CLIENT_TARGET_TUPLE_REJECTED field=database");
    }
    if (value.user !== expected.user) {
      violations.push("DB002_CLIENT_TARGET_TUPLE_REJECTED field=user");
    }
  }

  if (value.server !== "127.0.0.1") {
    violations.push("DB002_CLIENT_SERVER_REJECTED");
  }
  if (
    !Number.isInteger(canonicalPort) ||
    canonicalPort < 1024 ||
    canonicalPort > 65535 ||
    value.port !== canonicalPort
  ) {
    violations.push("DB002_CLIENT_PORT_REJECTED");
  }
  if (typeof value.password !== "string" || !safePasswordPattern.test(value.password)) {
    violations.push("DB002_CLIENT_PASSWORD_POLICY_REJECTED");
  }

  return [...new Set(violations)].sort();
}

export function validateClientAdministrativeTarget(
  value: unknown,
  canonicalPort: number,
): ClientAdministrativeTarget {
  const violations = clientAdministrativeTargetViolations(value, canonicalPort);
  if (violations.length > 0) {
    throw new ClientAdministrativeTargetError(violations.join("\n"));
  }
  return value as ClientAdministrativeTarget;
}

export function redactClientDiagnostic(value: unknown, secrets: readonly string[]): string {
  let redacted = String(value ?? "");
  for (const secret of secrets) {
    if (secret.length > 0) {
      redacted = redacted.replaceAll(secret, "[REDACTED]");
    }
  }

  return redacted
    .replace(/sqlserver:\/\/[^\s]+/giu, "[REDACTED_CONNECTION_STRING]")
    .replace(/\b(DATABASE_URL|connectionString|password|pwd)\s*=\s*[^\s;]+/giu, "$1=[REDACTED]");
}
