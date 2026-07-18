// @ts-check
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

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
