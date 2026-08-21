import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["database/client/tests/**/*.test.ts"],
    passWithNoTests: false,
  },
});
