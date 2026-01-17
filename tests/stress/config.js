/**
 * Unite-Hub Stress Test Configuration
 *
 * Central configuration for all 1000 stress tests across 6 categories:
 * - API Endpoint Stress (200 tests)
 * - Database Stress (200 tests)
 * - Multi-Tenant Isolation (150 tests)
 * - AI Agent Stress (150 tests)
 * - WebSocket/Real-time (100 tests)
 * - Chaos Engineering (200 tests)
 */

// ============================================================================
// Environment Configuration
// ============================================================================

export const CONFIG = {
  BASE_URL: __ENV.BASE_URL || 'http://localhost:3008',
  WS_URL: __ENV.WS_URL || 'ws://localhost:3008',
  API_PREFIX: '/api',

  // Authentication
  TEST_EMAIL: __ENV.TEST_EMAIL || 'stress-test@unite-hub.com',
  TEST_PASSWORD: __ENV.TEST_PASSWORD || 'stress-test-password-123',
  AUTH_TOKEN: __ENV.AUTH_TOKEN || '',

  // Multi-tenant testing
  WORKSPACE_IDS: (__ENV.WORKSPACE_IDS || 'ws-1,ws-2,ws-3,ws-4,ws-5').split(','),
  TENANT_COUNT: parseInt(__ENV.TENANT_COUNT || '10'),

  // Load levels
  MAX_VUS: parseInt(__ENV.MAX_VUS || '1000'),
  RAMP_DURATION: __ENV.RAMP_DURATION || '2m',
  SUSTAIN_DURATION: __ENV.SUSTAIN_DURATION || '5m',

  // AI Agent settings
  ANTHROPIC_BUDGET_LIMIT: parseFloat(__ENV.ANTHROPIC_BUDGET_LIMIT || '10.00'),
  AGENT_TIMEOUT_MS: parseInt(__ENV.AGENT_TIMEOUT_MS || '30000'),

  // Database settings
  DB_POOL_SIZE: parseInt(__ENV.DB_POOL_SIZE || '20'),
  QUERY_TIMEOUT_MS: parseInt(__ENV.QUERY_TIMEOUT_MS || '5000'),

  // Chaos settings
  CHAOS_ENABLED: __ENV.CHAOS_ENABLED === 'true',
  FAILURE_INJECTION_RATE: parseFloat(__ENV.FAILURE_INJECTION_RATE || '0.05'),
};

// ============================================================================
// Performance Thresholds
// ============================================================================

export const THRESHOLDS = {
  // Response time thresholds (milliseconds)
  api: {
    p50: 100,
    p95: 500,
    p99: 1000,
    max: 5000,
  },
  database: {
    p50: 50,
    p95: 200,
    p99: 500,
    max: 2000,
  },
  websocket: {
    connectionTime: 200,
    messageLatency: 100,
    reconnectTime: 1000,
  },
  agent: {
    p50: 2000,
    p95: 10000,
    p99: 30000,
    max: 60000,
  },

  // Error rate thresholds
  errorRate: {
    normal: 0.01,    // 1% under normal load
    stress: 0.05,    // 5% under stress
    spike: 0.10,     // 10% during spikes
  },

  // Rate limiting thresholds
  rateLimiting: {
    max429PerMinute: 10,
    recoveryTime: 60000,
  },

  // Resource thresholds
  resources: {
    maxMemoryMB: 4096,
    maxCpuPercent: 90,
    maxConnections: 1000,
  },
};

// ============================================================================
// Test Scenarios Configuration
// ============================================================================

export const SCENARIOS = {
  // Smoke test - basic functionality
  smoke: {
    executor: 'constant-vus',
    vus: 1,
    duration: '30s',
  },

  // Average load - normal operations
  average: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m', target: 50 },
      { duration: '5m', target: 50 },
      { duration: '1m', target: 0 },
    ],
  },

  // Stress test - beyond normal capacity
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '2m', target: 100 },
      { duration: '5m', target: 200 },
      { duration: '2m', target: 300 },
      { duration: '5m', target: 300 },
      { duration: '2m', target: 0 },
    ],
  },

  // Spike test - sudden traffic surge
  spike: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '10s', target: 500 },
      { duration: '1m', target: 500 },
      { duration: '10s', target: 1000 },
      { duration: '2m', target: 1000 },
      { duration: '30s', target: 0 },
    ],
  },

  // Soak test - extended duration
  soak: {
    executor: 'constant-vus',
    vus: 100,
    duration: '30m',
  },

  // Breakpoint test - find system limits
  breakpoint: {
    executor: 'ramping-arrival-rate',
    startRate: 10,
    timeUnit: '1s',
    preAllocatedVUs: 50,
    maxVUs: 2000,
    stages: [
      { duration: '2m', target: 50 },
      { duration: '2m', target: 100 },
      { duration: '2m', target: 200 },
      { duration: '2m', target: 500 },
      { duration: '2m', target: 1000 },
      { duration: '2m', target: 1500 },
      { duration: '2m', target: 2000 },
    ],
  },
};

// ============================================================================
// Test Data Generators
// ============================================================================

export function generateTestContact(vuId, iteration) {
  const timestamp = Date.now();
  return {
    name: `Stress Test User ${vuId}-${iteration}`,
    email: `stress-${vuId}-${iteration}-${timestamp}@test.unite-hub.com`,
    company: `Test Corp ${vuId}`,
    phone: `+1-555-${String(vuId).padStart(4, '0')}`,
    status: ['lead', 'prospect', 'customer', 'inactive'][iteration % 4],
    workspace_id: CONFIG.WORKSPACE_IDS[vuId % CONFIG.WORKSPACE_IDS.length],
    tags: [`stress-test`, `vu-${vuId}`, `iteration-${iteration}`],
  };
}

export function generateTestCampaign(vuId, iteration) {
  const timestamp = Date.now();
  return {
    name: `Stress Campaign ${vuId}-${iteration}-${timestamp}`,
    type: ['email', 'social', 'sms', 'push'][iteration % 4],
    status: 'draft',
    workspace_id: CONFIG.WORKSPACE_IDS[vuId % CONFIG.WORKSPACE_IDS.length],
    subject: `Test Subject ${iteration}`,
    content: `This is stress test content for VU ${vuId}, iteration ${iteration}`,
  };
}

export function generateTestEmail(vuId, iteration) {
  return {
    to: `recipient-${vuId}-${iteration}@test.com`,
    from: `sender-${vuId}@unite-hub.com`,
    subject: `Stress Test Email ${Date.now()}`,
    body: `Test email body for stress testing - VU: ${vuId}, Iteration: ${iteration}`,
    workspace_id: CONFIG.WORKSPACE_IDS[vuId % CONFIG.WORKSPACE_IDS.length],
  };
}

export function generateAgentRequest(vuId, iteration) {
  const prompts = [
    'Analyze this contact and suggest follow-up actions',
    'Generate a personalized email for this lead',
    'Classify this email intent and extract key information',
    'Create a campaign strategy for Q1',
    'Summarize recent interactions with this customer',
  ];

  return {
    prompt: prompts[iteration % prompts.length],
    context: {
      vuId,
      iteration,
      timestamp: Date.now(),
    },
    workspace_id: CONFIG.WORKSPACE_IDS[vuId % CONFIG.WORKSPACE_IDS.length],
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 500,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function sleep(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // Busy wait
  }
}

export function exponentialBackoff(attempt, baseMs = 100, maxMs = 10000) {
  const delay = Math.min(baseMs * Math.pow(2, attempt), maxMs);
  const jitter = delay * 0.2 * Math.random();
  return delay + jitter;
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================================================
// Test Result Tracking
// ============================================================================

export const TestRegistry = {
  tests: [],

  register(category, name, fn) {
    this.tests.push({
      id: `${category}:${name}`,
      category,
      name,
      fn,
      runs: 0,
      passed: 0,
      failed: 0,
    });
    return fn;
  },

  getByCategory(category) {
    return this.tests.filter(t => t.category === category);
  },

  getSummary() {
    return {
      total: this.tests.length,
      byCategory: this.tests.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      }, {}),
    };
  },
};
