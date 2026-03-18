import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import prettierConfig from 'eslint-config-prettier';
import security from 'eslint-plugin-security';
import tseslint from 'typescript-eslint';

const eslintConfig = tseslint.config(
  // -- Presets --
  ...nextCoreWebVitals,
  ...tseslint.configs.strictTypeChecked,
  prettierConfig,
  security.configs.recommended,

  // -- Global rules --
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // -- Codebase standards --
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'Literal[value=/[\\u{1F300}-\\u{1F9FF}\\u{2600}-\\u{26FF}\\u{2700}-\\u{27BF}]/u]',
          message:
            'Emojis are not allowed in code. Use plain text instead.',
        },
      ],
      'no-irregular-whitespace': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // -- Preset overrides (relaxed from strictTypeChecked) --
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      '@typescript-eslint/no-confusing-void-expression': [
        'error',
        { ignoreArrowShorthand: true },
      ],

      // -- Additions (not in any preset) --
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // -- Deferred: remove these overrides when ready to enforce
      //    strict any-safety across the codebase --
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',

      // -- Next.js --
      '@next/next/no-html-link-for-pages': 'off',

      // -- Security plugin: false positives --
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-unsafe-regex': 'off',
      'security/detect-non-literal-regexp': 'off',
    },
  },

  // Scripts: console.log is the CLI interface
  {
    files: ['scripts/**/*.ts'],
    rules: { 'no-console': 'off' },
  },

  // Tests: relax rules for mocks, assertions, fixtures
  {
    files: ['tests/**/*.ts', 'tests/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
    },
  },

  // Auto-generated types: suppress rules that conflict with codegen
  {
    files: ['types/database.ts'],
    rules: { '@typescript-eslint/no-redundant-type-constituents': 'off' },
  },

  // Config files and plain JS: not in tsconfig, skip type-checked rules
  {
    files: ['*.mjs', '*.js', 'scripts/**/*.js'],
    ...tseslint.configs.disableTypeChecked,
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      '@typescript-eslint/no-require-imports': 'off',
    },
  }
);

export default eslintConfig;
