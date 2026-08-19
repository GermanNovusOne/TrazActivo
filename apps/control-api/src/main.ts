import { startControlApi } from "./bootstrap.js";

void startControlApi().catch(() => {
  process.stderr.write(
    `${JSON.stringify({ application: "control-api", event: "APPLICATION_START_FAILED" })}\n`,
  );
  process.exitCode = 1;
});
