import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".git/**",
      "**/.next/**",
      "assets/**",
      "bin/**",
      "**/build/**",
      "contracts/**",
      "**/coverage/**",
      "database/**",
      "**/dist/**",
      "docs/**",
      "infra/**",
      "**/node_modules/**",
      "obj/**",
      "**/out/**",
      "policies/**",
      "src/**",
      "tests/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.js", "**/*.cjs", "**/*.mjs"],
    languageOptions: {
      globals: globals.node,
    },
  },
);
