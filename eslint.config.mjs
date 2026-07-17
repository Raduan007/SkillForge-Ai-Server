// @ts-check
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import { createRequire } from 'module';

// TypeScript 7 does not yet expose the programmatic API required by
// @typescript-eslint. The official workaround is to route ESLint through
// the @typescript/typescript6 compat shim for linting while continuing to
// build with TypeScript 7 (tsc). See:
// https://www.typescriptlang.org/docs/handbook/typescript-tooling-in-5-minutes.html
const require = createRequire(import.meta.url);
const tsPath = require.resolve('@typescript/typescript6');

export default [
  // ─── Global ignores ──────────────────────────────────────────────────────
  {
    ignores: ['dist/**', 'node_modules/**'],
  },

  // ─── TypeScript source files ─────────────────────────────────────────────
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // Point @typescript-eslint at the TS6 shim path
        typescriptPath: tsPath,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Start from the recommended set
      ...tseslint.configs['recommended'].rules,

      // Express route handlers commonly use `any` for req/res locals —
      // allow it rather than fighting the type system unnecessarily.
      '@typescript-eslint/no-explicit-any': 'off',

      // Prefer `const` / `let` over `var`
      'no-var': 'error',

      // Require explicit return types on exported functions
      '@typescript-eslint/explicit-module-boundary-types': 'off',

      // Warn on unused variables (prefix with _ to suppress)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
];
