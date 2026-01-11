/**
 * K6 Load Test: Health Check API - Spike Test Scenario
 * Sudden increase in traffic to test recovery from traffic spikes
 * Simulates viral content, news mentions, or DDoS-like patterns
 *
 * Run: k6 run tests/load/health-check-spike.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const healthCheckDuration = new Trend('health_check_duration_ms', true);
const healthCheckSuccess = new Rate('health_check_success_rate');
const healthCheckErrors = new Counter('health_check_error_count');

export const options = {
  // Spike test: normal → 10x surge → normal
  stages: [
    { duration: '1m', target: 100 },     // Normal load
    { duration: '10s', target: 1000 },   // Spike (10x)
    { duration: '30s', target: 1000 },   // Sustain spike
    { duration: '10s', target: 100 },    // Recovery
    { duration: '1m', target: 100 },     // Stabilize
    { duration: '10s', target: 0 },      // Ramp down
  ],

  thresholds: {
    'health_check_duration_ms': ['p(95)<2000', 'p(99)<5000'],
    'health_check_success_rate': ['rate>0.90'],
    'http_req_failed': ['rate<0.10'],
  },

  gracefulStop: '20s',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3008';
const WORKSPACE_ID = __ENV.WORKSPACE_ID || 'test-workspace-spike';

export default function () {
  const payload = JSON.stringify({
    url: 'https://spike-test-domain.com',
    workspaceId: WORKSPACE_ID,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.API_KEY || 'test-key'}`,
    },
    timeout: '30s',
    tags: { name: 'HealthCheckSpike' },
  };

  const res = http.post(
    `${BASE_URL}/api/health-check/analyze`,
    payload,
    params
  );

  healthCheckDuration.add(res.timings.duration);
  healthCheckSuccess.add(res.status === 200 || res.status === 202);

  if (res.status !== 200 && res.status !== 202) {
    healthCheckErrors.add(1);
  }

  check(res, {
    'request succeeded': (r) => r.status === 200 || r.status === 202,
    'response time acceptable': (r) => r.timings.duration < 3000,
    'no timeouts': (r) => r.status !== 0,
  });

  sleep(0.5); // Minimal think time to maximize load
}

export function teardown(data) {
  console.log(`\n⚡ Health Check Spike Test - Results:`);
  console.log(`✅ Success Rate: ${healthCheckSuccess.value.toFixed(2)}%`);
  console.log(`❌ Error Count: ${healthCheckErrors.value}`);
}
