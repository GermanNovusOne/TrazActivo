import { run, runNpm } from "./toolchain.mjs";

const requiredScripts = [
  "preflight",
  "db:platform:generate",
  "db:platform:validate",
  "db:client:generate",
  "db:client:validate",
  "format:check",
  "lint",
  "typecheck",
  "test:unit",
  "test:architecture",
  "test:integration",
  "test:contract",
  "test:multiclient",
  "test:golden",
  "test:e2e",
  "test:a11y",
  "build",
  "test:backend-smoke",
];

export function runSequence(steps) {
  for (const step of steps) {
    console.log(`VERIFY_RUNNING step=${step.name}`);
    const status = step.execute();
    if (status !== 0) {
      console.error(`VERIFY_FAILED step=${step.name} exit=${status}`);
      return status;
    }
  }

  console.log("VERIFY_COMPLETE result=CONTROLS_EXECUTED_WITH_EXPLICIT_SCOPE_STATUSES");
  return 0;
}

const failureProbe = process.argv.includes("--failure-probe");
const steps = failureProbe
  ? [
      {
        execute: () => run(process.execPath, ["-e", "process.exit(73)"]),
        name: "controlled-failure-probe",
      },
      {
        execute: () => 0,
        name: "must-not-run-after-failure",
      },
    ]
  : requiredScripts.map((name) => ({
      execute: () => runNpm(["run", name]),
      name,
    }));

process.exitCode = runSequence(steps);
