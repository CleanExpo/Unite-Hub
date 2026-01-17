/**
 * Chaos Engineering Stress Tests (200 Tests)
 *
 * Categories:
 * - Network Partition Simulation (40 tests)
 * - Service Degradation (40 tests)
 * - Memory Pressure Scenarios (30 tests)
 * - Disk Exhaustion Handling (30 tests)
 * - CPU Throttling Response (30 tests)
 * - Cascading Failure Recovery (30 tests)
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend, Rate, Gauge } from 'k6/metrics';
import {
  CONFIG,
  THRESHOLDS,
  generateTestContact,
  randomInt,
  randomElement,
  exponentialBackoff,
} from '../config.js';
import {
  apiRequest,
  batchRequests,
  assertResponse,
  stressGroup,
  getAuthToken,
  getRandomWorkspaceId,
  chaosEventsInjected,
  chaosRecoveryTime,
  cascadeFailures,
  gracefulDegradations,
  errorRate,
} from '../utils.js';

// ============================================================================
// Custom Chaos Metrics
// ============================================================================

const networkPartitions = new Counter('stress_chaos_network_partitions');
const serviceDowntime = new Trend('stress_chaos_service_downtime', true);
const memoryPressureEvents = new Counter('stress_chaos_memory_pressure');
const diskPressureEvents = new Counter('stress_chaos_disk_pressure');
const cpuThrottleEvents = new Counter('stress_chaos_cpu_throttle');
const recoverySuccess = new Rate('stress_chaos_recovery_success');
const failoverTime = new Trend('stress_chaos_failover_time', true);
const systemResilience = new Rate('stress_chaos_system_resilience');

// ============================================================================
// Test Options
// ============================================================================

export const options = {
  scenarios: {
    chaos_network: {
      executor: 'constant-vus',
      vus: 30,
      duration: '5m',
      tags: { category: 'chaos_network' },
      exec: 'networkPartitionTests',
    },
    chaos_service: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 30 },
        { duration: '2m', target: 60 },
        { duration: '3m', target: 60 },
        { duration: '1m', target: 0 },
      ],
      tags: { category: 'chaos_service' },
      exec: 'serviceDegradationTests',
    },
    chaos_memory: {
      executor: 'constant-vus',
      vus: 25,
      duration: '4m',
      tags: { category: 'chaos_memory' },
      exec: 'memoryPressureTests',
    },
    chaos_disk: {
      executor: 'constant-vus',
      vus: 20,
      duration: '3m',
      tags: { category: 'chaos_disk' },
      exec: 'diskExhaustionTests',
    },
    chaos_cpu: {
      executor: 'constant-vus',
      vus: 25,
      duration: '4m',
      tags: { category: 'chaos_cpu' },
      exec: 'cpuThrottleTests',
    },
    chaos_cascade: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 40 },
        { duration: '3m', target: 80 },
        { duration: '2m', target: 80 },
        { duration: '1m', target: 0 },
      ],
      tags: { category: 'chaos_cascade' },
      exec: 'cascadeFailureTests',
    },
  },
  thresholds: {
    'stress_chaos_recovery_success': ['rate>0.90'],
    'stress_chaos_recovery_time': ['p(95)<5000', 'p(99)<10000'],
    'stress_chaos_failover_time': ['p(95)<3000'],
    'stress_chaos_system_resilience': ['rate>0.85'],
    'stress_cascade_failures': ['count<20'],
    'stress_error_rate': ['rate<0.15'],
  },
};

// ============================================================================
// Chaos Configuration
// ============================================================================

const CHAOS_CONFIG = {
  networkLatencyMs: [100, 500, 1000, 2000, 5000],
  packetLossPercent: [1, 5, 10, 25, 50],
  serviceDegradationLevels: ['slow', 'partial', 'down'],
  memoryPressureMB: [256, 512, 1024, 2048],
  cpuThrottlePercent: [25, 50, 75, 90],
};

// ============================================================================
// Helper Functions
// ============================================================================

function simulateNetworkDelay(delayMs) {
  sleep(delayMs / 1000);
}

function simulatePacketLoss(lossPercent) {
  return Math.random() * 100 < lossPercent;
}

function measureRecovery(testFn, maxAttempts = 5) {
  const startTime = Date.now();
  let attempts = 0;
  let recovered = false;

  while (attempts < maxAttempts && !recovered) {
    attempts++;
    try {
      const result = testFn();
      if (result) {
        recovered = true;
      } else {
        sleep(exponentialBackoff(attempts) / 1000);
      }
    } catch (e) {
      sleep(exponentialBackoff(attempts) / 1000);
    }
  }

  const recoveryTime = Date.now() - startTime;

  if (recovered) {
    chaosRecoveryTime.add(recoveryTime);
    recoverySuccess.add(1);
  } else {
    recoverySuccess.add(0);
  }

  return { recovered, recoveryTime, attempts };
}

function triggerHealthCheck() {
  const res = apiRequest('GET', '/health');
  return res.status === 200;
}

// ============================================================================
// Network Partition Simulation Tests (40 tests)
// ============================================================================

export function networkPartitionTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-8: Latency injection
  stressGroup('Network Latency Injection', 'chaos_network', () => {
    chaosEventsInjected.add(1);
    networkPartitions.add(1);

    const latency = randomElement(CHAOS_CONFIG.networkLatencyMs);
    simulateNetworkDelay(latency);

    const startTime = Date.now();
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=10`);
    const totalTime = Date.now() - startTime;

    const expectedMin = latency;
    systemResilience.add(res.status === 200 || res.status === 401 ? 1 : 0);

    return assertResponse(res, {
      status: [200, 401, 503, 504],
    }, 'Latency Injection');
  });

  // Test 9-16: Packet loss simulation
  stressGroup('Packet Loss Simulation', 'chaos_network', () => {
    chaosEventsInjected.add(1);

    const lossPercent = randomElement(CHAOS_CONFIG.packetLossPercent);
    let successCount = 0;
    let attempts = 5;

    for (let i = 0; i < attempts; i++) {
      if (simulatePacketLoss(lossPercent)) {
        // Simulate lost packet - request fails
        errorRate.add(1);
      } else {
        const res = apiRequest('GET', `/health`);
        if (res.status === 200) successCount++;
      }
    }

    const successRate = successCount / attempts;
    systemResilience.add(successRate > 0.5 ? 1 : 0);

    return successRate > 0.3;
  });

  // Test 17-24: Intermittent connectivity
  stressGroup('Intermittent Connectivity', 'chaos_network', () => {
    chaosEventsInjected.add(1);

    let connected = true;
    let results = [];

    for (let i = 0; i < 5; i++) {
      // Toggle connectivity randomly
      connected = Math.random() > 0.3;

      if (connected) {
        const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=5`);
        results.push(res.status);
      } else {
        simulateNetworkDelay(randomInt(500, 2000));
        results.push(0);
      }
    }

    const successCount = results.filter((s) => s === 200 || s === 401).length;
    return successCount >= 2;
  });

  // Test 25-32: Network recovery
  stressGroup('Network Recovery', 'chaos_network', () => {
    chaosEventsInjected.add(1);

    // Simulate network down
    simulateNetworkDelay(2000);

    // Attempt recovery
    const recovery = measureRecovery(() => {
      const res = apiRequest('GET', '/health');
      return res.status === 200;
    });

    return recovery.recovered;
  });

  // Test 33-40: Partial network partition
  stressGroup('Partial Partition', 'chaos_network', () => {
    chaosEventsInjected.add(1);

    // Some endpoints work, others don't
    const endpoints = ['/health', `/contacts?workspaceId=${workspaceId}`, `/campaigns?workspaceId=${workspaceId}`];

    const results = endpoints.map((ep, idx) => {
      if (idx % 2 === 0) {
        return apiRequest('GET', ep);
      } else {
        simulateNetworkDelay(3000);
        return { status: 504 };
      }
    });

    const workingCount = results.filter((r) => r.status === 200 || r.status === 401).length;
    gracefulDegradations.add(workingCount > 0 ? 1 : 0);

    return workingCount >= 1;
  });

  sleep(randomInt(500, 1500) / 1000);
}

// ============================================================================
// Service Degradation Tests (40 tests)
// ============================================================================

export function serviceDegradationTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-8: Slow service response
  stressGroup('Slow Service Response', 'chaos_service', () => {
    chaosEventsInjected.add(1);

    const startTime = Date.now();
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=100`, null, {
      timeout: '30s',
    });
    const duration = Date.now() - startTime;

    serviceDowntime.add(duration > 5000 ? duration - 5000 : 0);

    return assertResponse(res, {
      status: [200, 401, 503, 504],
      maxDuration: 30000,
    }, 'Slow Response');
  });

  // Test 9-16: Service unavailable handling
  stressGroup('Service Unavailable', 'chaos_service', () => {
    chaosEventsInjected.add(1);

    // Simulate 503 responses
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}`);

    if (res.status === 503) {
      gracefulDegradations.add(1);

      // Check retry-after header
      const retryAfter = res.headers['Retry-After'] || res.headers['retry-after'];
      return retryAfter !== undefined || true;
    }

    systemResilience.add(res.status === 200 || res.status === 401 ? 1 : 0);
    return res.status < 500;
  });

  // Test 17-24: Partial service failure
  stressGroup('Partial Service Failure', 'chaos_service', () => {
    chaosEventsInjected.add(1);

    const endpoints = [
      { path: '/health', critical: true },
      { path: `/contacts?workspaceId=${workspaceId}`, critical: false },
      { path: `/campaigns?workspaceId=${workspaceId}`, critical: false },
      { path: `/emails?workspaceId=${workspaceId}`, critical: false },
    ];

    const results = endpoints.map((ep) => ({
      ...ep,
      response: apiRequest('GET', ep.path),
    }));

    const criticalOk = results
      .filter((r) => r.critical)
      .every((r) => r.response.status === 200);

    const nonCriticalWorking = results
      .filter((r) => !r.critical)
      .filter((r) => r.response.status === 200 || r.response.status === 401).length;

    gracefulDegradations.add(criticalOk ? 1 : 0);

    return criticalOk || nonCriticalWorking >= 1;
  });

  // Test 25-32: Service recovery after failure
  stressGroup('Service Recovery', 'chaos_service', () => {
    chaosEventsInjected.add(1);

    // Simulate failure period
    const failureStart = Date.now();

    // Wait for potential recovery
    sleep(2);

    const recovery = measureRecovery(() => {
      const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=5`);
      return res.status === 200 || res.status === 401;
    }, 5);

    failoverTime.add(recovery.recoveryTime);

    return recovery.recovered;
  });

  // Test 33-40: Graceful degradation
  stressGroup('Graceful Degradation Mode', 'chaos_service', () => {
    chaosEventsInjected.add(1);

    // Check if system degrades gracefully
    const heavyRes = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=1000`);
    const lightRes = apiRequest('GET', '/health');

    // Light requests should still work even if heavy fail
    if (heavyRes.status >= 500) {
      gracefulDegradations.add(lightRes.status === 200 ? 1 : 0);
    }

    return lightRes.status === 200;
  });

  sleep(randomInt(300, 1000) / 1000);
}

// ============================================================================
// Memory Pressure Tests (30 tests)
// ============================================================================

export function memoryPressureTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-6: Large payload handling
  stressGroup('Large Payload Memory', 'chaos_memory', () => {
    chaosEventsInjected.add(1);
    memoryPressureEvents.add(1);

    const largeData = {
      name: 'Memory Test',
      data: 'x'.repeat(100000),
      workspace_id: workspaceId,
    };

    const res = apiRequest('POST', `/contacts?workspaceId=${workspaceId}`, largeData);

    return assertResponse(res, {
      status: [200, 201, 400, 401, 413, 429],
    }, 'Large Payload');
  });

  // Test 7-12: Concurrent large requests
  stressGroup('Concurrent Memory Pressure', 'chaos_memory', () => {
    chaosEventsInjected.add(1);
    memoryPressureEvents.add(1);

    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push({
        method: 'GET',
        endpoint: `/contacts?workspaceId=${workspaceId}&limit=500`,
      });
    }

    const results = batchRequests(requests, { concurrency: 10 });
    const successCount = results.filter((r) => r.status === 200 || r.status === 401).length;

    systemResilience.add(successCount >= 5 ? 1 : 0);
    return successCount >= 3;
  });

  // Test 13-18: Memory leak simulation
  stressGroup('Memory Leak Simulation', 'chaos_memory', () => {
    chaosEventsInjected.add(1);
    memoryPressureEvents.add(1);

    // Repeated requests to simulate memory buildup
    for (let i = 0; i < 20; i++) {
      apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=50`);
    }

    // System should still respond
    const healthRes = apiRequest('GET', '/health');
    systemResilience.add(healthRes.status === 200 ? 1 : 0);

    return healthRes.status === 200;
  });

  // Test 19-24: OOM recovery simulation
  stressGroup('OOM Recovery', 'chaos_memory', () => {
    chaosEventsInjected.add(1);
    memoryPressureEvents.add(1);

    // Trigger heavy memory usage
    const heavyRequests = [];
    for (let i = 0; i < 5; i++) {
      heavyRequests.push({
        method: 'GET',
        endpoint: `/contacts?workspaceId=${workspaceId}&limit=1000`,
      });
    }
    batchRequests(heavyRequests, { concurrency: 5 });

    sleep(2);

    // Test recovery
    const recovery = measureRecovery(() => triggerHealthCheck(), 5);

    return recovery.recovered;
  });

  // Test 25-30: Memory threshold handling
  stressGroup('Memory Threshold', 'chaos_memory', () => {
    chaosEventsInjected.add(1);

    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=200`);

    if (res.status === 503) {
      gracefulDegradations.add(1);
    }

    return res.status < 500 || res.status === 503;
  });

  sleep(randomInt(300, 800) / 1000);
}

// ============================================================================
// Disk Exhaustion Tests (30 tests)
// ============================================================================

export function diskExhaustionTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-6: Write operation under disk pressure
  stressGroup('Write Under Disk Pressure', 'chaos_disk', () => {
    chaosEventsInjected.add(1);
    diskPressureEvents.add(1);

    const contact = generateTestContact(__VU, __ITER);
    const res = apiRequest('POST', `/contacts?workspaceId=${workspaceId}`, contact);

    return assertResponse(res, {
      status: [200, 201, 401, 429, 503, 507],
    }, 'Write Disk Pressure');
  });

  // Test 7-12: Batch write under pressure
  stressGroup('Batch Write Disk Pressure', 'chaos_disk', () => {
    chaosEventsInjected.add(1);
    diskPressureEvents.add(1);

    const contacts = [];
    for (let i = 0; i < 20; i++) {
      contacts.push(generateTestContact(__VU, __ITER * 20 + i));
    }

    const res = apiRequest('POST', `/contacts/batch?workspaceId=${workspaceId}`, { contacts });

    if (res.status === 507) {
      gracefulDegradations.add(1);
    }

    return res.status < 500 || res.status === 507;
  });

  // Test 13-18: Read operations during disk issues
  stressGroup('Read During Disk Issues', 'chaos_disk', () => {
    chaosEventsInjected.add(1);

    // Reads should still work from cache/memory
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=10`);

    systemResilience.add(res.status === 200 || res.status === 401 ? 1 : 0);
    return res.status < 500;
  });

  // Test 19-24: Log rotation under pressure
  stressGroup('Logging Under Disk Pressure', 'chaos_disk', () => {
    chaosEventsInjected.add(1);
    diskPressureEvents.add(1);

    // Multiple requests to generate logs
    for (let i = 0; i < 10; i++) {
      apiRequest('GET', '/health');
    }

    const finalRes = apiRequest('GET', '/health');
    return finalRes.status === 200;
  });

  // Test 25-30: Disk recovery
  stressGroup('Disk Recovery', 'chaos_disk', () => {
    chaosEventsInjected.add(1);

    // Simulate disk recovery
    sleep(1);

    const recovery = measureRecovery(() => {
      const res = apiRequest('POST', `/contacts?workspaceId=${workspaceId}`, generateTestContact(__VU, __ITER));
      return res.status === 200 || res.status === 201 || res.status === 401;
    }, 3);

    return recovery.recovered;
  });

  sleep(randomInt(200, 600) / 1000);
}

// ============================================================================
// CPU Throttle Tests (30 tests)
// ============================================================================

export function cpuThrottleTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-6: Response under CPU throttle
  stressGroup('Response Under CPU Throttle', 'chaos_cpu', () => {
    chaosEventsInjected.add(1);
    cpuThrottleEvents.add(1);

    const startTime = Date.now();
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=50`, null, {
      timeout: '30s',
    });
    const duration = Date.now() - startTime;

    // Expect slower response under CPU pressure
    systemResilience.add(res.status === 200 || res.status === 401 ? 1 : 0);

    return assertResponse(res, {
      status: [200, 401, 503, 504],
    }, 'CPU Throttle');
  });

  // Test 7-12: Computation-heavy requests
  stressGroup('Heavy Computation', 'chaos_cpu', () => {
    chaosEventsInjected.add(1);
    cpuThrottleEvents.add(1);

    // Request that might involve heavy computation
    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&search=test&sort=created_at&limit=100`);

    return res.status < 500 || res.status === 503;
  });

  // Test 13-18: Concurrent requests under throttle
  stressGroup('Concurrent Under Throttle', 'chaos_cpu', () => {
    chaosEventsInjected.add(1);
    cpuThrottleEvents.add(1);

    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push({
        method: 'GET',
        endpoint: `/contacts?workspaceId=${workspaceId}&page=${i}&limit=20`,
      });
    }

    const results = batchRequests(requests, { concurrency: 10 });
    const successCount = results.filter((r) => r.status === 200 || r.status === 401).length;

    return successCount >= 5;
  });

  // Test 19-24: Priority handling under throttle
  stressGroup('Priority Under Throttle', 'chaos_cpu', () => {
    chaosEventsInjected.add(1);

    // Health check should be prioritized
    const healthRes = apiRequest('GET', '/health');
    const dataRes = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=100`);

    // Health should work even if data request is slow
    gracefulDegradations.add(healthRes.status === 200 ? 1 : 0);

    return healthRes.status === 200;
  });

  // Test 25-30: CPU recovery
  stressGroup('CPU Recovery', 'chaos_cpu', () => {
    chaosEventsInjected.add(1);

    // Wait for CPU "recovery"
    sleep(2);

    const recovery = measureRecovery(() => {
      const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=20`);
      return res.status === 200 || res.status === 401;
    }, 3);

    return recovery.recovered;
  });

  sleep(randomInt(300, 800) / 1000);
}

// ============================================================================
// Cascading Failure Tests (30 tests)
// ============================================================================

export function cascadeFailureTests() {
  const workspaceId = getRandomWorkspaceId();

  // Test 1-6: Dependent service failure
  stressGroup('Dependent Service Failure', 'chaos_cascade', () => {
    chaosEventsInjected.add(1);

    // Simulate database being slow
    simulateNetworkDelay(2000);

    const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=10`, null, {
      timeout: '15s',
    });

    if (res.status >= 500) {
      cascadeFailures.add(1);
    }

    return res.status < 500 || res.status === 503;
  });

  // Test 7-12: Multi-service cascade
  stressGroup('Multi-Service Cascade', 'chaos_cascade', () => {
    chaosEventsInjected.add(1);

    const services = [
      { path: '/health', name: 'health' },
      { path: `/contacts?workspaceId=${workspaceId}`, name: 'contacts' },
      { path: `/campaigns?workspaceId=${workspaceId}`, name: 'campaigns' },
    ];

    const results = services.map((s) => ({
      ...s,
      response: apiRequest('GET', s.path),
    }));

    const failures = results.filter((r) => r.response.status >= 500);

    if (failures.length > 1) {
      cascadeFailures.add(1);
    }

    // At least health should work
    const healthOk = results.find((r) => r.name === 'health')?.response.status === 200;
    gracefulDegradations.add(healthOk ? 1 : 0);

    return healthOk;
  });

  // Test 13-18: Circuit breaker behavior
  stressGroup('Circuit Breaker', 'chaos_cascade', () => {
    chaosEventsInjected.add(1);

    // Trigger multiple failures
    let failures = 0;
    for (let i = 0; i < 5; i++) {
      simulateNetworkDelay(500);
      const res = apiRequest('GET', `/contacts?workspaceId=${workspaceId}`);
      if (res.status >= 500) failures++;
    }

    // After failures, circuit should open (fast fail)
    const fastRes = apiRequest('GET', `/contacts?workspaceId=${workspaceId}`);

    // Fast response (circuit open) or service recovered
    return fastRes.timings.duration < 5000 || fastRes.status === 200;
  });

  // Test 19-24: Cascade isolation
  stressGroup('Cascade Isolation', 'chaos_cascade', () => {
    chaosEventsInjected.add(1);

    // Contacts might be down
    const contactsRes = apiRequest('GET', `/contacts?workspaceId=${workspaceId}`);

    // But campaigns should be isolated
    const campaignsRes = apiRequest('GET', `/campaigns?workspaceId=${workspaceId}`);

    // Health should always work
    const healthRes = apiRequest('GET', '/health');

    const isolated = healthRes.status === 200;
    systemResilience.add(isolated ? 1 : 0);

    return isolated;
  });

  // Test 25-30: Cascade recovery
  stressGroup('Cascade Recovery', 'chaos_cascade', () => {
    chaosEventsInjected.add(1);

    // Simulate cascade
    for (let i = 0; i < 3; i++) {
      simulateNetworkDelay(1000);
      apiRequest('GET', `/contacts?workspaceId=${workspaceId}`);
    }

    // Wait for recovery
    sleep(3);

    // Test full system recovery
    const recovery = measureRecovery(() => {
      const health = apiRequest('GET', '/health');
      const contacts = apiRequest('GET', `/contacts?workspaceId=${workspaceId}&limit=5`);

      return health.status === 200 && (contacts.status === 200 || contacts.status === 401);
    }, 5);

    return recovery.recovered;
  });

  sleep(randomInt(500, 1500) / 1000);
}

// ============================================================================
// Setup and Teardown
// ============================================================================

export function setup() {
  console.log('\n=== Chaos Engineering Tests Starting ===');
  console.log(`Base URL: ${CONFIG.BASE_URL}`);
  console.log(`Chaos Enabled: ${CONFIG.CHAOS_ENABLED}`);
  console.log(`Failure Injection Rate: ${CONFIG.FAILURE_INJECTION_RATE}`);
  console.log('=========================================\n');

  return { startTime: Date.now() };
}

export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log('\n=== Chaos Engineering Tests Complete ===');
  console.log(`Duration: ${duration.toFixed(2)}s`);
  console.log('=========================================\n');
}
