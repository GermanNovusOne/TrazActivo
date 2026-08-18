import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: "utf8",
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    console.error(result.error.message);
    return 1;
  }

  return result.status ?? 1;
}

export function runNpm(args, options = {}) {
  const npmExecPath = process.env.npm_execpath;

  if (npmExecPath) {
    return run(process.execPath, [npmExecPath, ...args], options);
  }

  const bundledNpm = resolve(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");
  if (existsSync(bundledNpm)) {
    return run(process.execPath, [bundledNpm, ...args], options);
  }

  return run("npm", args, {
    shell: process.platform === "win32",
    ...options,
  });
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function workspaceManifests(root = repositoryRoot) {
  const manifests = [];

  for (const workspaceRoot of ["apps", "packages"]) {
    const absoluteWorkspaceRoot = resolve(root, workspaceRoot);
    let entries;

    try {
      entries = await readdir(absoluteWorkspaceRoot, { withFileTypes: true });
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        continue;
      }
      throw error;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const directory = resolve(absoluteWorkspaceRoot, entry.name);
      const manifestPath = resolve(directory, "package.json");

      try {
        const manifest = await readJson(manifestPath);
        manifests.push({
          directory,
          manifest,
          manifestPath,
          relativeDirectory: relative(root, directory).replaceAll("\\", "/"),
        });
      } catch (error) {
        if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
          continue;
        }
        throw error;
      }
    }
  }

  return manifests.sort((left, right) =>
    left.relativeDirectory.localeCompare(right.relativeDirectory),
  );
}

export async function runWorkspaceScript(scriptName, contract) {
  const manifests = await workspaceManifests();
  const runnable = manifests.filter(({ manifest }) =>
    Object.hasOwn(manifest.scripts ?? {}, scriptName),
  );
  const deferred = manifests.filter(
    ({ manifest }) => !Object.hasOwn(manifest.scripts ?? {}, scriptName),
  );

  for (const { relativeDirectory } of deferred) {
    console.log(
      `[${scriptName}] STATUS=${contract.status} OWNER=${contract.owner} WORKSPACE=${relativeDirectory}`,
    );
  }

  if (runnable.length === 0) {
    console.log(
      `[${scriptName}] STATUS=${contract.status} OWNER=${contract.owner} REASON=${contract.reason}`,
    );
    return 0;
  }

  for (const { relativeDirectory } of runnable) {
    console.log(`[${scriptName}] RUNNING WORKSPACE=${relativeDirectory}`);
    const status = runNpm(["run", scriptName, "--workspace", relativeDirectory]);
    if (status !== 0) {
      return status;
    }
  }

  return 0;
}
