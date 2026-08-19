import { reportFailure, startLocalInfrastructure } from "./fnd-005-runtime.mjs";

try {
  await startLocalInfrastructure({ argv: process.argv.slice(2) });
} catch (error) {
  reportFailure(error);
}
