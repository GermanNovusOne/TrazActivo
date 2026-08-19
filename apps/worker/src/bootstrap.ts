import "reflect-metadata";

import type { INestApplicationContext } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { WorkerRuntimeService } from "./application/worker-runtime.service.js";
import { GracefulShutdown } from "./infrastructure/graceful-shutdown.js";
import {
  loadWorkerRuntimeConfig,
  type WorkerRuntimeConfig,
  workerStartedRecord,
} from "./infrastructure/runtime-config.js";
import { WorkerModule } from "./worker.module.js";

export async function createWorkerApplication(
  config: WorkerRuntimeConfig,
): Promise<INestApplicationContext> {
  return NestFactory.createApplicationContext(WorkerModule.register(config), { logger: false });
}

export async function startWorker(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): Promise<
  Readonly<{
    app: INestApplicationContext;
    config: WorkerRuntimeConfig;
    shutdown: GracefulShutdown;
  }>
> {
  const config = loadWorkerRuntimeConfig(environment);
  const app = await createWorkerApplication(config);
  const shutdown = new GracefulShutdown(app, config.application);
  shutdown.register();

  process.stdout.write(`${JSON.stringify(workerStartedRecord(config))}\n`);
  return Object.freeze({ app, config, shutdown });
}

export function workerIsRunning(app: INestApplicationContext): boolean {
  return app.get(WorkerRuntimeService).isRunning();
}
