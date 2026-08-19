import "reflect-metadata";

import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { ControlApiModule } from "./control-api.module.js";
import { GracefulShutdown } from "./infrastructure/graceful-shutdown.js";
import {
  controlApiStartedRecord,
  loadControlApiRuntimeConfig,
  type ControlApiRuntimeConfig,
} from "./infrastructure/runtime-config.js";

export async function createControlApi(): Promise<INestApplication> {
  return NestFactory.create(ControlApiModule, { logger: false });
}

export async function startControlApi(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): Promise<
  Readonly<{ app: INestApplication; config: ControlApiRuntimeConfig; shutdown: GracefulShutdown }>
> {
  const config = loadControlApiRuntimeConfig(environment);
  const app = await createControlApi();
  const shutdown = new GracefulShutdown(app, config.application);
  shutdown.register();

  try {
    await app.listen(config.port, config.host);
  } catch {
    await shutdown.stop("TEST");
    throw new Error("CONTROL_API_START_FAILED");
  }

  process.stdout.write(`${JSON.stringify(controlApiStartedRecord(config))}\n`);
  return Object.freeze({ app, config, shutdown });
}
