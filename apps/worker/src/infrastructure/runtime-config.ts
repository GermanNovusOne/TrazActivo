export type WorkerRuntimeConfig = Readonly<{
  application: "worker";
  idleIntervalMs: number;
  mode: "standalone";
}>;

const DEFAULT_IDLE_INTERVAL_MS = 60_000;

function parseIdleInterval(value: string | undefined): number {
  if (value === undefined) {
    return DEFAULT_IDLE_INTERVAL_MS;
  }

  if (!/^\d{1,6}$/u.test(value)) {
    throw new Error("WORKER_IDLE_INTERVAL_MS_INVALID");
  }

  const interval = Number(value);
  if (!Number.isSafeInteger(interval) || interval < 1_000 || interval > 300_000) {
    throw new Error("WORKER_IDLE_INTERVAL_MS_INVALID");
  }

  return interval;
}

export function loadWorkerRuntimeConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): WorkerRuntimeConfig {
  return Object.freeze({
    application: "worker",
    idleIntervalMs: parseIdleInterval(environment.WORKER_IDLE_INTERVAL_MS),
    mode: "standalone",
  });
}

export function workerStartedRecord(config: WorkerRuntimeConfig) {
  return Object.freeze({
    application: config.application,
    event: "APPLICATION_STARTED",
    mode: config.mode,
  });
}
