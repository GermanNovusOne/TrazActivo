import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, test } from "vitest";

import { TechnicalHealthService } from "../src/application/technical-health.service.js";
import { createDataApi } from "../src/bootstrap.js";
import { GracefulShutdown } from "../src/infrastructure/graceful-shutdown.js";
import {
  dataApiStartedRecord,
  loadDataApiRuntimeConfig,
} from "../src/infrastructure/runtime-config.js";
import { HealthController } from "../src/presentation/health.controller.js";

afterEach(() => {
  process.exitCode = undefined;
});

describe("data-api technical shell", () => {
  test("the controller delegates the safe technical health response", () => {
    const service = new TechnicalHealthService();
    const controller = new HealthController(service);

    expect(controller.getHealth()).toEqual({
      plane: "data",
      service: "data-api",
      status: "ok",
      version: "0.0.0",
    });
  });

  test("runtime configuration validates the port without reflecting invalid input", () => {
    const sensitiveValue = "SENSITIVE_DATA_API_VALUE_MUST_NOT_APPEAR";

    expect(() => loadDataApiRuntimeConfig({ DATA_API_PORT: sensitiveValue })).toThrowError(
      "DATA_API_PORT_INVALID",
    );
    expect(() => loadDataApiRuntimeConfig({ DATA_API_PORT: "65536" })).toThrowError(
      "DATA_API_PORT_INVALID",
    );

    const config = loadDataApiRuntimeConfig({
      DATA_API_PORT: "43100",
      SECRET_TOKEN: sensitiveValue,
    });
    expect(JSON.stringify(dataApiStartedRecord(config))).not.toContain(sensitiveValue);
    expect(config.port).toBe(43_100);
  });

  test("the real server exposes only safe health and releases its listener", async () => {
    const app = await createDataApi();
    const server = app.getHttpServer();

    try {
      await app.listen(0, "127.0.0.1");
      const address = server.address() as AddressInfo;
      const response = await fetch(`http://127.0.0.1:${address.port}/health`, {
        headers: { connection: "close" },
      });

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        plane: "data",
        service: "data-api",
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
      "data-api",
      (record) => records.push(record),
    );

    await Promise.all([shutdown.stop("SIGTERM"), shutdown.stop("SIGTERM")]);

    expect(closeCount).toBe(1);
    expect(records).toEqual([
      { application: "data-api", event: "APPLICATION_STOPPED", signal: "SIGTERM" },
    ]);
  });
});
