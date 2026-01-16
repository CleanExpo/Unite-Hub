/**
 * K6 Load Test: Contacts API
 *
 * Tests CRUD operations on contacts endpoint under load.
 * Run with: npm run test:load:contacts
 *
 * Environment variables:
 * - BASE_URL: API base URL (default: http://localhost:3008)
 * - WORKSPACE_ID: Test workspace ID
 * - API_KEY: Test API key/token
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { randomString, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom metrics
const contactsListDuration = new Trend('contacts_list_duration_ms');
const contactsCreateDuration = new Trend('contacts_create_duration_ms');
const contactsSuccessRate = new Rate('contacts_success_rate');
const contactsErrorCount = new Counter('contacts_error_count');

export const options = {
  scenarios: {
    // Read-heavy scenario (typical CRM usage pattern)
    read_heavy: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },   // Ramp up
        { duration: '1m', target: 50 },    // Steady state
        { duration: '2m', target: 50 },    // Hold
        { duration: '30s', target: 0 },    // Ramp down
      ],
      exec: 'readContacts',
    },

    // Write scenario (contact creation burst)
    write_burst: {
      executor: 'constant-arrival-rate',
      rate: 10,           // 10 requests per second
      timeUnit: '1s',
      duration: '1m',
      preAllocatedVUs: 20,
      maxVUs: 50,
      exec: 'createContact',
      startTime: '4m30s', // Start after read_heavy completes
    },
  },

  thresholds: {
    'contacts_list_duration_ms': ['p(95)<1000', 'p(99)<2000'],
    'contacts_create_duration_ms': ['p(95)<1500', 'p(99)<3000'],
    'contacts_success_rate': ['rate>0.95'],
    'http_req_failed': ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3008';
const WORKSPACE_ID = __ENV.WORKSPACE_ID || 'test-workspace-load';
const API_KEY = __ENV.API_KEY || 'test-load-key';

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${API_KEY}`,
};

const companies = ['Acme Inc', 'Tech Corp', 'Global Ltd', 'Startup Co', 'Enterprise LLC'];
const statuses = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

export function readContacts() {
  group('GET /api/contacts', () => {
    const page = Math.floor(Math.random() * 5 + 1);
    const params = new URLSearchParams({
      workspaceId: WORKSPACE_ID,
      page: page.toString(),
      pageSize: '20',
    });

    const res = http.get(`${BASE_URL}/api/contacts?${params}`, { headers });

    contactsListDuration.add(res.timings.duration);
    contactsSuccessRate.add(res.status === 200);

    if (res.status !== 200) {
      contactsErrorCount.add(1);
      console.error(`GET /api/contacts failed: ${res.status} - ${res.body}`);
    }

    check(res, {
      'status is 200': (r) => r.status === 200,
      'response has contacts array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return Array.isArray(body.data?.contacts);
        } catch {
          return false;
        }
      },
      'response time < 1s': (r) => r.timings.duration < 1000,
    });

    // Simulate user think time
    sleep(Math.random() * 2 + 0.5);
  });
}

export function createContact() {
  group('POST /api/contacts', () => {
    const payload = JSON.stringify({
      workspaceId: WORKSPACE_ID,
      name: `Load Test User ${randomString(8)}`,
      email: `loadtest-${randomString(10)}@example.com`,
      company: randomItem(companies),
      status: 'new',
      phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      notes: 'Created by k6 load test',
    });

    const res = http.post(`${BASE_URL}/api/contacts`, payload, { headers });

    contactsCreateDuration.add(res.timings.duration);
    contactsSuccessRate.add(res.status === 201 || res.status === 200);

    if (res.status !== 201 && res.status !== 200) {
      contactsErrorCount.add(1);
      console.error(`POST /api/contacts failed: ${res.status} - ${res.body}`);
    }

    check(res, {
      'status is 201 or 200': (r) => r.status === 201 || r.status === 200,
      'contact created with ID': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data?.contact?.id !== undefined;
        } catch {
          return false;
        }
      },
      'response time < 1.5s': (r) => r.timings.duration < 1500,
    });

    sleep(Math.random() + 0.5);
  });
}

export function handleSummary(data) {
  return {
    'tests/load/results/contacts-summary.json': JSON.stringify(data, null, 2),
  };
}
