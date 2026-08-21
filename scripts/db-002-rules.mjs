import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";

import { readJson, repositoryRoot } from "./toolchain.mjs";

export const db002PrismaVersion = "7.9.1";
export const clientSchemaPath = "database/client/prisma/schema.prisma";
export const clientGeneratedPath = "database/client/generated/client";

const exactVersion =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u;
const sourceExtensions = new Set([".cjs", ".cts", ".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"]);
const ignoredDirectories = new Set([
  ".git",
  ".next",
  "build",
  "coverage",
  "dist",
  "generated",
  "node_modules",
  "out",
]);

function toPosix(value) {
  return value.split(sep).join("/");
}

function hasAssignment(source, name, value) {
  return new RegExp(`\\b${name}\\s*=\\s*"${value.replaceAll("/", "\\/")}"`, "u").test(source);
}

export function clientSchemaViolations(source) {
  const violations = [];
  const requiredAssignments = [
    ["provider", "prisma-client"],
    ["output", "../generated/client"],
    ["runtime", "nodejs"],
    ["moduleFormat", "esm"],
    ["generatedFileExtension", "ts"],
    ["importFileExtension", "ts"],
  ];

  for (const [name, value] of requiredAssignments) {
    if (!hasAssignment(source, name, value)) {
      violations.push(`DB002_SCHEMA_GENERATOR_SETTING_INVALID ${name}`);
    }
  }
  if (!/datasource\s+client\s*\{[\s\S]*?provider\s*=\s*"sqlserver"[\s\S]*?\}/u.test(source)) {
    violations.push("DB002_SCHEMA_SQLSERVER_DATASOURCE_MISSING");
  }
  if (/datasource\s+platform\s*\{/u.test(source)) {
    violations.push("DB002_PLATFORM_DATASOURCE_PROHIBITED");
  }
  if (/\bpreviewFeatures\b/u.test(source)) {
    violations.push("DB002_PRISMA_PREVIEW_FEATURE_PROHIBITED");
  }
  if (/^\s*(?:model|view|enum|type)\s+\w+/gmu.test(source)) {
    violations.push("DB002_SCHEMA_MODEL_SURFACE_PROHIBITED");
  }
  if (/\b(?:url|directUrl|shadowDatabaseUrl)\s*=/u.test(source) || /\benv\s*\(/u.test(source)) {
    violations.push("DB002_SCHEMA_CONNECTION_CONFIGURATION_PROHIBITED");
  }

  return [...new Set(violations)].sort();
}

export function clientPrismaDependencyViolations(manifest) {
  const violations = [];
  const expected = [
    ["devDependencies", "prisma", db002PrismaVersion],
    ["dependencies", "@prisma/client", db002PrismaVersion],
    ["dependencies", "@prisma/adapter-mssql", db002PrismaVersion],
  ];

  for (const [section, name, version] of expected) {
    const observed = manifest[section]?.[name];
    if (observed !== version) {
      violations.push(
        `DB002_DEPENDENCY_VERSION_INVALID ${section}.${name}=${observed ?? "missing"}`,
      );
    }
    if (typeof observed === "string" && !exactVersion.test(observed)) {
      violations.push(`DB002_DEPENDENCY_VERSION_NOT_EXACT ${section}.${name}=${observed}`);
    }
  }

  if (
    manifest.devDependencies?.prisma !== manifest.dependencies?.["@prisma/client"] ||
    manifest.devDependencies?.prisma !== manifest.dependencies?.["@prisma/adapter-mssql"]
  ) {
    violations.push("DB002_PRISMA_VERSION_MISMATCH");
  }

  return [...new Set(violations)].sort();
}

export function clientGenerationEvidenceViolations(expected, observed) {
  const violations = [];
  for (const key of Object.keys(observed)) {
    if (expected?.[key] !== observed[key]) {
      violations.push(`DB002_GENERATED_CLIENT_DRIFT ${key}`);
    }
  }
  return violations.sort();
}

function importSpecifiers(source) {
  const values = [];
  const patterns = [
    /\b(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/gu,
    /\b(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/gu,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1]) {
        values.push(match[1]);
      }
    }
  }
  return values;
}

export function clientPrismaImportViolations(files) {
  const violations = [];
  for (const [path, source] of Object.entries(files)) {
    for (const specifier of importSpecifiers(source)) {
      const prismaPackage = specifier === "prisma" || specifier.startsWith("@prisma/");
      const generatedClient =
        specifier.includes("database/client/generated/client") ||
        specifier.includes("client/generated/client") ||
        (path.startsWith("database/client/") && specifier.includes("../generated/client"));
      const existingPlatformInfrastructure =
        path === "database/platform/infrastructure/platform-prisma.ts";

      if (generatedClient) {
        violations.push(`DB002_CLIENT_PRISMA_RUNTIME_IMPORT_PROHIBITED ${path} -> ${specifier}`);
      } else if (prismaPackage && !existingPlatformInfrastructure) {
        violations.push(
          `DB002_PRISMA_IMPORT_OUTSIDE_AUTHORIZED_INFRASTRUCTURE ${path} -> ${specifier}`,
        );
      }
    }
  }
  return [...new Set(violations)].sort();
}

export function clientScopePathViolations(paths) {
  const violations = [];
  for (const path of paths.map((value) => value.replaceAll("\\", "/"))) {
    if (/(?:^|\/)migrations(?:\/|$)/u.test(path)) {
      violations.push(`DB002_MIGRATION_SCOPE_PROHIBITED ${path}`);
    }
    if (/(?:^|\/)(?:seed|seeds|sentinel|sentinels)(?:[./-]|$)/iu.test(path)) {
      violations.push(`DB002_SEED_OR_SENTINEL_SCOPE_PROHIBITED ${path}`);
    }
  }
  return [...new Set(violations)].sort();
}

export function clientMutationCommandViolations(files) {
  const violations = [];
  const mutationPattern =
    /\bprisma\s+(?:migrate\s+(?:dev|deploy)|db\s+push)\b|\bdb:client:(?:migrate|seed)\b/iu;
  for (const [path, source] of Object.entries(files)) {
    if (mutationPattern.test(source)) {
      violations.push(`DB002_DATABASE_MUTATION_COMMAND_PROHIBITED ${path}`);
    }
  }
  return [...new Set(violations)].sort();
}

export function clientSelectorViolations(files) {
  const violations = [];
  const clientIdNearTarget =
    /(?:client[\s_-]*id|x-client)[\s\S]{0,200}(?:database|datasource|connection|string|reference|generated[\\/]client)|(?:database|datasource|connection|string|reference|generated[\\/]client)[\s\S]{0,200}(?:client[\s_-]*id|x-client)/iu;
  const requestNearTarget =
    /(?:headers?|query|body|cookies?|browserState|requestInput)[\s\S]{0,200}(?:database|datasource|connection|string|reference|generated[\\/]client)/iu;
  for (const [path, source] of Object.entries(files)) {
    if (clientIdNearTarget.test(source) || requestNearTarget.test(source)) {
      violations.push(`DB002_REQUEST_DATABASE_SELECTOR_PROHIBITED ${path}`);
    }
  }
  return [...new Set(violations)].sort();
}

async function listFiles(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    if (entry.isSymbolicLink() || ignoredDirectories.has(entry.name)) {
      continue;
    }
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }
  return files;
}

async function authoredSources(root, roots) {
  const authored = {};
  for (const sourceRoot of roots) {
    for (const path of await listFiles(resolve(root, sourceRoot))) {
      if (sourceExtensions.has(extname(path).toLowerCase())) {
        authored[toPosix(relative(root, path))] = await readFile(path, "utf8");
      }
    }
  }
  return authored;
}

export async function validateStaticDb002(root = repositoryRoot) {
  const violations = [];
  const manifest = await readJson(resolve(root, "package.json"));
  const schema = await readFile(resolve(root, clientSchemaPath), "utf8");
  const gitattributes = await readFile(resolve(root, ".gitattributes"), "utf8");
  const gitignore = await readFile(resolve(root, ".gitignore"), "utf8");
  const runSuite = await readFile(resolve(root, "scripts/run-suite.mjs"), "utf8");
  const typecheck = await readFile(resolve(root, "scripts/typecheck.mjs"), "utf8");
  const verify = await readFile(resolve(root, "scripts/verify.mjs"), "utf8");

  violations.push(...clientPrismaDependencyViolations(manifest));
  violations.push(...clientSchemaViolations(schema));

  const expectedScripts = {
    "db:client:generate": "node scripts/db-002-cli.mjs generate",
    "db:client:validate": "node scripts/db-002-cli.mjs validate",
  };
  for (const [name, command] of Object.entries(expectedScripts)) {
    if (manifest.scripts?.[name] !== command) {
      violations.push(`DB002_ROOT_SCRIPT_INVALID ${name}`);
    }
  }

  if (!gitignore.includes(`${clientGeneratedPath}/`)) {
    violations.push("DB002_GENERATED_CLIENT_IGNORE_MISSING");
  }
  for (const extension of ["json", "md", "prisma", "ts"]) {
    if (!gitattributes.includes(`/database/**/*.${extension} text eol=lf`)) {
      violations.push(`DB002_DATABASE_LF_POLICY_MISSING extension=${extension}`);
    }
  }
  if (!runSuite.includes('project === "client-prisma-foundation"')) {
    violations.push("DB002_UNIT_PROJECT_DISPATCH_MISSING");
  }
  if (!typecheck.includes('"database/client/tsconfig.json"')) {
    violations.push("DB002_TYPECHECK_DISPATCH_MISSING");
  }
  const generateIndex = verify.indexOf('"db:client:generate"');
  const validateIndex = verify.indexOf('"db:client:validate"');
  const typecheckIndex = verify.indexOf('"typecheck"');
  if (generateIndex < 0 || validateIndex <= generateIndex || typecheckIndex <= validateIndex) {
    violations.push("DB002_VERIFY_ORDER_INVALID");
  }

  const importSources = await authoredSources(root, [
    "apps",
    "packages",
    "database/platform/infrastructure",
    "database/client/infrastructure",
    "scripts",
  ]);
  const productionImportSources = Object.fromEntries(
    Object.entries(importSources).filter(
      ([path]) =>
        !path.includes("/tests/") &&
        !/\.(?:architecture\.)?(?:spec|test)\.[cm]?[jt]sx?$/u.test(path),
    ),
  );
  violations.push(...clientPrismaImportViolations(productionImportSources));
  const selectorSources = await authoredSources(root, [
    "apps",
    "packages",
    "database/client/infrastructure",
  ]);
  const productionSelectorSources = Object.fromEntries(
    Object.entries(selectorSources).filter(
      ([path]) => !path.includes("/tests/") && !/\.(?:spec|test)\.[cm]?[jt]sx?$/u.test(path),
    ),
  );
  violations.push(...clientSelectorViolations(productionSelectorSources));

  const clientPaths = (await listFiles(resolve(root, "database/client"))).map((path) =>
    toPosix(relative(root, path)),
  );
  violations.push(...clientScopePathViolations(clientPaths));
  if (existsSync(resolve(root, "database/client/prisma/migrations"))) {
    violations.push("DB002_MIGRATION_DIRECTORY_PROHIBITED");
  }

  const mutationSources = {
    "package.json": JSON.stringify(manifest.scripts ?? {}),
    "scripts/db-002-cli.mjs": await readFile(resolve(root, "scripts/db-002-cli.mjs"), "utf8"),
  };
  violations.push(...clientMutationCommandViolations(mutationSources));

  if (clientGeneratedPath === "database/platform/generated/client") {
    violations.push("DB002_PLATFORM_CLIENT_OUTPUT_SHARED");
  }

  try {
    const trackedGenerated = execFileSync("git", ["ls-files", "--", clientGeneratedPath], {
      cwd: root,
      encoding: "utf8",
    }).trim();
    if (trackedGenerated.length > 0) {
      violations.push("DB002_GENERATED_CLIENT_TRACKED");
    }
  } catch {
    violations.push("DB002_GENERATED_CLIENT_TRACKING_CHECK_FAILED");
  }

  return [...new Set(violations)].sort();
}
