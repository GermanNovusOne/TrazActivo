import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  authoredImportViolations,
  generationEvidenceViolations,
  platformSchemaViolations,
  prismaDependencyViolations,
  scopePathViolations,
  validateStaticDb001,
} from "./db-001-rules.mjs";
import { repositoryRoot } from "./toolchain.mjs";

describe("DB-001 Platform Prisma architecture", () => {
  it("keeps the repository foundation inside its approved boundaries", async () => {
    expect(await validateStaticDb001()).toEqual([]);
  });

  it("rejects functional models and preview features", () => {
    const schema = `
      generator client {
        provider = "prisma-client"
        output = "../generated/client"
        runtime = "nodejs"
        moduleFormat = "esm"
        generatedFileExtension = "ts"
        importFileExtension = "ts"
        previewFeatures = ["unapproved"]
      }
      datasource platform { provider = "sqlserver" }
      model Client { id String @id }
    `;
    expect(platformSchemaViolations(schema)).toEqual(
      expect.arrayContaining([
        "DB001_FUNCTIONAL_SCHEMA_SURFACE_PROHIBITED",
        "DB001_PRISMA_PREVIEW_FEATURE_PROHIBITED",
      ]),
    );
  });

  it("rejects shared or redirected generated output", () => {
    const schema = `
      generator client {
        provider = "prisma-client"
        output = "../../client/generated/client"
        runtime = "nodejs"
        moduleFormat = "esm"
        generatedFileExtension = "ts"
        importFileExtension = "ts"
      }
      datasource platform { provider = "sqlserver" }
    `;
    expect(platformSchemaViolations(schema)).toContain(
      "DB001_SCHEMA_GENERATOR_SETTING_INVALID output",
    );
  });

  it("rejects ranges, latest and Prisma version mismatch", () => {
    const manifest = {
      dependencies: {
        "@prisma/adapter-mssql": "latest",
        "@prisma/client": "7.9.0",
      },
      devDependencies: {
        "@types/mssql": "^12.3.0",
        prisma: "7.9.1",
      },
    };
    expect(prismaDependencyViolations(manifest)).toEqual(
      expect.arrayContaining([
        "DB001_DEPENDENCY_VERSION_INVALID dependencies.@prisma/adapter-mssql=latest",
        "DB001_DEPENDENCY_VERSION_INVALID dependencies.@prisma/client=7.9.0",
        "DB001_DEPENDENCY_VERSION_INVALID devDependencies.@types/mssql=^12.3.0",
        "DB001_PRISMA_CLIENT_VERSION_MISMATCH",
      ]),
    );
  });

  it.each([
    "apps/portal-web/src/page.ts",
    "apps/control-web/src/page.ts",
    "packages/contracts/src/index.ts",
    "packages/domain/src/index.ts",
    "packages/client-context/src/index.ts",
  ])("rejects Prisma imports from %s", (path) => {
    expect(authoredImportViolations({ [path]: 'import "@prisma/client";' })).toEqual([
      `DB001_PRISMA_IMPORT_OUTSIDE_PLATFORM_INFRASTRUCTURE ${path} -> @prisma/client`,
    ]);
  });

  it("rejects Client Prisma, migrations and seeds", () => {
    expect(
      scopePathViolations([
        "database/client/prisma/schema.prisma",
        "database/platform/prisma/migrations/001_init.sql",
        "database/platform/seed.ts",
      ]),
    ).toEqual(
      expect.arrayContaining([
        "DB001_CLIENT_PRISMA_SCOPE_PROHIBITED database/client/prisma/schema.prisma",
        "DB001_MIGRATION_SCOPE_PROHIBITED database/platform/prisma/migrations/001_init.sql",
        "DB001_SEED_SCOPE_PROHIBITED database/platform/seed.ts",
      ]),
    );
  });

  it("detects generated-client drift in the fail-closed evidence gate", () => {
    expect(
      generationEvidenceViolations(
        { filesSha256: "old", schemaSha256: "same" },
        { filesSha256: "new", schemaSha256: "same" },
      ),
    ).toEqual(["DB001_GENERATED_CLIENT_DRIFT filesSha256"]);
  });

  it("rejects arbitrary arguments through the real root wrapper", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/db-001-cli.mjs", "validate", "--schema", "untrusted.prisma"],
      { cwd: repositoryRoot, encoding: "utf8" },
    );

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain("DB001_CLI_ARGUMENTS_REJECTED");
  });

  it("makes the real Prisma validator fail for an invalid SQL Server schema", async () => {
    const fixtureRoot = await mkdtemp(resolve(tmpdir(), "trazactivo-db001-invalid-"));
    const fixtureSchema = resolve(fixtureRoot, "schema.prisma");
    try {
      await writeFile(
        fixtureSchema,
        'generator client { provider = "prisma-client" output = "./generated" }\n' +
          'datasource platform { provider = "sqlserver" }\n' +
          "model Broken { id String @id\n",
        "utf8",
      );
      const result = spawnSync(
        process.execPath,
        [
          resolve(repositoryRoot, "node_modules/prisma/build/index.js"),
          "validate",
          "--schema",
          fixtureSchema,
        ],
        { cwd: repositoryRoot, encoding: "utf8" },
      );

      expect(result.status).not.toBe(0);
      expect(`${result.stdout}${result.stderr}`).toMatch(/validation|error/iu);
    } finally {
      await rm(fixtureRoot, { force: true, recursive: true });
    }
  });
});
