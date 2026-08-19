export type DataApiRuntimeConfig = Readonly<{
  application: "data-api";
  host: "127.0.0.1";
  plane: "data";
  port: number;
}>;

const DEFAULT_DATA_API_PORT = 3100;

function parsePort(value: string | undefined): number {
  if (value === undefined) {
    return DEFAULT_DATA_API_PORT;
  }

  if (!/^\d{1,5}$/u.test(value)) {
    throw new Error("DATA_API_PORT_INVALID");
  }

  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1024 || port > 65_535) {
    throw new Error("DATA_API_PORT_INVALID");
  }

  return port;
}

export function loadDataApiRuntimeConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): DataApiRuntimeConfig {
  return Object.freeze({
    application: "data-api",
    host: "127.0.0.1",
    plane: "data",
    port: parsePort(environment.DATA_API_PORT),
  });
}

export function dataApiStartedRecord(config: DataApiRuntimeConfig) {
  return Object.freeze({
    application: config.application,
    event: "APPLICATION_STARTED",
    host: config.host,
    plane: config.plane,
    port: config.port,
  });
}
