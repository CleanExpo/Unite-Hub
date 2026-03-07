// Scoped vitest config for obsidian-sync tests
// Uses .mts so Vite loads it as ESM (avoids vite-tsconfig-paths ESM/CJS conflict in root config)
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../../src'),
    },
  },
});
