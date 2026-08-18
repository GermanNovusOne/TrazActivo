import { runWorkspaceScript } from "./toolchain.mjs";

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
    reason: "no integration surface or local databases have been delivered yet",
    status: "NOT_IMPLEMENTED_SCOPE",
  },
  "test:multiclient": {
    owner: "CLI-005,QA-001",
    reason: "Client DB A and Client DB B have not been delivered yet",
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

if (!contract) {
  console.error(`UNKNOWN_SUITE ${scriptName ?? "missing"}`);
  process.exitCode = 2;
} else {
  process.exitCode = await runWorkspaceScript(scriptName, contract);
}
