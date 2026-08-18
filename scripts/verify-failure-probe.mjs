import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

import { repositoryRoot } from "./toolchain.mjs";

const result = spawnSync(
  process.execPath,
  [resolve(repositoryRoot, "scripts/verify.mjs"), "--failure-probe"],
  {
    cwd: repositoryRoot,
    encoding: "utf8",
  },
);
const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;

if (
  result.status !== 73 ||
  !output.includes("VERIFY_FAILED step=controlled-failure-probe exit=73") ||
  output.includes("must-not-run-after-failure")
) {
  console.error(output);
  console.error(`FAILURE_PROPAGATION_ERROR observed_exit=${result.status ?? "none"}`);
  process.exitCode = 1;
} else {
  console.log("FAILURE_PROPAGATION_VERIFIED child_exit=73 verify_exit=73 fail_fast=true");
}
