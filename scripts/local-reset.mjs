import { reportFailure, resetLocalInfrastructure } from "./fnd-005-runtime.mjs";

try {
  await resetLocalInfrastructure({ argv: process.argv.slice(2) });
} catch (error) {
  reportFailure(error);
}
