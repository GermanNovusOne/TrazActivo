import { reportFailure, statusLocalInfrastructure } from "./fnd-005-runtime.mjs";

try {
  await statusLocalInfrastructure({ argv: process.argv.slice(2) });
} catch (error) {
  reportFailure(error);
}
