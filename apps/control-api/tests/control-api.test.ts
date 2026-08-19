import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, test } from "vitest";

import { TechnicalHealthService } from "../src/application/technical-health.service.js";
import { createControlApi } from "../src/bootstrap.js";
import { GracefulShutdown } from "../src/infrastructure/graceful-shutdown.js";
import {
  controlApiStartedRecord,
  loadControlApiRuntimeConfig,
} from "../src/infrastructure/runtime-config.js";
import { HealthController } from "../src/presentation/health.controller.js";

afterEach(() => {
  process.exitCode = undefined;
});

describe("control-api technical shell", () => {
  test("the controller delegates the safe technical health response", () => {
    const service = new TechnicalHealthService();
    const controller = new HealthController(service);

    expect(controller.getHealth()).toEqual({
      plane: "control",
      service: "control-api",
      status: "ok",
      version: "0.0.0",
    });
  });

  test("runtime configuration validates the port without reflecting invalid input", () => {
    const sensitiveValue = "SENSITIVE_CONTROL_API_VALUE_MUST_NOT_APPEAR";

    expect(() => loadControlApiRuntimeConfig({ CONTROL_API_PORT: sensitiveValue })).toThrowError(
      "CONTROL_API_PORT_INVALID",
    );
    expect(() => loadControlApiRuntimeConfig({ CONTROL_API_PORT: "80" })).toThrowError(
      "CONTROL_API_PORT_INVALID",
    );

    const config = loadControlApiRuntimeConfig({
      CLIENT_SECRET: sensitiveValue,
      CONTROL_API_PORT: "43101",
    });
    expect(JSON.stringify(controlApiStartedRecord(config))).not.toContain(sensitiveValue);
    expect(config.port).toBe(43_101);
  });

  test("the real server exposes only safe health and releases its listener", async () => {
    const app = await createControlApi();
    const server = app.getHttpServer();

    try {
      await app.listen(0, "127.0.0.1");
      const address = server.address() as AddressInfo;
      const response = await fetch(`http://127.0.0.1:${address.port}/health`, {
        headers: { connection: "close" },
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        plane: "control",
        service: "control-api",
        status: "ok",
        version: "0.0.0",
      });
    } finally {
      await app.close();
    }

    expect(server.listening).toBe(false);
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
      "control-api",
      (record) => records.push(record),
    );

    await Promise.all([shutdown.stop("SIGTERM"), shutdown.stop("SIGTERM")]);

    expect(closeCount).toBe(1);
    expect(records).toEqual([
      { application: "control-api", event: "APPLICATION_STOPPED", signal: "SIGTERM" },
    ]);
  });
});
