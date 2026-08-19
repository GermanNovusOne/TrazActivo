import { execFileSync, spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { createRepositoryFixture } from "../packages/testkit/src/index.ts";
import { afterEach, describe, expect, test } from "vitest";

import { validateRepository } from "./architecture-rules.mjs";
import { validateFnd004Boundaries, validateGoldenApplicability } from "./fnd-004-rules.mjs";
import { repositoryRoot } from "./toolchain.mjs";

const fixtures = [];

async function fixture(files) {
  const created = await createRepositoryFixture(files);
  fixtures.push(created);
  return created.root;
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

function packageManifest(name, extra = {}) {
  return JSON.stringify({
    exports: { ".": "./src/index.ts" },
    name,
    private: true,
    scripts: {
      build: "tsc --project tsconfig.build.json",
      typecheck: "tsc --project tsconfig.json --noEmit",
    },
    type: "module",
    version: "0.0.0",
    ...extra,
  });
}

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map(({ cleanup }) => cleanup()));
});

describe("FND-004 package boundaries", () => {
  test("the approved packages expose only their justified public APIs", async () => {
    await expect(
      validateRepository(repositoryRoot, {
        legacyRef: "foundation-pre-v1.1-typescript-2026-08-18",
      }),
    ).resolves.toEqual([]);
    await expect(validateFnd004Boundaries(repositoryRoot)).resolves.toEqual([]);
    await expect(validateGoldenApplicability(repositoryRoot)).resolves.toEqual([]);

    for (const directory of [
      "authorization",
      "client-context",
      "contracts",
      "domain",
      "observability",
      "policy-engine",
    ]) {
      await expect(
        readFile(resolve(repositoryRoot, "packages", directory, "src/index.ts"), "utf8"),
      ).resolves.toBe("export {};\n");
    }
  });

  test("domain and policy-engine reject framework, persistence, UI, Azure and HTTP imports", async () => {
    const root = await fixture({
      "packages/domain/package.json": packageManifest("@trazactivo/domain"),
      "packages/domain/src/index.ts": [
        'import "@nestjs/common";',
        'import "@prisma/client";',
        'import "next";',
        'import "@azure/monitor-opentelemetry";',
        'import "node:http";',
      ].join("\n"),
      "packages/policy-engine/package.json": packageManifest("@trazactivo/policy-engine"),
      "packages/policy-engine/src/index.ts": 'import "react";',
    });
    const violations = await validateFnd004Boundaries(root);

    for (const dependency of [
      "@nestjs/common",
      "@prisma/client",
      "next",
      "@azure/monitor-opentelemetry",
      "node:http",
    ]) {
      expect(violations).toContain(
        `FND004_PURE_PACKAGE_IMPORT packages/domain/src/index.ts -> ${dependency}`,
      );
    }
    expect(violations).toContain(
      "FND004_PURE_PACKAGE_IMPORT packages/policy-engine/src/index.ts -> react",
    );
  });

  test("frontend data/backend access and app-to-app imports remain rejected", async () => {
    const root = await fixture({
      "apps/data-api/package.json": JSON.stringify({
        name: "@trazactivo/data-api",
        private: true,
        version: "0.0.0",
      }),
      "apps/portal-web/package.json": JSON.stringify({
        name: "@trazactivo/portal-web",
        private: true,
        scripts: { typecheck: "next typegen && tsc --project tsconfig.json --noEmit" },
        version: "0.0.0",
      }),
      "apps/portal-web/src/page.ts": [
        'import "@prisma/client";',
        'import "@nestjs/common";',
        'import "@trazactivo/data-api/internal";',
      ].join("\n"),
      "package.json": rootManifest(),
    });
    const violations = await validateRepository(root);

    expect(violations).toContain(
      "FRONTEND_DATA_ACCESS apps/portal-web/src/page.ts -> @prisma/client",
    );
    expect(violations).toContain(
      "FRONTEND_BACKEND_ACCESS apps/portal-web/src/page.ts -> @nestjs/common",
    );
    expect(violations).toContain("APP_TO_APP_IMPORT apps/portal-web/src/page.ts -> apps/data-api");
  });

  test("package cycles and a responsibility-free common package are rejected", async () => {
    const root = await fixture({
      "package.json": rootManifest(),
      "packages/alpha/package.json": packageManifest("@trazactivo/alpha", {
        dependencies: { "@trazactivo/beta": "0.0.0" },
      }),
      "packages/beta/package.json": packageManifest("@trazactivo/beta", {
        dependencies: { "@trazactivo/alpha": "0.0.0" },
      }),
      "packages/common/package.json": packageManifest("@trazactivo/common"),
    });

    expect(await validateFnd004Boundaries(root)).toContain(
      "FND004_PACKAGE_CYCLE @trazactivo/alpha -> @trazactivo/beta -> @trazactivo/alpha",
    );
    expect(await validateRepository(root)).toContain("RESPONSIBILITY_FREE_PACKAGE packages/common");
  });

  test("testkit cannot enter runtime manifests or production source", async () => {
    const root = await fixture({
      "packages/example/package.json": packageManifest("@trazactivo/example", {
        dependencies: { "@trazactivo/testkit": "0.0.0" },
      }),
      "packages/example/src/index.ts": 'import "@trazactivo/testkit";',
      "packages/testkit/package.json": packageManifest("@trazactivo/testkit"),
      "packages/testkit/src/index.ts": 'import "@trazactivo/domain";',
    });
    const violations = await validateFnd004Boundaries(root);

    expect(violations).toContain(
      "FND004_TESTKIT_RUNTIME_DEPENDENCY packages/example/package.json dependencies",
    );
    expect(violations).toContain(
      "FND004_TESTKIT_RUNTIME_IMPORT packages/example/src/index.ts -> @trazactivo/testkit",
    );
    expect(violations).toContain(
      "FND004_TESTKIT_PRODUCT_IMPORT packages/testkit/src/index.ts -> @trazactivo/domain",
    );
  });

  test("ClientContext rejects secrets and database references", async () => {
    const root = await fixture({
      "packages/client-context/package.json": packageManifest("@trazactivo/client-context"),
      "packages/client-context/src/index.ts": [
        "export interface UnsafeContext {",
        "  readonly databaseReference: string;",
        "  readonly connectionString: string;",
        "  readonly secret: string;",
        "}",
      ].join("\n"),
    });

    expect(await validateFnd004Boundaries(root)).toContain(
      "FND004_CLIENT_CONTEXT_SENSITIVE_SURFACE packages/client-context/src/index.ts",
    );
  });

  test("Prisma is rejected outside persistence and without an explicit ClientContext boundary", async () => {
    const root = await fixture({
      "apps/data-api/package.json": JSON.stringify({
        name: "@trazactivo/data-api",
        private: true,
        version: "0.0.0",
      }),
      "apps/data-api/src/application/use-case.ts": 'import "@prisma/client";',
      "apps/data-api/src/infrastructure/repository.ts": 'import "@prisma/client";',
    });

    const violations = await validateFnd004Boundaries(root);

    expect(violations).toContain(
      "FND004_PRISMA_BEFORE_CLIENT_CONTEXT apps/data-api/src/infrastructure/repository.ts -> @prisma/client",
    );
    expect(violations).toContain(
      "FND004_PRISMA_BEFORE_CLIENT_CONTEXT apps/data-api/src/application/use-case.ts -> @prisma/client",
    );
  });

  test("functional domain surface is rejected before AST-001", async () => {
    const root = await fixture({
      "packages/domain/package.json": packageManifest("@trazactivo/domain"),
      "packages/domain/src/index.ts": "export interface AssetItem { readonly id: string; }",
    });
    const violations = await validateFnd004Boundaries(root);

    expect(violations).toContain("FND004_DOMAIN_FUNCTIONAL_SURFACE packages/domain/src/index.ts");
    expect(violations).toContain("FND004_BOUNDARY_API_NOT_EMPTY packages/domain/src/index.ts");
  });

  test("golden applicability rejects every prohibited policy surface", async () => {
    const root = await fixture({
      "packages/policy-engine/src/index.ts": [
        "export function calculateDepreciation() { return 0; }",
        "export const computeMonetaryAmount = () => 0;",
        "export const accountingPolicyRule = {};",
      ].join("\n"),
    });
    const violations = await validateGoldenApplicability(root);

    expect(violations).toContain("FND004_GOLDEN_DEPRECIATION packages/policy-engine/src/index.ts");
    expect(violations).toContain(
      "FND004_GOLDEN_MONETARY_CALCULATION packages/policy-engine/src/index.ts",
    );
    expect(violations).toContain(
      "FND004_GOLDEN_ACCOUNTING_POLICY packages/policy-engine/src/index.ts",
    );
    expect(violations).toContain(
      "FND004_GOLDEN_FUNCTIONAL_RULE packages/policy-engine/src/index.ts",
    );
  });

  test("golden command reports inspected scope as not applicable, never as accounting PASS", () => {
    const result = spawnSync(
      process.execPath,
      [resolve(repositoryRoot, "scripts/fnd-004-golden.mjs")],
      {
        cwd: repositoryRoot,
        encoding: "utf8",
      },
    );
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

    expect(result.status).toBe(0);
    expect(output).toContain("STATUS=NOT_APPLICABLE_SCOPE OWNER=QA-002");
    expect(output).not.toMatch(/\bPASS\b/u);
  });

  test("design-system remains byte-for-byte outside the FND-004 diff", () => {
    const changed = execFileSync(
      "git",
      ["diff", "--name-only", "architecture/v1.1-typescript", "--", "packages/design-system"],
      { cwd: repositoryRoot, encoding: "utf8" },
    ).trim();

    expect(changed).toBe("");
  });
});
