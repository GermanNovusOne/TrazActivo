import { run, runWorkspaceScript } from "./toolchain.mjs";

const contracts = {
  build: {
    owner: "FND-002,FND-003",
    reason: "no deployable application workspace has been delivered yet",
    status: "NOT_IMPLEMENTED_SCOPE",
  },
  "test:a11y": {
    owner: "QA-002",
    reason: "no user interface has been delivered yet",
    status: "NOT_IMPLEMENTED_SCOPE",
  },
  "test:contract": {
    owner: "API-001,API-002,QA-001",
    reason: "no OpenAPI surface has been delivered yet",
    status: "NOT_IMPLEMENTED_SCOPE",
  },
  "test:e2e": {
    owner: "QA-002",
    reason: "no end-to-end system has been delivered yet",
    status: "NOT_IMPLEMENTED_SCOPE",
  },
  "test:golden": {
    owner: "QA-002",
    reason:
      "no accounting policy or calculation surface is published in the walking skeleton scope",
    status: "NOT_APPLICABLE_SCOPE",
  },
  "test:integration": {
    owner: "QA-001",
    reason: "application integration belongs to future authorized work packages",
    status: "NOT_IMPLEMENTED_SCOPE",
  },
  "test:multiclient": {
    owner: "CLI-005,QA-001",
    reason: "functional Client resolver, context and data surfaces have not been delivered yet",
    status: "NOT_IMPLEMENTED_SCOPE",
  },
  "test:unit": {
    owner: "FND-002,FND-003,FND-004",
    reason: "no functional application or package workspace has been delivered yet",
    status: "NOT_IMPLEMENTED_SCOPE",
  },
};

const scriptName = process.argv[2];
const contract = contracts[scriptName];

function integrationProject(args) {
  if (args.length === 0) {
    return undefined;
  }
  if (args.length === 2 && args[0] === "--project") {
    return args[1];
  }
  return null;
}

function runIntegration(args) {
  const project = integrationProject(args);
  if (project === null) {
    console.error("INVALID_INTEGRATION_ARGUMENTS expected=--project local-infrastructure");
    return 2;
  }
  if (project !== undefined && project !== "local-infrastructure") {
    console.error(`UNKNOWN_INTEGRATION_PROJECT ${project}`);
    return 2;
  }

  console.log("[test:integration] RUNNING PROJECT=local-infrastructure OWNER=FND-005");
  const status = run(process.execPath, ["scripts/fnd-005-integration.mjs"]);
  if (status !== 0) {
    return status;
  }
  if (project === undefined) {
    console.log(
      "[test:integration] STATUS=NOT_IMPLEMENTED_SCOPE OWNER=QA-001 PROJECT=future-application-integration",
    );
  }
  return 0;
}

if (!contract) {
  console.error(`UNKNOWN_SUITE ${scriptName ?? "missing"}`);
  process.exitCode = 2;
} else if (scriptName === "test:integration") {
  process.exitCode = runIntegration(process.argv.slice(3));
} else {
  process.exitCode = await runWorkspaceScript(scriptName, contract);
}
