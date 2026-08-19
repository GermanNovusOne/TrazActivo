import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, test } from "vitest";

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
import {
  databaseCreationSql,
  databaseUserSql,
  loginBootstrapSql,
  runDatabaseBootstrapWorkflow,
} from "./fnd-005-runtime.mjs";
import { repositoryRoot } from "./toolchain.mjs";

const localGuardEnvironment = {
  TRAZACTIVO_LOCAL_CONFIRMATION: "FND-005",
  TRAZACTIVO_LOCAL_ENV: "development",
};

function descriptor(kind, name, extraLabels = {}) {
  return {
    kind,
    labels: {
      ...canonicalTopology.labels,
      "com.docker.compose.project": canonicalTopology.projectName,
      ...(kind === "container"
        ? { "com.docker.compose.service": canonicalTopology.serviceName }
        : {}),
      ...extraLabels,
    },
    name,
  };
}

describe("FND-005 local infrastructure architecture", () => {
  test("the repository exposes a pinned canonical SQL Server topology", async () => {
    await expect(validateStaticFnd005(repositoryRoot)).resolves.toEqual([]);
    expect(canonicalTopology.image).toMatch(
      /^mcr\.microsoft\.com\/mssql\/server:2022-CU\d+-ubuntu-22\.04@sha256:[a-f\d]{64}$/u,
    );
    expect(canonicalTopology.image).not.toContain("latest");
  });

  test("Platform, Client A and Client B have distinct database references, targets and users", () => {
    expect(validateTopology(canonicalTopology.databases)).toEqual([]);
    expect(new Set(canonicalTopology.databases.map(({ database }) => database)).size).toBe(3);
    expect(new Set(canonicalTopology.databases.map(({ reference }) => reference)).size).toBe(3);
    expect(new Set(canonicalTopology.databases.map(({ user }) => user)).size).toBe(3);
  });

  test("one database split into Client A and B schemas is rejected", () => {
    const invalid = canonicalTopology.databases.map((entry) => ({
      ...entry,
      database: entry.role === "platform" ? entry.database : "shared_client_database",
      target: entry.role === "platform" ? entry.database : "shared_client_database",
    }));
    expect(validateTopology(invalid)).toContain(
      "FND005_TOPOLOGY_DATABASE_COLLISION shared_client_database",
    );
  });

  test("remote Docker endpoints and all destructive target overrides are rejected", () => {
    expect(
      validateInvocation({
        env: { ...localGuardEnvironment, DOCKER_HOST: "tcp://remote.invalid:2375" },
      }),
    ).toContain("FND005_GUARD_OVERRIDE_REJECTED DOCKER_HOST");
    expect(
      validateInvocation({
        env: { ...localGuardEnvironment, COMPOSE_PROJECT_NAME: "unapproved" },
      }),
    ).toContain("FND005_GUARD_OVERRIDE_REJECTED COMPOSE_PROJECT_NAME");
    expect(
      validateInvocation({ env: { ...localGuardEnvironment, COMPOSE_FILE: "other.yml" } }),
    ).toContain("FND005_GUARD_OVERRIDE_REJECTED COMPOSE_FILE");
    expect(
      validateInvocation({
        env: { ...localGuardEnvironment, TRAZACTIVO_DATABASE_TARGET: "arbitrary" },
      }),
    ).toContain("FND005_GUARD_OVERRIDE_REJECTED TRAZACTIVO_DATABASE_TARGET");
    expect(
      validateInvocation({ argv: ["--project", "other"], env: localGuardEnvironment }),
    ).toContain("FND005_GUARD_CLI_ARGUMENTS_REJECTED");
  });

  test("effective secrets are required, distinct and redacted from diagnostics", () => {
    const secrets = {
      MSSQL_SA_PASSWORD: `Aa1!${"s".repeat(16)}`,
      TRAZACTIVO_CLIENT_A_DB_PASSWORD: `Aa1!${"a".repeat(16)}`,
      TRAZACTIVO_CLIENT_B_DB_PASSWORD: `Aa1!${"b".repeat(16)}`,
      TRAZACTIVO_PLATFORM_DB_PASSWORD: `Aa1!${"p".repeat(16)}`,
    };

    expect(validateSecrets(secrets)).toEqual([]);
    expect(
      validateSecrets({ ...secrets, TRAZACTIVO_CLIENT_B_DB_PASSWORD: secrets.MSSQL_SA_PASSWORD }),
    ).toContain("FND005_SECRET_REUSE_REJECTED");
    const diagnostic = redactSensitiveText(
      `login failed password=${secrets.TRAZACTIVO_CLIENT_A_DB_PASSWORD}`,
      secrets,
    );
    expect(diagnostic).toBe("login failed password=[REDACTED]");
  });

  test("only the Docker Desktop Linux local endpoint is accepted", () => {
    expect(validateDockerEndpoint(canonicalTopology.dockerEndpoint)).toEqual([]);
    expect(validateDockerEndpoint("tcp://127.0.0.1:2375")[0]).toMatch(
      /FND005_GUARD_DOCKER_ENDPOINT_REJECTED/u,
    );
    expect(validateDockerEndpoint("ssh://remote.invalid")[0]).toMatch(
      /FND005_GUARD_DOCKER_ENDPOINT_REJECTED/u,
    );
  });

  test("a port collision fails unless the canonical container already owns the port", () => {
    expect(
      validatePortAvailability({
        available: false,
        canonicalContainerRunning: false,
        port: 14333,
      }),
    ).toEqual(["FND005_PORT_COLLISION port=14333"]);
    expect(
      validatePortAvailability({
        available: false,
        canonicalContainerRunning: true,
        port: 14333,
      }),
    ).toEqual([]);
  });

  test("canonical labels and resource names are required before destructive operations", () => {
    const valid = [
      descriptor("container", canonicalTopology.containerName),
      descriptor("network", canonicalTopology.networkName),
      descriptor("volume", canonicalTopology.volumeName),
    ];
    expect(validateResourceDescriptors(valid)).toEqual([]);
    expect(
      validateResourceDescriptors([...valid.slice(0, 2), descriptor("volume", "external-volume")]),
    ).toContain("FND005_RESOURCE_UNRECOGNIZED volume:external-volume");
    expect(
      validateResourceDescriptors([
        ...valid.slice(0, 2),
        descriptor("volume", canonicalTopology.volumeName, {
          "com.trazactivo.scope": "external",
        }),
      ]),
    ).toContain("FND005_RESOURCE_LABEL_MISMATCH volume:com.trazactivo.scope");
  });

  test("the destructive command allowlist cannot expand beyond canonical Compose operations", () => {
    expect(validateComposeOperation(["down"])).toEqual([]);
    expect(validateComposeOperation(["down", "--volumes"])).toEqual([]);
    expect(validateComposeOperation(["down", "--remove-orphans"])[0]).toMatch(
      /FND005_DESTRUCTIVE_SCOPE_REJECTED/u,
    );
    expect(validateComposeOperation(["volume", "prune"])[0]).toMatch(
      /FND005_DESTRUCTIVE_SCOPE_REJECTED/u,
    );
  });

  test("bootstrap SQL keeps databases, logins and users in independently executable phases", () => {
    const configuration = {
      values: Object.fromEntries([
        ["MSSQL_SA_PASSWORD", `Aa1!${"s".repeat(16)}`],
        ...canonicalTopology.databases.map(({ passwordVariable, role }) => [
          passwordVariable,
          `Aa1!${role.replaceAll("-", "").padEnd(16, "x")}`,
        ]),
      ]),
    };
    const createSql = databaseCreationSql();
    const loginSql = loginBootstrapSql(configuration);

    expect(createSql).toContain("CREATE DATABASE");
    expect(createSql).not.toContain("DEFAULT_DATABASE");
    expect(createSql).not.toContain("CREATE LOGIN");
    expect(loginSql.match(/PASSWORD =/gu)).toHaveLength(canonicalTopology.databases.length);
    for (const entry of canonicalTopology.databases) {
      expect(createSql).not.toContain(`USE [${entry.database}]`);
      expect(loginSql).toContain(`DEFAULT_DATABASE = [${entry.database}]`);
      expect(loginSql).not.toContain("CREATE DATABASE");

      const userSql = databaseUserSql(entry);
      expect(userSql).not.toContain("DEFAULT_DATABASE");
      expect(userSql).not.toContain(`USE [${entry.database}]`);
      expect(userSql.indexOf("IF DB_NAME() <>")).toBeLessThan(userSql.indexOf("CREATE USER"));
    }
  });

  test("bootstrap from zero verifies every phase before configuring logins or database users", async () => {
    const entries = canonicalTopology.databases;
    const databases = new Set();
    const validatedTargets = new Set();
    const logins = new Map();
    const users = new Set();
    const events = [];
    let databaseSetVerified = false;

    const operations = {
      createDatabases: () => {
        databaseSetVerified = false;
        validatedTargets.clear();
        for (const { database } of entries) databases.add(database);
        events.push("databases:create");
      },
      verifyDatabases: () => {
        expect([...databases].sort()).toEqual(entries.map(({ database }) => database).sort());
        databaseSetVerified = true;
        events.push("databases:verify");
      },
      configureLogins: () => {
        expect(databaseSetVerified).toBe(true);
        for (const { database, user } of entries) {
          expect(databases.has(database)).toBe(true);
          logins.set(user, database);
        }
        events.push("logins:configure");
      },
      verifyLogins: () => {
        expect([...logins]).toEqual(entries.map(({ database, user }) => [user, database]));
        events.push("logins:verify");
      },
      verifyDatabaseTarget: (entry) => {
        expect(databases.has(entry.database)).toBe(true);
        expect(logins.get(entry.user)).toBe(entry.database);
        validatedTargets.add(entry.database);
        events.push(`target:verify:${entry.database}`);
      },
      configureUser: (entry) => {
        expect(validatedTargets.has(entry.database)).toBe(true);
        users.add(`${entry.database}|${entry.user}`);
        events.push(`user:configure:${entry.database}`);
      },
      verifyUser: (entry) => {
        expect(users.has(`${entry.database}|${entry.user}`)).toBe(true);
        events.push(`user:verify:${entry.database}`);
      },
    };

    await runDatabaseBootstrapWorkflow(entries, operations);
    await runDatabaseBootstrapWorkflow(entries, operations);

    expect(events.slice(0, 4)).toEqual([
      "databases:create",
      "databases:verify",
      "logins:configure",
      "logins:verify",
    ]);
    for (const entry of entries) {
      expect(events.indexOf(`target:verify:${entry.database}`)).toBeLessThan(
        events.indexOf(`user:configure:${entry.database}`),
      );
      expect(events.indexOf(`user:configure:${entry.database}`)).toBeLessThan(
        events.indexOf(`user:verify:${entry.database}`),
      );
    }
    expect(databases.size).toBe(entries.length);
    expect(logins.size).toBe(entries.length);
    expect(users.size).toBe(entries.length);
  });

  test("reset rejects a remote endpoint before contacting Docker", () => {
    const result = spawnSync(
      process.execPath,
      [resolve(repositoryRoot, "scripts/local-reset.mjs")],
      {
        cwd: repositoryRoot,
        encoding: "utf8",
        env: {
          ...process.env,
          ...localGuardEnvironment,
          DOCKER_HOST: "tcp://remote.invalid:2375",
        },
      },
    );
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

    expect(result.status).toBe(1);
    expect(output).toContain("FND005_GUARD_OVERRIDE_REJECTED DOCKER_HOST");
    expect(output).not.toContain("MSSQL_SA_PASSWORD");
  });

  test("down rejects arbitrary command-line scope before contacting Docker", () => {
    const result = spawnSync(
      process.execPath,
      [resolve(repositoryRoot, "scripts/local-down.mjs"), "--project", "other"],
      {
        cwd: repositoryRoot,
        encoding: "utf8",
        env: { ...process.env, ...localGuardEnvironment },
      },
    );
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

    expect(result.status).toBe(1);
    expect(output).toContain("FND005_GUARD_CLI_ARGUMENTS_REJECTED");
  });

  test("the integration dispatcher rejects every non-authorized project", () => {
    const result = spawnSync(
      process.execPath,
      [resolve(repositoryRoot, "scripts/run-suite.mjs"), "test:integration", "--project", "future"],
      { cwd: repositoryRoot, encoding: "utf8" },
    );
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

    expect(result.status).toBe(2);
    expect(output).toContain("UNKNOWN_INTEGRATION_PROJECT future");
    expect(output).not.toContain("PROJECT_COMPLETE");
  });

  test("runtime scripts contain no global Docker deletion command", async () => {
    const source = await readFile(resolve(repositoryRoot, "scripts/fnd-005-runtime.mjs"), "utf8");
    const prohibitedCommands = [
      ["docker", "system", "prune"].join(" "),
      ["docker", "volume", "prune"].join(" "),
      ["docker", "container", "prune"].join(" "),
      ["docker", "network", "prune"].join(" "),
    ];
    for (const command of prohibitedCommands) {
      expect(source).not.toContain(command);
    }
  });
});
