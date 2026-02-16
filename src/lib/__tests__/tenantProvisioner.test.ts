/**
 * Tenant Provisioner Unit Tests - Phase 3 Step 8 Priority 3
 * Tests compose file generation and safety checks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateTenantConfig,
  getNextAvailablePort,
  generateDockerCompose,
  provisionTenant,
  deprovisionTenant,
} from '../tenants/tenantProvisioner';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
        })),
        not: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({ data: [], error: null })),
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: {}, error: null })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
    })),
  })),
}));

vi.mock('fs/promises', () => ({
  readFile: vi.fn(() => Promise.resolve('version: 3.8\nservices:\n  tenant_${TENANT_ID}:\n    environment:\n      TENANT_ID: ${TENANT_ID}')),
  writeFile: vi.fn(() => Promise.resolve()),
  mkdir: vi.fn(() => Promise.resolve()),
  rm: vi.fn(() => Promise.resolve()),
}));

describe('Tenant Provisioner - Validation', () => {
  it('should validate correct tenant configuration', () => {
    const config = {
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      tenantName: 'Test Tenant',
      cpuLimit: 0.50,
      memoryLimitMb: 512,
    };

    const result = validateTenantConfig(config);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should reject invalid organization ID', () => {
    const config = {
      organizationId: 'invalid-uuid',
      tenantName: 'Test Tenant',
    };

    const result = validateTenantConfig(config);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid organization ID format');
  });

  it('should reject empty tenant name', () => {
    const config = {
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      tenantName: '',
    };

    const result = validateTenantConfig(config);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Tenant name is required');
  });

  it('should reject tenant name over 100 characters', () => {
    const config = {
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      tenantName: 'a'.repeat(101),
    };

    const result = validateTenantConfig(config);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Tenant name must be 100 characters or less');
  });

  it('should reject invalid CPU limit (too low)', () => {
    const config = {
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      tenantName: 'Test',
      cpuLimit: 0,
    };

    const result = validateTenantConfig(config);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('CPU limit must be between 0 and 4.0');
  });

  it('should reject invalid CPU limit (too high)', () => {
    const config = {
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      tenantName: 'Test',
      cpuLimit: 5.0,
    };

    const result = validateTenantConfig(config);
    expect(result.valid).toBe(false);
  });

  it('should reject invalid memory limit (too low)', () => {
    const config = {
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      tenantName: 'Test',
      memoryLimitMb: 128,
    };

    const result = validateTenantConfig(config);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Memory limit must be between 256MB and 8192MB');
  });

  it('should reject invalid memory limit (too high)', () => {
    const config = {
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      tenantName: 'Test',
      memoryLimitMb: 10000,
    };

    const result = validateTenantConfig(config);
    expect(result.valid).toBe(false);
  });

  it('should reject invalid disk limit', () => {
    const config = {
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      tenantName: 'Test',
      diskLimitMb: 500,
    };

    const result = validateTenantConfig(config);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Disk limit must be at least 1024MB');
  });
});

describe('Tenant Provisioner - Port Allocation', () => {
  it('should return 3001 for first tenant', async () => {
    const port = await getNextAvailablePort();
    expect(port).toBe(3001);
  });

  it('should increment port for multiple tenants', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          not: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => ({ data: [{ external_port: 3005 }], error: null })),
            })),
          })),
        })),
      })),
    } as any);

    const port = await getNextAvailablePort();
    expect(port).toBe(3006);
  });
});

describe('Tenant Provisioner - Docker Compose Generation', () => {
  it('should generate docker-compose file successfully', async () => {
    const config = {
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      tenantName: 'Test Tenant',
      cpuLimit: 0.75,
      memoryLimitMb: 1024,
    };

    const result = await generateDockerCompose(config, 3001);
    expect(result.success).toBe(true);
    expect(result.composePath).toBeDefined();
  });

  it('should handle file write errors', async () => {
    const fs = await import('fs/promises');
    vi.mocked(fs.writeFile).mockRejectedValue(new Error('Permission denied'));

    const config = {
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      tenantName: 'Test',
    };

    const result = await generateDockerCompose(config, 3001);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('Tenant Provisioner - Provisioning', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Restore fs mocks that may have been overridden by previous tests
    const fs = await import('fs/promises');
    vi.mocked(fs.readFile).mockResolvedValue('version: 3.8\nservices:\n  tenant_${TENANT_ID}:\n    environment:\n      TENANT_ID: ${TENANT_ID}' as any);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
  });

  it('should provision tenant successfully', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn((table) => {
        if (table === 'tenant_containers') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({ data: null, error: null })),
              })),
              not: vi.fn(() => ({
                order: vi.fn(() => ({
                  limit: vi.fn(() => ({ data: [], error: null })),
                })),
              })),
            })),
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: {
                    id: 'container-id',
                    container_name: 'tenant_test',
                    external_port: 3001,
                    tenant_url: 'http://localhost:3001',
                  },
                  error: null,
                })),
              })),
            })),
          };
        }
        return {
          insert: vi.fn(() => ({ error: null })),
        };
      }),
    } as any);

    const config = {
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      tenantName: 'Test Tenant',
    };

    const result = await provisionTenant(config);
    expect(result.success).toBe(true);
    expect(result.containerId).toBe('container-id');
    expect(result.externalPort).toBe(3001);
  });

  it('should fail if tenant already exists', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: { id: 'existing' }, error: null })),
          })),
        })),
      })),
    } as any);

    const config = {
      organizationId: '550e8400-e29b-41d4-a716-446655440001',
      tenantName: 'Test',
    };

    const result = await provisionTenant(config);
    expect(result.success).toBe(false);
    expect(result.error).toBe('Tenant container already exists for this organization');
  });
});

describe('Tenant Provisioner - Deprovisioning', () => {
  it('should deprovision tenant successfully', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn((table) => {
        if (table === 'tenant_containers') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: {
                    id: 'container-id',
                    container_name: 'tenant_test',
                    image_tag: 'latest',
                  },
                  error: null,
                })),
              })),
            })),
            update: vi.fn(() => ({
              eq: vi.fn(() => ({ error: null })),
            })),
          };
        }
        return {
          insert: vi.fn(() => ({ error: null })),
        };
      }),
    } as any);

    const result = await deprovisionTenant('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(true);
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

    const result = await deprovisionTenant('550e8400-e29b-41d4-a716-446655440001');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Container not found');
  });
});
