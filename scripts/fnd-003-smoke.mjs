import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { repositoryRoot } from "./toolchain.mjs";

const smokeSecret = "FND003_SMOKE_SECRET_MUST_NOT_APPEAR";

function builtModule(relativePath) {
  return import(pathToFileURL(resolve(repositoryRoot, relativePath)).href);
}

async function verifyApi({ application, modulePath, plane, port, portVariable, startFunction }) {
  const module = await builtModule(modulePath);
  const runtime = await module[startFunction]({
    [portVariable]: String(port),
    CLIENT_CONNECTION_STRING: smokeSecret,
  });
  const server = runtime.app.getHttpServer();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/health`, {
      headers: { connection: "close" },
    });
    const body = await response.json();
    if (
      response.status !== 200 ||
      body.service !== application ||
      body.plane !== plane ||
      body.status !== "ok" ||
      JSON.stringify(body).includes(smokeSecret)
    ) {
      throw new Error(`${application.toUpperCase().replaceAll("-", "_")}_SMOKE_INVALID`);
    }
  } finally {
    await runtime.shutdown.stop("TEST");
  }

  if (server.listening) {
    throw new Error(`${application.toUpperCase().replaceAll("-", "_")}_SHUTDOWN_FAILED`);
  }

  console.log(`FND003_SMOKE_OK application=${application} health=200 shutdown=released`);
}

async function verifyWorker() {
  const module = await builtModule("apps/worker/dist/bootstrap.js");
  const runtime = await module.startWorker({
    CLIENT_CONNECTION_STRING: smokeSecret,
    WORKER_IDLE_INTERVAL_MS: "1000",
  });

  if (!module.workerIsRunning(runtime.app)) {
    throw new Error("WORKER_STARTUP_FAILED");
  }

  await runtime.shutdown.stop("TEST");
  if (module.workerIsRunning(runtime.app)) {
    throw new Error("WORKER_SHUTDOWN_FAILED");
  }

  console.log("FND003_SMOKE_OK application=worker mode=idle shutdown=released");
}

try {
  await verifyApi({
    application: "data-api",
    modulePath: "apps/data-api/dist/bootstrap.js",
    plane: "data",
    port: 43_110,
    portVariable: "DATA_API_PORT",
    startFunction: "startDataApi",
  });
  await verifyApi({
    application: "control-api",
    modulePath: "apps/control-api/dist/bootstrap.js",
    plane: "control",
    port: 43_111,
    portVariable: "CONTROL_API_PORT",
    startFunction: "startControlApi",
  });
  await verifyWorker();
} catch {
  console.error("FND003_SMOKE_FAILED");
  process.exitCode = 1;
}
