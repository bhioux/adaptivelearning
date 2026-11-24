/**
 * Flat ESLint 9 config. TS rules via typescript-eslint.
 * Lint: `pnpm lint` (root), `pnpm --filter @al/backend lint`.
 */
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
];
