const safePasswordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!%+\-=@_])[A-Za-z\d!%+\-=@_]{16,128}$/u;

export const canonicalPlatformTarget = Object.freeze({
  database: "platform_catalog",
  reference: "platform-local",
  server: "127.0.0.1",
  user: "trazactivo_platform_local",
});

const allowedTargetKeys = new Set(["database", "password", "port", "reference", "server", "user"]);

export interface PlatformTarget {
  database: string;
  password: string;
  port: number;
  reference: string;
  server: string;
  user: string;
}

export class PlatformTargetError extends Error {
  public constructor(code: string) {
    super(code);
    this.name = "PlatformTargetError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function platformTargetViolations(value: unknown): string[] {
  if (!isRecord(value)) {
    return ["DB001_PLATFORM_TARGET_OBJECT_REQUIRED"];
  }

  const violations: string[] = [];
  for (const key of Object.keys(value)) {
    if (!allowedTargetKeys.has(key)) {
      violations.push(`DB001_PLATFORM_TARGET_OVERRIDE_REJECTED key=${key}`);
    }
  }

  if (value.reference !== canonicalPlatformTarget.reference) {
    violations.push("DB001_PLATFORM_REFERENCE_REJECTED");
  }
  if (value.database !== canonicalPlatformTarget.database) {
    violations.push("DB001_PLATFORM_DATABASE_REJECTED");
  }
  if (value.server !== canonicalPlatformTarget.server) {
    violations.push("DB001_PLATFORM_SERVER_REJECTED");
  }
  if (value.user !== canonicalPlatformTarget.user) {
    violations.push("DB001_PLATFORM_USER_REJECTED");
  }
  if (
    typeof value.port !== "number" ||
    !Number.isInteger(value.port) ||
    value.port < 1024 ||
    value.port > 65535
  ) {
    violations.push("DB001_PLATFORM_PORT_REJECTED");
  }
  if (typeof value.password !== "string" || !safePasswordPattern.test(value.password)) {
    violations.push("DB001_PLATFORM_PASSWORD_POLICY_REJECTED");
  }

  return [...new Set(violations)].sort();
}

export function validatePlatformTarget(value: unknown): PlatformTarget {
  const violations = platformTargetViolations(value);
  if (violations.length > 0) {
    throw new PlatformTargetError(violations.join("\n"));
  }
  return value as PlatformTarget;
}

export function redactPlatformDiagnostic(value: unknown, secrets: readonly string[]): string {
  let redacted = String(value ?? "");
  for (const secret of secrets) {
    if (secret.length > 0) {
      redacted = redacted.replaceAll(secret, "[REDACTED]");
    }
  }

  return redacted
    .replace(/sqlserver:\/\/[^\s]+/giu, "[REDACTED_CONNECTION_STRING]")
    .replace(/\b(DATABASE_URL|password|pwd)\s*=\s*[^\s;]+/giu, "$1=[REDACTED]");
}
