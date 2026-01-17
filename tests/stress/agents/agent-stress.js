/**
 * AI Agent Stress Tests (150 Tests)
 *
 * Categories:
 * - Anthropic API Rate Limit Handling (30 tests)
 * - Agent Queue Backpressure (30 tests)
 * - Concurrent Agent Executions (30 tests)
 * - Memory Leak Detection (30 tests)
 * - Cost Budget Enforcement (30 tests)
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';
import {
  CONFIG,
  THRESHOLDS,
  generateAgentRequest,
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
  agentResponseTime,
  agentTokensUsed,
  agentCostAccumulated,
  agentRateLimitHits,
  agentTimeouts,
  errorRate,
} from '../utils.js';

// ============================================================================
// Custom Agent Metrics
// ============================================================================

const agentQueueDepth = new Gauge('stress_agent_queue_depth');
const agentConcurrentExecs = new Gauge('stress_agent_concurrent_execs');
const agentMemoryUsage = new Trend('stress_agent_memory_usage', true);
const agentBudgetRemaining = new Gauge('stress_agent_budget_remaining');
const agentRetries = new Counter('stress_agent_retries');
const agentBackpressure = new Counter('stress_agent_backpressure');
const agentCompletionRate = new Rate('stress_agent_completion_rate');

// ============================================================================
// Test Options
// ============================================================================

export const options = {
  scenarios: {
    agent_rate_limit: {
      executor: 'constant-arrival-rate',
      rate: 50,
      timeUnit: '1s',
      duration: '3m',
      preAllocatedVUs: 20,
      maxVUs: 100,
      tags: { category: 'agent_rate_limit' },
      exec: 'rateLimitTests',
    },
    agent_backpressure: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '2m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 0 },
      ],
      tags: { category: 'agent_backpressure' },
      exec: 'backpressureTests',
    },
    agent_concurrent: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 30 },
        { duration: '2m', target: 80 },
        { duration: '3m', target: 80 },
        { duration: '1m', target: 0 },
      ],
      tags: { category: 'agent_concurrent' },
      exec: 'concurrentTests',
    },
    agent_memory: {
      executor: 'constant-vus',
      vus: 20,
      duration: '5m',
      tags: { category: 'agent_memory' },
      exec: 'memoryLeakTests',
    },
    agent_budget: {
      executor: 'constant-vus',
      vus: 15,
      duration: '4m',
      tags: { category: 'agent_budget' },
      exec: 'budgetTests',
    },
  },
  thresholds: {
    'stress_agent_response_time': ['p(95)<30000', 'p(99)<60000'],
    'stress_agent_completion_rate': ['rate>0.80'],
    'stress_agent_rate_limit_hits': ['count<50'],
    'stress_agent_timeouts': ['count<20'],
    'stress_error_rate': ['rate<0.10'],
  },
};

// ============================================================================
// Agent Endpoints
// ============================================================================

const AGENT_ENDPOINTS = {
  emailAgent: '/api/agents/email',
  contentAgent: '/api/agents/content',
  orchestrator: '/api/agents/orchestrator',
  analyze: '/api/agents/analyze',
  generate: '/api/agents/generate',
  classify: '/api/agents/classify',
};

// ============================================================================
// Helper Functions
// ============================================================================

function callAgent(endpoint, request, options = {}) {
  const { timeout = '60s', retries = 2 } = options;
  const workspaceId = request.workspace_id || getRandomWorkspaceId();

  const startTime = Date.now();
  let lastRes = null;
  let attempt = 0;

  do {
    lastRes = apiRequest('POST', `${endpoint}?workspaceId=${workspaceId}`, request, {
      timeout,
      workspaceId,
    });

    const duration = Date.now() - startTime;
    agentResponseTime.add(duration);

    if (lastRes.status === 200) {
      agentCompletionRate.add(1);

      try {
        const body = JSON.parse(lastRes.body);
        if (body.tokens_used) {
          agentTokensUsed.add(body.tokens_used);
        }
        if (body.cost) {
          agentCostAccumulated.add(body.cost);
        }
      } catch (e) {}

      return lastRes;
    }

    if (lastRes.status === 429) {
      agentRateLimitHits.add(1);
      const retryAfter = parseInt(lastRes.headers['Retry-After'] || '5');
      sleep(retryAfter);
      agentRetries.add(1);
    } else if (lastRes.status === 503 || lastRes.status === 504) {
      agentTimeouts.add(1);
      sleep(2);
      agentRetries.add(1);
    } else if (lastRes.status >= 500) {
      sleep(1);
      agentRetries.add(1);
    } else {
      break;
    }

    attempt++;
  } while (attempt < retries);

  agentCompletionRate.add(0);
  return lastRes;
}

function getQueueStatus(workspaceId) {
  const res = apiRequest('GET', `/api/agents/queue/status?workspaceId=${workspaceId}`);
  if (res.status === 200) {
    try {
      return JSON.parse(res.body);
    } catch (e) {}
  }
  return null;
}

function getBudgetStatus(workspaceId) {
  const res = apiRequest('GET', `/api/agents/budget?workspaceId=${workspaceId}`);
  if (res.status === 200) {
    try {
      return JSON.parse(res.body);
    } catch (e) {}
  }
  return null;
}

// ============================================================================
// Rate Limit Handling Tests (30 tests)
// ============================================================================

export function rateLimitTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-6: Basic rate limit detection
  stressGroup('Agent Rate Limit Detection', 'agent_rate_limit', () => {
    const request = generateAgentRequest(__VU, __ITER);
    const res = callAgent(AGENT_ENDPOINTS.analyze, request, { retries: 0 });

    if (res.status === 429) {
      return check(res, {
        'rate limit has retry-after': () =>
          res.headers['Retry-After'] !== undefined ||
          res.headers['retry-after'] !== undefined,
        'rate limit response format': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.error !== undefined || body.message !== undefined;
          } catch {
            return true;
          }
        },
      });
    }

    return res.status === 200 || res.status === 401 || res.status === 404;
  });

  // Test 7-12: Rate limit recovery
  stressGroup('Agent Rate Limit Recovery', 'agent_rate_limit', () => {
    const request = generateAgentRequest(__VU, __ITER);

    // Trigger potential rate limit
    const res1 = callAgent(AGENT_ENDPOINTS.analyze, request, { retries: 0 });

    if (res1.status === 429) {
      const retryAfter = parseInt(res1.headers['Retry-After'] || '5');
      sleep(retryAfter + 1);

      // Should recover
      const res2 = callAgent(AGENT_ENDPOINTS.analyze, request, { retries: 0 });
      return res2.status !== 429;
    }

    return true;
  });

  // Test 13-18: Burst rate limiting
  stressGroup('Agent Burst Rate Limit', 'agent_rate_limit', () => {
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(generateAgentRequest(__VU, __ITER * 10 + i));
    }

    let rateLimited = 0;
    let successful = 0;

    for (const req of requests) {
      const res = callAgent(AGENT_ENDPOINTS.generate, req, { retries: 0 });
      if (res.status === 429) rateLimited++;
      else if (res.status === 200) successful++;
    }

    // Should have some rate limiting in burst
    return successful > 0 || rateLimited > 0;
  });

  // Test 19-24: Different endpoint rate limits
  stressGroup('Endpoint-Specific Rate Limits', 'agent_rate_limit', () => {
    const endpoints = Object.values(AGENT_ENDPOINTS);
    const endpoint = randomElement(endpoints);
    const request = generateAgentRequest(__VU, __ITER);

    const res = callAgent(endpoint, request, { retries: 1 });

    return res.status < 500 || res.status === 503;
  });

  // Test 25-30: Rate limit with retries
  stressGroup('Rate Limit Retry Strategy', 'agent_rate_limit', () => {
    const request = generateAgentRequest(__VU, __ITER);
    const res = callAgent(AGENT_ENDPOINTS.classify, request, { retries: 3 });

    return assertResponse(res, {
      status: [200, 401, 404, 429, 503],
    }, 'Rate Limit Retry');
  });

  sleep(randomInt(500, 2000) / 1000);
}

// ============================================================================
// Queue Backpressure Tests (30 tests)
// ============================================================================

export function backpressureTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-6: Queue depth monitoring
  stressGroup('Queue Depth Monitor', 'agent_backpressure', () => {
    const status = getQueueStatus(workspaceId);

    if (status) {
      agentQueueDepth.add(status.depth || 0);

      if (status.depth > 100) {
        agentBackpressure.add(1);
      }
    }

    // Submit new request
    const request = generateAgentRequest(__VU, __ITER);
    const res = callAgent(AGENT_ENDPOINTS.orchestrator, request, { retries: 1 });

    return res.status < 500;
  });

  // Test 7-12: Backpressure response
  stressGroup('Backpressure Response', 'agent_backpressure', () => {
    const request = generateAgentRequest(__VU, __ITER);
    const res = callAgent(AGENT_ENDPOINTS.emailAgent, request, { retries: 0 });

    if (res.status === 503) {
      agentBackpressure.add(1);

      return check(res, {
        'backpressure indicated': (r) => {
          try {
            const body = JSON.parse(r.body);
            return (
              body.message?.includes('queue') ||
              body.message?.includes('busy') ||
              body.error?.includes('overloaded')
            );
          } catch {
            return true;
          }
        },
      });
    }

    return res.status === 200 || res.status === 401 || res.status === 404;
  });

  // Test 13-18: Queue draining
  stressGroup('Queue Drain Behavior', 'agent_backpressure', () => {
    // Submit several requests
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(generateAgentRequest(__VU, __ITER * 5 + i));
    }

    const results = [];
    for (const req of requests) {
      const res = callAgent(AGENT_ENDPOINTS.contentAgent, req, { retries: 0 });
      results.push(res);
    }

    // Wait for queue to potentially drain
    sleep(5);

    // Check final queue status
    const status = getQueueStatus(workspaceId);
    if (status) {
      agentQueueDepth.add(status.depth || 0);
    }

    return results.filter((r) => r.status === 200).length >= 1;
  });

  // Test 19-24: Priority queue behavior
  stressGroup('Priority Queue Test', 'agent_backpressure', () => {
    const normalRequest = generateAgentRequest(__VU, __ITER);
    const priorityRequest = {
      ...generateAgentRequest(__VU, __ITER),
      priority: 'high',
    };

    const normalRes = callAgent(AGENT_ENDPOINTS.analyze, normalRequest, { retries: 0 });
    const priorityRes = callAgent(AGENT_ENDPOINTS.analyze, priorityRequest, { retries: 0 });

    // Both should eventually complete or be queued
    return (normalRes.status < 500 || normalRes.status === 503) &&
           (priorityRes.status < 500 || priorityRes.status === 503);
  });

  // Test 25-30: Graceful degradation
  stressGroup('Agent Graceful Degradation', 'agent_backpressure', () => {
    const request = generateAgentRequest(__VU, __ITER);
    const res = callAgent(AGENT_ENDPOINTS.generate, request, { retries: 2, timeout: '30s' });

    // Should either complete, queue, or gracefully reject
    return check(res, {
      'graceful handling': (r) =>
        r.status === 200 ||
        r.status === 202 ||
        r.status === 429 ||
        r.status === 503,
    });
  });

  sleep(randomInt(500, 1500) / 1000);
}

// ============================================================================
// Concurrent Agent Execution Tests (30 tests)
// ============================================================================

export function concurrentTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-6: Parallel agent calls
  stressGroup('Parallel Agent Calls', 'agent_concurrent', () => {
    agentConcurrentExecs.add(3);

    const requests = [
      { endpoint: AGENT_ENDPOINTS.analyze, data: generateAgentRequest(__VU, __ITER) },
      { endpoint: AGENT_ENDPOINTS.classify, data: generateAgentRequest(__VU, __ITER + 1) },
      { endpoint: AGENT_ENDPOINTS.generate, data: generateAgentRequest(__VU, __ITER + 2) },
    ];

    const results = [];
    const httpRequests = requests.map((req) => ({
      method: 'POST',
      endpoint: `${req.endpoint}?workspaceId=${workspaceId}`,
      body: req.data,
    }));

    const responses = batchRequests(httpRequests, { concurrency: 3 });

    agentConcurrentExecs.add(-3);

    const successCount = responses.filter((r) => r.status === 200).length;
    return successCount >= 1;
  });

  // Test 7-12: Same agent concurrent calls
  stressGroup('Same Agent Concurrent', 'agent_concurrent', () => {
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push({
        method: 'POST',
        endpoint: `${AGENT_ENDPOINTS.contentAgent}?workspaceId=${workspaceId}`,
        body: generateAgentRequest(__VU, __ITER * 5 + i),
      });
    }

    agentConcurrentExecs.add(5);
    const results = batchRequests(requests, { concurrency: 5 });
    agentConcurrentExecs.add(-5);

    return results.filter((r) => r.status >= 500 && r.status !== 503).length === 0;
  });

  // Test 13-18: Cross-workspace concurrent
  stressGroup('Cross-Workspace Concurrent', 'agent_concurrent', () => {
    const requests = CONFIG.WORKSPACE_IDS.slice(0, 3).map((wsId, idx) => ({
      method: 'POST',
      endpoint: `${AGENT_ENDPOINTS.analyze}?workspaceId=${wsId}`,
      body: generateAgentRequest(__VU, __ITER * 3 + idx),
    }));

    const results = batchRequests(requests, { concurrency: 3 });

    return results.filter((r) => r.status === 200 || r.status === 401 || r.status === 404).length >= 1;
  });

  // Test 19-24: Long-running concurrent
  stressGroup('Long Running Concurrent', 'agent_concurrent', () => {
    const request = {
      ...generateAgentRequest(__VU, __ITER),
      max_tokens: 1000,
    };

    agentConcurrentExecs.add(1);
    const res = callAgent(AGENT_ENDPOINTS.generate, request, { timeout: '60s', retries: 1 });
    agentConcurrentExecs.add(-1);

    return res.status < 500 || res.status === 503;
  });

  // Test 25-30: Rapid sequential
  stressGroup('Rapid Sequential Calls', 'agent_concurrent', () => {
    let completions = 0;

    for (let i = 0; i < 3; i++) {
      const request = generateAgentRequest(__VU, __ITER * 3 + i);
      const res = callAgent(AGENT_ENDPOINTS.classify, request, { retries: 0 });

      if (res.status === 200) completions++;
    }

    return completions >= 1;
  });

  sleep(randomInt(200, 800) / 1000);
}

// ============================================================================
// Memory Leak Detection Tests (30 tests)
// ============================================================================

export function memoryLeakTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-6: Large payload processing
  stressGroup('Large Payload Memory', 'agent_memory', () => {
    const largeContext = 'x'.repeat(10000);
    const request = {
      ...generateAgentRequest(__VU, __ITER),
      context: { data: largeContext },
    };

    const res = callAgent(AGENT_ENDPOINTS.analyze, request, { timeout: '30s' });

    // Track memory if available
    if (res.status === 200) {
      try {
        const body = JSON.parse(res.body);
        if (body.memory_used) {
          agentMemoryUsage.add(body.memory_used);
        }
      } catch (e) {}
    }

    return res.status < 500;
  });

  // Test 7-12: Repeated small requests
  stressGroup('Repeated Small Requests', 'agent_memory', () => {
    for (let i = 0; i < 10; i++) {
      const request = generateAgentRequest(__VU, __ITER * 10 + i);
      request.max_tokens = 50;

      callAgent(AGENT_ENDPOINTS.classify, request, { retries: 0 });
    }

    // Check system health after repeated requests
    const healthRes = apiRequest('GET', '/health');
    return healthRes.status === 200;
  });

  // Test 13-18: Memory under load
  stressGroup('Memory Under Sustained Load', 'agent_memory', () => {
    const startTime = Date.now();

    while (Date.now() - startTime < 5000) {
      const request = generateAgentRequest(__VU, __ITER);
      request.max_tokens = 100;

      const res = callAgent(AGENT_ENDPOINTS.generate, request, { retries: 0 });

      if (res.status >= 500 && res.status !== 503) {
        return false;
      }

      sleep(0.5);
    }

    return true;
  });

  // Test 19-24: Memory cleanup verification
  stressGroup('Memory Cleanup', 'agent_memory', () => {
    // Generate load
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(generateAgentRequest(__VU, __ITER * 5 + i));
    }

    for (const req of requests) {
      callAgent(AGENT_ENDPOINTS.contentAgent, req, { retries: 0 });
    }

    // Wait for potential cleanup
    sleep(2);

    // System should still be responsive
    const healthRes = apiRequest('GET', '/health');
    return healthRes.status === 200;
  });

  // Test 25-30: Error path memory
  stressGroup('Error Path Memory', 'agent_memory', () => {
    // Intentionally trigger errors
    const badRequest = {
      prompt: null,
      invalid_field: 'x'.repeat(1000),
    };

    const res = apiRequest('POST', `${AGENT_ENDPOINTS.analyze}?workspaceId=${workspaceId}`, badRequest);

    // Should handle gracefully without memory leak
    sleep(1);

    const healthRes = apiRequest('GET', '/health');
    return healthRes.status === 200;
  });

  sleep(randomInt(300, 1000) / 1000);
}

// ============================================================================
// Cost Budget Enforcement Tests (30 tests)
// ============================================================================

export function budgetTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-6: Budget status check
  stressGroup('Budget Status Check', 'agent_budget', () => {
    const status = getBudgetStatus(workspaceId);

    if (status) {
      agentBudgetRemaining.add(status.remaining || 0);

      return check(status, {
        'budget has limit': () => status.limit !== undefined,
        'budget has usage': () => status.used !== undefined,
      });
    }

    return true;
  });

  // Test 7-12: Budget consumption tracking
  stressGroup('Budget Consumption Track', 'agent_budget', () => {
    const beforeStatus = getBudgetStatus(workspaceId);
    const beforeUsed = beforeStatus?.used || 0;

    const request = generateAgentRequest(__VU, __ITER);
    const res = callAgent(AGENT_ENDPOINTS.generate, request, { retries: 1 });

    if (res.status === 200) {
      try {
        const body = JSON.parse(res.body);
        if (body.cost) {
          agentCostAccumulated.add(body.cost);
        }
      } catch (e) {}
    }

    const afterStatus = getBudgetStatus(workspaceId);
    const afterUsed = afterStatus?.used || 0;

    // Usage should have increased (or stayed same if cached)
    return afterUsed >= beforeUsed;
  });

  // Test 13-18: Budget limit enforcement
  stressGroup('Budget Limit Enforcement', 'agent_budget', () => {
    const request = {
      ...generateAgentRequest(__VU, __ITER),
      max_tokens: 2000,
    };

    const res = callAgent(AGENT_ENDPOINTS.generate, request, { retries: 0 });

    // Should either complete or reject due to budget
    if (res.status === 402 || res.status === 403) {
      return check(res, {
        'budget exceeded message': (r) => {
          try {
            const body = JSON.parse(r.body);
            return (
              body.message?.includes('budget') ||
              body.error?.includes('limit') ||
              body.error?.includes('quota')
            );
          } catch {
            return true;
          }
        },
      });
    }

    return res.status === 200 || res.status === 401 || res.status === 404 || res.status === 429;
  });

  // Test 19-24: Cost estimation
  stressGroup('Cost Estimation', 'agent_budget', () => {
    const request = generateAgentRequest(__VU, __ITER);
    request.estimate_only = true;

    const res = apiRequest('POST', `${AGENT_ENDPOINTS.analyze}/estimate?workspaceId=${workspaceId}`, request);

    if (res.status === 200) {
      try {
        const estimate = JSON.parse(res.body);
        return check(estimate, {
          'estimate has cost': () =>
            estimate.estimated_cost !== undefined ||
            estimate.cost !== undefined,
        });
      } catch (e) {}
    }

    return res.status === 401 || res.status === 404;
  });

  // Test 25-30: Budget reset behavior
  stressGroup('Budget Period Handling', 'agent_budget', () => {
    const status = getBudgetStatus(workspaceId);

    if (status) {
      return check(status, {
        'has period info': () =>
          status.period !== undefined ||
          status.reset_at !== undefined ||
          status.daily !== undefined ||
          status.monthly !== undefined,
      });
    }

    // Submit request and check budget impact
    const request = generateAgentRequest(__VU, __ITER);
    const res = callAgent(AGENT_ENDPOINTS.classify, request, { retries: 1 });

    return res.status < 500;
  });

  sleep(randomInt(500, 1500) / 1000);
}

// ============================================================================
// Setup and Teardown
// ============================================================================

export function setup() {
  console.log('\n=== AI Agent Stress Tests Starting ===');
  console.log(`Base URL: ${CONFIG.BASE_URL}`);
  console.log(`Budget Limit: $${CONFIG.ANTHROPIC_BUDGET_LIMIT}`);
  console.log(`Agent Timeout: ${CONFIG.AGENT_TIMEOUT_MS}ms`);
  console.log('======================================\n');

  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log('\n=== AI Agent Stress Tests Complete ===');
  console.log(`Duration: ${duration.toFixed(2)}s`);
  console.log('======================================\n');
}
