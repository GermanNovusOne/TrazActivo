import { resolve } from "node:path";

import { repositoryRoot, run, runWorkspaceScript } from "./toolchain.mjs";

const rootStatus = run(process.execPath, [
  resolve(repositoryRoot, "node_modules/typescript/bin/tsc"),
  "--project",
  resolve(repositoryRoot, "tsconfig.json"),
  "--noEmit",
]);

if (rootStatus !== 0) {
  process.exitCode = rootStatus;
} else {
  console.log("TYPECHECK_ROOT_OK config=tsconfig.json");
  const platformStatus = run(process.execPath, [
    resolve(repositoryRoot, "node_modules/typescript/bin/tsc"),
    "--project",
    resolve(repositoryRoot, "database/platform/tsconfig.json"),
    "--noEmit",
  ]);

  if (platformStatus !== 0) {
    process.exitCode = platformStatus;
  } else {
    console.log("TYPECHECK_DB001_OK config=database/platform/tsconfig.json");
    const clientStatus = run(process.execPath, [
      resolve(repositoryRoot, "node_modules/typescript/bin/tsc"),
      "--project",
      resolve(repositoryRoot, "database/client/tsconfig.json"),
      "--noEmit",
    ]);

    if (clientStatus !== 0) {
      process.exitCode = clientStatus;
    } else {
      console.log("TYPECHECK_DB002_OK config=database/client/tsconfig.json");
      process.exitCode = await runWorkspaceScript("typecheck", {
        owner: "FND-002,FND-003,FND-004",
        reason: "no TypeScript workspace has been delivered yet",
        status: "NOT_IMPLEMENTED_SCOPE",
      });
    }
  }
}
