import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { afterEach, describe, expect, test } from "vitest";

import { validateRepository } from "./architecture-rules.mjs";
import { repositoryRoot } from "./toolchain.mjs";

const temporaryDirectories = [];

async function fixture(files) {
  const root = await mkdtemp(resolve(tmpdir(), "trazactivo-fnd-002-"));
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

describe("FND-002 frontend boundaries", () => {
  test("the delivered frontend workspaces satisfy the repository contract", async () => {
    await expect(
      validateRepository(repositoryRoot, {
        legacyRef: "foundation-pre-v1.1-typescript-2026-08-18",
      }),
    ).resolves.toEqual([]);

    const portalManifest = JSON.parse(
      await readFile(resolve(repositoryRoot, "apps/portal-web/package.json"), "utf8"),
    );
    const controlManifest = JSON.parse(
      await readFile(resolve(repositoryRoot, "apps/control-web/package.json"), "utf8"),
    );

    expect(portalManifest.dependencies).toMatchObject({
      "@trazactivo/design-system": "0.0.0",
    });
    expect(controlManifest.dependencies).toMatchObject({
      "@trazactivo/design-system": "0.0.0",
    });
    expect(portalManifest.scripts.typecheck).toBe(
      "next typegen && tsc --project tsconfig.json --noEmit",
    );
    expect(controlManifest.scripts.typecheck).toBe(
      "next typegen && tsc --project tsconfig.json --noEmit",
    );
    expect(portalManifest.dependencies).not.toHaveProperty("control-web");
    expect(controlManifest.dependencies).not.toHaveProperty("portal-web");

    for (const app of ["portal-web", "control-web"]) {
      const tsconfig = JSON.parse(
        await readFile(resolve(repositoryRoot, `apps/${app}/tsconfig.json`), "utf8"),
      );
      expect(tsconfig.include).toContain("next-env.d.ts");
      expect(tsconfig.include).toContain(".next/types/**/*.ts");
      expect(tsconfig.exclude).not.toContain(".next");
    }
  });

  test("next-env.d.ts is generated, ignored and never tracked", async () => {
    const ignoredFiles = execFileSync(
      "git",
      ["check-ignore", "apps/portal-web/next-env.d.ts", "apps/control-web/next-env.d.ts"],
      { cwd: repositoryRoot, encoding: "utf8" },
    )
      .split(/\r?\n/u)
      .filter(Boolean);
    const trackedFiles = execFileSync(
      "git",
      ["ls-files", "--", "apps/portal-web/next-env.d.ts", "apps/control-web/next-env.d.ts"],
      { cwd: repositoryRoot, encoding: "utf8" },
    )
      .split(/\r?\n/u)
      .filter(Boolean);

    expect(ignoredFiles).toEqual([
      "apps/portal-web/next-env.d.ts",
      "apps/control-web/next-env.d.ts",
    ]);
    expect(trackedFiles).toEqual([]);
  });

  test("a Next.js typecheck without typegen is rejected", async () => {
    const root = await fixture({
      "apps/portal-web/package.json": JSON.stringify({
        dependencies: {
          next: "16.3.1",
        },
        name: "@trazactivo/portal-web",
        private: true,
        scripts: {
          typecheck: "tsc --project tsconfig.json --noEmit",
        },
        version: "0.0.0",
      }),
      "package.json": rootManifest(),
    });

    expect(await validateRepository(root)).toContain(
      "NEXT_TYPECHECK_NOT_REPRODUCIBLE apps/portal-web/package.json",
    );
  });

  test("an import between frontend applications is rejected", async () => {
    const root = await fixture({
      "apps/control-web/package.json": JSON.stringify({
        name: "@trazactivo/control-web",
        private: true,
        version: "0.0.0",
      }),
      "apps/portal-web/package.json": JSON.stringify({
        name: "@trazactivo/portal-web",
        private: true,
        version: "0.0.0",
      }),
      "apps/portal-web/src/page.tsx": 'import "@trazactivo/control-web/internal";',
      "package.json": rootManifest(),
    });

    expect(await validateRepository(root)).toContain(
      "APP_TO_APP_IMPORT apps/portal-web/src/page.tsx -> apps/control-web",
    );
  });

  test("frontend imports from backend and Prisma are rejected", async () => {
    const root = await fixture({
      "apps/portal-web/package.json": JSON.stringify({
        dependencies: {
          "@nestjs/common": "11.1.11",
          "@prisma/client": "7.3.0",
        },
        name: "portal-web",
        private: true,
        version: "0.0.0",
      }),
      "apps/portal-web/src/page.tsx": [
        'import "@nestjs/common";',
        'import "@prisma/client";',
        'import "../../../src/internal";',
      ].join("\n"),
      "package.json": rootManifest(),
    });
    const violations = await validateRepository(root);

    expect(violations).toContain(
      "FRONTEND_BACKEND_DEPENDENCY apps/portal-web/package.json @nestjs/common",
    );
    expect(violations).toContain(
      "FRONTEND_BACKEND_ACCESS apps/portal-web/src/page.tsx -> @nestjs/common",
    );
    expect(violations).toContain(
      "FRONTEND_BACKEND_ACCESS apps/portal-web/src/page.tsx -> ../../../src/internal",
    );
    expect(violations).toContain(
      "FRONTEND_DATA_ACCESS apps/portal-web/src/page.tsx -> @prisma/client",
    );
  });
});
