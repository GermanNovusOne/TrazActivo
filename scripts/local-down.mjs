import { reportFailure, stopLocalInfrastructure } from "./fnd-005-runtime.mjs";

try {
  await stopLocalInfrastructure({ argv: process.argv.slice(2) });
} catch (error) {
  reportFailure(error);
}
