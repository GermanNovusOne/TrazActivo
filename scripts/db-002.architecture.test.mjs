import { spawnSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { canonicalClientTargets } from "../database/client/infrastructure/client-target.ts";
import {
  clientGenerationEvidenceViolations,
  clientMutationCommandViolations,
  clientPrismaDependencyViolations,
  clientPrismaImportViolations,
  clientSchemaViolations,
  clientScopePathViolations,
  clientSelectorViolations,
  validateStaticDb002,
} from "./db-002-rules.mjs";
import { canonicalTopology } from "./fnd-005-rules.mjs";
import { repositoryRoot } from "./toolchain.mjs";

describe("DB-002 Client Prisma architecture", () => {
  it("keeps the Client foundation inside its approved boundaries", async () => {
    expect(await validateStaticDb002()).toEqual([]);
  });

  it("matches both canonical Client tuples from FND-005 exactly", () => {
    const topologyTargets = canonicalTopology.databases
      .filter(({ role }) => role === "client-a" || role === "client-b")
      .map(({ database, reference, user }) => ({
        database,
        reference,
        server: "127.0.0.1",
        user,
      }));

    expect(canonicalClientTargets).toEqual(topologyTargets);
  });

  it("rejects models, preview features and connection configuration", () => {
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
      datasource client { provider = "sqlserver" url = env("DATABASE_URL") }
      model AssetItem { id String @id }
    `;
    expect(clientSchemaViolations(schema)).toEqual(
      expect.arrayContaining([
        "DB002_PRISMA_PREVIEW_FEATURE_PROHIBITED",
        "DB002_SCHEMA_CONNECTION_CONFIGURATION_PROHIBITED",
        "DB002_SCHEMA_MODEL_SURFACE_PROHIBITED",
      ]),
    );
  });

  it("rejects shared output and a Platform datasource", () => {
    const schema = `
      generator client {
        provider = "prisma-client"
        output = "../../platform/generated/client"
        runtime = "nodejs"
        moduleFormat = "esm"
        generatedFileExtension = "ts"
        importFileExtension = "ts"
      }
      datasource platform { provider = "sqlserver" }
    `;
    expect(clientSchemaViolations(schema)).toEqual(
      expect.arrayContaining([
        "DB002_PLATFORM_DATASOURCE_PROHIBITED",
        "DB002_SCHEMA_GENERATOR_SETTING_INVALID output",
        "DB002_SCHEMA_SQLSERVER_DATASOURCE_MISSING",
      ]),
    );
  });

  it("rejects ranges, latest and version divergence", () => {
    const manifest = {
      dependencies: {
        "@prisma/adapter-mssql": "latest",
        "@prisma/client": "7.9.0",
      },
      devDependencies: { prisma: "^7.9.1" },
    };
    expect(clientPrismaDependencyViolations(manifest)).toEqual(
      expect.arrayContaining([
        "DB002_DEPENDENCY_VERSION_INVALID dependencies.@prisma/adapter-mssql=latest",
        "DB002_DEPENDENCY_VERSION_INVALID dependencies.@prisma/client=7.9.0",
        "DB002_DEPENDENCY_VERSION_INVALID devDependencies.prisma=^7.9.1",
        "DB002_PRISMA_VERSION_MISMATCH",
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
    expect(clientPrismaImportViolations({ [path]: 'import "@prisma/client";' })).toEqual([
      `DB002_PRISMA_IMPORT_OUTSIDE_AUTHORIZED_INFRASTRUCTURE ${path} -> @prisma/client`,
    ]);
  });

  it("rejects any authored import of the generated Client Prisma", () => {
    expect(
      clientPrismaImportViolations({
        "database/client/infrastructure/client-runtime.ts":
          'import { PrismaClient } from "../generated/client/client.ts";',
      }),
    ).toEqual([
      "DB002_CLIENT_PRISMA_RUNTIME_IMPORT_PROHIBITED database/client/infrastructure/client-runtime.ts -> ../generated/client/client.ts",
    ]);
  });

  it("rejects Client migrations, seeds and sentinels", () => {
    expect(
      clientScopePathViolations([
        "database/client/prisma/migrations/001_init.sql",
        "database/client/seed.ts",
        "database/client/sentinels/client-a.ts",
      ]),
    ).toEqual(
      expect.arrayContaining([
        "DB002_MIGRATION_SCOPE_PROHIBITED database/client/prisma/migrations/001_init.sql",
        "DB002_SEED_OR_SENTINEL_SCOPE_PROHIBITED database/client/seed.ts",
        "DB002_SEED_OR_SENTINEL_SCOPE_PROHIBITED database/client/sentinels/client-a.ts",
      ]),
    );
  });

  it.each(["prisma migrate dev", "prisma migrate deploy", "prisma db push", "db:client:seed"])(
    "rejects database mutation command %s",
    (command) => {
      expect(clientMutationCommandViolations({ "fixture.mjs": command })).toEqual([
        "DB002_DATABASE_MUTATION_COMMAND_PROHIBITED fixture.mjs",
      ]);
    },
  );

  it.each([
    "const database = request.headers.clientId;",
    "const reference = query.client_id;",
    "const datasource = body.clientId;",
    "const connectionString = cookie.clientId;",
    "const reference = browserState.selectedDatabase;",
  ])("rejects request or ClientId database selection", (source) => {
    expect(clientSelectorViolations({ "apps/data-api/src/selector.ts": source })).toEqual([
      "DB002_REQUEST_DATABASE_SELECTOR_PROHIBITED apps/data-api/src/selector.ts",
    ]);
  });

  it("detects generated-client drift in the fail-closed evidence gate", () => {
    expect(
      clientGenerationEvidenceViolations(
        { filesSha256: "old", schemaSha256: "same" },
        { filesSha256: "new", schemaSha256: "same" },
      ),
    ).toEqual(["DB002_GENERATED_CLIENT_DRIFT filesSha256"]);
  });

  it("rejects arbitrary arguments through the real root wrapper", () => {
    const result = spawnSync(
      process.execPath,
      ["scripts/db-002-cli.mjs", "validate", "--schema", "untrusted.prisma"],
      { cwd: repositoryRoot, encoding: "utf8" },
    );

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain("DB002_CLI_ARGUMENTS_REJECTED");
  });

  it("rejects environment connection and configuration overrides", () => {
    const result = spawnSync(process.execPath, ["scripts/db-002-cli.mjs", "validate"], {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: { ...process.env, PRISMA_SCHEMA: "untrusted.prisma" },
    });

    expect(result.status).not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain(
      "DB002_CONNECTION_OVERRIDE_REJECTED PRISMA_SCHEMA",
    );
  });

  it("makes the real Prisma validator fail for an invalid Client schema", async () => {
    const fixtureRoot = await mkdtemp(resolve(tmpdir(), "trazactivo-db002-invalid-"));
    const fixtureSchema = resolve(fixtureRoot, "schema.prisma");
    try {
      await writeFile(
        fixtureSchema,
        'generator client { provider = "prisma-client" output = "./generated" }\n' +
          'datasource client { provider = "sqlserver" }\n' +
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
