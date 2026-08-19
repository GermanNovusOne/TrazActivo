import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";

const boundaryPackages = new Map(
  [
    "authorization",
    "client-context",
    "contracts",
    "domain",
    "observability",
    "policy-engine",
    "testkit",
  ].map((directory) => [directory, `@trazactivo/${directory}`]),
);
const emptyBoundaryPackages = new Set([
  "authorization",
  "client-context",
  "contracts",
  "domain",
  "observability",
  "policy-engine",
]);
const allowedPackageDirectories = new Set([...boundaryPackages.keys(), "design-system"]);
const dependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
const productionDependencySections = ["dependencies", "optionalDependencies", "peerDependencies"];
const sourceExtensions = new Set([".cts", ".mts", ".ts", ".tsx"]);
const purePackageDirectories = new Set(["domain", "policy-engine"]);
const clientContextSensitiveSurface =
  /\b(?:connection_?string|credentials?|database_?reference|database_?url|dbref|password|secrets?|tokens?)\b/iu;
const domainFunctionalSurface = /\b(?:AssetItem|Invariant|ValueObject)\b/u;
const prismaImport = /^(?:@prisma(?:\/|$)|prisma$)/u;

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
    if (entry.isSymbolicLink() || new Set(["dist", "node_modules"]).has(entry.name)) {
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

function dependencyEntries(manifest) {
  return dependencySections.flatMap((section) =>
    Object.keys(manifest[section] ?? {}).map((name) => ({ name, section })),
  );
}

function isTestSource(displayPath) {
  return (
    displayPath.includes("/tests/") ||
    displayPath.includes(".test.") ||
    displayPath.includes(".spec.")
  );
}

async function packageRecords(root, violations) {
  const packagesRoot = resolve(root, "packages");
  let entries;
  try {
    entries = await readdir(packagesRoot, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const records = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) {
      continue;
    }
    if (!allowedPackageDirectories.has(entry.name)) {
      violations.push(`FND004_UNAPPROVED_PACKAGE packages/${entry.name}`);
    }
    const manifestPath = resolve(packagesRoot, entry.name, "package.json");
    try {
      records.push({
        directory: entry.name,
        manifest: JSON.parse(await readFile(manifestPath, "utf8")),
      });
    } catch {
      violations.push(`FND004_PACKAGE_MANIFEST_INVALID packages/${entry.name}/package.json`);
    }
  }
  return records;
}

function findPackageCycles(records) {
  const packageNames = new Set(records.map(({ manifest }) => manifest.name).filter(Boolean));
  const graph = new Map(
    records
      .filter(({ manifest }) => typeof manifest.name === "string")
      .map(({ manifest }) => [
        manifest.name,
        dependencyEntries(manifest)
          .map(({ name }) => name)
          .filter((name) => packageNames.has(name)),
      ]),
  );
  const visiting = new Set();
  const visited = new Set();
  const violations = [];

  function visit(name, path) {
    if (visiting.has(name)) {
      const cycleStart = path.indexOf(name);
      violations.push(`FND004_PACKAGE_CYCLE ${[...path.slice(cycleStart), name].join(" -> ")}`);
      return;
    }
    if (visited.has(name)) {
      return;
    }
    visiting.add(name);
    for (const dependency of graph.get(name) ?? []) {
      visit(dependency, [...path, name]);
    }
    visiting.delete(name);
    visited.add(name);
  }

  for (const name of [...graph.keys()].sort()) {
    visit(name, []);
  }
  return violations;
}

export async function validateFnd004Boundaries(root) {
  const violations = [];
  const records = await packageRecords(root, violations);
  const recordsByDirectory = new Map(records.map((record) => [record.directory, record]));
  const designSystem = recordsByDirectory.get("design-system");

  if (!designSystem) {
    violations.push("FND004_DESIGN_SYSTEM_BOUNDARY_MISSING packages/design-system");
  } else if (
    designSystem.manifest.name !== "@trazactivo/design-system" ||
    designSystem.manifest.private !== true ||
    typeof designSystem.manifest.exports !== "object" ||
    designSystem.manifest.exports === null ||
    !Object.hasOwn(designSystem.manifest.exports, ".")
  ) {
    violations.push("FND004_DESIGN_SYSTEM_BOUNDARY_INVALID packages/design-system/package.json");
  }

  for (const [directory, packageName] of boundaryPackages) {
    const record = recordsByDirectory.get(directory);
    if (!record) {
      violations.push(`FND004_BOUNDARY_PACKAGE_MISSING packages/${directory}`);
      continue;
    }
    const manifestPath = `packages/${directory}/package.json`;
    if (record.manifest.name !== packageName) {
      violations.push(`FND004_PACKAGE_NAME_INVALID ${manifestPath}`);
    }
    if (record.manifest.private !== true) {
      violations.push(`FND004_PACKAGE_NOT_PRIVATE ${manifestPath}`);
    }
    const publicExports = record.manifest.exports;
    if (
      typeof publicExports !== "object" ||
      publicExports === null ||
      publicExports["."] !== "./src/index.ts" ||
      Object.keys(publicExports).length !== 1
    ) {
      violations.push(`FND004_PUBLIC_API_INVALID ${manifestPath}`);
    }

    const sourceRoot = resolve(root, "packages", directory, "src");
    const sourceFiles = (await listFiles(sourceRoot)).filter((file) =>
      sourceExtensions.has(extname(file).toLowerCase()),
    );
    const indexPath = resolve(sourceRoot, "index.ts");
    if (!sourceFiles.includes(indexPath)) {
      violations.push(`FND004_PUBLIC_INDEX_MISSING packages/${directory}/src/index.ts`);
    }
    if (emptyBoundaryPackages.has(directory)) {
      if (sourceFiles.length !== 1) {
        violations.push(`FND004_BOUNDARY_EXTRA_SOURCE packages/${directory}`);
      }
      try {
        if ((await readFile(indexPath, "utf8")).trim() !== "export {};") {
          violations.push(`FND004_BOUNDARY_API_NOT_EMPTY packages/${directory}/src/index.ts`);
        }
      } catch {
        // The missing index violation above is sufficient.
      }
    }

    if (purePackageDirectories.has(directory)) {
      for (const section of productionDependencySections) {
        for (const name of Object.keys(record.manifest[section] ?? {})) {
          violations.push(
            `FND004_PURE_PACKAGE_PRODUCTION_DEPENDENCY ${manifestPath} ${section}.${name}`,
          );
        }
      }
    }
  }

  violations.push(...findPackageCycles(records));

  for (const { directory, manifest } of records) {
    for (const section of productionDependencySections) {
      if (Object.hasOwn(manifest[section] ?? {}, "@trazactivo/testkit")) {
        violations.push(
          `FND004_TESTKIT_RUNTIME_DEPENDENCY packages/${directory}/package.json ${section}`,
        );
      }
    }
  }

  for (const workspaceRoot of ["apps", "packages", "scripts"]) {
    const files = (await listFiles(resolve(root, workspaceRoot))).filter(
      (file) =>
        sourceExtensions.has(extname(file).toLowerCase()) || extname(file).toLowerCase() === ".mjs",
    );
    for (const file of files) {
      const displayPath = toPosix(relative(root, file));
      const source = await readFile(file, "utf8");
      const imports = extractImportSpecifiers(source);
      const purePackageSource = [...purePackageDirectories].some((directory) =>
        displayPath.startsWith(`packages/${directory}/src/`),
      );

      if (
        displayPath.startsWith("packages/client-context/src/") &&
        clientContextSensitiveSurface.test(source)
      ) {
        violations.push(`FND004_CLIENT_CONTEXT_SENSITIVE_SURFACE ${displayPath}`);
      }
      if (displayPath.startsWith("packages/domain/src/") && domainFunctionalSurface.test(source)) {
        violations.push(`FND004_DOMAIN_FUNCTIONAL_SURFACE ${displayPath}`);
      }

      for (const specifier of imports) {
        if (purePackageSource && !specifier.startsWith(".")) {
          violations.push(`FND004_PURE_PACKAGE_EXTERNAL_IMPORT ${displayPath} -> ${specifier}`);
        }
        if (specifier === "@trazactivo/testkit" || specifier.startsWith("@trazactivo/testkit/")) {
          if (!isTestSource(displayPath)) {
            violations.push(`FND004_TESTKIT_RUNTIME_IMPORT ${displayPath} -> ${specifier}`);
          }
        }
        if (
          displayPath.startsWith("packages/testkit/src/") &&
          specifier.startsWith("@trazactivo/")
        ) {
          violations.push(`FND004_TESTKIT_PRODUCT_IMPORT ${displayPath} -> ${specifier}`);
        }
        if (prismaImport.test(specifier) && !isTestSource(displayPath)) {
          const infrastructurePath =
            displayPath.includes("/infrastructure/") ||
            displayPath.includes("/adapters/persistence/");
          const hasClientContext = imports.some(
            (candidate) =>
              candidate === "@trazactivo/client-context" ||
              candidate.startsWith("@trazactivo/client-context/"),
          );
          if (!infrastructurePath || !hasClientContext) {
            violations.push(`FND004_PRISMA_BEFORE_CLIENT_CONTEXT ${displayPath} -> ${specifier}`);
          }
        }
      }
    }
  }

  return [...new Set(violations)].sort();
}

export async function validateGoldenApplicability(root) {
  const violations = [];
  const policyRoot = resolve(root, "packages", "policy-engine", "src");
  const files = (await listFiles(policyRoot)).filter((file) =>
    sourceExtensions.has(extname(file).toLowerCase()),
  );
  if (files.length === 0) {
    return ["FND004_POLICY_BOUNDARY_MISSING packages/policy-engine/src"];
  }

  const semanticPatterns = [
    ["DEPRECIATION", /(?:amorti[sz]\w*|depreciat\w*|depreciaci[oó]n\w*)/iu],
    [
      "MONETARY_CALCULATION",
      /\b(?:(?:calculate|compute)\w*(?:amount|money|monetary)\w*|(?:amount|money|monetary)\w*(?:calculate|compute)\w*)/iu,
    ],
    [
      "ACCOUNTING_POLICY",
      /\b(?:accounting|contabilidad|contable)\w*[_\s-]*(?:policy|pol[ií]tica|regla|rule)\w*/iu,
    ],
    [
      "FUNCTIONAL_RULE",
      /\bexport\s+(?:async\s+)?(?:class|function)\b|\bexport\s+(?:const|let|var)\s+\w*(?:policy|rule|regla|calculate|compute)\w*/iu,
    ],
  ];

  for (const file of files) {
    const displayPath = toPosix(relative(root, file));
    const source = await readFile(file, "utf8");
    for (const [category, pattern] of semanticPatterns) {
      if (pattern.test(source)) {
        violations.push(`FND004_GOLDEN_${category} ${displayPath}`);
      }
    }
  }
  return [...new Set(violations)].sort();
}
