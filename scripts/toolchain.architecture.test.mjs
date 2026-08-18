import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { afterEach, describe, expect, test } from "vitest";

import { validateRepository } from "./architecture-rules.mjs";
import { validateToolchain } from "./preflight.mjs";
import { repositoryRoot } from "./toolchain.mjs";

const temporaryDirectories = [];

async function fixture(files) {
  const root = await mkdtemp(resolve(tmpdir(), "trazactivo-fnd-001-"));
  temporaryDirectories.push(root);
  for (const [path, content] of Object.entries(files)) {
    const target = resolve(root, path);
    await mkdir(resolve(target, ".."), { recursive: true });
    await writeFile(target, content, "utf8");
  }
  return root;
}

function rootManifest(extra = {}) {
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
    ...extra,
  });
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { force: true, recursive: true })),
  );
});

describe("FND-001 architecture contract", () => {
  test("the repository satisfies the current architecture contract", async () => {
    await expect(
      validateRepository(repositoryRoot, {
        legacyRef: "foundation-pre-v1.1-typescript-2026-08-18",
      }),
    ).resolves.toEqual([]);
  });

  test("a new prohibited stack project is rejected", async () => {
    const root = await fixture({
      "Legacy.csproj": "<Project />",
      "package.json": rootManifest(),
    });

    expect(await validateRepository(root)).toContain("PROHIBITED_STACK_FILE Legacy.csproj");
  });

  test("a prohibited stack command is rejected", async () => {
    const root = await fixture({
      "package.json": rootManifest({
        scripts: {
          ...JSON.parse(rootManifest()).scripts,
          legacy: `${["dot", "net"].join("")} test`,
        },
      }),
    });

    expect(await validateRepository(root)).toContain("PROHIBITED_STACK_COMMAND legacy");
  });

  test("an app cannot depend on another app", async () => {
    const root = await fixture({
      "apps/first/package.json": JSON.stringify({
        dependencies: { "@trazactivo/second": "1.0.0" },
        name: "@trazactivo/first",
        private: true,
        version: "1.0.0",
      }),
      "apps/second/package.json": JSON.stringify({
        name: "@trazactivo/second",
        private: true,
        version: "1.0.0",
      }),
      "package.json": rootManifest(),
    });

    expect(await validateRepository(root)).toContain(
      "APP_TO_APP_DEPENDENCY apps/first/package.json @trazactivo/second",
    );
  });

  test("an app cannot import another app", async () => {
    const root = await fixture({
      "apps/first/package.json": JSON.stringify({
        name: "@trazactivo/first",
        private: true,
        version: "1.0.0",
      }),
      "apps/first/src/index.ts": 'import "@trazactivo/second/internal";',
      "apps/second/package.json": JSON.stringify({
        name: "@trazactivo/second",
        private: true,
        version: "1.0.0",
      }),
      "package.json": rootManifest(),
    });

    expect(await validateRepository(root)).toContain(
      "APP_TO_APP_IMPORT apps/first/src/index.ts -> apps/second",
    );
  });

  test("frontend Prisma access and ranged dependencies are rejected", async () => {
    const root = await fixture({
      "apps/portal-web/package.json": JSON.stringify({
        dependencies: { "@prisma/client": "^7.0.0" },
        name: "@trazactivo/portal-web",
        private: true,
        version: "1.0.0",
      }),
      "apps/portal-web/src/page.ts": 'import "@prisma/client";',
      "package.json": rootManifest(),
    });
    const violations = await validateRepository(root);

    expect(violations).toContain(
      "DEPENDENCY_VERSION_NOT_EXACT apps/portal-web/package.json dependencies.@prisma/client=^7.0.0",
    );
    expect(violations).toContain(
      "FRONTEND_DATA_DEPENDENCY apps/portal-web/package.json @prisma/client",
    );
    expect(violations).toContain(
      "FRONTEND_DATA_ACCESS apps/portal-web/src/page.ts -> @prisma/client",
    );
  });

  test("a different Node.js version fails preflight validation", () => {
    const errors = validateToolchain({
      nodeVersionFile: "24.13.0",
      nvmrc: "24.13.0",
      packageJson: {
        engines: { node: "24.13.0", npm: "11.6.2" },
        packageManager: "npm@11.6.2",
      },
      runtimeNode: "22.22.0",
      runtimeNpm: "11.6.2",
    });

    expect(errors).toContain("Node.js 24.13.0 is required; detected 22.22.0");
  });

  test("verify propagates a controlled child failure and stops", () => {
    const result = spawnSync(
      process.execPath,
      [resolve(repositoryRoot, "scripts/verify.mjs"), "--failure-probe"],
      { cwd: repositoryRoot, encoding: "utf8" },
    );
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

    expect(result.status).toBe(73);
    expect(output).toContain("VERIFY_FAILED step=controlled-failure-probe exit=73");
    expect(output).not.toContain("must-not-run-after-failure");
  });
});
