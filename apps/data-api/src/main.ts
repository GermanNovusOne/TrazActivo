import { startDataApi } from "./bootstrap.js";

void startDataApi().catch(() => {
  process.stderr.write(
    `${JSON.stringify({ application: "data-api", event: "APPLICATION_START_FAILED" })}\n`,
  );
  process.exitCode = 1;
});
