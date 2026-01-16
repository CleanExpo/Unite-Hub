/**
 * Provider Verification Tests
 *
 * Verifies that the Unite-Hub API (provider) satisfies all consumer contracts.
 * Run with: npm run test:contract:verify
 */

import { Verifier } from '@pact-foundation/pact';
import path from 'path';
import { describe, it, beforeAll, afterAll } from 'vitest';

// Import state handlers from config
import { stateHandlers } from '../../pact.config';

describe('Provider Verification', () => {
  const providerBaseUrl = process.env.PROVIDER_BASE_URL || 'http://localhost:3008';

  // Check if provider is running
  beforeAll(async () => {
    try {
      const response = await fetch(`${providerBaseUrl}/api/health`);
      if (!response.ok) {
        console.warn('Provider health check returned non-200 status');
      }
    } catch (error) {
      console.error('Provider is not running at', providerBaseUrl);
      console.error('Please start the application with: npm run dev');
      throw new Error('Provider not available for verification');
    }
  });

  it('validates the provider against consumer contracts', async () => {
    const pactDir = path.resolve(__dirname, 'pacts');

    // Check if pact files exist
    const fs = await import('fs');
    if (!fs.existsSync(pactDir)) {
      console.warn('No pacts directory found. Run consumer tests first.');
      return;
    }

    const pactFiles = fs.readdirSync(pactDir).filter((f) => f.endsWith('.json'));
    if (pactFiles.length === 0) {
      console.warn('No pact files found. Run consumer tests first.');
      return;
    }

    const verifier = new Verifier({
      provider: 'unite-hub-api',
      providerBaseUrl,

      // Local pact files (no broker)
      pactUrls: pactFiles.map((f) => path.resolve(pactDir, f)),

      // Publish results only in CI
      publishVerificationResult: process.env.CI === 'true',
      providerVersion: process.env.GIT_COMMIT || process.env.npm_package_version || '1.0.0',

      // State handlers setup test data
      stateHandlers: {
        ...stateHandlers,

        // Add specific state handlers for verification
        'contacts exist for workspace': async () => {
          // In real implementation, seed test data
          console.log('Provider state: contacts exist for workspace');
          return { description: 'Contacts seeded' };
        },

        'workspace exists and user authenticated': async () => {
          // In real implementation, create test workspace
          console.log('Provider state: workspace exists and user authenticated');
          return { description: 'Workspace and auth ready' };
        },

        'contact exists with ID': async () => {
          console.log('Provider state: specific contact exists');
          return { description: 'Contact seeded' };
        },

        'campaigns exist for workspace': async () => {
          console.log('Provider state: campaigns exist');
          return { description: 'Campaigns seeded' };
        },
      },

      // Request filter for auth headers
      requestFilter: (req, res, next) => {
        // Add test auth token for verification requests
        if (!req.headers['authorization']) {
          req.headers['authorization'] = 'Bearer test-verification-token';
        }
        next();
      },

      // Log level
      logLevel: 'warn',

      // Timeout
      timeout: 30000,
    });

    try {
      await verifier.verifyProvider();
      console.log('Provider verification successful!');
    } catch (error) {
      console.error('Provider verification failed:', error);
      throw error;
    }
  });

  afterAll(() => {
    // Cleanup any test data created during verification
    console.log('Provider verification complete');
  });
});
