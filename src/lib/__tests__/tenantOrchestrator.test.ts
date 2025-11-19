/**
 * Tenant Orchestrator Unit Tests - Phase 3 Step 8 Priority 3
 * Tests container lifecycle operations behave correctly
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  startTenantContainer,
  stopTenantContainer,
  restartTenantContainer,
  getContainerStatus,
  performHealthCheck,
  getResourceMetrics,
} from '../tenants/tenantOrchestrator';

// Mock child_process
vi.mock('child_process', () => ({
  exec: vi.fn((cmd, opts, callback) => {
    if (callback) {
      callback(null, { stdout: 'mock output', stderr: '' });
    }
  }),
}));

vi.mock('util', () => ({
  promisify: vi.fn((fn) => async (cmd: string) => {
    if (cmd.includes('docker-compose up')) {
      return { stdout: 'Started', stderr: '' };
    }
    if (cmd.includes('docker-compose down')) {
      return { stdout: 'Stopped', stderr: '' };
    }
    if (cmd.includes('docker-compose ps')) {
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
  getSupabaseServer: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: {
              id: 'container-id',
              container_name: 'tenant_test',
              container_id: 'docker-id-123',
              status: 'running',
              tenant_url: 'http://localhost:3001',
              image_tag: 'latest',
            },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
      insert: vi.fn(() => ({ error: null })),
    })),
  })),
}));

// Mock fetch for health checks
global.fetch = vi.fn(() =>
  Promise.resolve({
    status: 200,
    ok: true,
  } as Response)
);

describe('Tenant Orchestrator - Container Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start container successfully', async () => {
    const result = await startTenantContainer('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(true);
    expect(result.containerId).toBeDefined();
  });

  it('should fail to start if container not found', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: { message: 'Not found' } })),
          })),
        })),
      })),
    } as any);

    const result = await startTenantContainer('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Container not found');
  });

  it('should fail if container already running', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'test', status: 'running' },
              error: null,
            })),
          })),
        })),
      })),
    } as any);

    const result = await startTenantContainer('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Container is already running');
  });

  it('should stop container successfully', async () => {
    const result = await stopTenantContainer('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(true);
  });

  it('should fail to stop if already stopped', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'test', status: 'stopped' },
              error: null,
            })),
          })),
        })),
      })),
    } as any);

    const result = await stopTenantContainer('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Container is already stopped');
  });

  it('should restart container successfully', async () => {
    const result = await restartTenantContainer('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(true);
  });
});

describe('Tenant Orchestrator - Status Monitoring', () => {
  it('should get container status when running', async () => {
    const status = await getContainerStatus('550e8400-e29b-41d4-a716-446655440001');
    expect(status.running).toBe(true);
    expect(status.containerId).toBeDefined();
  });

  it('should return not running if container ID is null', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: { id: 'test', container_id: null },
              error: null,
            })),
          })),
        })),
      })),
    } as any);

    const status = await getContainerStatus('550e8400-e29b-41d4-a716-446655440001');
    expect(status.running).toBe(false);
  });

  it('should perform health check successfully', async () => {
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

    const result = await performHealthCheck('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(true);
    expect(result.healthy).toBe(false);
  });

  it('should handle health check timeout', async () => {
    global.fetch = vi.fn(() =>
      Promise.reject(new Error('Timeout'))
    );

    const result = await performHealthCheck('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(true);
    expect(result.healthy).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('Tenant Orchestrator - Resource Metrics', () => {
  it('should get resource metrics successfully', async () => {
    const result = await getResourceMetrics('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(true);
    expect(result.metrics).toBeDefined();
    expect(result.metrics?.cpuPercent).toBe(0.50);
    expect(result.metrics?.memoryUsageMb).toBeDefined();
  });

  it('should fail if container not found', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: { message: 'Not found' } })),
          })),
        })),
      })),
    } as any);

    const result = await getResourceMetrics('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Container not found');
  });
});
