import { localPreflight, reportFailure } from "./fnd-005-runtime.mjs";

try {
  await localPreflight({ argv: process.argv.slice(2) });
} catch (error) {
  reportFailure(error);
}
