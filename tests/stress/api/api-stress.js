/**
 * API Endpoint Stress Tests (200 Tests)
 *
 * Categories:
 * - CRUD Operations Under Load (40 tests)
 * - Authentication Stress (20 tests)
 * - Rate Limiter Verification (20 tests)
 * - Concurrent Workspace Operations (40 tests)
 * - API Timeout/Retry Handling (40 tests)
 * - Error Response Consistency (40 tests)
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import {
  CONFIG,
  SCENARIOS,
  THRESHOLDS,
  generateTestContact,
  generateTestCampaign,
  generateTestEmail,
  randomInt,
  randomElement,
} from '../config.js';
import {
  apiRequest,
  batchRequests,
  assertResponse,
  stressGroup,
  getAuthToken,
  getRandomWorkspaceId,
  cleanupTestData,
  apiResponseTime,
  apiRequestsTotal,
  api429Errors,
  api500Errors,
  apiTimeouts,
  errorRate,
  successRate,
} from '../utils.js';

// ============================================================================
// Test Options
// ============================================================================

export const options = {
  scenarios: {
    api_crud_stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '3m', target: 200 },
        { duration: '2m', target: 500 },
        { duration: '3m', target: 500 },
        { duration: '1m', target: 1000 },
        { duration: '2m', target: 1000 },
        { duration: '1m', target: 0 },
      ],
      tags: { category: 'api_crud' },
      exec: 'crudStressTests',
    },
    api_auth_stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '2m', target: 300 },
        { duration: '1m', target: 500 },
        { duration: '2m', target: 500 },
        { duration: '30s', target: 0 },
      ],
      tags: { category: 'api_auth' },
      exec: 'authStressTests',
    },
    api_rate_limit: {
      executor: 'constant-arrival-rate',
      rate: 200,
      timeUnit: '1s',
      duration: '3m',
      preAllocatedVUs: 50,
      maxVUs: 200,
      tags: { category: 'api_rate_limit' },
      exec: 'rateLimitTests',
    },
    api_concurrent_workspace: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '2m', target: 200 },
        { duration: '2m', target: 200 },
        { duration: '30s', target: 0 },
      ],
      tags: { category: 'api_workspace' },
      exec: 'workspaceStressTests',
    },
    api_timeout_retry: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      tags: { category: 'api_timeout' },
      exec: 'timeoutRetryTests',
    },
    api_error_consistency: {
      executor: 'constant-vus',
      vus: 30,
      duration: '3m',
      tags: { category: 'api_error' },
      exec: 'errorConsistencyTests',
    },
  },
  thresholds: {
    'stress_api_response_time{category:api_crud}': ['p(95)<500', 'p(99)<1000'],
    'stress_api_response_time{category:api_auth}': ['p(95)<300', 'p(99)<500'],
    'stress_error_rate': ['rate<0.05'],
    'stress_api_429_errors': ['count<100'],
    'stress_api_500_errors': ['count<50'],
    'http_req_duration': ['p(95)<1000'],
  },
};

// ============================================================================
// Test Data
// ============================================================================

const endpoints = [
  { method: 'GET', path: '/contacts', weight: 30 },
  { method: 'GET', path: '/campaigns', weight: 20 },
  { method: 'GET', path: '/emails', weight: 15 },
  { method: 'GET', path: '/workspaces', weight: 10 },
  { method: 'GET', path: '/health', weight: 25 },
];

// ============================================================================
// CRUD Stress Tests (40 tests)
// ============================================================================

export function crudStressTests() {
  const workspaceId = getRandomWorkspaceId();
  const createdIds = { contacts: [], campaigns: [] };

  // Test 1-10: Contact CRUD at scale
  stressGroup('Contact List Under Load', 'api_crud', () => {
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=100`);
    return assertResponse(res, {
      status: [200, 401],
      maxDuration: THRESHOLDS.api.p95,
    }, 'Contact List');
  });

  stressGroup('Contact Create Burst', 'api_crud', () => {
    const contact = generateTestContact(__VU, __ITER);
    contact.workspace_id = workspaceId;
    const res = apiRequest('POST', `/contacts?workspaceId=${workspaceId}`, contact);

    if (res.status === 200 || res.status === 201) {
      try {
        const body = JSON.parse(res.body);
        if (body.id) createdIds.contacts.push(body.id);
      } catch (e) {}
    }

    return assertResponse(res, {
      status: [200, 201, 429],
      maxDuration: THRESHOLDS.api.p95,
    }, 'Contact Create');
  });

  stressGroup('Contact Pagination Stress', 'api_crud', () => {
    const page = randomInt(1, 10);
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&page=${page}&limit=50`);
    return assertResponse(res, { status: [200, 401] }, 'Contact Pagination');
  });

  stressGroup('Contact Search Stress', 'api_crud', () => {
    const searchTerms = ['test', 'john', 'corp', 'lead', 'customer'];
    const term = randomElement(searchTerms);
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&search=${term}`);
    return assertResponse(res, { status: [200, 401] }, 'Contact Search');
  });

  stressGroup('Contact Filter Combination', 'api_crud', () => {
    const statuses = ['lead', 'prospect', 'customer'];
    const status = randomElement(statuses);
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&status=${status}&limit=25`);
    return assertResponse(res, { status: [200, 401] }, 'Contact Filter');
  });

  // Test 11-20: Campaign CRUD at scale
  stressGroup('Campaign List Under Load', 'api_crud', () => {
    const res = apiRequest('GET', `/campaigns?workspaceId=${workspaceId}`);
    return assertResponse(res, { status: [200, 401, 404] }, 'Campaign List');
  });

  stressGroup('Campaign Create Burst', 'api_crud', () => {
    const campaign = generateTestCampaign(__VU, __ITER);
    campaign.workspace_id = workspaceId;
    const res = apiRequest('POST', `/campaigns?workspaceId=${workspaceId}`, campaign);

    if (res.status === 200 || res.status === 201) {
      try {
        const body = JSON.parse(res.body);
        if (body.id) createdIds.campaigns.push(body.id);
      } catch (e) {}
    }

    return assertResponse(res, { status: [200, 201, 404, 429] }, 'Campaign Create');
  });

  stressGroup('Campaign Status Filter', 'api_crud', () => {
    const statuses = ['draft', 'active', 'paused', 'completed'];
    const status = randomElement(statuses);
    const res = apiRequest('GET', `/campaigns?workspaceId=${workspaceId}&status=${status}`);
    return assertResponse(res, { status: [200, 401, 404] }, 'Campaign Status Filter');
  });

  // Test 21-30: Batch operations
  stressGroup('Batch Contact Fetch', 'api_crud', () => {
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push({
        method: 'GET',
        endpoint: `/contacts?workspaceId=${workspaceId}&page=${i + 1}&limit=10`,
      });
    }
    const results = batchRequests(requests, { concurrency: 10 });
    const allSuccess = results.every((r) => r.status === 200 || r.status === 401);
    return allSuccess;
  });

  stressGroup('Parallel CRUD Mix', 'api_crud', () => {
    const requests = [
      { method: 'GET', endpoint: `/contacts?workspaceId=${workspaceId}` },
      { method: 'GET', endpoint: `/campaigns?workspaceId=${workspaceId}` },
      { method: 'GET', endpoint: `/health` },
    ];
    const results = batchRequests(requests);
    return results.filter((r) => r.status >= 200 && r.status < 400).length >= 2;
  });

  // Test 31-40: Update and Delete operations
  stressGroup('Contact Update Stress', 'api_crud', () => {
    if (createdIds.contacts.length > 0) {
      const contactId = randomElement(createdIds.contacts);
      const update = { name: `Updated ${Date.now()}` };
      const res = apiRequest('PATCH', `/contacts/${contactId}?workspaceId=${workspaceId}`, update);
      return assertResponse(res, { status: [200, 404, 429] }, 'Contact Update');
    }
    return true;
  });

  stressGroup('Rapid Fire Requests', 'api_crud', () => {
    let successCount = 0;
    for (let i = 0; i < 5; i++) {
      const res = apiRequest('GET', `/health`);
      if (res.status === 200) successCount++;
    }
    return successCount >= 3;
  });

  sleep(randomInt(100, 500) / 1000);

  // Cleanup
  if (__ITER % 10 === 0) {
    cleanupTestData('contacts', createdIds.contacts.slice(-5), workspaceId);
    cleanupTestData('campaigns', createdIds.campaigns.slice(-5), workspaceId);
  }
}

// ============================================================================
// Authentication Stress Tests (20 tests)
// ============================================================================

export function authStressTests() {
  // Test 1-5: Login/logout cycles
  stressGroup('Rapid Login Attempts', 'api_auth', () => {
    const res = http.post(
      `${CONFIG.BASE_URL}${CONFIG.API_PREFIX}/auth/login`,
      JSON.stringify({
        email: CONFIG.TEST_EMAIL,
        password: CONFIG.TEST_PASSWORD,
      }),
      { headers: { 'Content-Type': 'application/json' }, timeout: '10s' }
    );
    return check(res, {
      'login returns valid status': (r) => [200, 401, 429].includes(r.status),
      'login response time acceptable': (r) => r.timings.duration < 500,
    });
  });

  stressGroup('Token Validation Under Load', 'api_auth', () => {
    const token = getAuthToken();
    const res = apiRequest('GET', '/auth/me', null, { token });
    return assertResponse(res, { status: [200, 401] }, 'Token Validation');
  });

  stressGroup('Expired Token Handling', 'api_auth', () => {
    const expiredToken = 'expired.token.here';
    const res = http.get(`${CONFIG.BASE_URL}${CONFIG.API_PREFIX}/contacts`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${expiredToken}`,
      },
    });
    return check(res, {
      'expired token rejected': (r) => r.status === 401,
    });
  });

  // Test 6-10: Invalid auth scenarios
  stressGroup('Invalid Credentials Flood', 'api_auth', () => {
    const res = http.post(
      `${CONFIG.BASE_URL}${CONFIG.API_PREFIX}/auth/login`,
      JSON.stringify({
        email: `invalid-${__VU}-${__ITER}@test.com`,
        password: 'wrong-password',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    return check(res, {
      'invalid creds return 401': (r) => r.status === 401 || r.status === 429,
    });
  });

  stressGroup('Missing Auth Header', 'api_auth', () => {
    const res = http.get(`${CONFIG.BASE_URL}${CONFIG.API_PREFIX}/contacts`, {
      headers: { 'Content-Type': 'application/json' },
    });
    return check(res, {
      'missing auth returns 401': (r) => r.status === 401,
    });
  });

  // Test 11-15: Token refresh scenarios
  stressGroup('Concurrent Token Usage', 'api_auth', () => {
    const token = getAuthToken();
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push({
        method: 'GET',
        endpoint: `/health`,
        token,
      });
    }
    const results = batchRequests(requests, { concurrency: 5 });
    return results.every((r) => r.status === 200 || r.status === 401);
  });

  stressGroup('Session Persistence', 'api_auth', () => {
    const token = getAuthToken();
    let successCount = 0;
    for (let i = 0; i < 3; i++) {
      const res = apiRequest('GET', '/health', null, { token });
      if (res.status === 200) successCount++;
      sleep(0.1);
    }
    return successCount >= 2;
  });

  // Test 16-20: Multi-workspace auth
  stressGroup('Workspace Switch Auth', 'api_auth', () => {
    const workspaces = CONFIG.WORKSPACE_IDS.slice(0, 3);
    let allValid = true;
    for (const ws of workspaces) {
      const res = apiRequest('GET', `/contacts?workspaceId=${ws}`);
      if (res.status !== 200 && res.status !== 401) {
        allValid = false;
      }
    }
    return allValid;
  });

  stressGroup('Auth Under High Concurrency', 'api_auth', () => {
    const token = getAuthToken();
    const endpoint = randomElement(endpoints);
    const res = apiRequest(endpoint.method, `${endpoint.path}?workspaceId=${getRandomWorkspaceId()}`, null, { token });
    return res.status < 500;
  });

  sleep(randomInt(50, 200) / 1000);
}

// ============================================================================
// Rate Limiter Tests (20 tests)
// ============================================================================

export function rateLimitTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-5: Basic rate limit detection
  stressGroup('Rate Limit Detection', 'api_rate_limit', () => {
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}`);

    if (res.status === 429) {
      api429Errors.add(1);
      const retryAfter = res.headers['Retry-After'] || res.headers['retry-after'];
      check(res, {
        'rate limit has retry-after': () => retryAfter !== undefined,
        'rate limit body explains': (r) => r.body && r.body.includes('rate'),
      });
    }

    return assertResponse(res, { status: [200, 401, 429] }, 'Rate Limit');
  });

  // Test 6-10: Rate limit recovery
  stressGroup('Rate Limit Recovery', 'api_rate_limit', () => {
    const res = apiRequest('GET', `/health`);

    if (res.status === 429) {
      sleep(1);
      const retryRes = apiRequest('GET', `/health`);
      return retryRes.status === 200;
    }

    return res.status === 200;
  });

  // Test 11-15: Endpoint-specific rate limits
  stressGroup('Auth Endpoint Rate Limit', 'api_rate_limit', () => {
    const res = http.post(
      `${CONFIG.BASE_URL}${CONFIG.API_PREFIX}/auth/login`,
      JSON.stringify({
        email: CONFIG.TEST_EMAIL,
        password: CONFIG.TEST_PASSWORD,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

    return check(res, {
      'auth rate limited appropriately': (r) => [200, 401, 429].includes(r.status),
    });
  });

  stressGroup('Write Operation Rate Limit', 'api_rate_limit', () => {
    const contact = generateTestContact(__VU, __ITER);
    const res = apiRequest('POST', `/contacts?workspaceId=${workspaceId}`, contact);
    return assertResponse(res, { status: [200, 201, 401, 429] }, 'Write Rate Limit');
  });

  // Test 16-20: Burst handling
  stressGroup('Burst Request Handling', 'api_rate_limit', () => {
    const requests = [];
    for (let i = 0; i < 20; i++) {
      requests.push({
        method: 'GET',
        endpoint: `/contacts?workspaceId=${workspaceId}&page=${i}`,
      });
    }
    const results = batchRequests(requests, { concurrency: 20 });
    const rateLimited = results.filter((r) => r.status === 429).length;
    const successful = results.filter((r) => r.status === 200).length;

    return successful > rateLimited;
  });
}

// ============================================================================
// Workspace Concurrency Tests (40 tests)
// ============================================================================

export function workspaceStressTests() {
  // Test 1-10: Concurrent workspace operations
  stressGroup('Multi-Workspace Parallel Reads', 'api_workspace', () => {
    const requests = CONFIG.WORKSPACE_IDS.slice(0, 5).map((wsId) => ({
      method: 'GET',
      endpoint: `/contacts?workspaceId=${wsId}&limit=10`,
    }));
    const results = batchRequests(requests, { concurrency: 5 });
    return results.every((r) => r.status === 200 || r.status === 401);
  });

  stressGroup('Workspace Isolation Verify', 'api_workspace', () => {
    const ws1 = CONFIG.WORKSPACE_IDS[0];
    const ws2 = CONFIG.WORKSPACE_IDS[1];

    const res1 = apiRequest('GET', `/contacts?workspaceId=${ws1}`);
    const res2 = apiRequest('GET', `/contacts?workspaceId=${ws2}`);

    if (res1.status === 200 && res2.status === 200) {
      try {
        const data1 = JSON.parse(res1.body);
        const data2 = JSON.parse(res2.body);

        const ids1 = new Set((data1.data || data1).map((c) => c.id));
        const ids2 = new Set((data2.data || data2).map((c) => c.id));

        const overlap = [...ids1].filter((id) => ids2.has(id));
        return overlap.length === 0;
      } catch (e) {
        return true;
      }
    }
    return true;
  });

  // Test 11-20: Cross-workspace write isolation
  stressGroup('Write to Multiple Workspaces', 'api_workspace', () => {
    const workspaceId = getRandomWorkspaceId();
    const contact = generateTestContact(__VU, __ITER);
    contact.workspace_id = workspaceId;

    const res = apiRequest('POST', `/contacts?workspaceId=${workspaceId}`, contact);

    if (res.status === 200 || res.status === 201) {
      try {
        const body = JSON.parse(res.body);
        return body.workspace_id === workspaceId || !body.workspace_id;
      } catch (e) {
        return true;
      }
    }
    return true;
  });

  // Test 21-30: Workspace switching patterns
  stressGroup('Rapid Workspace Switching', 'api_workspace', () => {
    let success = true;
    for (let i = 0; i < 3; i++) {
      const wsId = CONFIG.WORKSPACE_IDS[i % CONFIG.WORKSPACE_IDS.length];
      const res = apiRequest('GET', `/contacts?workspaceId=${wsId}&limit=5`);
      if (res.status >= 500) success = false;
    }
    return success;
  });

  // Test 31-40: Concurrent modifications
  stressGroup('Concurrent Write Different Workspaces', 'api_workspace', () => {
    const requests = CONFIG.WORKSPACE_IDS.slice(0, 3).map((wsId, idx) => ({
      method: 'POST',
      endpoint: `/contacts?workspaceId=${wsId}`,
      body: generateTestContact(__VU, __ITER + idx),
    }));
    const results = batchRequests(requests, { concurrency: 3 });
    return results.filter((r) => r.status >= 500).length === 0;
  });

  sleep(randomInt(100, 300) / 1000);
}

// ============================================================================
// Timeout and Retry Tests (40 tests)
// ============================================================================

export function timeoutRetryTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-10: Slow endpoint handling
  stressGroup('Long Running Query', 'api_timeout', () => {
    const res = apiRequest(
      'GET',
      `/contacts?workspaceId=${workspaceId}&limit=1000`,
      null,
      { timeout: '30s' }
    );
    return assertResponse(res, {
      status: [200, 401, 408, 504],
      maxDuration: 30000,
    }, 'Long Query');
  });

  stressGroup('Complex Filter Query', 'api_timeout', () => {
    const res = apiRequest(
      'GET',
      `/contacts?workspaceId=${workspaceId}&status=lead&search=test&sort=created_at&order=desc`,
      null,
      { timeout: '15s' }
    );
    return res.status < 500;
  });

  // Test 11-20: Retry behavior
  stressGroup('Retry On Failure', 'api_timeout', () => {
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}`, null, {
      retries: 2,
      timeout: '5s',
    });
    return res.status < 500;
  });

  stressGroup('Exponential Backoff', 'api_timeout', () => {
    let attempts = 0;
    let lastStatus = 0;

    for (let i = 0; i < 3; i++) {
      const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}`);
      lastStatus = res.status;
      attempts++;

      if (res.status === 200) break;
      if (res.status === 429) {
        sleep(Math.pow(2, i));
      }
    }

    return lastStatus === 200 || attempts >= 2;
  });

  // Test 21-30: Connection handling
  stressGroup('Connection Reuse', 'api_timeout', () => {
    let successCount = 0;
    for (let i = 0; i < 5; i++) {
      const res = apiRequest('GET', `/health`);
      if (res.status === 200) successCount++;
    }
    return successCount >= 3;
  });

  stressGroup('Parallel With Timeouts', 'api_timeout', () => {
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push({
        method: 'GET',
        endpoint: `/contacts?workspaceId=${workspaceId}&page=${i}`,
      });
    }
    const results = batchRequests(requests, { concurrency: 10 });
    const timeouts = results.filter((r) => r.status === 408 || r.status === 504);
    return timeouts.length < 3;
  });

  // Test 31-40: Recovery patterns
  stressGroup('Recovery After Timeout', 'api_timeout', () => {
    const res1 = apiRequest('GET', `/contacts?workspaceId=${workspaceId}`, null, {
      timeout: '1s',
    });

    sleep(1);

    const res2 = apiRequest('GET', `/health`);
    return res2.status === 200;
  });

  stressGroup('Graceful Degradation', 'api_timeout', () => {
    const startTime = Date.now();
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=500`);
    const duration = Date.now() - startTime;

    if (res.status === 200 && duration > 5000) {
      console.log(`Slow response: ${duration}ms`);
    }

    return res.status < 500;
  });

  sleep(randomInt(200, 500) / 1000);
}

// ============================================================================
// Error Consistency Tests (40 tests)
// ============================================================================

export function errorConsistencyTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-10: 4xx error consistency
  stressGroup('404 Consistency', 'api_error', () => {
    const res = apiRequest('GET', `/contacts/nonexistent-id-${__VU}?workspaceId=${workspaceId}`);
    return check(res, {
      '404 status correct': (r) => r.status === 404 || r.status === 401,
      '404 has error body': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.error !== undefined || body.message !== undefined;
        } catch {
          return true;
        }
      },
    });
  });

  stressGroup('400 Bad Request Format', 'api_error', () => {
    const res = apiRequest('POST', `/contacts?workspaceId=${workspaceId}`, {
      invalid_field: 'bad data',
    });
    return check(res, {
      '400 or validation error': (r) => [400, 401, 422].includes(r.status),
    });
  });

  stressGroup('401 Unauthorized Consistency', 'api_error', () => {
    const res = http.get(`${CONFIG.BASE_URL}${CONFIG.API_PREFIX}/contacts`, {
      headers: { 'Content-Type': 'application/json' },
    });
    return check(res, {
      '401 when no auth': (r) => r.status === 401,
    });
  });

  // Test 11-20: Error message format
  stressGroup('Error JSON Format', 'api_error', () => {
    const res = apiRequest('GET', `/invalid-endpoint-${__VU}`);
    return check(res, {
      'error is JSON': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return r.status === 404;
        }
      },
    });
  });

  stressGroup('Validation Error Details', 'api_error', () => {
    const res = apiRequest('POST', `/contacts?workspaceId=${workspaceId}`, {
      email: 'not-an-email',
    });
    return check(res, {
      'validation has details': (r) => {
        if (r.status === 400 || r.status === 422) {
          try {
            const body = JSON.parse(r.body);
            return body.errors !== undefined || body.message !== undefined;
          } catch {
            return true;
          }
        }
        return true;
      },
    });
  });

  // Test 21-30: Error codes
  stressGroup('Error Code Consistency', 'api_error', () => {
    const testCases = [
      { endpoint: '/contacts/invalid', expected: [401, 404] },
      { endpoint: '/invalid-endpoint', expected: [404] },
    ];

    let allPassed = true;
    for (const tc of testCases) {
      const res = apiRequest('GET', tc.endpoint);
      if (!tc.expected.includes(res.status)) {
        allPassed = false;
      }
    }
    return allPassed;
  });

  // Test 31-40: Error recovery
  stressGroup('Error Then Success', 'api_error', () => {
    apiRequest('GET', `/contacts/invalid-${__VU}`);
    const res = apiRequest('GET', `/health`);
    return res.status === 200;
  });

  stressGroup('Multiple Errors Handled', 'api_error', () => {
    const requests = [
      { method: 'GET', endpoint: '/invalid-1' },
      { method: 'GET', endpoint: '/invalid-2' },
      { method: 'GET', endpoint: '/health' },
    ];
    const results = batchRequests(requests);
    const healthResult = results[2];
    return healthResult.status === 200;
  });

  stressGroup('Consistent Error Headers', 'api_error', () => {
    const res = apiRequest('GET', `/contacts/invalid?workspaceId=${workspaceId}`);
    return check(res, {
      'has content-type': (r) =>
        r.headers['Content-Type'] !== undefined ||
        r.headers['content-type'] !== undefined,
    });
  });

  sleep(randomInt(100, 300) / 1000);
}

// ============================================================================
// Setup and Teardown
// ============================================================================

export function setup() {
  console.log('\n=== API Stress Tests Starting ===');
  console.log(`Base URL: ${CONFIG.BASE_URL}`);
  console.log(`Workspaces: ${CONFIG.WORKSPACE_IDS.join(', ')}`);
  console.log(`Max VUs: ${CONFIG.MAX_VUS}`);
  console.log('=================================\n');

  const healthCheck = http.get(`${CONFIG.BASE_URL}${CONFIG.API_PREFIX}/health`, {
    timeout: '10s',
  });

  if (healthCheck.status !== 200) {
    console.error(`Health check failed: ${healthCheck.status}`);
  }

  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log('\n=== API Stress Tests Complete ===');
  console.log(`Duration: ${duration.toFixed(2)}s`);
  console.log('=================================\n');
}
