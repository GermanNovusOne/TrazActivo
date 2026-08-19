import { validateGoldenApplicability } from "./fnd-004-rules.mjs";
import { repositoryRoot } from "./toolchain.mjs";

const violations = await validateGoldenApplicability(repositoryRoot);

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(`GOLDEN_APPLICABILITY_VIOLATION ${violation}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    "[test:golden] STATUS=NOT_APPLICABLE_SCOPE OWNER=QA-002 REASON=no accounting policy or calculation surface is published",
  );
}
