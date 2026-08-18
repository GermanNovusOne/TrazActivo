import { readFile, readdir, writeFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";

import { format, resolveConfig } from "prettier";

import { repositoryRoot } from "./toolchain.mjs";

const supportedExtensions = new Set([
  ".cjs",
  ".css",
  ".js",
  ".json",
  ".jsonc",
  ".md",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);
const ignoredDirectories = new Set(["coverage", "dist", "node_modules", "out"]);
const selectedRootFiles = [
  ".prettierrc.json",
  "eslint.config.mjs",
  "package.json",
  "tsconfig.base.json",
  "tsconfig.json",
  "vitest.architecture.config.mjs",
];
const selectedDirectories = [
  "apps",
  "docs/04-development",
  "docs/plans/reports",
  "packages",
  "scripts",
];

async function collectFiles(directory) {
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
    if (entry.isSymbolicLink()) {
      continue;
    }

    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...(await collectFiles(absolutePath)));
      }
      continue;
    }

    if (entry.isFile() && supportedExtensions.has(extname(entry.name).toLowerCase())) {
      files.push(absolutePath);
    }
  }

  return files;
}

const mode = process.argv[2];
if (!new Set(["--check", "--write"]).has(mode)) {
  console.error("Usage: node scripts/format.mjs --check|--write");
  process.exitCode = 2;
} else {
  const files = [];
  for (const file of selectedRootFiles) {
    files.push(resolve(repositoryRoot, file));
  }
  for (const directory of selectedDirectories) {
    files.push(...(await collectFiles(resolve(repositoryRoot, directory))));
  }

  const changed = [];
  for (const file of [...new Set(files)].sort()) {
    const source = await readFile(file, "utf8");
    const configuration = (await resolveConfig(file, { editorconfig: true })) ?? {};
    const formatted = await format(source, { ...configuration, filepath: file });

    if (source === formatted) {
      continue;
    }

    const displayPath = relative(repositoryRoot, file).replaceAll("\\", "/");
    changed.push(displayPath);
    if (mode === "--write") {
      await writeFile(file, formatted, "utf8");
    }
  }

  if (mode === "--check" && changed.length > 0) {
    for (const file of changed) {
      console.error(`FORMAT_ERROR ${file}`);
    }
    process.exitCode = 1;
  } else {
    console.log(
      mode === "--write"
        ? `FORMAT_WRITE files_changed=${changed.length}`
        : `FORMAT_CHECK_OK files_checked=${files.length}`,
    );
  }
}
