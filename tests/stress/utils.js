/**
 * Unite-Hub Stress Test Utilities
 *
 * Common utilities, metrics, and helper functions for stress testing.
 */

import http from 'k6/http';
import { check, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';
import { CONFIG, THRESHOLDS, exponentialBackoff } from './config.js';

// ============================================================================
// Custom Metrics
// ============================================================================

// General metrics
export const errorRate = new Rate('stress_error_rate');
export const successRate = new Rate('stress_success_rate');

// API metrics
export const apiResponseTime = new Trend('stress_api_response_time', true);
export const apiRequestsTotal = new Counter('stress_api_requests_total');
export const api429Errors = new Counter('stress_api_429_errors');
export const api500Errors = new Counter('stress_api_500_errors');
export const apiTimeouts = new Counter('stress_api_timeouts');

// Database metrics
export const dbQueryTime = new Trend('stress_db_query_time', true);
export const dbConnectionErrors = new Counter('stress_db_connection_errors');
export const dbDeadlocks = new Counter('stress_db_deadlocks');
export const dbPoolExhaustion = new Counter('stress_db_pool_exhaustion');

// Multi-tenant metrics
export const tenantIsolationViolations = new Counter('stress_tenant_isolation_violations');
export const crossTenantAttempts = new Counter('stress_cross_tenant_attempts');
export const tenantSwitchTime = new Trend('stress_tenant_switch_time', true);

// AI Agent metrics
export const agentResponseTime = new Trend('stress_agent_response_time', true);
export const agentTokensUsed = new Counter('stress_agent_tokens_used');
export const agentCostAccumulated = new Counter('stress_agent_cost_accumulated');
export const agentRateLimitHits = new Counter('stress_agent_rate_limit_hits');
export const agentTimeouts = new Counter('stress_agent_timeouts');

// WebSocket metrics
export const wsConnectionTime = new Trend('stress_ws_connection_time', true);
export const wsMessageLatency = new Trend('stress_ws_message_latency', true);
export const wsMessagesReceived = new Counter('stress_ws_messages_received');
export const wsConnectionDrops = new Counter('stress_ws_connection_drops');
export const wsReconnectAttempts = new Counter('stress_ws_reconnect_attempts');
export const wsConcurrentConnections = new Gauge('stress_ws_concurrent_connections');

// Chaos metrics
export const chaosEventsInjected = new Counter('stress_chaos_events_injected');
export const chaosRecoveryTime = new Trend('stress_chaos_recovery_time', true);
export const cascadeFailures = new Counter('stress_cascade_failures');
export const gracefulDegradations = new Counter('stress_graceful_degradations');

// ============================================================================
// Authentication
// ============================================================================

let cachedTokens = {};

export function getAuthToken(workspaceId = null) {
  const cacheKey = workspaceId || 'default';

  if (cachedTokens[cacheKey] && cachedTokens[cacheKey].expiry > Date.now()) {
    return cachedTokens[cacheKey].token;
  }

  if (CONFIG.AUTH_TOKEN) {
    return CONFIG.AUTH_TOKEN;
  }

  const res = http.post(
    `${CONFIG.BASE_URL}${CONFIG.API_PREFIX}/auth/login`,
    JSON.stringify({
      email: CONFIG.TEST_EMAIL,
      password: CONFIG.TEST_PASSWORD,
      workspaceId: workspaceId,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: '10s',
    }
  );

  if (res.status === 200) {
    try {
      const body = JSON.parse(res.body);
      const token = body.token || body.access_token;
      cachedTokens[cacheKey] = {
        token,
        expiry: Date.now() + 3500000, // ~58 minutes
      };
      return token;
    } catch (e) {
      console.error(`Auth parse error: ${e}`);
    }
  }

  console.error(`Auth failed: ${res.status} - ${res.body}`);
  return null;
}

export function getAuthHeaders(token = null) {
  const t = token || getAuthToken();
  return {
    'Content-Type': 'application/json',
    Authorization: t ? `Bearer ${t}` : '',
  };
}

// ============================================================================
// HTTP Request Helpers
// ============================================================================

export function apiRequest(method, endpoint, body = null, options = {}) {
  const {
    workspaceId = null,
    token = null,
    timeout = '30s',
    retries = 0,
    tags = {},
  } = options;

  const url = `${CONFIG.BASE_URL}${CONFIG.API_PREFIX}${endpoint}`;
  const headers = getAuthHeaders(token || getAuthToken(workspaceId));

  if (workspaceId && !endpoint.includes('workspaceId=')) {
    const separator = endpoint.includes('?') ? '&' : '?';
    endpoint = `${endpoint}${separator}workspaceId=${workspaceId}`;
  }

  const params = {
    headers,
    timeout,
    tags: { endpoint, ...tags },
  };

  let res;
  let attempt = 0;

  do {
    const startTime = Date.now();

    switch (method.toUpperCase()) {
      case 'GET':
        res = http.get(url, params);
        break;
      case 'POST':
        res = http.post(url, body ? JSON.stringify(body) : null, params);
        break;
      case 'PUT':
        res = http.put(url, body ? JSON.stringify(body) : null, params);
        break;
      case 'PATCH':
        res = http.patch(url, body ? JSON.stringify(body) : null, params);
        break;
      case 'DELETE':
        res = http.del(url, null, params);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    const duration = Date.now() - startTime;
    apiResponseTime.add(duration);
    apiRequestsTotal.add(1);

    // Track specific errors
    if (res.status === 429) {
      api429Errors.add(1);
    } else if (res.status >= 500) {
      api500Errors.add(1);
    }

    if (res.timings.duration >= parseInt(timeout) * 1000) {
      apiTimeouts.add(1);
    }

    // Success or non-retryable error
    if (res.status < 500 && res.status !== 429) {
      break;
    }

    // Retry with backoff
    attempt++;
    if (attempt <= retries) {
      const backoff = exponentialBackoff(attempt);
      console.log(`Retry ${attempt}/${retries} after ${backoff}ms`);
      sleep(backoff);
    }
  } while (attempt <= retries);

  // Track overall success/error
  if (res.status >= 200 && res.status < 400) {
    successRate.add(1);
    errorRate.add(0);
  } else {
    successRate.add(0);
    errorRate.add(1);
  }

  return res;
}

export function batchRequests(requests, options = {}) {
  const { concurrency = 10, delayMs = 0 } = options;
  const results = [];

  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const responses = http.batch(
      batch.map((req) => ({
        method: req.method || 'GET',
        url: `${CONFIG.BASE_URL}${CONFIG.API_PREFIX}${req.endpoint}`,
        body: req.body ? JSON.stringify(req.body) : null,
        params: {
          headers: getAuthHeaders(req.token),
          tags: req.tags || {},
        },
      }))
    );
    results.push(...responses);

    if (delayMs > 0 && i + concurrency < requests.length) {
      sleep(delayMs);
    }
  }

  return results;
}

// ============================================================================
// Test Assertions
// ============================================================================

export function assertResponse(res, expectations, testName = '') {
  const checks = {};

  if (expectations.status !== undefined) {
    if (Array.isArray(expectations.status)) {
      checks[`${testName} status in ${expectations.status.join(',')}`] = (r) =>
        expectations.status.includes(r.status);
    } else {
      checks[`${testName} status ${expectations.status}`] = (r) =>
        r.status === expectations.status;
    }
  }

  if (expectations.maxDuration !== undefined) {
    checks[`${testName} duration < ${expectations.maxDuration}ms`] = (r) =>
      r.timings.duration < expectations.maxDuration;
  }

  if (expectations.bodyContains !== undefined) {
    checks[`${testName} body contains expected`] = (r) =>
      r.body && r.body.includes(expectations.bodyContains);
  }

  if (expectations.jsonPath !== undefined) {
    for (const [path, expected] of Object.entries(expectations.jsonPath)) {
      checks[`${testName} ${path} equals ${expected}`] = (r) => {
        try {
          const body = JSON.parse(r.body);
          const value = path.split('.').reduce((obj, key) => obj?.[key], body);
          return value === expected;
        } catch {
          return false;
        }
      };
    }
  }

  if (expectations.hasBody !== undefined) {
    checks[`${testName} has body`] = (r) => {
      if (expectations.hasBody) {
        return r.body && r.body.length > 0;
      }
      return !r.body || r.body.length === 0;
    };
  }

  if (expectations.isArray !== undefined) {
    checks[`${testName} body is array`] = (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(expectations.isArray ? body : body.data);
      } catch {
        return false;
      }
    };
  }

  if (expectations.custom) {
    for (const [name, fn] of Object.entries(expectations.custom)) {
      checks[`${testName} ${name}`] = fn;
    }
  }

  return check(res, checks);
}

// ============================================================================
// Performance Validation
// ============================================================================

export function validatePerformance(metrics, category = 'api') {
  const thresholds = THRESHOLDS[category];
  const results = [];

  if (metrics.p50 !== undefined && thresholds.p50 !== undefined) {
    results.push({
      metric: 'p50',
      value: metrics.p50,
      threshold: thresholds.p50,
      passed: metrics.p50 <= thresholds.p50,
    });
  }

  if (metrics.p95 !== undefined && thresholds.p95 !== undefined) {
    results.push({
      metric: 'p95',
      value: metrics.p95,
      threshold: thresholds.p95,
      passed: metrics.p95 <= thresholds.p95,
    });
  }

  if (metrics.p99 !== undefined && thresholds.p99 !== undefined) {
    results.push({
      metric: 'p99',
      value: metrics.p99,
      threshold: thresholds.p99,
      passed: metrics.p99 <= thresholds.p99,
    });
  }

  if (metrics.errorRate !== undefined) {
    const threshold = THRESHOLDS.errorRate.normal;
    results.push({
      metric: 'errorRate',
      value: metrics.errorRate,
      threshold,
      passed: metrics.errorRate <= threshold,
    });
  }

  return results;
}

// ============================================================================
// Test Groups
// ============================================================================

export function stressGroup(name, category, fn) {
  return group(`[${category}] ${name}`, () => {
    const startTime = Date.now();
    let passed = true;

    try {
      const result = fn();
      passed = result !== false;
    } catch (e) {
      console.error(`Test failed: ${name} - ${e.message}`);
      passed = false;
      errorRate.add(1);
    }

    const duration = Date.now() - startTime;

    return {
      name,
      category,
      duration,
      passed,
    };
  });
}

// ============================================================================
// Workspace Isolation Helpers
// ============================================================================

export function getRandomWorkspaceId() {
  return CONFIG.WORKSPACE_IDS[
    Math.floor(Math.random() * CONFIG.WORKSPACE_IDS.length)
  ];
}

export function getDifferentWorkspaceId(currentId) {
  const others = CONFIG.WORKSPACE_IDS.filter((id) => id !== currentId);
  return others[Math.floor(Math.random() * others.length)];
}

export function verifyWorkspaceIsolation(data, expectedWorkspaceId) {
  if (!data) return true;

  const items = Array.isArray(data) ? data : data.data || [data];

  for (const item of items) {
    if (item.workspace_id && item.workspace_id !== expectedWorkspaceId) {
      tenantIsolationViolations.add(1);
      console.error(
        `ISOLATION VIOLATION: Expected ${expectedWorkspaceId}, got ${item.workspace_id}`
      );
      return false;
    }
  }

  return true;
}

// ============================================================================
// Cleanup Utilities
// ============================================================================

export function cleanupTestData(resourceType, ids, workspaceId) {
  if (!ids || ids.length === 0) return;

  const deleteRequests = ids.map((id) => ({
    method: 'DELETE',
    endpoint: `/${resourceType}/${id}?workspaceId=${workspaceId}`,
    tags: { cleanup: 'true' },
  }));

  const results = batchRequests(deleteRequests, { concurrency: 5 });

  const failed = results.filter((r) => r.status >= 400 && r.status !== 404);
  if (failed.length > 0) {
    console.warn(`Cleanup: ${failed.length}/${ids.length} deletions failed`);
  }
}

// ============================================================================
// Reporting
// ============================================================================

export function logTestResult(testId, passed, details = {}) {
  const status = passed ? 'PASS' : 'FAIL';
  const detailStr = Object.entries(details)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');

  console.log(`[${status}] ${testId} ${detailStr}`);
}

export function generateTestReport(results) {
  const summary = {
    total: results.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    byCategory: {},
  };

  for (const result of results) {
    if (!summary.byCategory[result.category]) {
      summary.byCategory[result.category] = { passed: 0, failed: 0 };
    }
    if (result.passed) {
      summary.byCategory[result.category].passed++;
    } else {
      summary.byCategory[result.category].failed++;
    }
  }

  summary.passRate = ((summary.passed / summary.total) * 100).toFixed(2) + '%';

  return summary;
}
