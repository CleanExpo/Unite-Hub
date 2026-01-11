/**
 * K6 Load Test: Health Check API - Ramp-Up Scenario
 * Gradually increases load from 0 to 100 users over 2 minutes
 * Tests baseline performance as traffic increases
 *
 * Run: k6 run tests/load/health-check-ramp.js
 * With custom threshold: k6 run tests/load/health-check-ramp.js --vus 50 --duration 5m
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
const healthCheckDuration = new Trend('health_check_duration_ms', true);
const healthCheckSuccess = new Rate('health_check_success_rate');
const healthCheckErrors = new Counter('health_check_error_count');

export const options = {
  // Ramp-up scenario: 0 → 100 users over 2 min
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m30s', target: 100 }, // Continue ramp to 100 users
    { duration: '30s', target: 0 },     // Ramp down
  ],

  // Thresholds - must pass before deployment
  thresholds: {
    'health_check_duration_ms': ['p(95)<1000', 'p(99)<2000'],  // 95% < 1s, 99% < 2s
    'health_check_success_rate': ['rate>0.99'],                 // >99% success
    'http_req_duration': ['p(95)<1000'],
    'http_req_failed': ['rate<0.01'],  // <1% error rate
  },

  // Graceful shutdown
  gracefulStop: '30s',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3008';
const WORKSPACE_ID = __ENV.WORKSPACE_ID || 'test-workspace-001';

export default function () {
  // Test URL for health check
  const testUrl = 'https://example.com';

  const payload = JSON.stringify({
    url: testUrl,
    workspaceId: WORKSPACE_ID,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.API_KEY || 'test-key'}`,
    },
    timeout: '30s',
  };

  // Make request
  const startTime = new Date();
  const res = http.post(
    `${BASE_URL}/api/health-check/analyze`,
    payload,
    params
  );
  const duration = new Date() - startTime;

  // Track metrics
  healthCheckDuration.add(duration);
  healthCheckSuccess.add(res.status === 200 || res.status === 202); // 202 = accepted (async)

  if (res.status !== 200 && res.status !== 202) {
    healthCheckErrors.add(1);
  }

  // Validate response
  check(res, {
    'status is 200 or 202': (r) => r.status === 200 || r.status === 202,
    'response contains jobId or score': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.jobId || body.overallScore !== undefined;
      } catch {
        return false;
      }
    },
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  // Think time between requests
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

export function teardown(data) {
  console.log(`Health Check Load Test (Ramp-Up) - Results:`);
  console.log(`Success Rate: ${healthCheckSuccess.value}%`);
  console.log(`Error Count: ${healthCheckErrors.value}`);
}
