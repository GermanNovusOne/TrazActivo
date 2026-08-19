import { defineConfig } from "vitest/config";

export default defineConfig({
  oxc: {
    jsx: {
      runtime: "automatic",
    },
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.a11y.test.tsx"],
    passWithNoTests: false,
    setupFiles: ["./tests/setup.ts"],
  },
});
