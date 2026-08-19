import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, realpath } from "node:fs/promises";
import { createServer } from "node:net";
import { resolve } from "node:path";

import {
  canonicalTopology,
  redactSensitiveText,
  validateComposeOperation,
  validateDockerEndpoint,
  validateInvocation,
  validatePortAvailability,
  validateResourceDescriptors,
  validateSecrets,
  validateStaticFnd005,
  validateTopology,
} from "./fnd-005-rules.mjs";
import { repositoryRoot } from "./toolchain.mjs";

const localEnvironmentPath = resolve(repositoryRoot, ".env.local");
const composePath = resolve(repositoryRoot, canonicalTopology.composeFile);
const knownEnvironmentVariables = new Set([
  "TRAZACTIVO_LOCAL_ENV",
  "TRAZACTIVO_LOCAL_CONFIRMATION",
  "TRAZACTIVO_SQL_PORT",
  "MSSQL_SA_PASSWORD",
  ...canonicalTopology.databases.map(({ passwordVariable }) => passwordVariable),
]);

export class Fnd005Error extends Error {
  constructor(message) {
    super(message);
    this.name = "Fnd005Error";
  }
}

function failOnViolations(violations) {
  if (violations.length > 0) {
    throw new Fnd005Error(violations.join("\n"));
  }
}

function parseEnvironmentFile(source) {
  const values = {};
  for (const [index, rawLine] of source.split(/\r?\n/u).entries()) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) {
      continue;
    }
    const separator = line.indexOf("=");
    if (separator <= 0) {
      throw new Fnd005Error(`FND005_ENV_FILE_INVALID line=${index + 1}`);
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!knownEnvironmentVariables.has(key)) {
      throw new Fnd005Error(`FND005_ENV_FILE_VARIABLE_REJECTED ${key}`);
    }
    if (Object.hasOwn(values, key)) {
      throw new Fnd005Error(`FND005_ENV_FILE_DUPLICATE ${key}`);
    }
    values[key] = value;
  }
  return values;
}

async function loadEnvironment() {
  const fileValues = existsSync(localEnvironmentPath)
    ? parseEnvironmentFile(await readFile(localEnvironmentPath, "utf8"))
    : {};
  const values = { ...fileValues };
  for (const key of knownEnvironmentVariables) {
    if (process.env[key] !== undefined) {
      values[key] = process.env[key];
    }
  }
  return values;
}

function command(commandName, args, { env, input } = {}) {
  const result = spawnSync(commandName, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: { ...process.env, ...env },
    input,
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  return {
    error: result.error,
    status: result.status ?? 1,
    stderr: result.stderr ?? "",
    stdout: result.stdout ?? "",
  };
}

function requiredCommand(commandName, args, configuration, options = {}) {
  const result = command(commandName, args, {
    ...options,
    env: { ...configuration.values, ...options.env },
  });
  if (result.error || result.status !== 0) {
    const detail = redactSensitiveText(
      [result.error?.message, result.stderr, result.stdout].filter(Boolean).join("\n").trim(),
      configuration.values,
    );
    throw new Fnd005Error(
      `FND005_COMMAND_FAILED command=${commandName} exit=${result.status}${detail ? `\n${detail}` : ""}`,
    );
  }
  return result.stdout.trim();
}

function composeBaseArguments(configuration) {
  const args = ["compose"];
  if (configuration.environmentFileExists) {
    args.push("--env-file", localEnvironmentPath);
  }
  args.push("--file", composePath);
  return args;
}

function composeArguments(configuration, operation) {
  failOnViolations(validateComposeOperation(operation));
  return [...composeBaseArguments(configuration), ...operation];
}

function runCompose(configuration, operation) {
  return requiredCommand("docker", composeArguments(configuration, operation), configuration);
}

async function assertCanonicalPaths() {
  const resolvedRepository = await realpath(repositoryRoot);
  const resolvedCompose = await realpath(composePath);
  if (resolvedCompose !== resolve(resolvedRepository, canonicalTopology.composeFile)) {
    throw new Fnd005Error("FND005_GUARD_COMPOSE_PATH_REJECTED");
  }
  if (existsSync(localEnvironmentPath)) {
    const resolvedEnvironment = await realpath(localEnvironmentPath);
    if (resolvedEnvironment !== resolve(resolvedRepository, ".env.local")) {
      throw new Fnd005Error("FND005_GUARD_ENV_PATH_REJECTED");
    }
  }
}

async function isPortAvailable(port) {
  return await new Promise((resolveAvailability) => {
    const server = createServer();
    server.unref();
    server.once("error", () => resolveAvailability(false));
    server.listen({ host: "127.0.0.1", port }, () => {
      server.close(() => resolveAvailability(true));
    });
  });
}

function inspectOptional(kind, name, configuration) {
  const dockerKind = kind === "container" ? "container" : kind;
  const result = command("docker", [dockerKind, "inspect", name], {
    env: { ...process.env, ...configuration.values },
  });
  if (result.status !== 0) {
    const detail = `${result.stderr}${result.stdout}`;
    if (/no such|not found/iu.test(detail)) {
      return undefined;
    }
    throw new Fnd005Error(
      `FND005_RESOURCE_INSPECTION_FAILED ${kind}:${name}\n${redactSensitiveText(detail, configuration.values)}`,
    );
  }
  const [record] = JSON.parse(result.stdout);
  const labels = kind === "container" ? record.Config?.Labels : record.Labels;
  return {
    hostPort:
      kind === "container"
        ? record.HostConfig?.PortBindings?.["1433/tcp"]?.[0]?.HostPort
        : undefined,
    kind,
    labels: labels ?? {},
    name,
    running: kind === "container" ? record.State?.Running === true : undefined,
  };
}

function listProjectResources(kind, configuration) {
  const argsByKind = {
    container: [
      "container",
      "ls",
      "--all",
      "--filter",
      `label=com.docker.compose.project=${canonicalTopology.projectName}`,
      "--format",
      "{{.Names}}",
    ],
    network: [
      "network",
      "ls",
      "--filter",
      `label=com.docker.compose.project=${canonicalTopology.projectName}`,
      "--format",
      "{{.Name}}",
    ],
    volume: [
      "volume",
      "ls",
      "--filter",
      `label=com.docker.compose.project=${canonicalTopology.projectName}`,
      "--format",
      "{{.Name}}",
    ],
  };
  const output = requiredCommand("docker", argsByKind[kind], configuration);
  return output
    .split(/\r?\n/u)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function inspectCanonicalResources(configuration, { requireAll = true } = {}) {
  const descriptors = [
    inspectOptional("container", canonicalTopology.containerName, configuration),
    inspectOptional("network", canonicalTopology.networkName, configuration),
    inspectOptional("volume", canonicalTopology.volumeName, configuration),
  ].filter(Boolean);
  failOnViolations(validateResourceDescriptors(descriptors, { requireAll }));
  const container = descriptors.find(({ kind }) => kind === "container");
  if (container && container.hostPort !== String(configuration.port)) {
    throw new Fnd005Error(
      `FND005_RESOURCE_PORT_MISMATCH expected=${configuration.port} actual=${container.hostPort ?? "missing"}`,
    );
  }

  const expectedNames = {
    container: canonicalTopology.containerName,
    network: canonicalTopology.networkName,
    volume: canonicalTopology.volumeName,
  };
  for (const kind of Object.keys(expectedNames)) {
    for (const name of listProjectResources(kind, configuration)) {
      if (name !== expectedNames[kind]) {
        throw new Fnd005Error(`FND005_RESOURCE_UNRECOGNIZED ${kind}:${name}`);
      }
    }
  }
  return descriptors;
}

async function verifyPort(configuration) {
  const existing = inspectOptional("container", canonicalTopology.containerName, configuration);
  if (existing) {
    failOnViolations(validateResourceDescriptors([existing], { requireAll: false }));
    if (existing.hostPort !== String(configuration.port)) {
      throw new Fnd005Error(
        `FND005_RESOURCE_PORT_MISMATCH expected=${configuration.port} actual=${existing.hostPort ?? "missing"}`,
      );
    }
    if (existing.running) {
      return;
    }
  }
  failOnViolations(
    validatePortAvailability({
      available: await isPortAvailable(configuration.port),
      canonicalContainerRunning: existing?.running === true,
      port: configuration.port,
    }),
  );
}

export async function localPreflight({ argv = [], checkPort = true, requireSecrets = true } = {}) {
  const values = await loadEnvironment();
  const invocationEnvironment = { ...process.env, ...values };
  failOnViolations(validateInvocation({ argv, env: invocationEnvironment }));
  if (requireSecrets) {
    failOnViolations(validateSecrets(values));
  }
  failOnViolations(validateTopology(canonicalTopology.databases));
  failOnViolations(await validateStaticFnd005(repositoryRoot));
  await assertCanonicalPaths();

  if (process.platform !== "win32") {
    throw new Fnd005Error(`FND005_WINDOWS_11_REQUIRED platform=${process.platform}`);
  }

  const configuration = {
    environmentFileExists: existsSync(localEnvironmentPath),
    port: Number(values.TRAZACTIVO_SQL_PORT ?? "14333"),
    values,
  };

  requiredCommand(
    "pwsh",
    ["-NoLogo", "-NoProfile", "-Command", "if ($PSVersionTable.PSVersion.Major -lt 7) { exit 1 }"],
    configuration,
  );
  requiredCommand("wsl.exe", ["--status"], configuration);
  requiredCommand("docker", ["compose", "version"], configuration);
  const context = requiredCommand("docker", ["context", "show"], configuration);
  if (context !== canonicalTopology.dockerContext) {
    throw new Fnd005Error(`FND005_GUARD_DOCKER_CONTEXT_REJECTED ${context || "missing"}`);
  }
  const endpoint = requiredCommand(
    "docker",
    [
      "context",
      "inspect",
      canonicalTopology.dockerContext,
      "--format",
      "{{.Endpoints.docker.Host}}",
    ],
    configuration,
  );
  failOnViolations(validateDockerEndpoint(endpoint));
  let engineVersion;
  try {
    engineVersion = requiredCommand(
      "docker",
      ["version", "--format", "{{.Server.Version}}"],
      configuration,
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Fnd005Error(
      `FND005_DOCKER_ENGINE_UNAVAILABLE context=${canonicalTopology.dockerContext}\n${detail}`,
    );
  }
  if (checkPort) {
    await verifyPort(configuration);
  }

  console.log(
    `LOCAL_PREFLIGHT_OK context=${canonicalTopology.dockerContext} engine=${engineVersion} port=${configuration.port}`,
  );
  return configuration;
}

function sqlCommand(configuration, { database, input, password, query, user }) {
  const containerScript = [
    "set -eu",
    "IFS= read -r SQLCMDPASSWORD",
    "export SQLCMDPASSWORD",
    'test -x /opt/mssql-tools18/bin/sqlcmd || { echo "FND005_SQLCMD_MISSING" >&2; exit 127; }',
    'exec /opt/mssql-tools18/bin/sqlcmd "$@"',
  ].join("; ");
  const sqlArguments = ["-S", "localhost", "-U", user, "-d", database, "-C", "-b", "-V", "16"];
  if (query !== undefined) {
    sqlArguments.push("-h", "-1", "-W", "-w", "65535", "-Q", query);
  } else {
    sqlArguments.push("-i", "/dev/stdin");
  }
  const payload = `${password}\n${input ?? ""}`;
  return command(
    "docker",
    [
      ...composeBaseArguments(configuration),
      "exec",
      "-T",
      canonicalTopology.serviceName,
      "bash",
      "-lc",
      containerScript,
      "fnd005-sqlcmd",
      ...sqlArguments,
    ],
    { env: { ...process.env, ...configuration.values }, input: payload },
  );
}

function requiredSql(configuration, options) {
  const result = sqlCommand(configuration, options);
  if (result.error || result.status !== 0) {
    const detail = redactSensitiveText(
      [result.error?.message, result.stderr, result.stdout].filter(Boolean).join("\n").trim(),
      configuration.values,
    );
    throw new Fnd005Error(
      `FND005_SQL_FAILED target=${options.database} exit=${result.status}${detail ? `\n${detail}` : ""}`,
    );
  }
  return result.stdout.trim();
}

function sqlIdentifier(value) {
  if (!/^[a-z_]+$/u.test(value)) {
    throw new Fnd005Error("FND005_SQL_IDENTIFIER_REJECTED");
  }
  return `[${value}]`;
}

function sqlLiteral(value) {
  return `N'${value.replaceAll("'", "''")}'`;
}

export function databaseCreationSql() {
  const lines = ["SET NOCOUNT ON;"];
  for (const entry of canonicalTopology.databases) {
    const database = sqlIdentifier(entry.database);
    lines.push(
      `IF DB_ID(${sqlLiteral(entry.database)}) IS NULL EXEC(N'CREATE DATABASE ${database}');`,
    );
  }
  return `${lines.join("\n")}\n`;
}

export function loginBootstrapSql(configuration) {
  const lines = ["SET NOCOUNT ON;"];
  for (const entry of canonicalTopology.databases) {
    const login = sqlIdentifier(entry.user);
    const database = sqlIdentifier(entry.database);
    const password = sqlLiteral(configuration.values[entry.passwordVariable]);
    lines.push(
      `IF SUSER_ID(${sqlLiteral(entry.user)}) IS NULL BEGIN CREATE LOGIN ${login} WITH PASSWORD = ${password}, CHECK_POLICY = ON, CHECK_EXPIRATION = OFF, DEFAULT_DATABASE = ${database}; END ELSE BEGIN ALTER LOGIN ${login} WITH CHECK_POLICY = ON, CHECK_EXPIRATION = OFF, DEFAULT_DATABASE = ${database}; END;`,
    );
  }
  return `${lines.join("\n")}\n`;
}

export function databaseUserSql(entry) {
  const login = sqlIdentifier(entry.user);
  return `${[
    "SET NOCOUNT ON;",
    `IF DB_NAME() <> ${sqlLiteral(entry.database)} THROW 51000, 'FND005_DATABASE_TARGET_MISMATCH', 1;`,
    `IF USER_ID(${sqlLiteral(entry.user)}) IS NULL BEGIN CREATE USER ${login} FOR LOGIN ${login}; END ELSE BEGIN ALTER USER ${login} WITH LOGIN = ${login}; END;`,
    `GRANT CONNECT TO ${login};`,
  ].join("\n")}\n`;
}

export async function runDatabaseBootstrapWorkflow(entries, operations) {
  await operations.createDatabases();
  await operations.verifyDatabases();
  await operations.configureLogins();
  await operations.verifyLogins();
  for (const entry of entries) {
    await operations.verifyDatabaseTarget(entry);
    await operations.configureUser(entry);
    await operations.verifyUser(entry);
  }
}

function outputLines(output) {
  return output
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);
}

function verifyDatabaseSet(configuration) {
  const expectedNames = canonicalTopology.databases.map(({ database }) => database).sort();
  const query = [
    "SET NOCOUNT ON;",
    "SELECT name FROM sys.databases",
    `WHERE name IN (${expectedNames.map(sqlLiteral).join(", ")})`,
    "ORDER BY name;",
  ].join(" ");
  const actualNames = outputLines(
    requiredSql(configuration, {
      database: "master",
      password: configuration.values.MSSQL_SA_PASSWORD,
      query,
      user: "sa",
    }),
  ).sort();
  if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
    throw new Fnd005Error(
      `FND005_DATABASE_SET_INVALID expected=${expectedNames.join(",")} actual=${actualNames.join(",")}`,
    );
  }
}

function verifyLoginDefaults(configuration) {
  const entries = [...canonicalTopology.databases].sort((left, right) =>
    left.user.localeCompare(right.user),
  );
  const query = [
    "SET NOCOUNT ON;",
    "SELECT CONCAT(principal.name, N'|', principal.default_database_name, N'|', login.is_policy_checked, N'|', login.is_expiration_checked)",
    "FROM sys.server_principals AS principal",
    "INNER JOIN sys.sql_logins AS login ON login.principal_id = principal.principal_id",
    `WHERE principal.name IN (${entries.map(({ user }) => sqlLiteral(user)).join(", ")})`,
    "ORDER BY principal.name;",
  ].join(" ");
  const actual = outputLines(
    requiredSql(configuration, {
      database: "master",
      password: configuration.values.MSSQL_SA_PASSWORD,
      query,
      user: "sa",
    }),
  );
  const expected = entries.map(({ database, user }) => `${user}|${database}|1|0`);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Fnd005Error("FND005_LOGIN_DEFAULTS_INVALID");
  }
}

function verifyDatabaseTarget(configuration, entry) {
  const [actual, ...unexpected] = outputLines(
    requiredSql(configuration, {
      database: entry.database,
      password: configuration.values.MSSQL_SA_PASSWORD,
      query: "SET NOCOUNT ON; SELECT DB_NAME();",
      user: "sa",
    }),
  );
  if (actual !== entry.database || unexpected.length > 0) {
    throw new Fnd005Error(
      `FND005_DATABASE_TARGET_INVALID reference=${entry.reference} expected=${entry.database}`,
    );
  }
}

function queryEntry(configuration, entry, database = entry.database) {
  return requiredSql(configuration, {
    database,
    password: configuration.values[entry.passwordVariable],
    query: "SET NOCOUNT ON; SELECT CONCAT(DB_NAME(), N'|', ORIGINAL_LOGIN(), N'|', USER_NAME());",
    user: entry.user,
  });
}

function verifyDatabaseUser(configuration, entry) {
  const [identity, ...unexpected] = outputLines(queryEntry(configuration, entry));
  const expected = `${entry.database}|${entry.user}|${entry.user}`;
  if (identity !== expected || unexpected.length > 0) {
    throw new Fnd005Error(
      `FND005_DATABASE_USER_INVALID reference=${entry.reference} database=${entry.database}`,
    );
  }
}

export async function ensureDatabases(configuration) {
  await runDatabaseBootstrapWorkflow(canonicalTopology.databases, {
    configureLogins: () =>
      requiredSql(configuration, {
        database: "master",
        input: loginBootstrapSql(configuration),
        password: configuration.values.MSSQL_SA_PASSWORD,
        user: "sa",
      }),
    configureUser: (entry) =>
      requiredSql(configuration, {
        database: entry.database,
        input: databaseUserSql(entry),
        password: configuration.values.MSSQL_SA_PASSWORD,
        user: "sa",
      }),
    createDatabases: () =>
      requiredSql(configuration, {
        database: "master",
        input: databaseCreationSql(),
        password: configuration.values.MSSQL_SA_PASSWORD,
        user: "sa",
      }),
    verifyDatabaseTarget: (entry) => verifyDatabaseTarget(configuration, entry),
    verifyDatabases: () => verifyDatabaseSet(configuration),
    verifyLogins: () => verifyLoginDefaults(configuration),
    verifyUser: (entry) => verifyDatabaseUser(configuration, entry),
  });
}

function expectSqlFailure(configuration, options) {
  const result = sqlCommand(configuration, options);
  if (result.status === 0) {
    throw new Fnd005Error(`FND005_ISOLATION_EXPECTED_DENIAL_MISSING target=${options.database}`);
  }
  const diagnostic = redactSensitiveText(
    `${result.stderr}\n${result.stdout}`,
    configuration.values,
  );
  if (!/cannot open database|is not able to access|login failed for user/iu.test(diagnostic)) {
    throw new Fnd005Error(
      `FND005_ISOLATION_DENIAL_NOT_PROVEN target=${options.database} exit=${result.status}`,
    );
  }
}

export function verifyDatabaseTopology(configuration) {
  verifyDatabaseSet(configuration);

  for (const entry of canonicalTopology.databases) {
    const [identity] = outputLines(queryEntry(configuration, entry));
    const expected = `${entry.database}|${entry.user}|${entry.user}`;
    if (identity !== expected) {
      throw new Fnd005Error(
        `FND005_DATABASE_IDENTITY_INVALID reference=${entry.reference} database=${entry.database}`,
      );
    }
  }

  const platform = canonicalTopology.databases.find(({ role }) => role === "platform");
  const clientA = canonicalTopology.databases.find(({ role }) => role === "client-a");
  const clientB = canonicalTopology.databases.find(({ role }) => role === "client-b");
  for (const [source, target] of [
    [clientA, clientB],
    [clientB, clientA],
    [platform, clientA],
  ]) {
    expectSqlFailure(configuration, {
      database: target.database,
      password: configuration.values[source.passwordVariable],
      query: "SET NOCOUNT ON; SELECT DB_NAME();",
      user: source.user,
    });
  }

  return canonicalTopology.databases.map(({ database, reference, role, user }) => ({
    database,
    reference,
    role,
    user,
  }));
}

function setDatabaseAvailability(configuration, database, online) {
  requiredSql(configuration, {
    database: "master",
    password: configuration.values.MSSQL_SA_PASSWORD,
    query: `ALTER DATABASE ${sqlIdentifier(database)} SET ${online ? "ONLINE" : "OFFLINE WITH ROLLBACK IMMEDIATE"};`,
    user: "sa",
  });
}

export function verifyClientAvailabilityIndependence(configuration) {
  const clientA = canonicalTopology.databases.find(({ role }) => role === "client-a");
  const clientB = canonicalTopology.databases.find(({ role }) => role === "client-b");
  try {
    setDatabaseAvailability(configuration, clientA.database, false);
    expectSqlFailure(configuration, {
      database: clientA.database,
      password: configuration.values[clientA.passwordVariable],
      query: "SET NOCOUNT ON; SELECT DB_NAME();",
      user: clientA.user,
    });
    const [databaseB] = outputLines(queryEntry(configuration, clientB));
    if (!databaseB?.startsWith(`${clientB.database}|`)) {
      throw new Fnd005Error("FND005_CLIENT_B_FALSE_UNAVAILABLE");
    }
  } finally {
    setDatabaseAvailability(configuration, clientA.database, true);
  }
  const [databaseA] = outputLines(queryEntry(configuration, clientA));
  if (!databaseA?.startsWith(`${clientA.database}|`)) {
    throw new Fnd005Error("FND005_CLIENT_A_RECOVERY_FAILED");
  }
}

export async function startLocalInfrastructure({ argv = [] } = {}) {
  const configuration = await localPreflight({ argv, checkPort: true });
  inspectCanonicalResources(configuration, { requireAll: false });
  runCompose(configuration, ["up", "--detach", "--wait", "--wait-timeout", "240", "sqlserver"]);
  inspectCanonicalResources(configuration, { requireAll: true });
  await ensureDatabases(configuration);
  const evidence = verifyDatabaseTopology(configuration);
  console.log(
    `LOCAL_UP_OK project=${canonicalTopology.projectName} databases=${evidence.map(({ database }) => database).join(",")}`,
  );
  return configuration;
}

export async function statusLocalInfrastructure({ argv = [] } = {}) {
  const configuration = await localPreflight({ argv, checkPort: false });
  inspectCanonicalResources(configuration, { requireAll: true });
  const evidence = verifyDatabaseTopology(configuration);
  for (const { database, reference, role, user } of evidence) {
    console.log(
      `LOCAL_DATABASE_READY role=${role} reference=${reference} database=${database} user=${user}`,
    );
  }
  console.log(`LOCAL_STATUS_OK project=${canonicalTopology.projectName}`);
  return configuration;
}

export async function stopLocalInfrastructure({ argv = [] } = {}) {
  const configuration = await localPreflight({ argv, checkPort: false });
  const resources = inspectCanonicalResources(configuration, { requireAll: false });
  if (resources.some(({ kind }) => kind === "container" || kind === "network")) {
    runCompose(configuration, ["down"]);
  }
  const remaining = inspectCanonicalResources(configuration, { requireAll: false });
  if (remaining.some(({ kind }) => kind === "container" || kind === "network")) {
    throw new Fnd005Error("FND005_LOCAL_DOWN_INCOMPLETE");
  }
  console.log(`LOCAL_DOWN_OK project=${canonicalTopology.projectName} data=preserved`);
}

export async function resetLocalInfrastructure({ argv = [] } = {}) {
  const configuration = await localPreflight({ argv, checkPort: false });
  const resources = inspectCanonicalResources(configuration, { requireAll: false });
  if (resources.length > 0) {
    runCompose(configuration, ["down", "--volumes"]);
  }
  const remaining = inspectCanonicalResources(configuration, { requireAll: false });
  if (remaining.length > 0) {
    throw new Fnd005Error("FND005_LOCAL_RESET_SCOPE_INCOMPLETE");
  }
  runCompose(configuration, ["up", "--detach", "--wait", "--wait-timeout", "240", "sqlserver"]);
  inspectCanonicalResources(configuration, { requireAll: true });
  await ensureDatabases(configuration);
  verifyDatabaseTopology(configuration);
  console.log(`LOCAL_RESET_OK project=${canonicalTopology.projectName}`);
}

export function reportFailure(error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
}
