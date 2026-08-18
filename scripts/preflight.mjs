import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readJson, repositoryRoot } from "./toolchain.mjs";

const approvedNodeMajor = 24;

export function validateToolchain({
  packageJson,
  nodeVersionFile,
  nvmrc,
  runtimeNode,
  runtimeNpm,
}) {
  const errors = [];
  const expectedNode = packageJson.engines?.node;
  const expectedNpm = packageJson.engines?.npm;
  const packageManager = packageJson.packageManager;

  if (!/^\d+\.\d+\.\d+$/.test(expectedNode ?? "")) {
    errors.push("package.json engines.node must be an exact semantic version");
  } else if (Number(expectedNode.split(".")[0]) !== approvedNodeMajor) {
    errors.push(`engines.node must remain on approved Node.js ${approvedNodeMajor} LTS`);
  }

  if (!/^\d+\.\d+\.\d+$/.test(expectedNpm ?? "")) {
    errors.push("package.json engines.npm must be an exact semantic version");
  }

  if (packageManager !== `npm@${expectedNpm}`) {
    errors.push("packageManager must match the exact engines.npm version");
  }

  if (nvmrc !== expectedNode || nodeVersionFile !== expectedNode) {
    errors.push(".nvmrc and .node-version must match engines.node");
  }

  if (runtimeNode !== expectedNode) {
    errors.push(`Node.js ${expectedNode} is required; detected ${runtimeNode}`);
  }

  if (runtimeNpm !== expectedNpm) {
    errors.push(`npm ${expectedNpm} is required; detected ${runtimeNpm}`);
  }

  return errors;
}

function detectNpmVersion() {
  const userAgentMatch = process.env.npm_config_user_agent?.match(/\bnpm\/([^\s]+)/u);
  if (userAgentMatch?.[1]) {
    return userAgentMatch[1];
  }

  const bundledNpm = resolve(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");
  const result = existsSync(bundledNpm)
    ? spawnSync(process.execPath, [bundledNpm, "--version"], {
        cwd: repositoryRoot,
        encoding: "utf8",
      })
    : spawnSync("npm", ["--version"], {
        cwd: repositoryRoot,
        encoding: "utf8",
        shell: process.platform === "win32",
      });

  if (result.status !== 0) {
    return "unavailable";
  }

  return result.stdout.trim();
}

export async function main() {
  const packageJson = await readJson(resolve(repositoryRoot, "package.json"));
  const nvmrc = (await readFile(resolve(repositoryRoot, ".nvmrc"), "utf8")).trim();
  const nodeVersionFile = (await readFile(resolve(repositoryRoot, ".node-version"), "utf8")).trim();
  const errors = validateToolchain({
    nodeVersionFile,
    nvmrc,
    packageJson,
    runtimeNode: process.version.replace(/^v/u, ""),
    runtimeNpm: detectNpmVersion(),
  });

  if (errors.length > 0) {
    for (const error of errors) {
      console.error(`PREFLIGHT_ERROR ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `PREFLIGHT_OK node=${packageJson.engines.node} npm=${packageJson.engines.npm} packageManager=${packageJson.packageManager}`,
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
