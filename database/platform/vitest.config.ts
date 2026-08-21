import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["database/platform/tests/**/*.test.ts"],
    passWithNoTests: false,
  },
});
