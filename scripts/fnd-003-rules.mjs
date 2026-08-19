import { readFile, readdir } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";

const backendApplications = ["control-api", "data-api", "worker"];
const dependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
const sourceExtensions = new Set([".cts", ".mts", ".ts"]);
const prismaDependency = /^(?:@prisma\/|prisma$)/u;
const messagingDependency = /^(?:@azure\/service-bus|amqplib|kafkajs)$/u;
const sensitiveHealthToken =
  /\b(?:AZURE_CLIENT_SECRET|CLIENT_SECRET|CONNECTION_STRING|DATABASE_URL|PASSWORD|SHARED_ACCESS_KEY|TOKEN)\b/iu;

function toPosix(filePath) {
  return filePath.split(sep).join("/");
}

async function listSourceFiles(directory) {
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
      files.push(...(await listSourceFiles(absolutePath)));
    } else if (entry.isFile() && sourceExtensions.has(extname(entry.name).toLowerCase())) {
      files.push(absolutePath);
    }
  }

  return files;
}

function dependencyNames(manifest) {
  return dependencySections.flatMap((section) => Object.keys(manifest[section] ?? {}));
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

function controllerHasInvariantLogic(source) {
  return /\b(?:for|if|switch|while)\s*\(/u.test(source);
}

function workerHasFunctionalConsumer(source) {
  return /@(?:EventPattern|MessagePattern)\b|\b(?:consume|process)(?:Job|Message)\b/u.test(source);
}

function workerHasExplicitContext(source) {
  return /\b(?:ClientContext|JobEnvelope)\b|@trazactivo\/client-context/u.test(source);
}

function extractRequiredVerifySteps(source) {
  const declaration = source.match(/const requiredScripts = \[(?<steps>[\s\S]*?)\];/u);
  if (!declaration?.groups?.steps) {
    return undefined;
  }

  return [...declaration.groups.steps.matchAll(/["'](?<name>[^"']+)["']/gu)].map(
    (match) => match.groups.name,
  );
}

export async function validateBackendSmokeVerifyContract(root) {
  const violations = [];
  let manifest;
  let verifySource;

  try {
    manifest = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
  } catch {
    violations.push("FND003_BACKEND_SMOKE_ROOT_MANIFEST_INVALID");
  }

  try {
    verifySource = await readFile(resolve(root, "scripts", "verify.mjs"), "utf8");
  } catch {
    violations.push("FND003_BACKEND_SMOKE_VERIFY_UNREADABLE");
  }

  if (!manifest?.scripts?.["test:backend-smoke"]) {
    violations.push("FND003_BACKEND_SMOKE_ROOT_SCRIPT_MISSING");
  }

  if (verifySource !== undefined) {
    const requiredSteps = extractRequiredVerifySteps(verifySource);
    if (!requiredSteps) {
      violations.push("FND003_BACKEND_SMOKE_VERIFY_SEQUENCE_UNREADABLE");
    } else {
      const buildIndex = requiredSteps.indexOf("build");
      const smokeIndexes = requiredSteps.flatMap((step, index) =>
        step === "test:backend-smoke" ? [index] : [],
      );

      if (buildIndex === -1) {
        violations.push("FND003_BACKEND_SMOKE_BUILD_MISSING");
      }
      if (smokeIndexes.length === 0) {
        violations.push("FND003_BACKEND_SMOKE_OUTSIDE_VERIFY");
      }
      if (smokeIndexes.length > 1) {
        violations.push("FND003_BACKEND_SMOKE_DUPLICATED");
      }
      if (buildIndex !== -1 && smokeIndexes.some((index) => index < buildIndex)) {
        violations.push("FND003_BACKEND_SMOKE_BEFORE_BUILD");
      }
    }
  }

  return [...new Set(violations)].sort();
}

export async function validateFnd003Boundaries(root) {
  const violations = [];

  for (const application of backendApplications) {
    const applicationDirectory = resolve(root, "apps", application);
    const manifestPath = resolve(applicationDirectory, "package.json");
    let manifest;
    try {
      manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        continue;
      }
      violations.push(`FND003_MANIFEST_INVALID apps/${application}/package.json`);
      continue;
    }

    for (const dependency of dependencyNames(manifest)) {
      if (prismaDependency.test(dependency)) {
        violations.push(`FND003_PRISMA_DEPENDENCY apps/${application}/package.json ${dependency}`);
      }
      if (application === "worker" && messagingDependency.test(dependency)) {
        violations.push(
          `FND003_WORKER_MESSAGING_DEPENDENCY apps/worker/package.json ${dependency}`,
        );
      }
    }

    const sourceFiles = await listSourceFiles(resolve(applicationDirectory, "src"));
    for (const file of sourceFiles) {
      const displayPath = toPosix(relative(root, file));
      const source = await readFile(file, "utf8");
      const imports = extractImportSpecifiers(source);

      for (const specifier of imports) {
        if (prismaDependency.test(specifier)) {
          violations.push(`FND003_PRISMA_IMPORT ${displayPath} -> ${specifier}`);
        }
        if (displayPath.endsWith(".controller.ts") && specifier.startsWith(".")) {
          const target = toPosix(resolve(file, "..", specifier));
          if (target.includes("/domain/") || target.includes("/infrastructure/")) {
            violations.push(`FND003_CONTROLLER_LAYER_BYPASS ${displayPath} -> ${specifier}`);
          }
        }
      }

      if (displayPath.includes("health") && sensitiveHealthToken.test(source)) {
        violations.push(`FND003_HEALTH_SENSITIVE_CONFIG ${displayPath}`);
      }
      if (displayPath.endsWith(".controller.ts") && controllerHasInvariantLogic(source)) {
        violations.push(`FND003_CONTROLLER_INVARIANT_LOGIC ${displayPath}`);
      }
      if (
        application === "worker" &&
        workerHasFunctionalConsumer(source) &&
        !workerHasExplicitContext(source)
      ) {
        violations.push(`FND003_WORKER_CONTEXT_MISSING ${displayPath}`);
      }
    }
  }

  return [...new Set(violations)].sort();
}
