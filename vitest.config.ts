import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['**/*.test.tsx', 'jsdom'],
      ['**/components/**/*.test.ts', 'jsdom'],
    ],
    setupFiles: ['./tests/setup.ts'],
    // Exclude Playwright tests and separate projects
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.spec.ts', // Playwright E2E tests
      '**/tests/e2e/**', // E2E test directory
      '**/*.e2e.spec.ts', // E2E test files
      '**/NodeJS-Starter-V1/**', // Separate project with own test setup
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/cli/services/**/*.ts', 'src/cli/commands/**/*.ts'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/types.ts',
        '**/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/next': path.resolve(__dirname, './next'),
      '@/convex': path.resolve(__dirname, './convex'),
      '@config': path.resolve(__dirname, './config'),
    },
  },
});
