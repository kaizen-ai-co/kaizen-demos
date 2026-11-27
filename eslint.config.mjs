// ESLint del monorepo: TypeScript + React hooks + Next + accesibilidad (WCAG) en .tsx.
// No se desactivan reglas para «pasar»: si una regla no aplica, se justifica en línea.
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import nextPlugin from "@next/eslint-plugin-next";
import jsxA11y from "eslint-plugin-jsx-a11y-x";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/dist/**",
      "coverage/**",
      "capturas/**",
      "lighthouse/**",
      "test-results/**",
      "playwright-report/**",
      "**/next-env.d.ts",
    ],
  },
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["**/*.tsx"],
    ...reactHooks.configs.flat.recommended,
  },
  {
    files: ["**/*.tsx"],
    ...jsxA11y.configs.recommended,
  },
  {
    files: ["apps/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
    plugins: { "@next/next": nextPlugin },
    rules: { ...nextPlugin.configs.recommended.rules, ...nextPlugin.configs["core-web-vitals"].rules },
    settings: { next: { rootDir: "apps/*/" } },
  },
];
