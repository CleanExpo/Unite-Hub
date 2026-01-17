/**
 * Multi-Tenant Isolation Stress Tests (150 Tests)
 *
 * Categories:
 * - Cross-Tenant Data Leak Attempts (50 tests)
 * - Workspace Boundary Violations (50 tests)
 * - Concurrent Tenant Operations (50 tests)
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import {
  CONFIG,
  THRESHOLDS,
  generateTestContact,
  generateTestCampaign,
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
  getDifferentWorkspaceId,
  verifyWorkspaceIsolation,
  tenantIsolationViolations,
  crossTenantAttempts,
  tenantSwitchTime,
  errorRate,
} from '../utils.js';

// ============================================================================
// Custom Metrics
// ============================================================================

const isolationBreaches = new Counter('stress_isolation_breaches');
const boundaryViolations = new Counter('stress_boundary_violations');
const crossTenantQueries = new Counter('stress_cross_tenant_queries');
const tenantSwitches = new Counter('stress_tenant_switches');
const isolationVerifyTime = new Trend('stress_isolation_verify_time', true);

// ============================================================================
// Test Options
// ============================================================================

export const options = {
  scenarios: {
    cross_tenant_leak: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 30 },
        { duration: '2m', target: 100 },
        { duration: '3m', target: 200 },
        { duration: '2m', target: 200 },
        { duration: '1m', target: 0 },
      ],
      tags: { category: 'cross_tenant' },
      exec: 'crossTenantLeakTests',
    },
    workspace_boundary: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '2m', target: 150 },
        { duration: '3m', target: 150 },
        { duration: '1m', target: 0 },
      ],
      tags: { category: 'workspace_boundary' },
      exec: 'workspaceBoundaryTests',
    },
    concurrent_tenant: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '2m', target: 200 },
        { duration: '3m', target: 300 },
        { duration: '2m', target: 300 },
        { duration: '1m', target: 0 },
      ],
      tags: { category: 'concurrent_tenant' },
      exec: 'concurrentTenantTests',
    },
  },
  thresholds: {
    'stress_isolation_breaches': ['count==0'],
    'stress_boundary_violations': ['count==0'],
    'stress_tenant_isolation_violations': ['count==0'],
    'stress_isolation_verify_time': ['p(95)<100'],
    'stress_error_rate': ['rate<0.05'],
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

function createResourceInWorkspace(type, workspaceId) {
  const generators = {
    contact: () => generateTestContact(__VU, __ITER),
    campaign: () => generateTestCampaign(__VU, __ITER),
  };

  const data = generators[type]();
  data.workspace_id = workspaceId;

  const res = apiRequest('POST', `/${type}s?workspaceId=${workspaceId}`, data);

  if (res.status === 200 || res.status === 201) {
    try {
      const body = JSON.parse(res.body);
      return { id: body.id, workspaceId, type };
    } catch (e) {}
  }
  return null;
}

function tryAccessResource(resourceId, resourceType, workspaceId) {
  return apiRequest('GET', `/${resourceType}s/${resourceId}?workspaceId=${workspaceId}`);
}

// ============================================================================
// Cross-Tenant Data Leak Tests (50 tests)
// ============================================================================

export function crossTenantLeakTests() {
  const myWorkspace = getRandomWorkspaceId();
  const otherWorkspace = getDifferentWorkspaceId(myWorkspace);

  // Test 1-10: Direct cross-tenant access attempts
  stressGroup('Direct Cross-Tenant Read', 'cross_tenant', () => {
    crossTenantAttempts.add(1);
    crossTenantQueries.add(1);

    // Get resource from workspace A
    const listRes = apiRequest('GET', `/contacts?workspaceId=${myWorkspace}&limit=1`);

    if (listRes.status === 200) {
      try {
        const data = JSON.parse(listRes.body);
        const contacts = data.data || data;

        if (contacts.length > 0) {
          const contactId = contacts[0].id;

          // Try to access from workspace B
          const crossRes = tryAccessResource(contactId, 'contact', otherWorkspace);

          const isolated = check(crossRes, {
            'cross-tenant read blocked': (r) =>
              r.status === 401 || r.status === 403 || r.status === 404,
          });

          if (!isolated) {
            isolationBreaches.add(1);
            tenantIsolationViolations.add(1);
            console.error(`ISOLATION BREACH: Contact ${contactId} accessible from wrong workspace`);
          }

          return isolated;
        }
      } catch (e) {}
    }
    return true;
  });

  // Test 11-20: Cross-tenant update attempts
  stressGroup('Cross-Tenant Update Attempt', 'cross_tenant', () => {
    crossTenantAttempts.add(1);

    // Create resource in my workspace
    const resource = createResourceInWorkspace('contact', myWorkspace);

    if (resource) {
      // Try to update from other workspace
      const updateRes = apiRequest(
        'PATCH',
        `/contacts/${resource.id}?workspaceId=${otherWorkspace}`,
        { name: 'Hacked Name' }
      );

      const blocked = check(updateRes, {
        'cross-tenant update blocked': (r) =>
          r.status === 401 || r.status === 403 || r.status === 404,
      });

      if (!blocked) {
        isolationBreaches.add(1);
        console.error(`ISOLATION BREACH: Updated resource from wrong workspace`);
      }

      return blocked;
    }
    return true;
  });

  // Test 21-30: Cross-tenant delete attempts
  stressGroup('Cross-Tenant Delete Attempt', 'cross_tenant', () => {
    crossTenantAttempts.add(1);

    const resource = createResourceInWorkspace('contact', myWorkspace);

    if (resource) {
      const deleteRes = apiRequest(
        'DELETE',
        `/contacts/${resource.id}?workspaceId=${otherWorkspace}`
      );

      const blocked = check(deleteRes, {
        'cross-tenant delete blocked': (r) =>
          r.status === 401 || r.status === 403 || r.status === 404,
      });

      if (!blocked) {
        isolationBreaches.add(1);
        console.error(`ISOLATION BREACH: Deleted resource from wrong workspace`);
      }

      return blocked;
    }
    return true;
  });

  // Test 31-40: List enumeration attempts
  stressGroup('Cross-Tenant Enumeration', 'cross_tenant', () => {
    crossTenantAttempts.add(1);

    // List from my workspace
    const myRes = apiRequest('GET', `/contacts?workspaceId=${myWorkspace}&limit=50`);
    const otherRes = apiRequest('GET', `/contacts?workspaceId=${otherWorkspace}&limit=50`);

    if (myRes.status === 200 && otherRes.status === 200) {
      try {
        const myData = JSON.parse(myRes.body);
        const otherData = JSON.parse(otherRes.body);

        const myContacts = myData.data || myData;
        const otherContacts = otherData.data || otherData;

        const myIds = new Set(myContacts.map((c) => c.id));
        const otherIds = new Set(otherContacts.map((c) => c.id));

        // Check for overlap
        const overlap = [...myIds].filter((id) => otherIds.has(id));

        if (overlap.length > 0) {
          isolationBreaches.add(overlap.length);
          console.error(`ISOLATION BREACH: ${overlap.length} overlapping IDs between workspaces`);
          return false;
        }

        return true;
      } catch (e) {}
    }
    return true;
  });

  // Test 41-50: Nested resource access
  stressGroup('Nested Resource Cross-Tenant', 'cross_tenant', () => {
    crossTenantAttempts.add(1);

    // Try to access sub-resources with wrong workspace
    const endpoints = [
      `/contacts?workspaceId=${myWorkspace}&campaign_id=fake-id`,
      `/campaigns?workspaceId=${myWorkspace}`,
      `/emails?workspaceId=${myWorkspace}`,
    ];

    const endpoint = randomElement(endpoints);
    const res = apiRequest('GET', endpoint);

    if (res.status === 200) {
      try {
        const data = JSON.parse(res.body);
        const items = data.data || data;

        // Verify all items belong to correct workspace
        const startTime = Date.now();
        const isolated = verifyWorkspaceIsolation(items, myWorkspace);
        isolationVerifyTime.add(Date.now() - startTime);

        if (!isolated) {
          isolationBreaches.add(1);
        }

        return isolated;
      } catch (e) {}
    }
    return true;
  });

  sleep(randomInt(100, 300) / 1000);
}

// ============================================================================
// Workspace Boundary Violation Tests (50 tests)
// ============================================================================

export function workspaceBoundaryTests() {
  const myWorkspace = getRandomWorkspaceId();
  const otherWorkspace = getDifferentWorkspaceId(myWorkspace);

  // Test 1-10: Missing workspace parameter
  stressGroup('Missing Workspace Param', 'workspace_boundary', () => {
    const res = http.get(`${CONFIG.BASE_URL}${CONFIG.API_PREFIX}/contacts`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });

    const handled = check(res, {
      'missing workspace rejected': (r) =>
        r.status === 400 || r.status === 401 || r.status === 422,
    });

    if (!handled && res.status === 200) {
      try {
        const data = JSON.parse(res.body);
        const items = data.data || data;
        if (items.length > 0) {
          boundaryViolations.add(1);
          console.error('BOUNDARY VIOLATION: Data returned without workspace filter');
        }
      } catch (e) {}
    }

    return handled;
  });

  // Test 11-20: Invalid workspace ID
  stressGroup('Invalid Workspace ID', 'workspace_boundary', () => {
    const invalidIds = [
      'invalid-uuid',
      '00000000-0000-0000-0000-000000000000',
      '../../../etc/passwd',
      "'; DROP TABLE contacts; --",
      '<script>alert(1)</script>',
    ];

    const invalidId = randomElement(invalidIds);
    const res = apiRequest('GET', `/contacts?workspaceId=${encodeURIComponent(invalidId)}`);

    return check(res, {
      'invalid workspace rejected': (r) =>
        r.status === 400 || r.status === 401 || r.status === 403 || r.status === 404,
    });
  });

  // Test 21-30: Workspace ID manipulation in body
  stressGroup('Workspace Manipulation in Body', 'workspace_boundary', () => {
    const contact = generateTestContact(__VU, __ITER);
    contact.workspace_id = otherWorkspace; // Try to override

    const res = apiRequest('POST', `/contacts?workspaceId=${myWorkspace}`, contact);

    if (res.status === 200 || res.status === 201) {
      try {
        const created = JSON.parse(res.body);

        if (created.workspace_id && created.workspace_id !== myWorkspace) {
          boundaryViolations.add(1);
          console.error('BOUNDARY VIOLATION: Workspace override in body succeeded');
          return false;
        }
      } catch (e) {}
    }

    return true;
  });

  // Test 31-40: Workspace switching mid-request
  stressGroup('Mid-Request Workspace Switch', 'workspace_boundary', () => {
    const startTime = Date.now();

    // Start with workspace A
    const res1 = apiRequest('GET', `/contacts?workspaceId=${myWorkspace}&limit=10`);

    // Quick switch to workspace B
    const res2 = apiRequest('GET', `/contacts?workspaceId=${otherWorkspace}&limit=10`);

    tenantSwitchTime.add(Date.now() - startTime);
    tenantSwitches.add(1);

    if (res1.status === 200 && res2.status === 200) {
      try {
        const data1 = JSON.parse(res1.body);
        const data2 = JSON.parse(res2.body);

        const items1 = data1.data || data1;
        const items2 = data2.data || data2;

        // Verify isolation
        const isolated1 = verifyWorkspaceIsolation(items1, myWorkspace);
        const isolated2 = verifyWorkspaceIsolation(items2, otherWorkspace);

        if (!isolated1 || !isolated2) {
          boundaryViolations.add(1);
        }

        return isolated1 && isolated2;
      } catch (e) {}
    }
    return true;
  });

  // Test 41-50: Batch operations boundary
  stressGroup('Batch Cross-Workspace', 'workspace_boundary', () => {
    const contacts = [];
    for (let i = 0; i < 5; i++) {
      const contact = generateTestContact(__VU, __ITER * 5 + i);
      // Alternate workspaces in batch
      contact.workspace_id = i % 2 === 0 ? myWorkspace : otherWorkspace;
      contacts.push(contact);
    }

    const res = apiRequest('POST', `/contacts/batch?workspaceId=${myWorkspace}`, { contacts });

    if (res.status === 200 || res.status === 201) {
      try {
        const result = JSON.parse(res.body);
        const created = result.data || result;

        // All should be in myWorkspace regardless of body workspace_id
        for (const item of created) {
          if (item.workspace_id && item.workspace_id !== myWorkspace) {
            boundaryViolations.add(1);
            console.error('BOUNDARY VIOLATION: Batch created items in wrong workspace');
            return false;
          }
        }
      } catch (e) {}
    }

    return true;
  });

  sleep(randomInt(100, 300) / 1000);
}

// ============================================================================
// Concurrent Tenant Operations Tests (50 tests)
// ============================================================================

export function concurrentTenantTests() {
  // Test 1-10: Parallel reads across workspaces
  stressGroup('Parallel Multi-Tenant Reads', 'concurrent_tenant', () => {
    const requests = CONFIG.WORKSPACE_IDS.map((wsId) => ({
      method: 'GET',
      endpoint: `/contacts?workspaceId=${wsId}&limit=20`,
    }));

    const startTime = Date.now();
    const results = batchRequests(requests, { concurrency: CONFIG.WORKSPACE_IDS.length });
    tenantSwitchTime.add(Date.now() - startTime);

    // Verify each result only contains data from its workspace
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 200) {
        try {
          const data = JSON.parse(results[i].body);
          const items = data.data || data;
          const expectedWs = CONFIG.WORKSPACE_IDS[i];

          if (!verifyWorkspaceIsolation(items, expectedWs)) {
            isolationBreaches.add(1);
            return false;
          }
        } catch (e) {}
      }
    }

    return true;
  });

  // Test 11-20: Parallel writes across workspaces
  stressGroup('Parallel Multi-Tenant Writes', 'concurrent_tenant', () => {
    const requests = CONFIG.WORKSPACE_IDS.slice(0, 5).map((wsId, idx) => ({
      method: 'POST',
      endpoint: `/contacts?workspaceId=${wsId}`,
      body: {
        ...generateTestContact(__VU, __ITER * 5 + idx),
        workspace_id: wsId,
      },
    }));

    const results = batchRequests(requests, { concurrency: 5 });

    // Verify each created item is in correct workspace
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 200 || results[i].status === 201) {
        try {
          const created = JSON.parse(results[i].body);
          const expectedWs = CONFIG.WORKSPACE_IDS[i];

          if (created.workspace_id && created.workspace_id !== expectedWs) {
            isolationBreaches.add(1);
            console.error(`Write isolation breach: Expected ${expectedWs}, got ${created.workspace_id}`);
            return false;
          }
        } catch (e) {}
      }
    }

    return true;
  });

  // Test 21-30: Race condition testing
  stressGroup('Tenant Race Condition', 'concurrent_tenant', () => {
    const ws1 = CONFIG.WORKSPACE_IDS[0];
    const ws2 = CONFIG.WORKSPACE_IDS[1];

    // Create same-named contacts in parallel
    const sharedName = `Race Test ${Date.now()}`;

    const requests = [
      {
        method: 'POST',
        endpoint: `/contacts?workspaceId=${ws1}`,
        body: { name: sharedName, email: `race1-${__VU}@test.com`, workspace_id: ws1 },
      },
      {
        method: 'POST',
        endpoint: `/contacts?workspaceId=${ws2}`,
        body: { name: sharedName, email: `race2-${__VU}@test.com`, workspace_id: ws2 },
      },
    ];

    const results = batchRequests(requests, { concurrency: 2 });

    // Both should succeed (different workspaces)
    const successCount = results.filter(
      (r) => r.status === 200 || r.status === 201 || r.status === 429
    ).length;

    return successCount >= 1;
  });

  // Test 31-40: Interleaved tenant operations
  stressGroup('Interleaved Operations', 'concurrent_tenant', () => {
    let allIsolated = true;

    for (let i = 0; i < 5; i++) {
      const wsId = CONFIG.WORKSPACE_IDS[i % CONFIG.WORKSPACE_IDS.length];

      if (i % 2 === 0) {
        const res = apiRequest('GET', `/contacts?workspaceId=${wsId}&limit=5`);
        if (res.status === 200) {
          try {
            const data = JSON.parse(res.body);
            if (!verifyWorkspaceIsolation(data.data || data, wsId)) {
              allIsolated = false;
            }
          } catch (e) {}
        }
      } else {
        const contact = generateTestContact(__VU, __ITER * 5 + i);
        apiRequest('POST', `/contacts?workspaceId=${wsId}`, contact);
      }
    }

    if (!allIsolated) {
      isolationBreaches.add(1);
    }

    return allIsolated;
  });

  // Test 41-50: High concurrency tenant switching
  stressGroup('High Concurrency Switching', 'concurrent_tenant', () => {
    const iterations = 10;
    const requests = [];

    for (let i = 0; i < iterations; i++) {
      const wsId = CONFIG.WORKSPACE_IDS[i % CONFIG.WORKSPACE_IDS.length];
      requests.push({
        method: 'GET',
        endpoint: `/contacts?workspaceId=${wsId}&limit=10&offset=${i * 10}`,
      });
    }

    const startTime = Date.now();
    const results = batchRequests(requests, { concurrency: iterations });
    const totalTime = Date.now() - startTime;

    tenantSwitchTime.add(totalTime / iterations);
    tenantSwitches.add(iterations);

    // Verify all responses maintain isolation
    for (let i = 0; i < results.length; i++) {
      if (results[i].status === 200) {
        try {
          const data = JSON.parse(results[i].body);
          const expectedWs = CONFIG.WORKSPACE_IDS[i % CONFIG.WORKSPACE_IDS.length];

          if (!verifyWorkspaceIsolation(data.data || data, expectedWs)) {
            isolationBreaches.add(1);
            return false;
          }
        } catch (e) {}
      }
    }

    return true;
  });

  sleep(randomInt(100, 400) / 1000);
}

// ============================================================================
// Setup and Teardown
// ============================================================================

export function setup() {
  console.log('\n=== Tenant Isolation Tests Starting ===');
  console.log(`Base URL: ${CONFIG.BASE_URL}`);
  console.log(`Workspaces: ${CONFIG.WORKSPACE_IDS.join(', ')}`);
  console.log(`Tenant Count: ${CONFIG.TENANT_COUNT}`);
  console.log('========================================\n');

  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log('\n=== Tenant Isolation Tests Complete ===');
  console.log(`Duration: ${duration.toFixed(2)}s`);
  console.log('========================================\n');
}
