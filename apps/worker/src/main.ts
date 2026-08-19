import { startWorker } from "./bootstrap.js";

void startWorker().catch(() => {
  process.stderr.write(
    `${JSON.stringify({ application: "worker", event: "APPLICATION_START_FAILED" })}\n`,
  );
  process.exitCode = 1;
});
