/**
 * K6 Load Test: Health Check API - Stress Test Scenario
 * Gradually increases load until system breaks or max capacity reached
 * Identifies breaking point and recovery behavior
 *
 * Run: k6 run tests/load/health-check-stress.js
 * With higher target: k6 run tests/load/health-check-stress.js --max-vus 5000
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const healthCheckDuration = new Trend('health_check_duration_ms', true);
const healthCheckSuccess = new Rate('health_check_success_rate');
const healthCheckErrors = new Counter('health_check_error_count');
const serverErrors = new Counter('http_5xx_errors');

export const options = {
  // Stress test: gradually increase until breaking point
  stages: [
    { duration: '2m', target: 100 },
    { duration: '2m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '2m', target: 2000 },  // Stress level
    { duration: '2m', target: 5000 },  // Extreme stress
    { duration: '1m', target: 0 },     // Ramp down
  ],

  // Stress test thresholds (focus on identifying breaking point)
  thresholds: {
    'health_check_duration_ms': ['p(95)<5000', 'p(99)<10000'],
    'health_check_success_rate': ['rate>0.80'],  // Lower threshold to find breaking point
    'http_req_failed': ['rate<0.50'],  // Allow up to 50% failures under stress
    'http_5xx_errors': ['count<1000'], // Track server errors
  },

  gracefulStop: '1m',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3008';
const WORKSPACE_ID = __ENV.WORKSPACE_ID || 'test-workspace-stress';

export default function () {
  const payload = JSON.stringify({
    url: 'https://stress-test-domain.com',
    workspaceId: WORKSPACE_ID,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.API_KEY || 'test-key'}`,
    },
    timeout: '120s',
    tags: { name: 'HealthCheckStress' },
  };

  const res = http.post(
    `${BASE_URL}/api/health-check/analyze`,
    payload,
    params
  );

  healthCheckDuration.add(res.timings.duration);
  healthCheckSuccess.add(res.status === 200 || res.status === 202);

  if (res.status >= 500) {
    serverErrors.add(1);
  }

  if (res.status !== 200 && res.status !== 202) {
    healthCheckErrors.add(1);
  }

  check(res, {
    'status code is acceptable': (r) =>
      r.status === 200 ||
      r.status === 202 ||
      r.status === 429 || // Rate limited is ok
      r.status === 503,   // Service unavailable is acceptable under stress
    'no 5xx errors': (r) => r.status < 500,
    'response time < 10000ms': (r) => r.timings.duration < 10000,
  });

  sleep(Math.random() * 5 + 1); // 1-6 seconds
}

export function teardown(data) {
  console.log(`\n🔥 Health Check Stress Test - Results:`);
  console.log(`✅ Success Rate: ${healthCheckSuccess.value.toFixed(2)}%`);
  console.log(`❌ Total Errors: ${healthCheckErrors.value}`);
  console.log(`🛑 Server Errors (5xx): ${serverErrors.value}`);
  console.log(`⏱️  Max Duration: ${healthCheckDuration.value.toFixed(0)}ms`);
}
