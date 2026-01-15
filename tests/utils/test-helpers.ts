/**
 * Test Utilities and Helpers
 */

import { vi } from 'vitest';

/**
 * Create mock Supabase client with custom responses
 */
export function createMockSupabaseClient(responses: Record<string, any> = {}) {
  return {
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue(responses[table]?.single || { data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue(responses[table]?.maybeSingle || { data: null, error: null }),
    })),
  };
}

/**
 * Create mock tenant data
 */
export function createMockTenant(overrides: Partial<any> = {}) {
  return {
    id: 'tenant-uuid',
    tenant_id: 'TEST_CLIENT_001',
    workspace_id: 'workspace-uuid',
    name: 'Test Client',
    type: 'shopify',
    status: 'active',
    market: 'ANZ_SMB',
    region: 'AU-SE1',
    shopify_shop: 'testclient.myshopify.com',
    gmc_merchant_id: null,
    industry: 'Retail',
    website: 'https://testclient.com',
    contact_email: 'contact@testclient.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create mock credential data
 */
export function createMockCredential(overrides: Partial<any> = {}) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

  return {
    id: 'credential-uuid',
    tenant_id: 'TEST_CLIENT_001',
    service: 'shopify',
    secret_name: 'synthex/workspace-uuid/TEST_CLIENT_001/shopify/credentials',
    status: 'valid',
    expires_at: expiresAt.toISOString(),
    metadata: {},
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    ...overrides,
  };
}

/**
 * Create mock workspace data
 */
export function createMockWorkspace(overrides: Partial<any> = {}) {
  return {
    id: 'workspace-uuid',
    name: 'Test Workspace',
    market: 'ANZ_SMB',
    region: 'AU-SE1',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create mock alert data
 */
export function createMockAlert(overrides: Partial<any> = {}) {
  return {
    id: 'alert-uuid',
    workspace_id: 'workspace-uuid',
    tenant_id: 'TEST_CLIENT_001',
    service: 'shopify',
    severity: 'warning',
    type: 'expiring_7d',
    message: 'Credential expiring in 7 days',
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    days_until_expiry: 7,
    sent_at: new Date().toISOString(),
    acknowledged: false,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create mock usage metric data
 */
export function createMockUsageMetric(overrides: Partial<any> = {}) {
  return {
    id: 'metric-uuid',
    workspace_id: 'workspace-uuid',
    user_id: 'user-uuid',
    metric_type: 'command',
    metric_name: 'tenant.create',
    value: 1,
    metadata: { tenantType: 'shopify' },
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create mock Shopify product data
 */
export function createMockShopifyProduct(overrides: Partial<any> = {}) {
  return {
    id: 'product-uuid',
    tenant_id: 'TEST_CLIENT_001',
    shopify_product_id: '12345678',
    title: 'Test Product',
    description: 'Test product description',
    vendor: 'Test Vendor',
    product_type: 'Test Type',
    price: '99.99',
    inventory_quantity: 100,
    sku: 'TEST-SKU-001',
    image_url: 'https://cdn.shopify.com/test.jpg',
    raw_data: {},
    synced_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create mock health check data
 */
export function createMockHealthCheck(overrides: Partial<any> = {}) {
  return {
    name: 'Database',
    status: 'healthy',
    message: 'Database connection successful',
    lastChecked: new Date().toISOString(),
    responseTime: 45,
    metadata: {},
    ...overrides,
  };
}

/**
 * Wait for async operations to complete
 */
export function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a spy that resolves after a delay
 */
export function createDelayedSpy<T>(result: T, delay: number = 100) {
  return vi.fn(async () => {
    await waitFor(delay);
    return result;
  });
}

/**
 * Create a spy that rejects after a delay
 */
export function createRejectedSpy(error: Error, delay: number = 100) {
  return vi.fn(async () => {
    await waitFor(delay);
    throw error;
  });
}
