import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
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
    },
  },
});
