import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    // Global overrides for recommended rules (applied to all files)
    rules: {
      'no-case-declarations': 'off',
      'no-empty': 'warn',
      'no-useless-catch': 'warn',
      'no-useless-escape': 'warn',
      'no-constant-binary-expression': 'warn',
      'no-dupe-keys': 'warn',
      'no-unused-vars': 'off',
      'no-prototype-builtins': 'warn', // Use Object.hasOwn() instead but don't error
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
        JSX: 'readonly',
        NodeJS: 'readonly',
        HeadersInit: 'readonly',
        RequestInit: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        AbortController: 'readonly',
        AbortSignal: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptPlugin,
    },
    rules: {
      // TypeScript-specific rules - warn instead of error for gradual fix
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-unused-vars': 'off', // Disable base rule in favor of TypeScript rule

      // Naming conventions - relaxed for database field destructuring (snake_case)
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase', 'snake_case'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false,
          },
        },
      ],

      // General JavaScript rules
      'no-console': 'off', // Allow console in development
      'prefer-const': 'warn',
      'no-var': 'error',
      'eqeqeq': ['warn', 'always'],
      'no-unused-expressions': 'warn',
      'curly': ['warn', 'all'],
      'brace-style': ['warn', '1tbs'],
      'no-throw-literal': 'warn',
      'prefer-promise-reject-errors': 'warn',
      'no-case-declarations': 'off', // Often needed in switch statements
      'no-redeclare': 'off', // TypeScript handles this
      'no-useless-escape': 'warn',
      'no-empty': 'warn',
      'no-useless-catch': 'warn',
      'no-constant-binary-expression': 'warn',
      'no-undef': 'off', // TypeScript handles undefined checks
      'no-unreachable': 'warn',
      'no-unsafe-finally': 'warn',
      'no-dupe-keys': 'warn', // Should be fixed but not blocking
      'no-control-regex': 'warn',
      'no-empty-pattern': 'warn',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unused-vars': 'off',
    },
  },
  {
    // Test files configuration
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/tests/**/*.ts', '**/tests/**/*.tsx', 'vitest.setup.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        jest: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-unused-expressions': 'off',
    },
  },
  {
    // Node.js scripts (.mjs, .cjs, .js files)
    files: ['**/*.mjs', '**/*.cjs', '**/*.js', 'scripts/**/*'],
    languageOptions: {
      globals: {
        ...globals.node,
        console: 'readonly',
        process: 'readonly',
        fetch: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
      '@typescript-eslint/naming-convention': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      '_disabled/**',
      'convex.bak/**',
      'convex/**',
      '.claude/mcp_servers/**',
      '.clinerules/**',
      '**/*.d.ts',
      // Non-core directories
      'examples/**',
      'lib/**',
      'mcp/**',
      'modules/**',
      'next/**',
      'tests/**',
      'docker/**',
      'coverage/**',
      'scripts/**',
      // External dependencies
      'external/**',
      // Experimental/shadow directories
      'shadow-observer/**',
      // Root level orphan files
      'page.tsx',
    ],
  },
];
