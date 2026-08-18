import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: {
    jsx: {
      runtime: "automatic",
    },
  },
  test: {
    environment: "jsdom",
    exclude: ["tests/**/*.a11y.test.tsx"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    passWithNoTests: false,
    setupFiles: ["./tests/setup.ts"],
  },
});
