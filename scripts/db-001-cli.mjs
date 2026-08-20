import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { lstat, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { relative, resolve, sep } from "node:path";

import {
  db001PrismaVersion,
  generationEvidenceViolations,
  platformGeneratedPath,
  platformSchemaPath,
  platformSchemaViolations,
  prismaDependencyViolations,
} from "./db-001-rules.mjs";
import { readJson, repositoryRoot } from "./toolchain.mjs";

const generatedRoot = resolve(repositoryRoot, platformGeneratedPath);
const schemaPath = resolve(repositoryRoot, platformSchemaPath);
const generationManifestPath = resolve(generatedRoot, ".db001-generation.json");
const prismaCli = resolve(repositoryRoot, "node_modules/prisma/build/index.js");
const forbiddenEnvironment = ["DATABASE_URL", "PRISMA_CONFIG_PATH", "PRISMA_SCHEMA"];

function toPosix(value) {
  return value.split(sep).join("/");
}

function fail(violations) {
  if (violations.length > 0) {
    throw new Error(violations.join("\n"));
  }
}

async function sourceHash() {
  return createHash("sha256")
    .update(await readFile(schemaPath))
    .digest("hex");
}

async function generatedHash() {
  const hash = createHash("sha256");

  async function visit(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      const path = resolve(directory, entry.name);
      if (path === generationManifestPath) {
        continue;
      }
      if (entry.isSymbolicLink()) {
        throw new Error("DB001_GENERATED_SYMLINK_REJECTED");
      }
      if (entry.isDirectory()) {
        await visit(path);
      } else if (entry.isFile()) {
        hash.update(toPosix(relative(generatedRoot, path)));
        hash.update("\0");
        hash.update(await readFile(path));
        hash.update("\0");
      }
    }
  }

  await visit(generatedRoot);
  return hash.digest("hex");
}

function runPrisma(args) {
  if (!existsSync(prismaCli)) {
    return 127;
  }
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    cwd: repositoryRoot,
    env: process.env,
    stdio: "inherit",
  });
  if (result.error) {
    console.error("DB001_PRISMA_CLI_FAILED");
    return 1;
  }
  return result.status ?? 1;
}

async function validateAuthoredConfiguration() {
  const manifest = await readJson(resolve(repositoryRoot, "package.json"));
  const schema = await readFile(schemaPath, "utf8");
  fail([...prismaDependencyViolations(manifest), ...platformSchemaViolations(schema)]);
}

async function safelyClearGeneratedOutput() {
  const expected = resolve(repositoryRoot, "database/platform/generated/client");
  if (generatedRoot !== expected || !generatedRoot.startsWith(`${repositoryRoot}${sep}`)) {
    throw new Error("DB001_GENERATED_PATH_REJECTED");
  }
  if (existsSync(generatedRoot)) {
    const details = await lstat(generatedRoot);
    if (details.isSymbolicLink() || !details.isDirectory()) {
      throw new Error("DB001_GENERATED_PATH_TYPE_REJECTED");
    }
  }
  await rm(generatedRoot, { force: true, recursive: true });
}

async function generate() {
  await validateAuthoredConfiguration();
  await safelyClearGeneratedOutput();
  const status = runPrisma(["generate", "--schema", platformSchemaPath]);
  if (status !== 0) {
    process.exitCode = status;
    return;
  }
  if (!existsSync(resolve(generatedRoot, "client.ts"))) {
    throw new Error("DB001_GENERATED_CLIENT_ENTRY_MISSING");
  }

  const evidence = {
    filesSha256: await generatedHash(),
    format: 1,
    prismaVersion: db001PrismaVersion,
    schema: platformSchemaPath,
    schemaSha256: await sourceHash(),
  };
  await writeFile(generationManifestPath, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  console.log(
    `DB001_GENERATE_OK schema=${platformSchemaPath} output=${platformGeneratedPath} hash=${evidence.filesSha256}`,
  );
}

async function validate() {
  await validateAuthoredConfiguration();
  const status = runPrisma(["validate", "--schema", platformSchemaPath]);
  if (status !== 0) {
    process.exitCode = status;
    return;
  }
  if (!existsSync(generationManifestPath)) {
    throw new Error("DB001_GENERATION_EVIDENCE_MISSING");
  }
  const evidence = await readJson(generationManifestPath);
  const observed = {
    filesSha256: await generatedHash(),
    prismaVersion: db001PrismaVersion,
    schema: platformSchemaPath,
    schemaSha256: await sourceHash(),
  };
  fail(generationEvidenceViolations(evidence, observed));
  console.log(
    `DB001_VALIDATE_OK schema=${platformSchemaPath} output=${platformGeneratedPath} hash=${observed.filesSha256}`,
  );
}

const command = process.argv[2];
const forwardedArguments = process.argv.slice(3);
const environmentViolations = forbiddenEnvironment
  .filter((name) => typeof process.env[name] === "string" && process.env[name].trim().length > 0)
  .map((name) => `DB001_CONNECTION_OVERRIDE_REJECTED ${name}`);

try {
  fail(environmentViolations);
  if (forwardedArguments.length > 0) {
    throw new Error("DB001_CLI_ARGUMENTS_REJECTED");
  }
  if (command === "generate") {
    await generate();
  } else if (command === "validate") {
    await validate();
  } else {
    throw new Error("DB001_COMMAND_REJECTED");
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : "DB001_COMMAND_FAILED");
  process.exitCode = 1;
}
