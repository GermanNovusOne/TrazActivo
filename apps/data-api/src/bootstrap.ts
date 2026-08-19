import "reflect-metadata";

import type { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { DataApiModule } from "./data-api.module.js";
import { GracefulShutdown } from "./infrastructure/graceful-shutdown.js";
import {
  dataApiStartedRecord,
  loadDataApiRuntimeConfig,
  type DataApiRuntimeConfig,
} from "./infrastructure/runtime-config.js";

export async function createDataApi(): Promise<INestApplication> {
  return NestFactory.create(DataApiModule, { logger: false });
}

export async function startDataApi(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): Promise<
  Readonly<{ app: INestApplication; config: DataApiRuntimeConfig; shutdown: GracefulShutdown }>
> {
  const config = loadDataApiRuntimeConfig(environment);
  const app = await createDataApi();
  const shutdown = new GracefulShutdown(app, config.application);
  shutdown.register();

  try {
    await app.listen(config.port, config.host);
  } catch {
    await shutdown.stop("TEST");
    throw new Error("DATA_API_START_FAILED");
  }

  process.stdout.write(`${JSON.stringify(dataApiStartedRecord(config))}\n`);
  return Object.freeze({ app, config, shutdown });
}
