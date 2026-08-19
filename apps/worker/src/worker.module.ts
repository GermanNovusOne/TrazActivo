import { Module, type DynamicModule } from "@nestjs/common";

import { WorkerRuntimeService } from "./application/worker-runtime.service.js";
import type { WorkerRuntimeConfig } from "./infrastructure/runtime-config.js";
import { WORKER_RUNTIME_CONFIG } from "./infrastructure/worker-runtime.token.js";

@Module({})
export class WorkerModule {
  static register(config: WorkerRuntimeConfig): DynamicModule {
    return {
      module: WorkerModule,
      providers: [{ provide: WORKER_RUNTIME_CONFIG, useValue: config }, WorkerRuntimeService],
      exports: [WorkerRuntimeService],
    };
  }
}
