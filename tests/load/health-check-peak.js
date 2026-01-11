/**
 * K6 Load Test: Health Check API - Peak Load Scenario
 * Sustains high load (1000 concurrent users) for 5 minutes
 * Tests maximum capacity and sustained performance
 *
 * Run: k6 run tests/load/health-check-peak.js
 * Distributed: k6 run -o cloud tests/load/health-check-peak.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const healthCheckDuration = new Trend('health_check_duration_ms', true);
const healthCheckSuccess = new Rate('health_check_success_rate');
const healthCheckErrors = new Counter('health_check_error_count');
const activeUsers = new Gauge('vus_active');

export const options = {
  // Peak load scenario: 1000 concurrent users for 5 minutes
  stages: [
    { duration: '1m', target: 500 },    // Ramp to 500
    { duration: '1m', target: 1000 },   // Ramp to 1000 (peak)
    { duration: '3m', target: 1000 },   // Sustain peak
    { duration: '1m', target: 0 },      // Ramp down
  ],

  // Peak load thresholds (stricter for production)
  thresholds: {
    'health_check_duration_ms': ['p(95)<2000', 'p(99)<5000'],  // 95% < 2s, 99% < 5s
    'health_check_success_rate': ['rate>0.95'],                 // >95% success
    'http_req_duration': ['p(95)<2000'],
    'http_req_failed': ['rate<0.05'],   // <5% error rate acceptable under peak
  },

  // Cloud execution (if using k6 cloud)
  ext: {
    loadimpact: {
      projectID: __ENV.K6_PROJECT_ID,
      name: 'Health Check - Peak Load',
    },
  },

  gracefulStop: '30s',
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3008';
const WORKSPACE_ID = __ENV.WORKSPACE_ID || 'test-workspace-peak';

export default function () {
  activeUsers.add(__VU); // Track VU count

  // Simulate different health check requests
  const testUrls = [
    'https://example.com',
    'https://ecommerce-site.com',
    'https://saas-platform.io',
    'https://local-service.com',
  ];

  const testUrl = testUrls[Math.floor(Math.random() * testUrls.length)];

  const payload = JSON.stringify({
    url: testUrl,
    workspaceId: WORKSPACE_ID,
    includeCompetitors: true,
    analyzeThreats: true,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${__ENV.API_KEY || 'test-key'}`,
    },
    timeout: '60s',
    tags: { name: 'HealthCheckPeak' },
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
    'status is 200 or 202': (r) => r.status === 200 || r.status === 202,
    'response contains analysis': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.jobId || body.overallScore !== undefined;
      } catch {
        return false;
      }
    },
    'response time < 2000ms': (r) => r.timings.duration < 2000,
    'no timeout errors': (r) => r.timings.waiting < 60000,
  });

  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

export function teardown(data) {
  console.log(`\n📊 Health Check Load Test (Peak) - Results:`);
  console.log(`✅ Success Rate: ${healthCheckSuccess.value.toFixed(2)}%`);
  console.log(`❌ Error Count: ${healthCheckErrors.value}`);
  console.log(`⏱️  Avg Duration: ${healthCheckDuration.value.toFixed(0)}ms`);
  console.log(`📈 P95 Duration: ${healthCheckDuration.value}ms`);
}
