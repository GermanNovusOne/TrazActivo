export type ControlApiRuntimeConfig = Readonly<{
  application: "control-api";
  host: "127.0.0.1";
  plane: "control";
  port: number;
}>;

const DEFAULT_CONTROL_API_PORT = 3101;

function parsePort(value: string | undefined): number {
  if (value === undefined) {
    return DEFAULT_CONTROL_API_PORT;
  }

  if (!/^\d{1,5}$/u.test(value)) {
    throw new Error("CONTROL_API_PORT_INVALID");
  }

  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 1024 || port > 65_535) {
    throw new Error("CONTROL_API_PORT_INVALID");
  }

  return port;
}

export function loadControlApiRuntimeConfig(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): ControlApiRuntimeConfig {
  return Object.freeze({
    application: "control-api",
    host: "127.0.0.1",
    plane: "control",
    port: parsePort(environment.CONTROL_API_PORT),
  });
}

export function controlApiStartedRecord(config: ControlApiRuntimeConfig) {
  return Object.freeze({
    application: config.application,
    event: "APPLICATION_STARTED",
    host: config.host,
    plane: config.plane,
    port: config.port,
  });
}
