// Pact Contract Testing Configuration
// https://docs.pact.io/

import path from 'path';

export const pactConfig = {
  // Consumer name (the service making API requests)
  consumer: 'synthex-frontend',

  // Provider name (Unite-Hub API)
  provider: 'unite-hub-api',

  // Log level for Pact
  logLevel: 'warn' as const,

  // Directory to write pact files
  dir: path.resolve(__dirname, 'tests/contract/pacts'),

  // How to handle existing pact files
  pactfileWriteMode: 'update' as const,

  // Pact specification version
  spec: 4,
};

export const providerConfig = {
  provider: 'unite-hub-api',
  providerBaseUrl: process.env.PROVIDER_BASE_URL || 'http://localhost:3008',

  // Pact files to verify (local mode - no broker)
  pactUrls: [
    path.resolve(__dirname, 'tests/contract/pacts/synthex-frontend-unite-hub-api.json'),
  ],

  // Publish verification results (only in CI)
  publishVerificationResult: process.env.CI === 'true',

  // Provider version for verification
  providerVersion: process.env.GIT_COMMIT || process.env.npm_package_version || '1.0.0',

  // Timeout for provider verification
  timeout: 30000,
};

// State handlers for provider verification
export const stateHandlers = {
  'contacts exist for workspace': async () => {
    // Setup: Ensure test contacts exist in database
    console.log('Setting up state: contacts exist for workspace');
  },

  'workspace exists and user authenticated': async () => {
    // Setup: Ensure valid workspace and auth token
    console.log('Setting up state: workspace exists and user authenticated');
  },

  'campaigns exist for workspace': async () => {
    // Setup: Ensure test campaigns exist
    console.log('Setting up state: campaigns exist for workspace');
  },

  'AI service is available': async () => {
    // Setup: Mock or ensure AI service is ready
    console.log('Setting up state: AI service is available');
  },
};
