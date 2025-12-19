/**
 * M1 Tenant Manager
 *
 * Multi-tenant support with workspace isolation and tenant-specific configurations
 * Manages tenant registration, billing, and feature entitlements
 *
 * Version: v2.5.0
 * Phase: 11E - Enterprise Features
 */

/**
 * Tenant tier/subscription level
 */
export type TenantTier = 'starter' | 'professional' | 'enterprise' | 'custom';

/**
 * Tenant configuration
 */
export interface TenantConfig {
  tenantId: string;
  name: string;
  tier: TenantTier;
  status: 'active' | 'suspended' | 'archived';
  createdAt: number;
  expiresAt?: number;
  features: string[];
  limits: {
    maxUsers: number;
    maxApiCalls: number;
    maxDataRetention: number; // days
    maxStorageGb: number;
  };
  metadata?: Record<string, unknown>;
}

/**
 * Tenant usage metrics
 */
export interface TenantUsage {
  tenantId: string;
  period: 'daily' | 'monthly' | 'annual';
  timestamp: number;
  metrics: {
    activeUsers: number;
    apiCalls: number;
    dataStoredGb: number;
    computeHours: number;
  };
  costEstimate: number;
}

/**
 * Feature entitlement
 */
export interface FeatureEntitlement {
  featureId: string;
  name: string;
  description: string;
  tier: TenantTier[];
  enabled: boolean;
  config?: Record<string, unknown>;
}

/**
 * Tenant Manager
 */
export class TenantManager {
  private tenants: Map<string, TenantConfig> = new Map();
  private tenantUsage: Map<string, TenantUsage[]> = new Map();
  private featureEntitlements: Map<string, FeatureEntitlement> = new Map();
  private tenantApiKeys: Map<string, string> = new Map(); // tenantId -> apiKey

  constructor() {
    this.initializeDefaultFeatures();
  }

  /**
   * Initialize default feature entitlements
   */
  private initializeDefaultFeatures(): void {
    const features: FeatureEntitlement[] = [
      {
        featureId: 'multi_region',
        name: 'Multi-Region Support',
        description: 'Deploy across multiple AWS regions',
        tier: ['professional', 'enterprise', 'custom'],
        enabled: true,
      },
      {
        featureId: 'ml_analytics',
        name: 'ML Analytics',
        description: 'Advanced ML predictions and anomaly detection',
        tier: ['professional', 'enterprise', 'custom'],
        enabled: true,
      },
      {
        featureId: 'compliance',
        name: 'Compliance Suite',
        description: 'GDPR, HIPAA, SOC 2, CCPA, PCI-DSS',
        tier: ['enterprise', 'custom'],
        enabled: true,
      },
      {
        featureId: 'sso',
        name: 'Single Sign-On',
        description: 'SAML/OIDC SSO integration',
        tier: ['professional', 'enterprise', 'custom'],
        enabled: true,
      },
      {
        featureId: 'audit_logging',
        name: 'Audit Logging',
        description: 'Comprehensive audit trails',
        tier: ['professional', 'enterprise', 'custom'],
        enabled: true,
      },
      {
        featureId: 'api_webhooks',
        name: 'API Webhooks',
        description: 'Event-driven webhooks',
        tier: ['starter', 'professional', 'enterprise', 'custom'],
        enabled: true,
      },
      {
        featureId: 'custom_branding',
        name: 'Custom Branding',
        description: 'White-label customization',
        tier: ['enterprise', 'custom'],
        enabled: true,
      },
      {
        featureId: 'dedicated_support',
        name: 'Dedicated Support',
        description: '24/7 dedicated support team',
        tier: ['enterprise', 'custom'],
        enabled: true,
      },
    ];

    features.forEach(f => this.featureEntitlements.set(f.featureId, f));
  }

  /**
   * Create new tenant
   */
  createTenant(config: Omit<TenantConfig, 'tenantId' | 'createdAt'>): string {
    const tenantId = `tenant_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const tenantConfig: TenantConfig = {
      tenantId,
      createdAt: now,
      ...config,
    };

    this.tenants.set(tenantId, tenantConfig);
    this.tenantUsage.set(tenantId, []);

    // Generate API key
    const apiKey = `sk_${tenantId}_${Math.random().toString(36).substring(7)}`;
    this.tenantApiKeys.set(tenantId, apiKey);

    return tenantId;
  }

  /**
   * Get tenant configuration
   */
  getTenant(tenantId: string): TenantConfig | null {
    return this.tenants.get(tenantId) || null;
  }

  /**
   * Update tenant configuration
   */
  updateTenant(tenantId: string, updates: Partial<Omit<TenantConfig, 'tenantId' | 'createdAt'>>): void {
    const tenant = this.tenants.get(tenantId);
    if (tenant) {
      Object.assign(tenant, updates);
    }
  }

  /**
   * Record tenant usage
   */
  recordUsage(tenantId: string, usage: Omit<TenantUsage, 'tenantId' | 'timestamp'>): void {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
return;
}

    const usageRecord: TenantUsage = {
      tenantId,
      timestamp: Date.now(),
      ...usage,
    };

    const tenantUsages = this.tenantUsage.get(tenantId) || [];
    tenantUsages.push(usageRecord);
    this.tenantUsage.set(tenantId, tenantUsages);
  }

  /**
   * Get tenant usage
   */
  getTenantUsage(tenantId: string, limit: number = 100): TenantUsage[] {
    const usages = this.tenantUsage.get(tenantId) || [];
    return usages.slice(-limit);
  }

  /**
   * Check feature entitlement
   */
  hasFeature(tenantId: string, featureId: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
return false;
}

    const feature = this.featureEntitlements.get(featureId);
    if (!feature || !feature.enabled) {
return false;
}

    // Check if feature is included in tenant's tier
    if (!feature.tier.includes(tenant.tier)) {
return false;
}

    // Check if feature is in tenant's enabled features
    return tenant.features.includes(featureId);
  }

  /**
   * Get available features for tier
   */
  getFeaturesByTier(tier: TenantTier): FeatureEntitlement[] {
    return Array.from(this.featureEntitlements.values()).filter(
      f => f.enabled && f.tier.includes(tier),
    );
  }

  /**
   * Get tenant API key
   */
  getApiKey(tenantId: string): string | null {
    return this.tenantApiKeys.get(tenantId) || null;
  }

  /**
   * Validate API key
   */
  validateApiKey(apiKey: string): string | null {
    for (const [tenantId, key] of this.tenantApiKeys) {
      if (key === apiKey) {
        const tenant = this.tenants.get(tenantId);
        if (tenant && tenant.status === 'active') {
          return tenantId;
        }
      }
    }
    return null;
  }

  /**
   * Get all tenants
   */
  getAllTenants(): TenantConfig[] {
    return Array.from(this.tenants.values());
  }

  /**
   * Get tenant statistics
   */
  getTenantStats(): Record<string, unknown> {
    const tenants = Array.from(this.tenants.values());
    const byTier: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    tenants.forEach(t => {
      byTier[t.tier] = (byTier[t.tier] || 0) + 1;
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    });

    return {
      totalTenants: tenants.length,
      activeTenants: tenants.filter(t => t.status === 'active').length,
      byTier,
      byStatus,
    };
  }

  /**
   * Calculate tenant costs
   */
  calculateTenantCost(tenantId: string, period: 'monthly' | 'annual' = 'monthly'): number {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
return 0;
}

    // Base pricing by tier
    const basePricing: Record<TenantTier, number> = {
      starter: 29,
      professional: 99,
      enterprise: 499,
      custom: 0, // Custom pricing
    };

    const baseCost = basePricing[tenant.tier] || 0;

    // Get average usage for last 30 days
    const usages = this.getTenantUsage(tenantId, 30);
    const avgApiCalls = usages.reduce((sum, u) => sum + u.metrics.apiCalls, 0) / (usages.length || 1);

    // Usage overage (per million API calls)
    const overageCost = Math.max(0, avgApiCalls - 10_000_000) * 0.001;

    const totalMonthly = baseCost + overageCost;

    return period === 'annual' ? totalMonthly * 12 * 0.9 : totalMonthly;
  }

  /**
   * Check resource limits
   */
  checkLimits(tenantId: string, metric: 'users' | 'apiCalls' | 'storage', currentValue: number): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
return false;
}

    const limits = tenant.limits;

    switch (metric) {
      case 'users':
        return currentValue <= limits.maxUsers;
      case 'apiCalls':
        return currentValue <= limits.maxApiCalls;
      case 'storage':
        return currentValue <= limits.maxStorageGb;
      default:
        return false;
    }
  }
}

// Export singleton
export const tenantManager = new TenantManager();
