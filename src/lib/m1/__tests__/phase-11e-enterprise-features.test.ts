/**
 * Phase 11E: Enterprise Features Tests
 *
 * Comprehensive test suite for multi-tenancy, RBAC, and enterprise capabilities
 *
 * Version: v2.5.0
 * Phase: 11E - Enterprise Features
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TenantManager, tenantManager } from '../enterprise/tenant-manager';
import { RBACManager, rbacManager } from '../enterprise/rbac-manager';

/**
 * ============================================================================
 * TENANT MANAGER TESTS (20 tests)
 * ============================================================================
 */

describe('Tenant Manager', () => {
  let manager: TenantManager;

  beforeEach(() => {
    manager = new TenantManager();
  });

  // Test 1: Create starter tenant
  it('should create starter tier tenant', () => {
    const tenantId = manager.createTenant({
      name: 'Acme Corp',
      tier: 'starter',
      status: 'active',
      features: ['api_webhooks'],
      limits: {
        maxUsers: 10,
        maxApiCalls: 100_000,
        maxDataRetention: 90,
        maxStorageGb: 10,
      },
    });

    expect(tenantId).toBeDefined();
    expect(tenantId).toContain('tenant_');
  });

  // Test 2: Create professional tenant
  it('should create professional tier tenant', () => {
    const tenantId = manager.createTenant({
      name: 'TechCorp',
      tier: 'professional',
      status: 'active',
      features: ['multi_region', 'ml_analytics', 'sso', 'audit_logging'],
      limits: {
        maxUsers: 100,
        maxApiCalls: 10_000_000,
        maxDataRetention: 365,
        maxStorageGb: 100,
      },
    });

    expect(tenantId).toBeDefined();
  });

  // Test 3: Create enterprise tenant
  it('should create enterprise tier tenant', () => {
    const tenantId = manager.createTenant({
      name: 'Fortune 500 Corp',
      tier: 'enterprise',
      status: 'active',
      features: [
        'multi_region',
        'ml_analytics',
        'compliance',
        'sso',
        'audit_logging',
        'custom_branding',
        'dedicated_support',
      ],
      limits: {
        maxUsers: 10_000,
        maxApiCalls: 1_000_000_000,
        maxDataRetention: 2555,
        maxStorageGb: 10_000,
      },
    });

    expect(tenantId).toBeDefined();
  });

  // Test 4: Get tenant configuration
  it('should retrieve tenant configuration', () => {
    const tenantId = manager.createTenant({
      name: 'Test Corp',
      tier: 'professional',
      status: 'active',
      features: [],
      limits: { maxUsers: 50, maxApiCalls: 1_000_000, maxDataRetention: 365, maxStorageGb: 50 },
    });

    const tenant = manager.getTenant(tenantId);

    expect(tenant).not.toBeNull();
    expect(tenant!.name).toBe('Test Corp');
    expect(tenant!.tier).toBe('professional');
  });

  // Test 5: Update tenant configuration
  it('should update tenant configuration', () => {
    const tenantId = manager.createTenant({
      name: 'Test Corp',
      tier: 'professional',
      status: 'active',
      features: [],
      limits: { maxUsers: 50, maxApiCalls: 1_000_000, maxDataRetention: 365, maxStorageGb: 50 },
    });

    manager.updateTenant(tenantId, {
      status: 'suspended',
      features: ['ml_analytics'],
    });

    const updated = manager.getTenant(tenantId);

    expect(updated!.status).toBe('suspended');
    expect(updated!.features).toContain('ml_analytics');
  });

  // Test 6: Generate API key
  it('should generate API key for tenant', () => {
    const tenantId = manager.createTenant({
      name: 'Test Corp',
      tier: 'starter',
      status: 'active',
      features: [],
      limits: { maxUsers: 10, maxApiCalls: 100_000, maxDataRetention: 90, maxStorageGb: 10 },
    });

    const apiKey = manager.getApiKey(tenantId);

    expect(apiKey).not.toBeNull();
    expect(apiKey!).toContain('sk_');
  });

  // Test 7: Validate API key
  it('should validate API key', () => {
    const tenantId = manager.createTenant({
      name: 'Test Corp',
      tier: 'starter',
      status: 'active',
      features: [],
      limits: { maxUsers: 10, maxApiCalls: 100_000, maxDataRetention: 90, maxStorageGb: 10 },
    });

    const apiKey = manager.getApiKey(tenantId)!;
    const validatedTenantId = manager.validateApiKey(apiKey);

    expect(validatedTenantId).toBe(tenantId);
  });

  // Test 8: Record tenant usage
  it('should record tenant usage metrics', () => {
    const tenantId = manager.createTenant({
      name: 'Test Corp',
      tier: 'professional',
      status: 'active',
      features: [],
      limits: { maxUsers: 100, maxApiCalls: 10_000_000, maxDataRetention: 365, maxStorageGb: 100 },
    });

    manager.recordUsage(tenantId, {
      period: 'monthly',
      metrics: {
        activeUsers: 25,
        apiCalls: 5_000_000,
        dataStoredGb: 45,
        computeHours: 240,
      },
      costEstimate: 150,
    });

    const usage = manager.getTenantUsage(tenantId);

    expect(usage).toHaveLength(1);
    expect(usage[0].metrics.activeUsers).toBe(25);
  });

  // Test 9: Check feature entitlement
  it('should verify feature entitlements', () => {
    const tenantId = manager.createTenant({
      name: 'Professional Corp',
      tier: 'professional',
      status: 'active',
      features: ['multi_region', 'ml_analytics'],
      limits: { maxUsers: 100, maxApiCalls: 10_000_000, maxDataRetention: 365, maxStorageGb: 100 },
    });

    expect(manager.hasFeature(tenantId, 'multi_region')).toBe(true);
    expect(manager.hasFeature(tenantId, 'ml_analytics')).toBe(true);
    expect(manager.hasFeature(tenantId, 'compliance')).toBe(false); // Enterprise only
  });

  // Test 10: Get features by tier
  it('should list features available for tier', () => {
    const enterpriseFeatures = manager.getFeaturesByTier('enterprise');

    expect(enterpriseFeatures.length).toBeGreaterThan(0);
    expect(enterpriseFeatures.some(f => f.featureId === 'compliance')).toBe(true);
  });

  // Test 11: Calculate tenant cost
  it('should calculate monthly tenant cost', () => {
    const tenantId = manager.createTenant({
      name: 'Test Corp',
      tier: 'professional',
      status: 'active',
      features: [],
      limits: { maxUsers: 100, maxApiCalls: 10_000_000, maxDataRetention: 365, maxStorageGb: 100 },
    });

    const cost = manager.calculateTenantCost(tenantId, 'monthly');

    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeCloseTo(99, 1); // Professional tier base price
  });

  // Test 12: Check resource limits
  it('should validate resource limits', () => {
    const tenantId = manager.createTenant({
      name: 'Test Corp',
      tier: 'starter',
      status: 'active',
      features: [],
      limits: { maxUsers: 10, maxApiCalls: 100_000, maxDataRetention: 90, maxStorageGb: 10 },
    });

    expect(manager.checkLimits(tenantId, 'users', 5)).toBe(true);
    expect(manager.checkLimits(tenantId, 'users', 15)).toBe(false);
  });

  // Test 13: Get all tenants
  it('should retrieve all tenants', () => {
    manager.createTenant({
      name: 'Corp 1',
      tier: 'starter',
      status: 'active',
      features: [],
      limits: { maxUsers: 10, maxApiCalls: 100_000, maxDataRetention: 90, maxStorageGb: 10 },
    });

    manager.createTenant({
      name: 'Corp 2',
      tier: 'professional',
      status: 'active',
      features: [],
      limits: { maxUsers: 100, maxApiCalls: 10_000_000, maxDataRetention: 365, maxStorageGb: 100 },
    });

    const allTenants = manager.getAllTenants();

    expect(allTenants.length).toBe(2);
  });

  // Test 14: Get tenant statistics
  it('should calculate tenant statistics', () => {
    manager.createTenant({
      name: 'Corp 1',
      tier: 'starter',
      status: 'active',
      features: [],
      limits: { maxUsers: 10, maxApiCalls: 100_000, maxDataRetention: 90, maxStorageGb: 10 },
    });

    manager.createTenant({
      name: 'Corp 2',
      tier: 'professional',
      status: 'suspended',
      features: [],
      limits: { maxUsers: 100, maxApiCalls: 10_000_000, maxDataRetention: 365, maxStorageGb: 100 },
    });

    const stats = manager.getTenantStats();

    expect(stats.totalTenants).toBe(2);
    expect(stats.activeTenants).toBe(1);
  });

  // Test 15: Multiple usage records
  it('should track multiple usage periods', () => {
    const tenantId = manager.createTenant({
      name: 'Test Corp',
      tier: 'professional',
      status: 'active',
      features: [],
      limits: { maxUsers: 100, maxApiCalls: 10_000_000, maxDataRetention: 365, maxStorageGb: 100 },
    });

    for (let i = 0; i < 5; i++) {
      manager.recordUsage(tenantId, {
        period: 'daily',
        metrics: { activeUsers: 10 + i, apiCalls: 100_000 * i, dataStoredGb: 10, computeHours: 24 },
        costEstimate: 10 * i,
      });
    }

    const usage = manager.getTenantUsage(tenantId);

    expect(usage).toHaveLength(5);
  });

  // Test 16: Feature not available for tier
  it('should deny enterprise features for lower tiers', () => {
    const tenantId = manager.createTenant({
      name: 'Starter Corp',
      tier: 'starter',
      status: 'active',
      features: ['api_webhooks'],
      limits: { maxUsers: 10, maxApiCalls: 100_000, maxDataRetention: 90, maxStorageGb: 10 },
    });

    expect(manager.hasFeature(tenantId, 'compliance')).toBe(false);
    expect(manager.hasFeature(tenantId, 'custom_branding')).toBe(false);
    expect(manager.hasFeature(tenantId, 'api_webhooks')).toBe(true);
  });

  // Test 17: API key uniqueness
  it('should generate unique API keys', () => {
    const tenant1 = manager.createTenant({
      name: 'Corp 1',
      tier: 'starter',
      status: 'active',
      features: [],
      limits: { maxUsers: 10, maxApiCalls: 100_000, maxDataRetention: 90, maxStorageGb: 10 },
    });

    const tenant2 = manager.createTenant({
      name: 'Corp 2',
      tier: 'starter',
      status: 'active',
      features: [],
      limits: { maxUsers: 10, maxApiCalls: 100_000, maxDataRetention: 90, maxStorageGb: 10 },
    });

    const key1 = manager.getApiKey(tenant1);
    const key2 = manager.getApiKey(tenant2);

    expect(key1).not.toBe(key2);
  });

  // Test 18: Suspended tenant API key validation
  it('should reject API key from suspended tenant', () => {
    const tenantId = manager.createTenant({
      name: 'Test Corp',
      tier: 'starter',
      status: 'active',
      features: [],
      limits: { maxUsers: 10, maxApiCalls: 100_000, maxDataRetention: 90, maxStorageGb: 10 },
    });

    const apiKey = manager.getApiKey(tenantId)!;

    manager.updateTenant(tenantId, { status: 'suspended' });

    const validated = manager.validateApiKey(apiKey);

    expect(validated).toBeNull();
  });

  // Test 19: Annual billing discount
  it('should apply annual billing discount', () => {
    const tenantId = manager.createTenant({
      name: 'Test Corp',
      tier: 'professional',
      status: 'active',
      features: [],
      limits: { maxUsers: 100, maxApiCalls: 10_000_000, maxDataRetention: 365, maxStorageGb: 100 },
    });

    const monthly = manager.calculateTenantCost(tenantId, 'monthly');
    const annual = manager.calculateTenantCost(tenantId, 'annual');

    expect(annual).toBeLessThan(monthly * 12);
  });

  // Test 20: Tenant creation timestamp
  it('should record tenant creation timestamp', () => {
    const before = Date.now();
    const tenantId = manager.createTenant({
      name: 'Test Corp',
      tier: 'starter',
      status: 'active',
      features: [],
      limits: { maxUsers: 10, maxApiCalls: 100_000, maxDataRetention: 90, maxStorageGb: 10 },
    });
    const after = Date.now();

    const tenant = manager.getTenant(tenantId);

    expect(tenant!.createdAt).toBeGreaterThanOrEqual(before);
    expect(tenant!.createdAt).toBeLessThanOrEqual(after);
  });
});

/**
 * ============================================================================
 * RBAC MANAGER TESTS (20 tests)
 * ============================================================================
 */

describe('RBAC Manager', () => {
  let rbac: RBACManager;

  beforeEach(() => {
    rbac = new RBACManager();
  });

  // Test 21: Built-in owner role
  it('should have built-in owner role', () => {
    const ownerRole = rbac.getRole('owner');

    expect(ownerRole).not.toBeNull();
    expect(ownerRole!.isBuiltIn).toBe(true);
    expect(ownerRole!.name).toBe('Owner');
  });

  // Test 22: Built-in admin role
  it('should have built-in admin role', () => {
    const adminRole = rbac.getRole('admin');

    expect(adminRole).not.toBeNull();
    expect(adminRole!.isBuiltIn).toBe(true);
  });

  // Test 23: Create custom role
  it('should create custom role', () => {
    const permissions = new Map([['data', new Set(['read', 'write'])]]);

    const roleId = rbac.createRole('tenant_123', 'Data Manager', 'Manage data operations', permissions);

    expect(roleId).toBeDefined();
    expect(roleId).toContain('role_');
  });

  // Test 24: Assign role to user
  it('should assign role to user', () => {
    rbac.assignRole('user_1', 'tenant_123', 'admin');

    const userRoles = rbac.getUserRoles('user_1', 'tenant_123');

    expect(userRoles.length).toBeGreaterThan(0);
    expect(userRoles.some(r => r.roleId === 'admin')).toBe(true);
  });

  // Test 25: Check permission
  it('should verify user permissions', () => {
    rbac.assignRole('user_1', 'tenant_123', 'admin');

    const hasPermission = rbac.hasPermission('user_1', 'tenant_123', 'data', 'write');

    expect(hasPermission).toBe(true);
  });

  // Test 26: Deny insufficient permission
  it('should deny insufficient permissions', () => {
    rbac.assignRole('user_1', 'tenant_123', 'viewer');

    const hasWritePermission = rbac.hasPermission('user_1', 'tenant_123', 'users', 'write');

    expect(hasWritePermission).toBe(false);
  });

  // Test 27: Owner full access
  it('should grant owner full access', () => {
    rbac.assignRole('user_1', 'tenant_123', 'owner');

    const canReadData = rbac.hasPermission('user_1', 'tenant_123', 'data', 'read');
    const canWriteUsers = rbac.hasPermission('user_1', 'tenant_123', 'users', 'write');
    const canDeleteBilling = rbac.hasPermission('user_1', 'tenant_123', 'billing', 'delete');

    expect(canReadData).toBe(true);
    expect(canWriteUsers).toBe(true);
    expect(canDeleteBilling).toBe(true);
  });

  // Test 28: Viewer read-only access
  it('should limit viewer to read-only', () => {
    rbac.assignRole('user_1', 'tenant_123', 'viewer');

    const canRead = rbac.hasPermission('user_1', 'tenant_123', 'data', 'read');
    const canWrite = rbac.hasPermission('user_1', 'tenant_123', 'data', 'write');

    expect(canRead).toBe(true);
    expect(canWrite).toBe(false);
  });

  // Test 29: Multiple roles for user
  it('should support multiple roles per user', () => {
    rbac.assignRole('user_1', 'tenant_123', 'editor');
    rbac.assignRole('user_1', 'tenant_123', 'viewer');

    const userRoles = rbac.getUserRoles('user_1', 'tenant_123');

    expect(userRoles.length).toBe(2);
  });

  // Test 30: Remove user role
  it('should remove role from user', () => {
    rbac.assignRole('user_1', 'tenant_123', 'admin');

    rbac.removeUserRole('user_1', 'tenant_123', 'admin');

    const userRoles = rbac.getUserRoles('user_1', 'tenant_123');

    expect(userRoles.some(r => r.roleId === 'admin')).toBe(false);
  });

  // Test 31: Expired role assignment
  it('should respect role expiration', () => {
    const expiresAt = Date.now() - 1000; // Already expired

    rbac.assignRole('user_1', 'tenant_123', 'admin', expiresAt);

    const hasPermission = rbac.hasPermission('user_1', 'tenant_123', 'data', 'read');

    expect(hasPermission).toBe(false);
  });

  // Test 32: Update role permissions
  it('should update custom role permissions', () => {
    const roleId = rbac.createRole('tenant_123', 'Custom Role', 'Test', new Map());

    const newPermissions = new Set(['read', 'write']);
    rbac.updateRolePermissions(roleId, 'data', newPermissions);

    const role = rbac.getRole(roleId);

    expect(role!.permissions.get('data')).toEqual(newPermissions);
  });

  // Test 33: Cannot modify built-in roles
  it('should prevent modification of built-in roles', () => {
    expect(() => {
      rbac.updateRolePermissions('admin', 'data', new Set());
    }).toThrow();
  });

  // Test 34: Create resource policy
  it('should create resource-specific policy', () => {
    const policyId = rbac.createResourcePolicy(
      'tenant_123',
      'data',
      'dataset_456',
      'viewer',
      new Set(['read']),
    );

    expect(policyId).toBeDefined();
    expect(policyId).toContain('policy_');
  });

  // Test 35: Get RBAC statistics
  it('should calculate RBAC statistics', () => {
    rbac.createRole('tenant_123', 'Custom Role', 'Test', new Map());

    const stats = rbac.getStats();

    expect(stats.totalRoles).toBeGreaterThan(0);
    expect(stats.builtInRoles).toBe(4); // owner, admin, editor, viewer
  });

  // Test 36: Audit log tracking
  it('should maintain audit log', () => {
    rbac.createRole('tenant_123', 'Custom Role', 'Test', new Map());
    rbac.assignRole('user_1', 'tenant_123', 'admin');

    const log = rbac.getAuditLog();

    expect(log.length).toBeGreaterThan(0);
    expect(log.some(l => l.action === 'create_role')).toBe(true);
  });

  // Test 37: Role with custom permissions
  it('should create role with custom permissions', () => {
    const permissions = new Map([
      ['data', new Set(['read', 'write', 'execute'])],
      ['settings', new Set(['read'])],
    ]);

    const roleId = rbac.createRole('tenant_123', 'Data Ops', 'Data operations', permissions);
    const role = rbac.getRole(roleId);

    expect(role!.permissions.get('data')).toContain('write');
    expect(role!.permissions.get('settings')).toContain('read');
  });

  // Test 38: Admin role limitations
  it('should restrict admin from billing delete', () => {
    rbac.assignRole('user_1', 'tenant_123', 'admin');

    const canDeleteBilling = rbac.hasPermission('user_1', 'tenant_123', 'billing', 'delete');
    const canWriteUsers = rbac.hasPermission('user_1', 'tenant_123', 'users', 'write');

    expect(canDeleteBilling).toBe(false); // Admin can't delete billing
    expect(canWriteUsers).toBe(true);     // Admin can manage users
  });

  // Test 39: Multiple tenants tenant isolation
  it('should isolate roles between tenants', () => {
    rbac.assignRole('user_1', 'tenant_a', 'admin');
    rbac.assignRole('user_1', 'tenant_b', 'viewer');

    const rolesInTenantA = rbac.getUserRoles('user_1', 'tenant_a');
    const rolesInTenantB = rbac.getUserRoles('user_1', 'tenant_b');

    expect(rolesInTenantA.some(r => r.roleId === 'admin')).toBe(true);
    expect(rolesInTenantB.some(r => r.roleId === 'viewer')).toBe(true);
  });

  // Test 40: Editor role capabilities
  it('should grant editor appropriate permissions', () => {
    rbac.assignRole('user_1', 'tenant_123', 'editor');

    const canEditData = rbac.hasPermission('user_1', 'tenant_123', 'data', 'write');
    const canManageUsers = rbac.hasPermission('user_1', 'tenant_123', 'users', 'write');

    expect(canEditData).toBe(true);
    expect(canManageUsers).toBe(false); // Editors can't manage users
  });
});
