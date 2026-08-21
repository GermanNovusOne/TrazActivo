import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";

import { readJson, repositoryRoot } from "./toolchain.mjs";

export const db001PrismaVersion = "7.9.1";
export const platformSchemaPath = "database/platform/prisma/schema.prisma";
export const platformGeneratedPath = "database/platform/generated/client";

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

export function platformSchemaViolations(source) {
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
      violations.push(`DB001_SCHEMA_GENERATOR_SETTING_INVALID ${name}`);
    }
  }
  if (!/datasource\s+platform\s*\{[\s\S]*?provider\s*=\s*"sqlserver"[\s\S]*?\}/u.test(source)) {
    violations.push("DB001_SCHEMA_SQLSERVER_DATASOURCE_MISSING");
  }
  if (/\bpreviewFeatures\b/u.test(source)) {
    violations.push("DB001_PRISMA_PREVIEW_FEATURE_PROHIBITED");
  }
  if (/^\s*(?:model|view|enum|type)\s+\w+/gmu.test(source)) {
    violations.push("DB001_FUNCTIONAL_SCHEMA_SURFACE_PROHIBITED");
  }
  if (/\b(?:url|directUrl|shadowDatabaseUrl)\s*=/u.test(source) || /\benv\s*\(/u.test(source)) {
    violations.push("DB001_SCHEMA_CONNECTION_CONFIGURATION_PROHIBITED");
  }

  return [...new Set(violations)].sort();
}

export function prismaDependencyViolations(manifest) {
  const violations = [];
  const expected = [
    ["devDependencies", "prisma", db001PrismaVersion],
    ["dependencies", "@prisma/client", db001PrismaVersion],
    ["dependencies", "@prisma/adapter-mssql", db001PrismaVersion],
    ["devDependencies", "@types/mssql", "12.3.0"],
  ];

  for (const [section, name, version] of expected) {
    const observed = manifest[section]?.[name];
    if (observed !== version) {
      violations.push(
        `DB001_DEPENDENCY_VERSION_INVALID ${section}.${name}=${observed ?? "missing"}`,
      );
    }
    if (typeof observed === "string" && !exactVersion.test(observed)) {
      violations.push(`DB001_DEPENDENCY_VERSION_NOT_EXACT ${section}.${name}=${observed}`);
    }
  }

  if (manifest.devDependencies?.prisma !== manifest.dependencies?.["@prisma/client"]) {
    violations.push("DB001_PRISMA_CLIENT_VERSION_MISMATCH");
  }

  return [...new Set(violations)].sort();
}

export function generationEvidenceViolations(expected, observed) {
  const violations = [];
  for (const key of Object.keys(observed)) {
    if (expected?.[key] !== observed[key]) {
      violations.push(`DB001_GENERATED_CLIENT_DRIFT ${key}`);
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

export function authoredImportViolations(files) {
  const violations = [];
  for (const [path, source] of Object.entries(files)) {
    for (const specifier of importSpecifiers(source)) {
      const prismaPackage = specifier === "prisma" || specifier.startsWith("@prisma/");
      const generatedClient = specifier.includes("generated/client");
      const allowedInfrastructure = path === "database/platform/infrastructure/platform-prisma.ts";
      if ((prismaPackage || generatedClient) && !allowedInfrastructure) {
        violations.push(
          `DB001_PRISMA_IMPORT_OUTSIDE_PLATFORM_INFRASTRUCTURE ${path} -> ${specifier}`,
        );
      }
    }
  }
  return [...new Set(violations)].sort();
}

export function scopePathViolations(paths) {
  const violations = [];
  for (const path of paths.map((value) => value.replaceAll("\\", "/"))) {
    if (/(?:^|\/)migrations(?:\/|$)/u.test(path)) {
      violations.push(`DB001_MIGRATION_SCOPE_PROHIBITED ${path}`);
    }
    if (/(?:^|\/)(?:seed|seeds)(?:[./-]|$)/iu.test(path)) {
      violations.push(`DB001_SEED_SCOPE_PROHIBITED ${path}`);
    }
  }
  return [...new Set(violations)].sort();
}

async function listAuthoredSourceFiles(directory) {
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
      files.push(...(await listAuthoredSourceFiles(path)));
    } else if (entry.isFile() && sourceExtensions.has(extname(entry.name).toLowerCase())) {
      files.push(path);
    }
  }
  return files;
}

export async function validateStaticDb001(root = repositoryRoot) {
  const violations = [];
  const manifest = await readJson(resolve(root, "package.json"));
  const schema = await readFile(resolve(root, platformSchemaPath), "utf8");
  const gitattributes = await readFile(resolve(root, ".gitattributes"), "utf8");
  const gitignore = await readFile(resolve(root, ".gitignore"), "utf8");
  const runSuite = await readFile(resolve(root, "scripts/run-suite.mjs"), "utf8");
  const verify = await readFile(resolve(root, "scripts/verify.mjs"), "utf8");

  violations.push(...prismaDependencyViolations(manifest));
  violations.push(...platformSchemaViolations(schema));

  const expectedScripts = {
    "db:platform:generate": "node scripts/db-001-cli.mjs generate",
    "db:platform:validate": "node scripts/db-001-cli.mjs validate",
  };
  for (const [name, command] of Object.entries(expectedScripts)) {
    if (manifest.scripts?.[name] !== command) {
      violations.push(`DB001_ROOT_SCRIPT_INVALID ${name}`);
    }
  }

  if (!gitignore.includes(`${platformGeneratedPath}/`)) {
    violations.push("DB001_GENERATED_CLIENT_IGNORE_MISSING");
  }
  for (const extension of ["json", "md", "prisma", "ts"]) {
    if (!gitattributes.includes(`/database/**/*.${extension} text eol=lf`)) {
      violations.push(`DB001_DATABASE_LF_POLICY_MISSING extension=${extension}`);
    }
  }
  if (!runSuite.includes('project === "platform-prisma-foundation"')) {
    violations.push("DB001_PROJECT_DISPATCH_MISSING");
  }
  const generateIndex = verify.indexOf('"db:platform:generate"');
  const validateIndex = verify.indexOf('"db:platform:validate"');
  const typecheckIndex = verify.indexOf('"typecheck"');
  if (generateIndex < 0 || validateIndex <= generateIndex || typecheckIndex <= validateIndex) {
    violations.push("DB001_VERIFY_ORDER_INVALID");
  }

  const roots = ["apps", "packages", "database/platform/infrastructure"];
  const authored = {};
  for (const sourceRoot of roots) {
    for (const path of await listAuthoredSourceFiles(resolve(root, sourceRoot))) {
      authored[toPosix(relative(root, path))] = await readFile(path, "utf8");
    }
  }
  violations.push(...authoredImportViolations(authored));

  const scopePaths = [
    ...(await listAuthoredSourceFiles(resolve(root, "database"))).map((path) =>
      toPosix(relative(root, path)),
    ),
  ];
  violations.push(...scopePathViolations(scopePaths));
  if (existsSync(resolve(root, "database/platform/prisma/migrations"))) {
    violations.push("DB001_MIGRATION_DIRECTORY_PROHIBITED");
  }
  try {
    const trackedGenerated = execFileSync("git", ["ls-files", "--", platformGeneratedPath], {
      cwd: root,
      encoding: "utf8",
    }).trim();
    if (trackedGenerated.length > 0) {
      violations.push("DB001_GENERATED_CLIENT_TRACKED");
    }
  } catch {
    violations.push("DB001_GENERATED_CLIENT_TRACKING_CHECK_FAILED");
  }

  return [...new Set(violations)].sort();
}
