import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { basename, dirname, extname, relative, resolve, sep } from "node:path";

import { readJson } from "./toolchain.mjs";

const ignoredDirectories = new Set([
  ".git",
  ".idea",
  ".vs",
  ".vscode",
  "artifacts",
  "bin",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "obj",
  "out",
]);
const sourceExtensions = new Set([".cjs", ".cts", ".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"]);
const commandFileExtensions = new Set([".bat", ".cmd", ".ps1", ".sh"]);
const legacyExtensions = new Set([
  ".cs",
  ".csproj",
  ".fs",
  ".fsproj",
  ".props",
  ".sln",
  ".targets",
  ".vb",
  ".vbproj",
]);
const legacyFileNames = new Set(["global.json"]);
const dependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
const requiredScripts = [
  "build",
  "db:generate",
  "db:migrate:local",
  "db:seed:local",
  "dev",
  "format:check",
  "lint",
  "local:down",
  "local:up",
  "test:a11y",
  "test:architecture",
  "test:contract",
  "test:e2e",
  "test:golden",
  "test:integration",
  "test:multiclient",
  "test:unit",
  "typecheck",
  "verify",
];
const exactVersion =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u;
const prohibitedRuntime = ["dot", "net"].join("");

function toPosix(filePath) {
  return filePath.split(sep).join("/");
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

    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(absolutePath)));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

function isLegacyStackPath(relativePath) {
  return (
    legacyExtensions.has(extname(relativePath).toLowerCase()) ||
    legacyFileNames.has(basename(relativePath).toLowerCase())
  );
}

function extractImportSpecifiers(source) {
  const specifiers = [];
  const patterns = [
    /\b(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/gu,
    /\b(?:import|require)\s*\(\s*["']([^"']+)["']\s*\)/gu,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1]) {
        specifiers.push(match[1]);
      }
    }
  }

  return specifiers;
}

async function readWorkspaceManifests(root, violations) {
  const records = [];
  for (const workspaceRoot of ["apps", "packages"]) {
    const directory = resolve(root, workspaceRoot);
    let entries;

    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        continue;
      }
      throw error;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const workspaceDirectory = resolve(directory, entry.name);
      const manifestPath = resolve(workspaceDirectory, "package.json");
      try {
        records.push({
          directory: workspaceDirectory,
          kind: workspaceRoot === "apps" ? "app" : "package",
          manifest: await readJson(manifestPath),
          path: toPosix(relative(root, manifestPath)),
          relativeDirectory: toPosix(relative(root, workspaceDirectory)),
        });
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
          violations.push(
            `WORKSPACE_MANIFEST_MISSING ${toPosix(relative(root, workspaceDirectory))}`,
          );
          continue;
        }
        violations.push(`WORKSPACE_MANIFEST_INVALID ${toPosix(relative(root, manifestPath))}`);
      }
    }
  }

  return records;
}

function dependencyEntries(manifest) {
  return dependencySections.flatMap((section) =>
    Object.entries(manifest[section] ?? {}).map(([name, version]) => ({ name, section, version })),
  );
}

async function validateLegacySurface(root, legacyRef, violations) {
  const allFiles = await listFiles(root);
  const legacyFiles = allFiles
    .map((file) => toPosix(relative(root, file)))
    .filter(isLegacyStackPath);

  if (!legacyRef) {
    for (const file of legacyFiles) {
      violations.push(`PROHIBITED_STACK_FILE ${file}`);
    }
    return;
  }

  let baselineFiles;
  try {
    baselineFiles = new Set(
      execFileSync("git", ["ls-tree", "-r", "--name-only", legacyRef], {
        cwd: root,
        encoding: "utf8",
      })
        .split(/\r?\n/u)
        .filter(Boolean),
    );
  } catch {
    violations.push(`LEGACY_BASELINE_UNAVAILABLE ${legacyRef}`);
    return;
  }

  const currentLegacyFiles = new Set(legacyFiles);
  for (const file of legacyFiles) {
    if (!baselineFiles.has(file)) {
      violations.push(`PROHIBITED_STACK_FILE_NEW ${file}`);
    }
  }

  try {
    const committedChanges = execFileSync(
      "git",
      ["diff", "--name-only", `${legacyRef}..HEAD`, "--"],
      {
        cwd: root,
        encoding: "utf8",
      },
    )
      .split(/\r?\n/u)
      .filter(Boolean);
    const workingTreeChanges = execFileSync(
      "git",
      ["status", "--porcelain=v1", "--untracked-files=all"],
      {
        cwd: root,
        encoding: "utf8",
      },
    )
      .split(/\r?\n/u)
      .filter(Boolean)
      .map((line) => line.slice(3).split(" -> ").at(-1));
    const changedFiles = new Set([...committedChanges, ...workingTreeChanges]);
    for (const file of changedFiles) {
      if (currentLegacyFiles.has(file) && baselineFiles.has(file)) {
        violations.push(`PRESERVED_STACK_MODIFIED ${file}`);
      }
    }
  } catch {
    violations.push(`LEGACY_BASELINE_COMPARE_FAILED ${legacyRef}`);
  }
}

export async function validateRepository(root, { legacyRef } = {}) {
  const violations = [];
  const rootManifestPath = resolve(root, "package.json");
  let rootManifest;

  try {
    rootManifest = await readJson(rootManifestPath);
  } catch {
    return ["ROOT_MANIFEST_INVALID package.json"];
  }

  if (JSON.stringify(rootManifest.workspaces) !== JSON.stringify(["apps/*", "packages/*"])) {
    violations.push("WORKSPACE_CONTRACT_INVALID expected=apps/*,packages/*");
  }

  for (const script of requiredScripts) {
    if (!Object.hasOwn(rootManifest.scripts ?? {}, script)) {
      violations.push(`ROOT_SCRIPT_MISSING ${script}`);
    }
  }

  for (const [name, command] of Object.entries(rootManifest.scripts ?? {})) {
    if (/\becho\b|--passWithNoTests|\bexit\s+0\b/iu.test(command)) {
      violations.push(`SIMULATED_SUCCESS_SCRIPT ${name}`);
    }
    if (new RegExp(`\\b${prohibitedRuntime}\\b`, "iu").test(command)) {
      violations.push(`PROHIBITED_STACK_COMMAND ${name}`);
    }
  }

  const workspaceRecords = await readWorkspaceManifests(root, violations);
  const manifestRecords = [
    { kind: "root", manifest: rootManifest, path: "package.json", relativeDirectory: "." },
    ...workspaceRecords,
  ];
  const appNames = new Map(
    workspaceRecords
      .filter(({ kind, manifest }) => kind === "app" && typeof manifest.name === "string")
      .map(({ manifest, relativeDirectory }) => [manifest.name, relativeDirectory]),
  );
  const seenNames = new Map();

  for (const record of manifestRecords) {
    if (typeof record.manifest.name === "string") {
      const prior = seenNames.get(record.manifest.name);
      if (prior) {
        violations.push(`WORKSPACE_NAME_DUPLICATE ${record.manifest.name} ${prior} ${record.path}`);
      } else {
        seenNames.set(record.manifest.name, record.path);
      }
    }

    for (const { name, section, version } of dependencyEntries(record.manifest)) {
      if (typeof version !== "string" || !exactVersion.test(version)) {
        violations.push(
          `DEPENDENCY_VERSION_NOT_EXACT ${record.path} ${section}.${name}=${version}`,
        );
      }
      if (name.toLowerCase().includes(prohibitedRuntime)) {
        violations.push(`PROHIBITED_STACK_DEPENDENCY ${record.path} ${name}`);
      }
      if (appNames.has(name) && record.manifest.name !== name) {
        violations.push(`APP_TO_APP_DEPENDENCY ${record.path} ${name}`);
      }
    }

    if (record.kind === "app" && record.manifest.private !== true) {
      violations.push(`APP_MUST_BE_PRIVATE ${record.path}`);
    }
  }

  if (workspaceRecords.some(({ relativeDirectory }) => relativeDirectory === "packages/common")) {
    violations.push("RESPONSIBILITY_FREE_PACKAGE packages/common");
  }

  for (const { directory, kind, manifest, relativeDirectory } of workspaceRecords) {
    const files = (await listFiles(directory)).filter((file) =>
      sourceExtensions.has(extname(file).toLowerCase()),
    );
    const currentAppName = kind === "app" ? manifest.name : undefined;
    const frontend = new Set(["apps/control-web", "apps/portal-web"]).has(relativeDirectory);
    const purePackage = new Set(["packages/domain", "packages/policy-engine"]).has(
      relativeDirectory,
    );

    for (const file of files) {
      const displayPath = toPosix(relative(root, file));
      const source = await readFile(file, "utf8");
      for (const specifier of extractImportSpecifiers(source)) {
        for (const [appName, appDirectory] of appNames) {
          if (
            appName !== currentAppName &&
            (specifier === appName || specifier.startsWith(`${appName}/`))
          ) {
            violations.push(`APP_TO_APP_IMPORT ${displayPath} -> ${appDirectory}`);
          }
        }

        if (specifier.startsWith(".")) {
          const target = resolve(dirname(file), specifier);
          for (const appDirectory of appNames.values()) {
            const absoluteAppDirectory = resolve(root, appDirectory);
            if (
              !displayPath.startsWith(`${appDirectory}/`) &&
              (target === absoluteAppDirectory ||
                target.startsWith(`${absoluteAppDirectory}${sep}`))
            ) {
              violations.push(`APP_TO_APP_IMPORT ${displayPath} -> ${appDirectory}`);
            }
          }
        }

        const prismaImport = specifier === "prisma" || specifier.startsWith("@prisma/");
        if (frontend && (prismaImport || specifier.includes("database"))) {
          violations.push(`FRONTEND_DATA_ACCESS ${displayPath} -> ${specifier}`);
        }
        if (
          prismaImport &&
          !displayPath.includes("/infrastructure/") &&
          !displayPath.includes("/adapters/persistence/")
        ) {
          violations.push(`PRISMA_OUTSIDE_INFRASTRUCTURE ${displayPath} -> ${specifier}`);
        }
        if (
          purePackage &&
          /^(?:@nestjs|@prisma|@azure|next(?:\/|$)|react(?:\/|$)|prisma$)/u.test(specifier)
        ) {
          violations.push(`PURE_PACKAGE_FRAMEWORK_DEPENDENCY ${displayPath} -> ${specifier}`);
        }
      }
    }
  }

  for (const activeRoot of ["apps", "packages", "scripts"]) {
    const activeFiles = await listFiles(resolve(root, activeRoot));
    for (const file of activeFiles) {
      const extension = extname(file).toLowerCase();
      if (!sourceExtensions.has(extension) && !commandFileExtensions.has(extension)) {
        continue;
      }
      const source = await readFile(file, "utf8");
      if (new RegExp(`\\b${prohibitedRuntime}\\b`, "iu").test(source)) {
        violations.push(`PROHIBITED_STACK_COMMAND ${toPosix(relative(root, file))}`);
      }
    }
  }

  for (const record of workspaceRecords) {
    const frontend = new Set(["apps/control-web", "apps/portal-web"]).has(record.relativeDirectory);
    const purePackage = new Set(["packages/domain", "packages/policy-engine"]).has(
      record.relativeDirectory,
    );
    for (const { name } of dependencyEntries(record.manifest)) {
      if (frontend && (name === "prisma" || name.startsWith("@prisma/"))) {
        violations.push(`FRONTEND_DATA_DEPENDENCY ${record.path} ${name}`);
      }
      if (purePackage && /^(?:@nestjs|@prisma|@azure|next$|react$|prisma$)/u.test(name)) {
        violations.push(`PURE_PACKAGE_FRAMEWORK_DEPENDENCY ${record.path} ${name}`);
      }
    }
  }

  await validateLegacySurface(root, legacyRef, violations);
  return [...new Set(violations)].sort();
}
