import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

/**
 * Vitest Configuration — Unite-Group Nexus 2.0
 *
 * Unit + integration tests for all Nexus 2.0 source files.
 * E2E tests use Playwright (playwright.config.ts).
 */

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['**/*.test.tsx', 'jsdom'],
      ['**/components/**/*.test.ts', 'jsdom'],
    ],
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      '**/tests/**',                          // v1 legacy test suite — references deleted modules
      '**/*.spec.ts',                         // Playwright E2E — use `pnpm playwright test` instead
      '**/e2e/**',
      'apps/web/**',                          // apps/web has its own @/ alias (apps/web root), incompatible with root config
      'packages/veritas-kanban-mcp/web/**',   // separate package with own vitest.config.ts
      'NodeJS-Starter-V1/**',                 // separate project — has its own test setup
      '.claude/worktrees/**',                 // git worktrees — each runs tests against its own src/
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/lib/**/*.ts',
        'src/app/api/**/*.ts',
        'src/components/ui/**/*.tsx',
        'src/hooks/**/*.ts',
      ],
      exclude: [
        'node_modules/',
        '**/*.test.ts',
        '**/*.test.tsx',
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
      '@config': path.resolve(__dirname, './config'),
    },
  },
});
