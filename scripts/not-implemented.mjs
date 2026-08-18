const command = process.argv[2] ?? "unknown";
const owner = process.argv[3] ?? "unassigned";

console.error(
  `[${command}] STATUS=NOT_IMPLEMENTED_SCOPE OWNER=${owner} RESULT=BLOCKED_NO_FALSE_SUCCESS`,
);
process.exitCode = 2;
