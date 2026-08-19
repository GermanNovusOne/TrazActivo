import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, resolve, sep } from "node:path";

export interface RepositoryFixture {
  readonly root: string;
  cleanup(): Promise<void>;
}

export async function createRepositoryFixture(
  files: Readonly<Record<string, string>>,
): Promise<RepositoryFixture> {
  const root = await mkdtemp(resolve(tmpdir(), "trazactivo-fixture-"));

  try {
    for (const [relativePath, content] of Object.entries(files)) {
      const target = resolve(root, relativePath);
      if (target !== root && !target.startsWith(`${root}${sep}`)) {
        throw new Error("FIXTURE_PATH_OUTSIDE_ROOT");
      }
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, content, "utf8");
    }
  } catch (error) {
    await rm(root, { force: true, recursive: true });
    throw error;
  }

  return Object.freeze({
    cleanup: () => rm(root, { force: true, recursive: true }),
    root,
  });
}
