import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { validateRepository } from "./architecture-rules.mjs";
import { validateBackendSmokeVerifyContract, validateFnd003Boundaries } from "./fnd-003-rules.mjs";
import { repositoryRoot } from "./toolchain.mjs";

const temporaryDirectories = [];

async function fixture(files) {
  const root = await mkdtemp(resolve(tmpdir(), "trazactivo-fnd-003-"));
  temporaryDirectories.push(root);

  for (const [path, content] of Object.entries(files)) {
    const target = resolve(root, path);
    await mkdir(resolve(target, ".."), { recursive: true });
    await writeFile(target, content, "utf8");
  }

  return root;
}

function rootManifest() {
  return JSON.stringify({
    name: "fixture",
    private: true,
    workspaces: ["apps/*", "packages/*"],
    scripts: Object.fromEntries(
      [
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
      ].map((name) => [name, "node safe.mjs"]),
    ),
  });
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("FND-003 backend shell boundaries", () => {
  test("the delivered backend workspaces satisfy repository and FND-003 rules", async () => {
    await expect(
      validateRepository(repositoryRoot, {
        legacyRef: "foundation-pre-v1.1-typescript-2026-08-18",
      }),
    ).resolves.toEqual([]);
    await expect(validateFnd003Boundaries(repositoryRoot)).resolves.toEqual([]);
    await expect(validateBackendSmokeVerifyContract(repositoryRoot)).resolves.toEqual([]);

    for (const application of ["control-api", "data-api", "worker"]) {
      const manifest = JSON.parse(
        await readFile(resolve(repositoryRoot, "apps", application, "package.json"), "utf8"),
      );
      expect(manifest.name).toBe(`@trazactivo/${application}`);
      expect(manifest.private).toBe(true);
      expect(manifest.scripts).toMatchObject({
        build: "tsc --project tsconfig.build.json",
        dev: "tsx src/main.ts",
        "test:unit": "vitest run --config vitest.config.ts",
        typecheck: "tsc --project tsconfig.json --noEmit",
      });
    }
  });

  test("an app-to-app backend import is rejected", async () => {
    const root = await fixture({
      "apps/control-api/package.json": JSON.stringify({
        name: "@trazactivo/control-api",
        private: true,
        version: "0.0.0",
      }),
      "apps/data-api/package.json": JSON.stringify({
        name: "@trazactivo/data-api",
        private: true,
        version: "0.0.0",
      }),
      "apps/data-api/src/main.ts": 'import "@trazactivo/control-api/internal";',
      "package.json": rootManifest(),
    });

    expect(await validateRepository(root)).toContain(
      "APP_TO_APP_IMPORT apps/data-api/src/main.ts -> apps/control-api",
    );
  });

  test("Prisma in a backend shell or health path is rejected", async () => {
    const root = await fixture({
      "apps/data-api/package.json": JSON.stringify({
        dependencies: { "@prisma/client": "7.0.0" },
        name: "@trazactivo/data-api",
        private: true,
        version: "0.0.0",
      }),
      "apps/data-api/src/presentation/health.controller.ts": 'import "@prisma/client";',
    });
    const violations = await validateFnd003Boundaries(root);

    expect(violations).toContain(
      "FND003_PRISMA_DEPENDENCY apps/data-api/package.json @prisma/client",
    );
    expect(violations).toContain(
      "FND003_PRISMA_IMPORT apps/data-api/src/presentation/health.controller.ts -> @prisma/client",
    );
  });

  test("a controller cannot bypass application or contain invariants", async () => {
    const root = await fixture({
      "apps/control-api/package.json": JSON.stringify({
        name: "@trazactivo/control-api",
        private: true,
        version: "0.0.0",
      }),
      "apps/control-api/src/presentation/assets.controller.ts": [
        'import "../domain/asset.js";',
        "export function decide() { if (true) return 1; return 0; }",
      ].join("\n"),
    });
    const violations = await validateFnd003Boundaries(root);

    expect(violations).toContain(
      "FND003_CONTROLLER_LAYER_BYPASS apps/control-api/src/presentation/assets.controller.ts -> ../domain/asset.js",
    );
    expect(violations).toContain(
      "FND003_CONTROLLER_INVARIANT_LOGIC apps/control-api/src/presentation/assets.controller.ts",
    );
  });

  test("health cannot expose sensitive configuration", async () => {
    const root = await fixture({
      "apps/control-api/package.json": JSON.stringify({
        name: "@trazactivo/control-api",
        private: true,
        version: "0.0.0",
      }),
      "apps/control-api/src/presentation/health.controller.ts":
        "export const health = { DATABASE_URL: process.env.DATABASE_URL };",
    });

    expect(await validateFnd003Boundaries(root)).toContain(
      "FND003_HEALTH_SENSITIVE_CONFIG apps/control-api/src/presentation/health.controller.ts",
    );
  });

  test("a functional worker consumer without explicit context is rejected", async () => {
    const root = await fixture({
      "apps/worker/package.json": JSON.stringify({
        name: "@trazactivo/worker",
        private: true,
        version: "0.0.0",
      }),
      "apps/worker/src/application/consumer.ts": [
        '@MessagePattern("asset-job")',
        "export function processMessage() { return undefined; }",
      ].join("\n"),
    });

    expect(await validateFnd003Boundaries(root)).toContain(
      "FND003_WORKER_CONTEXT_MISSING apps/worker/src/application/consumer.ts",
    );
  });

  test("the root backend smoke script cannot be removed", async () => {
    const root = await fixture({
      "package.json": JSON.stringify({ scripts: {} }),
      "scripts/verify.mjs": 'const requiredScripts = ["build", "test:backend-smoke"];',
    });

    expect(await validateBackendSmokeVerifyContract(root)).toContain(
      "FND003_BACKEND_SMOKE_ROOT_SCRIPT_MISSING",
    );
  });

  test("backend smoke cannot be omitted from the executable verify sequence", async () => {
    const root = await fixture({
      "package.json": JSON.stringify({
        scripts: { "test:backend-smoke": "node scripts/fnd-003-smoke.mjs" },
      }),
      "scripts/verify.mjs": 'const requiredScripts = ["build"];',
    });

    expect(await validateBackendSmokeVerifyContract(root)).toContain(
      "FND003_BACKEND_SMOKE_OUTSIDE_VERIFY",
    );
  });

  test("mentioning backend smoke outside the executable verify sequence is rejected", async () => {
    const root = await fixture({
      "package.json": JSON.stringify({
        scripts: { "test:backend-smoke": "node scripts/fnd-003-smoke.mjs" },
      }),
      "scripts/verify.mjs": [
        'const requiredScripts = ["build"];',
        'const documentedOnly = "test:backend-smoke";',
      ].join("\n"),
    });

    expect(await validateBackendSmokeVerifyContract(root)).toContain(
      "FND003_BACKEND_SMOKE_OUTSIDE_VERIFY",
    );
  });

  test("backend smoke cannot run before build", async () => {
    const root = await fixture({
      "package.json": JSON.stringify({
        scripts: { "test:backend-smoke": "node scripts/fnd-003-smoke.mjs" },
      }),
      "scripts/verify.mjs": 'const requiredScripts = ["test:backend-smoke", "build"];',
    });

    expect(await validateBackendSmokeVerifyContract(root)).toContain(
      "FND003_BACKEND_SMOKE_BEFORE_BUILD",
    );
  });
});
