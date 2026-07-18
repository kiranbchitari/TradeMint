import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // We intentionally sync local state from props/localStorage in a few
      // effects (dialog form reset on open, sidebar collapse hydration).
      // These are valid "sync with external system" uses, so downgrade to warn.
      "react-hooks/set-state-in-effect": "warn",
      // TanStack Table's useReactTable returns non-memoizable functions by
      // design; the React Compiler correctly skips it — informational only.
      "react-hooks/incompatible-library": "warn",
    },
  },
]);

export default eslintConfig;
