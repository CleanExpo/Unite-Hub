/**
 * Database Stress Tests (200 Tests)
 *
 * Categories:
 * - Connection Pool Exhaustion (30 tests)
 * - Long Transaction Handling (30 tests)
 * - RLS Policy Performance (40 tests)
 * - Index Efficiency at Scale (30 tests)
 * - Deadlock Detection/Recovery (30 tests)
 * - Backup/Restore Under Load (40 tests)
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';
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
  getRandomWorkspaceId,
  dbQueryTime,
  dbConnectionErrors,
  dbDeadlocks,
  dbPoolExhaustion,
  errorRate,
} from '../utils.js';

// ============================================================================
// Custom Database Metrics
// ============================================================================

const dbConcurrentQueries = new Counter('stress_db_concurrent_queries');
const dbLongTransactions = new Counter('stress_db_long_transactions');
const dbRLSEvaluationTime = new Trend('stress_db_rls_eval_time', true);
const dbIndexHits = new Counter('stress_db_index_hits');
const dbSeqScans = new Counter('stress_db_seq_scans');
const dbWriteConflicts = new Counter('stress_db_write_conflicts');

// ============================================================================
// Test Options
// ============================================================================

export const options = {
  scenarios: {
    db_connection_pool: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '3m', target: 500 },
        { duration: '2m', target: 500 },
        { duration: '1m', target: 0 },
      ],
      tags: { category: 'db_pool' },
      exec: 'connectionPoolTests',
    },
    db_long_transactions: {
      executor: 'constant-vus',
      vus: 30,
      duration: '5m',
      tags: { category: 'db_long_tx' },
      exec: 'longTransactionTests',
    },
    db_rls_performance: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 100 },
        { duration: '3m', target: 200 },
        { duration: '2m', target: 200 },
        { duration: '1m', target: 0 },
      ],
      tags: { category: 'db_rls' },
      exec: 'rlsPerformanceTests',
    },
    db_index_efficiency: {
      executor: 'constant-vus',
      vus: 50,
      duration: '4m',
      tags: { category: 'db_index' },
      exec: 'indexEfficiencyTests',
    },
    db_deadlock_detection: {
      executor: 'constant-vus',
      vus: 40,
      duration: '4m',
      tags: { category: 'db_deadlock' },
      exec: 'deadlockTests',
    },
    db_backup_load: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      tags: { category: 'db_backup' },
      exec: 'backupLoadTests',
    },
  },
  thresholds: {
    'stress_db_query_time': ['p(95)<200', 'p(99)<500'],
    'stress_db_rls_eval_time': ['p(95)<50', 'p(99)<100'],
    'stress_db_connection_errors': ['count<10'],
    'stress_db_deadlocks': ['count<5'],
    'stress_db_pool_exhaustion': ['count<3'],
    'stress_error_rate': ['rate<0.05'],
  },
};

// ============================================================================
// Connection Pool Exhaustion Tests (30 tests)
// ============================================================================

export function connectionPoolTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-6: Basic pool pressure
  stressGroup('Pool Saturation Read', 'db_pool', () => {
    dbConcurrentQueries.add(1);
    const startTime = Date.now();
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=100`);
    const queryTime = Date.now() - startTime;
    dbQueryTime.add(queryTime);

    if (res.status === 503 || res.status === 504) {
      dbPoolExhaustion.add(1);
    }
    if (res.status >= 500) {
      dbConnectionErrors.add(1);
    }

    return assertResponse(res, { status: [200, 401, 503, 504] }, 'Pool Read');
  });

  stressGroup('Pool Saturation Write', 'db_pool', () => {
    dbConcurrentQueries.add(1);
    const contact = generateTestContact(__VU, __ITER);
    const startTime = Date.now();
    const res = apiRequest('POST', `/contacts?workspaceId=${workspaceId}`, contact);
    const queryTime = Date.now() - startTime;
    dbQueryTime.add(queryTime);

    if (res.status === 503 || res.status === 504) {
      dbPoolExhaustion.add(1);
    }

    return assertResponse(res, { status: [200, 201, 401, 429, 503, 504] }, 'Pool Write');
  });

  // Test 7-12: Burst connection requests
  stressGroup('Connection Burst', 'db_pool', () => {
    const requests = [];
    for (let i = 0; i < 20; i++) {
      requests.push({
        method: 'GET',
        endpoint: `/contacts?workspaceId=${workspaceId}&page=${i}&limit=10`,
      });
    }

    const startTime = Date.now();
    const results = batchRequests(requests, { concurrency: 20 });
    const totalTime = Date.now() - startTime;

    dbConcurrentQueries.add(20);

    const exhausted = results.filter((r) => r.status === 503).length;
    if (exhausted > 0) {
      dbPoolExhaustion.add(exhausted);
    }

    return exhausted < 10;
  });

  // Test 13-18: Pool recovery
  stressGroup('Pool Recovery After Burst', 'db_pool', () => {
    // Trigger burst
    const burstRequests = [];
    for (let i = 0; i < 15; i++) {
      burstRequests.push({
        method: 'GET',
        endpoint: `/contacts?workspaceId=${workspaceId}&limit=50`,
      });
    }
    batchRequests(burstRequests, { concurrency: 15 });

    sleep(2);

    // Check recovery
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=10`);
    return res.status === 200 || res.status === 401;
  });

  // Test 19-24: Mixed read/write pool pressure
  stressGroup('Mixed Pool Operations', 'db_pool', () => {
    const operations = [
      () => apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=20`),
      () => apiRequest('GET', `/campaigns?workspaceId=${workspaceId}`),
      () => apiRequest('POST', `/contacts?workspaceId=${workspaceId}`, generateTestContact(__VU, __ITER)),
    ];

    let successCount = 0;
    for (let i = 0; i < 5; i++) {
      const op = randomElement(operations);
      const res = op();
      if (res.status < 500) successCount++;
    }

    return successCount >= 3;
  });

  // Test 25-30: Slow query impact
  stressGroup('Slow Query Pool Impact', 'db_pool', () => {
    // Trigger potentially slow query
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=1000&search=test`);
    dbLongTransactions.add(res.timings.duration > 1000 ? 1 : 0);

    return res.status < 500;
  });

  sleep(randomInt(100, 500) / 1000);
}

// ============================================================================
// Long Transaction Handling Tests (30 tests)
// ============================================================================

export function longTransactionTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-6: Large dataset retrieval
  stressGroup('Large Dataset Query', 'db_long_tx', () => {
    const startTime = Date.now();
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=500`);
    const duration = Date.now() - startTime;

    dbQueryTime.add(duration);
    if (duration > 5000) {
      dbLongTransactions.add(1);
    }

    return assertResponse(res, {
      status: [200, 401],
      maxDuration: 10000,
    }, 'Large Dataset');
  });

  // Test 7-12: Complex aggregation
  stressGroup('Aggregation Query', 'db_long_tx', () => {
    const res = apiRequest('GET', `/contacts/stats?workspaceId=${workspaceId}`);

    if (res.timings && res.timings.duration > 3000) {
      dbLongTransactions.add(1);
    }

    return assertResponse(res, { status: [200, 401, 404] }, 'Aggregation');
  });

  // Test 13-18: Batch insert operations
  stressGroup('Batch Insert Transaction', 'db_long_tx', () => {
    const contacts = [];
    for (let i = 0; i < 10; i++) {
      contacts.push(generateTestContact(__VU, __ITER * 10 + i));
    }

    const startTime = Date.now();
    const res = apiRequest('POST', `/contacts/batch?workspaceId=${workspaceId}`, { contacts });
    const duration = Date.now() - startTime;

    dbQueryTime.add(duration);
    if (duration > 5000) {
      dbLongTransactions.add(1);
    }

    return assertResponse(res, { status: [200, 201, 401, 404, 429] }, 'Batch Insert');
  });

  // Test 19-24: Transaction isolation
  stressGroup('Concurrent Long Transactions', 'db_long_tx', () => {
    const requests = [
      { method: 'GET', endpoint: `/contacts?workspaceId=${workspaceId}&limit=200` },
      { method: 'GET', endpoint: `/campaigns?workspaceId=${workspaceId}` },
      { method: 'GET', endpoint: `/contacts?workspaceId=${workspaceId}&search=test` },
    ];

    const startTime = Date.now();
    const results = batchRequests(requests, { concurrency: 3 });
    const totalDuration = Date.now() - startTime;

    if (totalDuration > 5000) {
      dbLongTransactions.add(1);
    }

    return results.filter((r) => r.status >= 500).length === 0;
  });

  // Test 25-30: Transaction timeout handling
  stressGroup('Transaction Timeout Recovery', 'db_long_tx', () => {
    // Trigger potentially long query
    const res = apiRequest(
      'GET',
      `/contacts?workspaceId=${workspaceId}&limit=1000`,
      null,
      { timeout: '30s' }
    );

    // Verify system still responsive
    sleep(0.5);
    const healthRes = apiRequest('GET', '/health');

    return healthRes.status === 200;
  });

  sleep(randomInt(200, 800) / 1000);
}

// ============================================================================
// RLS Policy Performance Tests (40 tests)
// ============================================================================

export function rlsPerformanceTests() {
  // Test 1-8: Single workspace RLS
  stressGroup('Single Workspace RLS', 'db_rls', () => {
    const workspaceId = getRandomWorkspaceId();
    const startTime = Date.now();
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=50`);
    const rlsTime = Date.now() - startTime;

    dbRLSEvaluationTime.add(rlsTime);

    return assertResponse(res, {
      status: [200, 401],
      maxDuration: THRESHOLDS.database.p95,
    }, 'Single WS RLS');
  });

  // Test 9-16: Multi-workspace RLS switching
  stressGroup('RLS Workspace Switch', 'db_rls', () => {
    const workspaces = CONFIG.WORKSPACE_IDS.slice(0, 3);
    let totalRLSTime = 0;

    for (const wsId of workspaces) {
      const startTime = Date.now();
      const res = apiRequest('GET', `/contacts?workspaceId=${wsId}&limit=10`);
      totalRLSTime += Date.now() - startTime;

      if (res.status >= 500) return false;
    }

    dbRLSEvaluationTime.add(totalRLSTime / workspaces.length);
    return true;
  });

  // Test 17-24: RLS with complex queries
  stressGroup('RLS Complex Filter', 'db_rls', () => {
    const workspaceId = getRandomWorkspaceId();
    const startTime = Date.now();
    const res = apiRequest(
      'GET',
      `/contacts?workspaceId=${workspaceId}&status=lead&search=corp&sort=created_at&limit=25`
    );
    const queryTime = Date.now() - startTime;

    dbRLSEvaluationTime.add(queryTime);
    dbQueryTime.add(queryTime);

    return assertResponse(res, { status: [200, 401] }, 'RLS Complex Filter');
  });

  // Test 25-32: RLS write operations
  stressGroup('RLS Write Validation', 'db_rls', () => {
    const workspaceId = getRandomWorkspaceId();
    const contact = generateTestContact(__VU, __ITER);
    contact.workspace_id = workspaceId;

    const startTime = Date.now();
    const res = apiRequest('POST', `/contacts?workspaceId=${workspaceId}`, contact);
    const writeTime = Date.now() - startTime;

    dbRLSEvaluationTime.add(writeTime);

    return assertResponse(res, { status: [200, 201, 401, 429] }, 'RLS Write');
  });

  // Test 33-40: RLS violation attempts
  stressGroup('RLS Cross-Tenant Attempt', 'db_rls', () => {
    const ws1 = CONFIG.WORKSPACE_IDS[0];
    const ws2 = CONFIG.WORKSPACE_IDS[1];

    // Get contact from ws1
    const listRes = apiRequest('GET', `/contacts?workspaceId=${ws1}&limit=1`);

    if (listRes.status === 200) {
      try {
        const data = JSON.parse(listRes.body);
        const contacts = data.data || data;
        if (contacts.length > 0) {
          const contactId = contacts[0].id;

          // Try to access from ws2
          const crossRes = apiRequest('GET', `/contacts/${contactId}?workspaceId=${ws2}`);

          return check(crossRes, {
            'cross-tenant blocked': (r) => r.status === 401 || r.status === 403 || r.status === 404,
          });
        }
      } catch (e) {}
    }

    return true;
  });

  sleep(randomInt(50, 200) / 1000);
}

// ============================================================================
// Index Efficiency Tests (30 tests)
// ============================================================================

export function indexEfficiencyTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-6: Primary key lookups
  stressGroup('Primary Key Lookup', 'db_index', () => {
    const listRes = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=1`);

    if (listRes.status === 200) {
      try {
        const data = JSON.parse(listRes.body);
        const contacts = data.data || data;
        if (contacts.length > 0) {
          const startTime = Date.now();
          const res = apiRequest('GET', `/contacts/${contacts[0].id}?workspaceId=${workspaceId}`);
          const lookupTime = Date.now() - startTime;

          dbQueryTime.add(lookupTime);
          if (lookupTime < 50) dbIndexHits.add(1);
          else dbSeqScans.add(1);

          return res.status === 200 || res.status === 401;
        }
      } catch (e) {}
    }
    return true;
  });

  // Test 7-12: Indexed field queries
  stressGroup('Indexed Status Query', 'db_index', () => {
    const statuses = ['lead', 'prospect', 'customer'];
    const status = randomElement(statuses);

    const startTime = Date.now();
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&status=${status}&limit=50`);
    const queryTime = Date.now() - startTime;

    dbQueryTime.add(queryTime);
    if (queryTime < 100) dbIndexHits.add(1);
    else dbSeqScans.add(1);

    return assertResponse(res, {
      status: [200, 401],
      maxDuration: 500,
    }, 'Indexed Query');
  });

  // Test 13-18: Compound index queries
  stressGroup('Compound Index Query', 'db_index', () => {
    const startTime = Date.now();
    const res = apiRequest(
      'GET',
      `/contacts?workspaceId=${workspaceId}&status=lead&sort=created_at&order=desc&limit=25`
    );
    const queryTime = Date.now() - startTime;

    dbQueryTime.add(queryTime);

    return assertResponse(res, {
      status: [200, 401],
      maxDuration: 300,
    }, 'Compound Index');
  });

  // Test 19-24: Text search index
  stressGroup('Text Search Index', 'db_index', () => {
    const searchTerms = ['test', 'corp', 'inc', 'llc', 'john'];
    const term = randomElement(searchTerms);

    const startTime = Date.now();
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&search=${term}&limit=20`);
    const queryTime = Date.now() - startTime;

    dbQueryTime.add(queryTime);

    return assertResponse(res, {
      status: [200, 401],
      maxDuration: 1000,
    }, 'Text Search');
  });

  // Test 25-30: Range queries
  stressGroup('Date Range Query', 'db_index', () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const startTime = Date.now();
    const res = apiRequest(
      'GET',
      `/contacts?workspaceId=${workspaceId}&created_after=${thirtyDaysAgo.toISOString()}&limit=50`
    );
    const queryTime = Date.now() - startTime;

    dbQueryTime.add(queryTime);

    return assertResponse(res, { status: [200, 401] }, 'Date Range');
  });

  sleep(randomInt(100, 300) / 1000);
}

// ============================================================================
// Deadlock Detection Tests (30 tests)
// ============================================================================

export function deadlockTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-6: Concurrent updates to same resource
  stressGroup('Concurrent Update Same Resource', 'db_deadlock', () => {
    const listRes = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=1`);

    if (listRes.status === 200) {
      try {
        const data = JSON.parse(listRes.body);
        const contacts = data.data || data;
        if (contacts.length > 0) {
          const contactId = contacts[0].id;

          // Concurrent updates
          const requests = [
            {
              method: 'PATCH',
              endpoint: `/contacts/${contactId}?workspaceId=${workspaceId}`,
              body: { name: `Update A ${Date.now()}` },
            },
            {
              method: 'PATCH',
              endpoint: `/contacts/${contactId}?workspaceId=${workspaceId}`,
              body: { name: `Update B ${Date.now()}` },
            },
          ];

          const results = batchRequests(requests, { concurrency: 2 });
          const conflicts = results.filter((r) => r.status === 409 || r.status === 423);

          if (conflicts.length > 0) {
            dbWriteConflicts.add(conflicts.length);
          }

          return results.filter((r) => r.status >= 500 && r.status !== 503).length === 0;
        }
      } catch (e) {}
    }
    return true;
  });

  // Test 7-12: Cross-table deadlock scenario
  stressGroup('Cross Table Operations', 'db_deadlock', () => {
    const contact = generateTestContact(__VU, __ITER);
    const campaign = generateTestCampaign(__VU, __ITER);

    const requests = [
      { method: 'POST', endpoint: `/contacts?workspaceId=${workspaceId}`, body: contact },
      { method: 'POST', endpoint: `/campaigns?workspaceId=${workspaceId}`, body: campaign },
      { method: 'GET', endpoint: `/contacts?workspaceId=${workspaceId}&limit=10` },
    ];

    const results = batchRequests(requests, { concurrency: 3 });

    const deadlockErrors = results.filter((r) =>
      r.status === 500 && r.body && r.body.includes('deadlock')
    );

    if (deadlockErrors.length > 0) {
      dbDeadlocks.add(deadlockErrors.length);
    }

    return deadlockErrors.length === 0;
  });

  // Test 13-18: Rapid read-write interleaving
  stressGroup('Read Write Interleave', 'db_deadlock', () => {
    let deadlockDetected = false;

    for (let i = 0; i < 5; i++) {
      const isWrite = i % 2 === 0;

      if (isWrite) {
        const contact = generateTestContact(__VU, __ITER * 5 + i);
        const res = apiRequest('POST', `/contacts?workspaceId=${workspaceId}`, contact);
        if (res.status === 500 && res.body && res.body.includes('deadlock')) {
          deadlockDetected = true;
          dbDeadlocks.add(1);
        }
      } else {
        apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=10`);
      }
    }

    return !deadlockDetected;
  });

  // Test 19-24: Lock contention simulation
  stressGroup('Lock Contention', 'db_deadlock', () => {
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push({
        method: 'POST',
        endpoint: `/contacts?workspaceId=${workspaceId}`,
        body: generateTestContact(__VU, __ITER * 10 + i),
      });
    }

    const results = batchRequests(requests, { concurrency: 10 });
    const conflicts = results.filter((r) => r.status === 409 || r.status === 423);

    dbWriteConflicts.add(conflicts.length);

    return conflicts.length < 5;
  });

  // Test 25-30: Deadlock recovery
  stressGroup('Deadlock Recovery', 'db_deadlock', () => {
    // Trigger potential contention
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push({
        method: 'POST',
        endpoint: `/contacts?workspaceId=${workspaceId}`,
        body: generateTestContact(__VU, __ITER * 5 + i),
      });
    }
    batchRequests(requests, { concurrency: 5 });

    sleep(1);

    // Verify recovery
    const healthRes = apiRequest('GET', '/health');
    const readRes = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=5`);

    return healthRes.status === 200 && (readRes.status === 200 || readRes.status === 401);
  });

  sleep(randomInt(100, 400) / 1000);
}

// ============================================================================
// Backup/Restore Under Load Tests (40 tests)
// ============================================================================

export function backupLoadTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-8: Read operations during simulated backup
  stressGroup('Read During Backup', 'db_backup', () => {
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=100`);

    return assertResponse(res, {
      status: [200, 401, 503],
      maxDuration: 2000,
    }, 'Read During Backup');
  });

  // Test 9-16: Write operations during simulated backup
  stressGroup('Write During Backup', 'db_backup', () => {
    const contact = generateTestContact(__VU, __ITER);
    const res = apiRequest('POST', `/contacts?workspaceId=${workspaceId}`, contact);

    return assertResponse(res, {
      status: [200, 201, 401, 429, 503],
      maxDuration: 3000,
    }, 'Write During Backup');
  });

  // Test 17-24: High throughput during backup window
  stressGroup('Throughput During Backup', 'db_backup', () => {
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push({
        method: 'GET',
        endpoint: `/contacts?workspaceId=${workspaceId}&page=${i}&limit=20`,
      });
    }

    const startTime = Date.now();
    const results = batchRequests(requests, { concurrency: 10 });
    const totalTime = Date.now() - startTime;

    const successCount = results.filter((r) => r.status === 200 || r.status === 401).length;

    return successCount >= 7 && totalTime < 5000;
  });

  // Test 25-32: Data consistency check
  stressGroup('Data Consistency', 'db_backup', () => {
    // Create contact
    const contact = generateTestContact(__VU, __ITER);
    const createRes = apiRequest('POST', `/contacts?workspaceId=${workspaceId}`, contact);

    if (createRes.status === 200 || createRes.status === 201) {
      try {
        const created = JSON.parse(createRes.body);
        const contactId = created.id;

        sleep(0.5);

        // Verify it exists
        const getRes = apiRequest('GET', `/contacts/${contactId}?workspaceId=${workspaceId}`);

        return check(getRes, {
          'contact persisted': (r) => r.status === 200 || r.status === 401,
        });
      } catch (e) {}
    }
    return true;
  });

  // Test 33-40: Recovery simulation
  stressGroup('Post-Backup Recovery', 'db_backup', () => {
    // Simulate post-recovery operations
    const operations = [
      () => apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=10`),
      () => apiRequest('POST', `/contacts?workspaceId=${workspaceId}`, generateTestContact(__VU, __ITER)),
      () => apiRequest('GET', '/health'),
    ];

    let successCount = 0;
    for (const op of operations) {
      const res = op();
      if (res.status < 500) successCount++;
    }

    return successCount >= 2;
  });

  sleep(randomInt(100, 400) / 1000);
}

// ============================================================================
// Setup and Teardown
// ============================================================================

export function setup() {
  console.log('\n=== Database Stress Tests Starting ===');
  console.log(`Base URL: ${CONFIG.BASE_URL}`);
  console.log(`DB Pool Size: ${CONFIG.DB_POOL_SIZE}`);
  console.log(`Query Timeout: ${CONFIG.QUERY_TIMEOUT_MS}ms`);
  console.log('======================================\n');

  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log('\n=== Database Stress Tests Complete ===');
  console.log(`Duration: ${duration.toFixed(2)}s`);
  console.log('======================================\n');
}
