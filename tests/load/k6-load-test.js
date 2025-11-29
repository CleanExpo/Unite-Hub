/**
 * Unite-Hub Load Testing Configuration
 *
 * K6 load testing suite for API endpoints, WebSocket connections,
 * and system performance validation.
 *
 * Usage:
 *   k6 run tests/load/k6-load-test.js
 *   k6 run --vus 100 --duration 5m tests/load/k6-load-test.js
 *   k6 run --env SCENARIO=smoke tests/load/k6-load-test.js
 */

import http from 'k6/http';
import ws from 'k6/ws';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import encoding from 'k6/encoding';

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3008';
const WS_URL = __ENV.WS_URL || 'ws://localhost:3008';
const API_PREFIX = '/api/v1';

// Test user credentials (configure via environment variables)
const TEST_EMAIL = __ENV.TEST_EMAIL || 'test@unite-hub.com';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'test-password-123';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// ============================================================================
// Custom Metrics
// ============================================================================

const errorRate = new Rate('errors');
const apiResponseTime = new Trend('api_response_time');
const wsConnectionTime = new Trend('ws_connection_time');
const wsMessageRate = new Counter('ws_messages_received');
const authFailures = new Counter('auth_failures');
const rateLimit429 = new Counter('rate_limit_429_errors');

// ============================================================================
// Test Data
// ============================================================================

const contactData = new SharedArray('contacts', function() {
  return [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      company: 'Acme Corp',
      status: 'lead'
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      company: 'Tech Industries',
      status: 'prospect'
    },
    {
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      company: 'Innovation Labs',
      status: 'customer'
    }
  ];
});

// ============================================================================
// Test Scenarios
// ============================================================================

export const options = {
  scenarios: {
    smoke_test: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { test_type: 'smoke' },
      env: { SCENARIO: 'smoke' },
    },
    average_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },  // Ramp up to 50 users
        { duration: '5m', target: 50 },  // Stay at 50 for 5 minutes
        { duration: '1m', target: 0 },   // Ramp down
      ],
      tags: { test_type: 'average' },
      gracefulRampDown: '30s',
    },
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 }, // Ramp up to 100
        { duration: '1m', target: 200 },  // Ramp up to 200
        { duration: '2m', target: 200 },  // Stay at 200 for 2 minutes
        { duration: '30s', target: 0 },   // Ramp down
      ],
      tags: { test_type: 'stress' },
      gracefulRampDown: '30s',
    },
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 500 }, // Spike to 500 users
        { duration: '1m', target: 500 },  // Stay at 500
        { duration: '30s', target: 0 },   // Drop to 0
      ],
      tags: { test_type: 'spike' },
      gracefulRampDown: '30s',
    },
    websocket_load: {
      executor: 'constant-vus',
      vus: 100,
      duration: '3m',
      tags: { test_type: 'websocket' },
      exec: 'websocketTest',
    },
  },

  // Performance thresholds
  thresholds: {
    // 95th percentile response time should be under 500ms
    'http_req_duration{test_type:average}': ['p(95)<500'],

    // 99th percentile should be under 1s
    'http_req_duration{test_type:average}': ['p(99)<1000'],

    // Error rate should be less than 1%
    'errors': ['rate<0.01'],

    // 95% of requests should complete within 1s
    'http_req_duration': ['p(95)<1000'],

    // API-specific thresholds
    'api_response_time': ['avg<300', 'p(95)<500'],

    // WebSocket connection should establish quickly
    'ws_connection_time': ['p(95)<200'],

    // Rate limit errors should be minimal in normal scenarios
    'rate_limit_429_errors{test_type:average}': ['count<10'],
  },

  // Test execution limits
  noConnectionReuse: false,
  userAgent: 'UniteHub-K6-LoadTest/1.0',
  insecureSkipTLSVerify: true, // Only for local testing
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get authentication headers
 */
function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token || AUTH_TOKEN}`,
  };
}

/**
 * Login and get auth token
 */
function login() {
  const payload = JSON.stringify({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  const res = http.post(`${BASE_URL}${API_PREFIX}/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Login' },
  });

  const success = check(res, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.token !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    authFailures.add(1);
    console.error(`Login failed: ${res.status} - ${res.body}`);
    return null;
  }

  try {
    const body = JSON.parse(res.body);
    return body.token;
  } catch (e) {
    console.error(`Failed to parse login response: ${e}`);
    authFailures.add(1);
    return null;
  }
}

/**
 * Generic API request with error handling
 */
function apiRequest(method, endpoint, body = null, token = null) {
  const url = `${BASE_URL}${API_PREFIX}${endpoint}`;
  const params = {
    headers: getAuthHeaders(token),
    tags: { name: endpoint },
  };

  const startTime = Date.now();
  let res;

  if (method === 'GET') {
    res = http.get(url, params);
  } else if (method === 'POST') {
    res = http.post(url, JSON.stringify(body), params);
  } else if (method === 'PUT') {
    res = http.put(url, JSON.stringify(body), params);
  } else if (method === 'DELETE') {
    res = http.del(url, null, params);
  }

  const duration = Date.now() - startTime;
  apiResponseTime.add(duration);

  // Track rate limiting
  if (res.status === 429) {
    rateLimit429.add(1);
  }

  // Track errors
  if (res.status >= 400) {
    errorRate.add(1);
  } else {
    errorRate.add(0);
  }

  return res;
}

// ============================================================================
// Test Scenarios
// ============================================================================

/**
 * Main API test scenario
 */
export default function() {
  // Skip if this is a WebSocket-only scenario
  if (__ENV.SCENARIO === 'websocket') {
    return;
  }

  let token = AUTH_TOKEN;

  // Login if no token provided
  if (!token) {
    token = login();
    if (!token) {
      sleep(1);
      return; // Skip this iteration if login failed
    }
  }

  group('Health Check', () => {
    const res = apiRequest('GET', '/health', null, token);

    check(res, {
      'health check status 200': (r) => r.status === 200,
      'health check response time < 100ms': (r) => r.timings.duration < 100,
    });
  });

  sleep(0.5);

  group('Contact Management', () => {
    // List contacts
    const listRes = apiRequest('GET', '/contacts', null, token);

    check(listRes, {
      'list contacts status 200': (r) => r.status === 200,
      'list contacts has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.data) || Array.isArray(body);
        } catch {
          return false;
        }
      },
    });

    sleep(0.3);

    // Create contact
    const contactIndex = Math.floor(Math.random() * contactData.length);
    const newContact = {
      ...contactData[contactIndex],
      email: `test-${Date.now()}-${__VU}@example.com`, // Unique email
      workspace_id: __ENV.WORKSPACE_ID || 'default-workspace',
    };

    const createRes = apiRequest('POST', '/contacts', newContact, token);

    const createSuccess = check(createRes, {
      'create contact status 200 or 201': (r) => r.status === 200 || r.status === 201,
      'create contact returns ID': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.id !== undefined || body.data?.id !== undefined;
        } catch {
          return false;
        }
      },
    });

    // Get contact details if creation succeeded
    if (createSuccess) {
      try {
        const body = JSON.parse(createRes.body);
        const contactId = body.id || body.data?.id;

        if (contactId) {
          sleep(0.2);

          const detailRes = apiRequest('GET', `/contacts/${contactId}`, null, token);

          check(detailRes, {
            'get contact details status 200': (r) => r.status === 200,
            'contact details match': (r) => {
              try {
                const detail = JSON.parse(r.body);
                return detail.email === newContact.email;
              } catch {
                return false;
              }
            },
          });
        }
      } catch (e) {
        console.error(`Failed to get contact details: ${e}`);
      }
    }
  });

  sleep(0.5);

  group('Campaign Management', () => {
    // List campaigns
    const listRes = apiRequest('GET', '/campaigns', null, token);

    check(listRes, {
      'list campaigns status 200': (r) => r.status === 200,
      'list campaigns response time < 500ms': (r) => r.timings.duration < 500,
    });

    sleep(0.3);

    // Create campaign (if endpoint exists)
    const newCampaign = {
      name: `Load Test Campaign ${Date.now()}-${__VU}`,
      type: 'email',
      status: 'draft',
      workspace_id: __ENV.WORKSPACE_ID || 'default-workspace',
    };

    const createRes = apiRequest('POST', '/campaigns', newCampaign, token);

    // Don't fail if endpoint doesn't exist yet
    check(createRes, {
      'create campaign successful or not implemented': (r) =>
        r.status === 200 || r.status === 201 || r.status === 404 || r.status === 501,
    });
  });

  sleep(1);
}

/**
 * WebSocket load test scenario
 */
export function websocketTest() {
  const token = AUTH_TOKEN || login();
  if (!token) {
    console.error('Cannot test WebSocket without valid auth token');
    return;
  }

  const url = `${WS_URL}/ws/alerts?token=${token}`;
  const startTime = Date.now();

  const res = ws.connect(url, {
    headers: getAuthHeaders(token),
    tags: { name: 'WebSocket Connection' },
  }, function(socket) {
    const connectionTime = Date.now() - startTime;
    wsConnectionTime.add(connectionTime);

    check(socket, {
      'websocket connected': (s) => s.readyState === 1, // OPEN
    });

    // Send heartbeat every 30 seconds
    const heartbeatInterval = setInterval(() => {
      socket.send(JSON.stringify({
        type: 'ping',
        timestamp: Date.now(),
      }));
    }, 30000);

    // Subscribe to alerts
    socket.send(JSON.stringify({
      type: 'subscribe',
      channel: 'alerts',
      workspaceId: __ENV.WORKSPACE_ID || 'default-workspace',
    }));

    socket.on('message', (data) => {
      wsMessageRate.add(1);

      try {
        const message = JSON.parse(data);

        check(message, {
          'message has valid structure': (m) => m.type !== undefined,
        });

        // Handle pong responses
        if (message.type === 'pong') {
          const latency = Date.now() - message.timestamp;
          console.log(`WebSocket ping latency: ${latency}ms`);
        }
      } catch (e) {
        console.error(`Failed to parse WebSocket message: ${e}`);
      }
    });

    socket.on('error', (e) => {
      console.error(`WebSocket error: ${e}`);
      errorRate.add(1);
    });

    socket.on('close', () => {
      clearInterval(heartbeatInterval);
      console.log('WebSocket connection closed');
    });

    // Keep connection open for test duration
    socket.setTimeout(() => {
      clearInterval(heartbeatInterval);
      socket.close();
    }, 180000); // 3 minutes
  });

  check(res, {
    'websocket session successful': (r) => r && r.status === 101,
  });
}

// ============================================================================
// Teardown
// ============================================================================

export function teardown(data) {
  console.log('\n=== Load Test Summary ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Scenarios executed: ${JSON.stringify(options.scenarios)}`);
  console.log('=========================\n');
}

// ============================================================================
// Setup
// ============================================================================

export function setup() {
  console.log('\n=== Unite-Hub Load Test Starting ===');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`WebSocket URL: ${WS_URL}`);
  console.log(`Auth Token: ${AUTH_TOKEN ? 'Provided' : 'Will authenticate per-VU'}`);
  console.log('====================================\n');

  // Verify server is reachable
  const healthCheck = http.get(`${BASE_URL}${API_PREFIX}/health`, {
    timeout: '10s',
  });

  if (healthCheck.status !== 200) {
    console.warn(`Warning: Health check returned ${healthCheck.status}`);
  }

  return {
    startTime: Date.now(),
  };
}
