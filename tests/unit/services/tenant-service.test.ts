/**
 * Unit Tests: TenantService
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMockTenant, createMockSupabaseClient } from '../../utils/test-helpers';

// Mock the Supabase client
const mockSupabase = createMockSupabaseClient();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// Import after mocking
const { TenantService } = await import('@/cli/services/tenant-management/tenant-service');

describe('TenantService', () => {
  let tenantService: InstanceType<typeof TenantService>;

  beforeEach(() => {
    vi.clearAllMocks();
    tenantService = new TenantService('workspace-uuid');
  });

  describe('create', () => {
    it('should create a new tenant successfully', async () => {
      const mockTenant = createMockTenant();
      const mockResponse = { data: mockTenant, error: null };

      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockResponse),
      })) as any;

      const result = await tenantService.create({
        workspaceId: 'workspace-uuid',
        tenantId: 'TEST_CLIENT_001',
        name: 'Test Client',
        type: 'shopify',
        market: 'ANZ_SMB',
        region: 'AU-SE1',
        shopifyShop: 'testclient.myshopify.com',
      });

      expect(result).toEqual(mockTenant);
      expect(mockSupabase.from).toHaveBeenCalledWith('tenants');
    });

    it('should throw error if tenant ID already exists', async () => {
      const mockError = { code: '23505', message: 'duplicate key value violates unique constraint' };
      const mockResponse = { data: null, error: mockError };

      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockResponse),
      })) as any;

      await expect(
        tenantService.create({
          workspaceId: 'workspace-uuid',
          tenantId: 'DUPLICATE',
          name: 'Duplicate',
          type: 'shopify',
          market: 'ANZ_SMB',
          region: 'AU-SE1',
          shopifyShop: 'duplicate.myshopify.com',
        })
      ).rejects.toThrow();
    });

    it('should validate Shopify shop format', async () => {
      await expect(
        tenantService.create({
          workspaceId: 'workspace-uuid',
          tenantId: 'TEST_001',
          name: 'Test',
          type: 'shopify',
          market: 'ANZ_SMB',
          region: 'AU-SE1',
          shopifyShop: 'invalid-shop-url',
        })
      ).rejects.toThrow();
    });
  });

  describe('list', () => {
    it('should list all tenants in workspace', async () => {
      const mockTenants = [createMockTenant(), createMockTenant({ tenant_id: 'TEST_CLIENT_002' })];
      const mockResponse = { data: mockTenants, error: null };

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockResponse),
      })) as any;

      const result = await tenantService.list();

      expect(result).toEqual(mockTenants);
      expect(result).toHaveLength(2);
    });

    it('should filter tenants by status', async () => {
      const mockActiveTenants = [createMockTenant({ status: 'active' })];
      const mockResponse = { data: mockActiveTenants, error: null };

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockResponse),
      })) as any;

      const result = await tenantService.list({ status: 'active' });

      expect(result).toEqual(mockActiveTenants);
      expect(result[0].status).toBe('active');
    });

    it('should filter tenants by type', async () => {
      const mockShopifyTenants = [createMockTenant({ type: 'shopify' })];
      const mockResponse = { data: mockShopifyTenants, error: null };

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue(mockResponse),
      })) as any;

      const result = await tenantService.list({ type: 'shopify' });

      expect(result[0].type).toBe('shopify');
    });
  });

  describe('get', () => {
    it('should get tenant by ID', async () => {
      const mockTenant = createMockTenant();
      const mockResponse = { data: mockTenant, error: null };

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockResponse),
      })) as any;

      const result = await tenantService.get('TEST_CLIENT_001');

      expect(result).toEqual(mockTenant);
      expect(result?.tenant_id).toBe('TEST_CLIENT_001');
    });

    it('should return null if tenant not found', async () => {
      const mockResponse = { data: null, error: { code: 'PGRST116' } };

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockResponse),
      })) as any;

      const result = await tenantService.get('NONEXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update tenant successfully', async () => {
      const updatedTenant = createMockTenant({ name: 'Updated Name' });
      const mockResponse = { data: updatedTenant, error: null };

      mockSupabase.from = vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockResponse),
      })) as any;

      const result = await tenantService.update('TEST_CLIENT_001', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });

    it('should throw error if tenant not found', async () => {
      const mockResponse = { data: null, error: { code: 'PGRST116' } };

      mockSupabase.from = vi.fn(() => ({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue(mockResponse),
      })) as any;

      await expect(
        tenantService.update('NONEXISTENT', { name: 'New Name' })
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete tenant successfully', async () => {
      const mockResponse = { data: null, error: null };

      mockSupabase.from = vi.fn(() => ({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockResponse),
      })) as any;

      await expect(tenantService.delete('TEST_CLIENT_001')).resolves.not.toThrow();
    });

    it('should throw error if deletion fails', async () => {
      const mockResponse = { data: null, error: { message: 'Deletion failed' } };

      mockSupabase.from = vi.fn(() => ({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue(mockResponse),
      })) as any;

      await expect(tenantService.delete('TEST_CLIENT_001')).rejects.toThrow();
    });
  });
});
