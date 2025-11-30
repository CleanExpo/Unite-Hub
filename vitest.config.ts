import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/tests/e2e/**',
      '**/tests/api/**',
      '**/tests/strategy/**',
      '**/tests/integration/**',
      '**/tests/phase1/**',
      '**/*.e2e.spec.ts',
      '**/*.e2e.test.ts',
      // Service tests that need real database - run separately
      '**/src/lib/__tests__/consensusService.test.ts',
      '**/src/lib/__tests__/guardrailPolicyService.test.ts',
      '**/src/lib/__tests__/strategyRefinement.test.ts',
      '**/src/lib/__tests__/horizonPlanning.test.ts',
      '**/src/lib/__tests__/strategySignoff.test.ts',
      '**/src/lib/__tests__/leviathan.test.ts',
      '**/src/lib/__tests__/timeService.test.ts',
      '**/src/lib/__tests__/financialReportEngine.test.ts',
      '**/src/lib/__tests__/xeroSync.test.ts',
      '**/src/lib/__tests__/operatorInsightsService.test.ts',
      '**/src/lib/__tests__/strategyGraph.test.ts',
      '**/src/lib/__tests__/projectService.test.ts',
      '**/src/lib/__tests__/scopeAI.test.ts',
      '**/src/lib/__tests__/strategySimulation.test.ts',
      '**/src/lib/__tests__/projectCreator.test.ts',
      '**/src/lib/__tests__/executionEngine.test.ts',
      '**/src/lib/__tests__/operatorRoleService.test.ts',
      '**/src/lib/__tests__/proposalEngine.test.ts',
      '**/src/lib/__tests__/rollbackEngine.test.ts',
      '**/src/lib/__tests__/signatureProvider.test.ts',
      '**/src/lib/__tests__/tenantOrchestrator.test.ts',
      '**/src/lib/__tests__/trustModeService.test.ts',
      '**/src/lib/__tests__/deltaEngine.test.ts',
      '**/src/lib/__tests__/tenantProvisioner.test.ts',
      '**/src/lib/__tests__/scopeService.ai.test.ts',
      '**/src/lib/__tests__/cache.test.ts', // Requires Redis
      '**/src/lib/__tests__/integration/**',
      // Email ingestion tests need runtime config
      '**/tests/unit/lib/email-ingestion/**',
      // Connected apps tests need runtime config
      '**/tests/unit/lib/connected-apps/**',
      // Tests that require Anthropic API key
      '**/tests/unit/multi-channel-autonomy.test.ts',
      '**/tests/unit/lib/agents/orchestrator-email-intents.test.ts',
      // API route tests need Next.js request mocking
      '**/tests/unit/api/media/**',
      // Component test with complex UI
      '**/tests/components/ui.test.tsx',
      // Supabase server tests need Next.js request context
      '**/tests/unit/lib/supabase.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        'vitest.config.ts',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'tests/',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/__tests__/**',
        'src/app/api/**', // API routes tested separately
        'src/types/**', // Type definitions
        '.next/**',
      ],
      all: true,
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70,
      reportOnFailure: true,
    },
    // Run tests in parallel
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@config': path.resolve(__dirname, './config'),
      '@/convex': path.resolve(__dirname, './convex'),
    },
  },
});
