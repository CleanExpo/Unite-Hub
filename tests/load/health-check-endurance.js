/**
 * K6 Load Test: Health Check API - Endurance Test Scenario
 * Long-running test at moderate load to detect memory leaks, resource exhaustion
 * Runs for 30+ minutes to identify degradation over time
 *
 * Run: k6 run tests/load/health-check-endurance.js
 * Local: k6 run tests/load/health-check-endurance.js --duration 30m
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const healthCheckDuration = new Trend('health_check_duration_ms', true);
const healthCheckSuccess = new Rate('health_check_success_rate');
const healthCheckErrors = new Counter('health_check_error_count');
const memoryIssues = new Counter('memory_issues');

export const options = {
  // Endurance test: moderate sustained load for long duration
  stages: [
    { duration: '2m', target: 50 },     // Warm up
    { duration: '20m', target: 50 },    // Sustained load
    { duration: '5m', target: 100 },    // Step increase
    { duration: '5m', target: 100 },    // Sustain high load
    { duration: '1m', target: 0 },      // Cool down
  ],

  // Endurance test thresholds (strict to detect degradation)
  thresholds: {
    'health_check_duration_ms': ['p(95)<1500', 'p(99)<3000'],  // No degradation over time
    'health_check_success_rate': ['rate>0.98'],                 // High reliability
    'http_req_failed': ['rate<0.02'],
  },

  gracefulStop: '1m',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3008';
const WORKSPACE_ID = __ENV.WORKSPACE_ID || 'test-workspace-endurance';

let requestCount = 0;

export default function () {
  requestCount++;

  // Vary URLs to simulate realistic usage
  const testUrls = [
    'https://endurance-test-1.com',
    'https://endurance-test-2.com',
    'https://endurance-test-3.com',
    'https://endurance-test-4.com',
  ];

  const testUrl = testUrls[requestCount % testUrls.length];

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
    tags: { name: 'HealthCheckEndurance' },
  };

  const startTime = new Date();
  const res = http.post(
    `${BASE_URL}/api/health-check/analyze`,
    payload,
    params
  );
  const duration = new Date() - startTime;

  healthCheckDuration.add(duration);
  healthCheckSuccess.add(res.status === 200 || res.status === 202);

  // Track potential memory issues (very slow responses)
  if (duration > 10000) {
    memoryIssues.add(1);
  }

  if (res.status !== 200 && res.status !== 202) {
    healthCheckErrors.add(1);
  }

  check(res, {
    'response succeeds': (r) => r.status === 200 || r.status === 202,
    'response time consistent': (r) => r.timings.duration < 2000,
    'no memory/resource issues': (r) => r.timings.duration < 10000,
  });

  // Realistic think time
  sleep(Math.random() * 2 + 1);
}

export function teardown(data) {
  console.log(`\n⏱️ Health Check Endurance Test - Results:`);
  console.log(`✅ Success Rate: ${healthCheckSuccess.value.toFixed(2)}%`);
  console.log(`❌ Total Errors: ${healthCheckErrors.value}`);
  console.log(`⚠️  Potential Memory Issues: ${memoryIssues.value}`);
  console.log(`📊 Requests Executed: ${requestCount}`);
  console.log(`\n💡 Note: Check for performance degradation over time.`);
  console.log(`   Sustained high response times indicate memory leaks.`);
}
