import {
  Inject,
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from "@nestjs/common";

import {
  WORKER_RUNTIME_CONFIG,
  type WorkerRuntimeConfig,
} from "../infrastructure/worker-runtime.token.js";

@Injectable()
export class WorkerRuntimeService implements OnApplicationBootstrap, OnApplicationShutdown {
  private idleTimer: NodeJS.Timeout | undefined;

  constructor(
    @Inject(WORKER_RUNTIME_CONFIG)
    private readonly config: WorkerRuntimeConfig,
  ) {}

  onApplicationBootstrap(): void {
    this.idleTimer ??= setInterval(() => undefined, this.config.idleIntervalMs);
  }

  onApplicationShutdown(): void {
    if (this.idleTimer) {
      clearInterval(this.idleTimer);
      this.idleTimer = undefined;
    }
  }

  isRunning(): boolean {
    return this.idleTimer !== undefined;
  }
}
