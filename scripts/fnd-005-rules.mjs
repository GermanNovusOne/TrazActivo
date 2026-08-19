import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const sqlServerDigest = "sha256:ba4c8329f48fb8f02e1416be6a930ebfd71268caee78aa985f3af4315e457c89";

export const canonicalTopology = Object.freeze({
  composeFile: "infra/local/docker-compose.yml",
  containerName: "trazactivo-local-fnd005-sqlserver",
  databases: Object.freeze([
    Object.freeze({
      database: "platform_catalog",
      passwordVariable: "TRAZACTIVO_PLATFORM_DB_PASSWORD",
      reference: "platform-local",
      role: "platform",
      user: "trazactivo_platform_local",
    }),
    Object.freeze({
      database: "trazactivo_client_a",
      passwordVariable: "TRAZACTIVO_CLIENT_A_DB_PASSWORD",
      reference: "client-a-local",
      role: "client-a",
      user: "trazactivo_client_a_local",
    }),
    Object.freeze({
      database: "trazactivo_client_b",
      passwordVariable: "TRAZACTIVO_CLIENT_B_DB_PASSWORD",
      reference: "client-b-local",
      role: "client-b",
      user: "trazactivo_client_b_local",
    }),
  ]),
  dockerContext: "desktop-linux",
  dockerEndpoint: "npipe:////./pipe/dockerDesktopLinuxEngine",
  image: `mcr.microsoft.com/mssql/server:2022-CU26-ubuntu-22.04@${sqlServerDigest}`,
  labels: Object.freeze({
    "com.trazactivo.project": "trazactivo-local-fnd005",
    "com.trazactivo.scope": "local-infrastructure",
    "com.trazactivo.wp": "FND-005",
  }),
  networkName: "trazactivo-local-fnd005-network",
  projectName: "trazactivo-local-fnd005",
  serviceName: "sqlserver",
  volumeName: "trazactivo-local-fnd005-sqlserver-data",
});

const forbiddenOverrideVariables = [
  "COMPOSE_FILE",
  "COMPOSE_PATH_SEPARATOR",
  "COMPOSE_PROFILES",
  "COMPOSE_PROJECT_NAME",
  "DOCKER_HOST",
  "PLATFORM_DATABASE_NAME",
  "CLIENT_A_DATABASE_NAME",
  "CLIENT_B_DATABASE_NAME",
  "TRAZACTIVO_DATABASE_TARGET",
];

const requiredSecretVariables = [
  "MSSQL_SA_PASSWORD",
  ...canonicalTopology.databases.map(({ passwordVariable }) => passwordVariable),
];

const safePasswordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!%+\-=@_])[A-Za-z\d!%+\-=@_]{16,128}$/u;

function present(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateInvocation({ argv = [], env = {} }) {
  const violations = [];

  if (argv.length > 0) {
    violations.push("FND005_GUARD_CLI_ARGUMENTS_REJECTED");
  }

  for (const variable of forbiddenOverrideVariables) {
    if (present(env[variable])) {
      violations.push(`FND005_GUARD_OVERRIDE_REJECTED ${variable}`);
    }
  }

  if (present(env.DOCKER_CONTEXT) && env.DOCKER_CONTEXT !== canonicalTopology.dockerContext) {
    violations.push("FND005_GUARD_DOCKER_CONTEXT_REJECTED");
  }

  if (env.TRAZACTIVO_LOCAL_ENV !== "development") {
    violations.push("FND005_GUARD_LOCAL_ENV_REQUIRED");
  }
  if (env.TRAZACTIVO_LOCAL_CONFIRMATION !== "FND-005") {
    violations.push("FND005_GUARD_LOCAL_CONFIRMATION_REQUIRED");
  }

  const port = Number(env.TRAZACTIVO_SQL_PORT ?? "14333");
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    violations.push("FND005_GUARD_SQL_PORT_INVALID");
  }

  return violations;
}

export function validateSecrets(env) {
  const violations = [];
  const values = [];

  for (const variable of requiredSecretVariables) {
    const value = env[variable];
    if (!present(value)) {
      violations.push(`FND005_SECRET_MISSING ${variable}`);
      continue;
    }
    if (!safePasswordPattern.test(value)) {
      violations.push(`FND005_SECRET_POLICY_REJECTED ${variable}`);
      continue;
    }
    values.push(value);
  }

  if (new Set(values).size !== values.length) {
    violations.push("FND005_SECRET_REUSE_REJECTED");
  }

  return violations;
}

export function redactSensitiveText(value, env) {
  let redacted = String(value ?? "");
  for (const variable of requiredSecretVariables) {
    const secret = env[variable];
    if (present(secret)) {
      redacted = redacted.replaceAll(secret, "[REDACTED]");
    }
  }
  return redacted;
}

export function validateDockerEndpoint(endpoint) {
  const normalized = String(endpoint ?? "")
    .trim()
    .replace(/^"|"$/gu, "");
  return normalized === canonicalTopology.dockerEndpoint
    ? []
    : [`FND005_GUARD_DOCKER_ENDPOINT_REJECTED ${normalized || "missing"}`];
}

export function validatePortAvailability({ available, canonicalContainerRunning, port }) {
  return available || canonicalContainerRunning ? [] : [`FND005_PORT_COLLISION port=${port}`];
}

export function validateTopology(entries) {
  const violations = [];
  const expectedRoles = new Set(["platform", "client-a", "client-b"]);
  const values = {
    database: new Set(),
    reference: new Set(),
    user: new Set(),
  };

  if (!Array.isArray(entries) || entries.length !== 3) {
    return ["FND005_TOPOLOGY_REQUIRES_THREE_DATABASES"];
  }

  for (const entry of entries) {
    if (!expectedRoles.delete(entry.role)) {
      violations.push(`FND005_TOPOLOGY_ROLE_INVALID ${entry.role ?? "missing"}`);
    }
    for (const field of Object.keys(values)) {
      const value = entry[field];
      if (!present(value)) {
        violations.push(`FND005_TOPOLOGY_${field.toUpperCase()}_MISSING`);
      } else if (values[field].has(value)) {
        violations.push(`FND005_TOPOLOGY_${field.toUpperCase()}_COLLISION ${value}`);
      } else {
        values[field].add(value);
      }
    }
    if (entry.target !== undefined && entry.target !== entry.database) {
      violations.push(`FND005_TOPOLOGY_TARGET_MISMATCH ${entry.role}`);
    }
  }

  if (expectedRoles.size > 0) {
    violations.push(`FND005_TOPOLOGY_ROLE_MISSING ${[...expectedRoles].join(",")}`);
  }
  return violations;
}

export function validateResourceDescriptors(descriptors, { requireAll = true } = {}) {
  const violations = [];
  const expected = new Map([
    ["container", canonicalTopology.containerName],
    ["network", canonicalTopology.networkName],
    ["volume", canonicalTopology.volumeName],
  ]);
  const seen = new Set();

  for (const descriptor of descriptors) {
    const expectedName = expected.get(descriptor.kind);
    if (!expectedName || descriptor.name !== expectedName) {
      violations.push(`FND005_RESOURCE_UNRECOGNIZED ${descriptor.kind}:${descriptor.name}`);
      continue;
    }
    if (seen.has(descriptor.kind)) {
      violations.push(`FND005_RESOURCE_DUPLICATE ${descriptor.kind}`);
    }
    seen.add(descriptor.kind);

    for (const [label, value] of Object.entries(canonicalTopology.labels)) {
      if (descriptor.labels?.[label] !== value) {
        violations.push(`FND005_RESOURCE_LABEL_MISMATCH ${descriptor.kind}:${label}`);
      }
    }
    if (descriptor.labels?.["com.docker.compose.project"] !== canonicalTopology.projectName) {
      violations.push(`FND005_RESOURCE_PROJECT_MISMATCH ${descriptor.kind}`);
    }
    if (
      descriptor.kind === "container" &&
      descriptor.labels?.["com.docker.compose.service"] !== canonicalTopology.serviceName
    ) {
      violations.push("FND005_RESOURCE_SERVICE_MISMATCH container");
    }
  }

  if (requireAll) {
    for (const kind of expected.keys()) {
      if (!seen.has(kind)) {
        violations.push(`FND005_RESOURCE_MISSING ${kind}`);
      }
    }
  }

  return violations;
}

export function validateComposeOperation(operation) {
  const allowed = new Set([
    "down",
    "down --volumes",
    "up --detach --wait --wait-timeout 240 sqlserver",
  ]);
  const serialized = operation.join(" ");
  return allowed.has(serialized)
    ? []
    : [`FND005_DESTRUCTIVE_SCOPE_REJECTED ${serialized || "missing"}`];
}

export async function validateStaticFnd005(root) {
  const violations = [];
  const [attributes, compose, exampleEnvironment, gitignore, manifest, runSuite] =
    await Promise.all([
      readFile(resolve(root, ".gitattributes"), "utf8"),
      readFile(resolve(root, canonicalTopology.composeFile), "utf8"),
      readFile(resolve(root, ".env.example"), "utf8"),
      readFile(resolve(root, ".gitignore"), "utf8"),
      readFile(resolve(root, "package.json"), "utf8").then(JSON.parse),
      readFile(resolve(root, "scripts/run-suite.mjs"), "utf8"),
    ]);

  if (!compose.includes(`name: ${canonicalTopology.projectName}`)) {
    violations.push("FND005_COMPOSE_PROJECT_NOT_CANONICAL");
  }
  if (!compose.includes(`image: ${canonicalTopology.image}`)) {
    violations.push("FND005_SQLSERVER_IMAGE_NOT_PINNED");
  }
  if (/image:\s*\S*latest\b/iu.test(compose)) {
    violations.push("FND005_SQLSERVER_LATEST_PROHIBITED");
  }
  for (const [label, value] of Object.entries(canonicalTopology.labels)) {
    if (!compose.includes(`${label}: ${value}`)) {
      violations.push(`FND005_COMPOSE_LABEL_MISSING ${label}`);
    }
  }

  const expectedScripts = {
    "local:down": "node scripts/local-down.mjs",
    "local:preflight": "node scripts/local-preflight.mjs",
    "local:reset": "node scripts/local-reset.mjs",
    "local:status": "node scripts/local-status.mjs",
    "local:up": "node scripts/local-up.mjs",
  };
  for (const [name, command] of Object.entries(expectedScripts)) {
    if (manifest.scripts?.[name] !== command) {
      violations.push(`FND005_ROOT_SCRIPT_INVALID ${name}`);
    }
  }

  for (const variable of requiredSecretVariables) {
    const match = exampleEnvironment.match(new RegExp(`^${variable}=(.*)$`, "mu"));
    if (!match || match[1] !== "") {
      violations.push(`FND005_TRACKED_SECRET_PLACEHOLDER_INVALID ${variable}`);
    }
  }
  if (!gitignore.includes(".env.*") || !gitignore.includes("!.env.example")) {
    violations.push("FND005_LOCAL_ENV_IGNORE_MISSING");
  }
  if (
    !attributes.includes("/.env.example text eol=lf") ||
    !attributes.includes("/infra/**/*.yml text eol=lf")
  ) {
    violations.push("FND005_REPRODUCIBLE_LINE_ENDINGS_MISSING");
  }
  if (
    !runSuite.includes('"local-infrastructure"') ||
    !runSuite.includes("fnd-005-integration.mjs")
  ) {
    violations.push("FND005_INTEGRATION_PROJECT_NOT_DISPATCHED");
  }

  return violations;
}
