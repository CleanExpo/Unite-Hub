/**
 * Tenant Orchestrator Unit Tests - Phase 3 Step 8 Priority 3
 * Tests container lifecycle operations behave correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create chainable Supabase mock with chainProxy pattern.
// Root mock has NO .then (so await getSupabaseServer() works).
// Chain methods return chainProxy which HAS .then for terminal queries.
const { mockSupabase } = vi.hoisted(() => {
  const queryResults: any[] = [];

  const mock: any = {
    _queryResults: queryResults,
    _setResults: (results: any[]) => {
      queryResults.length = 0;
      queryResults.push(...results);
    },
  };

  const chainProxy: any = {};

  const chainMethods = [
    'from', 'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
    'is', 'in', 'order', 'limit', 'range', 'match', 'not',
    'or', 'filter', 'contains', 'containedBy', 'textSearch', 'overlaps',
  ];
  chainMethods.forEach((m) => {
    const fn = vi.fn().mockReturnValue(chainProxy);
    mock[m] = fn;
    chainProxy[m] = fn;
  });

  const singleFn = vi.fn().mockImplementation(() => {
    const result = queryResults.shift() || { data: null, error: null };
    return Promise.resolve(result);
  });
  const maybeSingleFn = vi.fn().mockImplementation(() => {
    const result = queryResults.shift() || { data: null, error: null };
    return Promise.resolve(result);
  });

  mock.single = singleFn;
  mock.maybeSingle = maybeSingleFn;
  chainProxy.single = singleFn;
  chainProxy.maybeSingle = maybeSingleFn;

  chainProxy.then = (resolve: any) => {
    const result = queryResults.shift() || { data: [], error: null };
    return resolve(result);
  };

  return { mockSupabase: mock };
});

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn((cmd: string, opts: any, callback: any) => {
    if (callback) {
      callback(null, { stdout: 'mock output', stderr: '' });
    }
  }),
}));

vi.mock('util', () => ({
  promisify: vi.fn(() => async (cmd: string) => {
    if (cmd.includes('docker-compose up')) {
      return { stdout: 'Started', stderr: '' };
    }
    if (cmd.includes('docker-compose down')) {
      return { stdout: 'Stopped', stderr: '' };
    }
    if (cmd.includes('docker-compose ps') || cmd.includes('ps -q')) {
      return { stdout: 'abc123\n', stderr: '' };
    }
    if (cmd.includes('docker inspect')) {
      return { stdout: 'running\n', stderr: '' };
    }
    if (cmd.includes('docker stats')) {
      return { stdout: '0.50%|512MiB / 1GiB|1.23MB / 4.56MB\n', stderr: '' };
    }
    return { stdout: '', stderr: '' };
  }),
}));

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn().mockResolvedValue(mockSupabase),
}));

import {
  startTenantContainer,
  stopTenantContainer,
  restartTenantContainer,
  getContainerStatus,
  performHealthCheck,
  getResourceMetrics,
} from '../tenants/tenantOrchestrator';

// Mock fetch for health checks
global.fetch = vi.fn(() =>
  Promise.resolve({
    status: 200,
    ok: true,
  } as Response)
);

const defaultContainer = {
  id: 'container-id',
  container_name: 'tenant_test',
  container_id: 'docker-id-123',
  status: 'stopped',
  tenant_url: 'http://localhost:3001',
  image_tag: 'latest',
};

function resetMocks() {
  mockSupabase._setResults([]);
}

describe('Tenant Orchestrator - Container Lifecycle', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should start container successfully', async () => {
    mockSupabase._setResults([
      { data: { ...defaultContainer, status: 'stopped' }, error: null },
      { error: null },
      { error: null },
    ]);

    const result = await startTenantContainer('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(true);
    expect(result.containerId).toBeDefined();
  });

  it('should fail to start if container not found', async () => {
    mockSupabase._setResults([
      { data: null, error: { message: 'Not found' } },
    ]);

    const result = await startTenantContainer('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Container not found');
  });

  it('should fail if container already running', async () => {
    mockSupabase._setResults([
      { data: { ...defaultContainer, status: 'running' }, error: null },
    ]);

    const result = await startTenantContainer('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Container is already running');
  });

  it('should stop container successfully', async () => {
    mockSupabase._setResults([
      { data: { ...defaultContainer, status: 'running' }, error: null },
      { error: null },
    ]);

    const result = await stopTenantContainer('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(true);
  });

  it('should fail to stop if already stopped', async () => {
    mockSupabase._setResults([
      { data: { ...defaultContainer, status: 'stopped' }, error: null },
    ]);

    const result = await stopTenantContainer('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Container is already stopped');
  });

  it('should restart container successfully', async () => {
    mockSupabase._setResults([
      // stop: get container
      { data: { ...defaultContainer, status: 'running' }, error: null },
      // stop: update status
      { error: null },
      // start: get container
      { data: { ...defaultContainer, status: 'stopped' }, error: null },
      // start: update status
      { error: null },
      // start: insert deployment
      { error: null },
    ]);

    const result = await restartTenantContainer('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(true);
  });
});

describe('Tenant Orchestrator - Status Monitoring', () => {
  beforeEach(() => {
    resetMocks();
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 200,
        ok: true,
      } as Response)
    );
  });

  it('should get container status when running', async () => {
    mockSupabase._setResults([
      { data: { ...defaultContainer, status: 'running', container_id: 'docker-id-123', health_status: 'healthy' }, error: null },
    ]);

    const status = await getContainerStatus('550e8400-e29b-41d4-a716-446655440001');
    expect(status.running).toBe(true);
    expect(status.containerId).toBeDefined();
  });

  it('should return not running if container ID is null', async () => {
    mockSupabase._setResults([
      { data: { id: 'test', container_id: null }, error: null },
    ]);

    const status = await getContainerStatus('550e8400-e29b-41d4-a716-446655440001');
    expect(status.running).toBe(false);
  });

  it('should perform health check successfully', async () => {
    mockSupabase._setResults([
      // performHealthCheck: get container
      { data: { ...defaultContainer, status: 'running', container_id: 'docker-id-123', health_status: 'healthy' }, error: null },
      // getContainerStatus: get container
      { data: { ...defaultContainer, status: 'running', container_id: 'docker-id-123', health_status: 'healthy' }, error: null },
      // insert health record -> then
      { error: null },
      // update container health -> then
      { error: null },
    ]);

    const result = await performHealthCheck('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(true);
    expect(result.healthy).toBe(true);
    expect(result.responseTimeMs).toBeDefined();
  });

  it('should detect unhealthy container', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        status: 500,
        ok: false,
      } as Response)
    );

    mockSupabase._setResults([
      { data: { ...defaultContainer, status: 'running', container_id: 'docker-id-123' }, error: null },
      { data: { ...defaultContainer, status: 'running', container_id: 'docker-id-123' }, error: null },
      { error: null },
      { error: null },
    ]);

    const result = await performHealthCheck('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(true);
    expect(result.healthy).toBe(false);
  });

  it('should handle health check timeout', async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Timeout'))
    );

    mockSupabase._setResults([
      { data: { ...defaultContainer, status: 'running', container_id: 'docker-id-123' }, error: null },
      { data: { ...defaultContainer, status: 'running', container_id: 'docker-id-123' }, error: null },
      { error: null },
      { error: null },
    ]);

    const result = await performHealthCheck('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(true);
    expect(result.healthy).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('Tenant Orchestrator - Resource Metrics', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should get resource metrics successfully', async () => {
    mockSupabase._setResults([
      { data: { ...defaultContainer, container_id: 'docker-id-123' }, error: null },
      { error: null },
    ]);

    const result = await getResourceMetrics('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(true);
    expect(result.metrics).toBeDefined();
    expect(result.metrics?.cpuPercent).toBe(0.50);
    expect(result.metrics?.memoryUsageMb).toBeDefined();
  });

  it('should fail if container not found', async () => {
    mockSupabase._setResults([
      { data: null, error: { message: 'Not found' } },
    ]);

    const result = await getResourceMetrics('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Container not found');
  });
});
