import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

import { createRepositoryFixture } from "../src/index.js";

describe("repository fixture", () => {
  test("creates isolated files and removes its exact temporary root", async () => {
    const fixture = await createRepositoryFixture({
      "packages/example/src/index.ts": "export {};",
    });
    const file = resolve(fixture.root, "packages/example/src/index.ts");

    await expect(readFile(file, "utf8")).resolves.toBe("export {};");
    await fixture.cleanup();
    await expect(access(fixture.root)).rejects.toMatchObject({ code: "ENOENT" });
  });

  test("rejects a path that escapes the temporary root", async () => {
    await expect(createRepositoryFixture({ "../outside.ts": "unsafe" })).rejects.toThrow(
      "FIXTURE_PATH_OUTSIDE_ROOT",
    );
  });
});
