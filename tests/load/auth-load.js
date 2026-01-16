/**
 * K6 Load Test: Authentication Flow
 *
 * Tests authentication endpoints under spike load.
 * Run with: npm run test:load:auth
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
const authSessionDuration = new Trend('auth_session_duration_ms');
const authSuccessRate = new Rate('auth_success_rate');
const authErrorCount = new Counter('auth_error_count');

export const options = {
  scenarios: {
    // Spike test - sudden traffic surge
    auth_spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 50 },   // Sudden spike
        { duration: '30s', target: 50 },   // Hold spike
        { duration: '10s', target: 100 },  // Double spike
        { duration: '30s', target: 100 },  // Hold double
        { duration: '10s', target: 0 },    // Rapid cooldown
      ],
    },
  },

  thresholds: {
    'auth_session_duration_ms': ['p(95)<500', 'p(99)<1000'],
    'auth_success_rate': ['rate>0.99'],
    'http_req_failed': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3008';
const SESSION_TOKEN = __ENV.SESSION_TOKEN || 'test-session-token';

export default function () {
  group('GET /api/auth/session', () => {
    const res = http.get(`${BASE_URL}/api/auth/session`, {
      headers: {
        Cookie: `next-auth.session-token=${SESSION_TOKEN}`,
      },
    });

    authSessionDuration.add(res.timings.duration);

    // Both 200 (valid session) and 401 (no session) are acceptable
    const isValidResponse = res.status === 200 || res.status === 401;
    authSuccessRate.add(isValidResponse);

    if (!isValidResponse) {
      authErrorCount.add(1);
      console.error(`Session check failed: ${res.status}`);
    }

    check(res, {
      'valid response (200 or 401)': (r) => r.status === 200 || r.status === 401,
      'fast response < 500ms': (r) => r.timings.duration < 500,
      'response is JSON': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
    });

    // Very short sleep to simulate rapid auth checks
    sleep(Math.random() * 0.3 + 0.1);
  });
}

export function handleSummary(data) {
  return {
    'tests/load/results/auth-summary.json': JSON.stringify(data, null, 2),
  };
}
