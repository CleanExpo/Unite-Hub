/**
 * Vitest Test Setup
 *
 * Global test configuration, mocks, and utilities
 */

import { vi } from 'vitest';
import { config } from 'dotenv';
import '@testing-library/jest-dom/vitest';

// Load test environment variables
config({ path: '.env.test' });

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}));

// Mock Google Secret Manager
vi.mock('@google-cloud/secret-manager', () => ({
  SecretManagerServiceClient: vi.fn(() => ({
    accessSecretVersion: vi.fn().mockResolvedValue([{
      payload: {
        data: Buffer.from(JSON.stringify({ access_token: 'mock-token' })),
      },
    }]),
    createSecret: vi.fn().mockResolvedValue([{ name: 'mock-secret' }]),
    addSecretVersion: vi.fn().mockResolvedValue([{ name: 'mock-version' }]),
    deleteSecret: vi.fn().mockResolvedValue([{}]),
  })),
}));

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.GOOGLE_APPLICATION_CREDENTIALS = './test-service-account.json';
process.env.GCP_PROJECT_ID = 'test-project';
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-12345';
process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
process.env.PERPLEXITY_API_KEY = 'test-perplexity-key';
