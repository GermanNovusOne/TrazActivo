import { afterEach, describe, expect, test } from "vitest";

import { WorkerRuntimeService } from "../src/application/worker-runtime.service.js";
import { createWorkerApplication, workerIsRunning } from "../src/bootstrap.js";
import { GracefulShutdown } from "../src/infrastructure/graceful-shutdown.js";
import {
  loadWorkerRuntimeConfig,
  workerStartedRecord,
} from "../src/infrastructure/runtime-config.js";

afterEach(() => {
  process.exitCode = undefined;
});

describe("worker technical shell", () => {
  test("runtime configuration is validated and startup logs use an allowlist", () => {
    const sensitiveValue = "SENSITIVE_WORKER_VALUE_MUST_NOT_APPEAR";

    expect(() => loadWorkerRuntimeConfig({ WORKER_IDLE_INTERVAL_MS: sensitiveValue })).toThrowError(
      "WORKER_IDLE_INTERVAL_MS_INVALID",
    );

    const config = loadWorkerRuntimeConfig({
      CLIENT_CONNECTION_STRING: sensitiveValue,
      WORKER_IDLE_INTERVAL_MS: "1500",
    });
    expect(config.idleIntervalMs).toBe(1_500);
    expect(JSON.stringify(workerStartedRecord(config))).not.toContain(sensitiveValue);
  });

  test("the runtime stays idle without processing a functional job", () => {
    const runtime = new WorkerRuntimeService(loadWorkerRuntimeConfig({}));

    runtime.onApplicationBootstrap();
    expect(runtime.isRunning()).toBe(true);
    runtime.onApplicationShutdown();
    expect(runtime.isRunning()).toBe(false);
  });

  test("the Nest standalone context starts and releases its keepalive handle", async () => {
    const config = loadWorkerRuntimeConfig({ WORKER_IDLE_INTERVAL_MS: "1000" });
    const app = await createWorkerApplication(config);

    expect(workerIsRunning(app)).toBe(true);
    await app.close();
    expect(app.get(WorkerRuntimeService).isRunning()).toBe(false);
  });

  test("graceful shutdown is idempotent and logs only allowlisted fields", async () => {
    let closeCount = 0;
    const records: Array<Readonly<Record<string, string>>> = [];
    const shutdown = new GracefulShutdown(
      {
        close: async () => {
          closeCount += 1;
        },
      },
      "worker",
      (record) => records.push(record),
    );

    await Promise.all([shutdown.stop("SIGTERM"), shutdown.stop("SIGTERM")]);

    expect(closeCount).toBe(1);
    expect(records).toEqual([
      { application: "worker", event: "APPLICATION_STOPPED", signal: "SIGTERM" },
    ]);
  });
});
