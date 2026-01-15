/**
 * Tenant Management Service
 *
 * Handles multi-tenant operations:
 * - Tenant CRUD (create, read, update, delete)
 * - Workspace association
 * - Tenant metadata management
 * - Service mapping (Shopify, GMC, etc.)
 */

import { createClient } from '@supabase/supabase-js';
import { ConfigManager } from '../../utils/config-manager.js';

export interface Tenant {
  id: string;
  workspaceId: string;
  tenantId: string; // Human-readable ID (e.g., "SMB_CLIENT_001")
  name: string;
  type: 'shopify' | 'google-merchant' | 'mixed';
  market: string; // ANZ_SMB, ANZ_ENTERPRISE, US_SMB, UK_SMB
  region: string; // AU-SE1, NZ-NR1, US-EA1, EU-WE1
  status: 'active' | 'inactive' | 'suspended';
  metadata: {
    shopifyShop?: string; // mystore.myshopify.com
    gmcMerchantId?: string; // Google Merchant Center ID
    industry?: string;
    employeeCount?: number;
    website?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantInput {
  tenantId: string;
  name: string;
  type: 'shopify' | 'google-merchant' | 'mixed';
  market?: string;
  region?: string;
  metadata?: Tenant['metadata'];
}

export interface UpdateTenantInput {
  name?: string;
  status?: 'active' | 'inactive' | 'suspended';
  metadata?: Partial<Tenant['metadata']>;
}

export interface TenantListOptions {
  type?: 'shopify' | 'google-merchant' | 'mixed';
  status?: 'active' | 'inactive' | 'suspended';
  market?: string;
  limit?: number;
}

export class TenantManager {
  private supabase: any;
  private configManager: ConfigManager;
  private workspaceId: string;

  constructor() {
    this.configManager = new ConfigManager();

    const config = this.configManager.loadConfig();
    if (!config) {
      throw new Error('Synthex not initialized. Run: synthex init');
    }

    this.workspaceId = config.workspace_id;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      throw new Error('Supabase credentials not configured');
    }
  }

  /**
   * Create a new tenant
   */
  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    // Check if tenant ID already exists
    const { data: existing } = await this.supabase
      .from('synthex_tenants')
      .select('id')
      .eq('workspace_id', this.workspaceId)
      .eq('tenant_id', input.tenantId)
      .single();

    if (existing) {
      throw new Error(`Tenant with ID "${input.tenantId}" already exists`);
    }

    // Get market and region from config or input
    const config = this.configManager.loadConfig()!;
    const market = input.market || config.market;
    const region = input.region || config.region;

    // Create tenant
    const { data, error } = await this.supabase
      .from('synthex_tenants')
      .insert({
        workspace_id: this.workspaceId,
        tenant_id: input.tenantId,
        name: input.name,
        type: input.type,
        market,
        region,
        status: 'active',
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create tenant: ${error.message}`);
    }

    return this.mapTenant(data);
  }

  /**
   * Get tenant by ID
   */
  async getTenant(tenantId: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .from('synthex_tenants')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapTenant(data);
  }

  /**
   * List all tenants with optional filters
   */
  async listTenants(options: TenantListOptions = {}): Promise<Tenant[]> {
    let query = this.supabase
      .from('synthex_tenants')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .order('created_at', { ascending: false });

    if (options.type) {
      query = query.eq('type', options.type);
    }

    if (options.status) {
      query = query.eq('status', options.status);
    }

    if (options.market) {
      query = query.eq('market', options.market);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list tenants: ${error.message}`);
    }

    return (data || []).map((t: any) => this.mapTenant(t));
  }

  /**
   * Update tenant
   */
  async updateTenant(tenantId: string, input: UpdateTenantInput): Promise<Tenant> {
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (input.name) {
      updates.name = input.name;
    }

    if (input.status) {
      updates.status = input.status;
    }

    if (input.metadata) {
      // Merge metadata
      const current = await this.getTenant(tenantId);
      if (!current) {
        throw new Error(`Tenant "${tenantId}" not found`);
      }

      updates.metadata = {
        ...current.metadata,
        ...input.metadata,
      };
    }

    const { data, error } = await this.supabase
      .from('synthex_tenants')
      .update(updates)
      .eq('workspace_id', this.workspaceId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update tenant: ${error.message}`);
    }

    return this.mapTenant(data);
  }

  /**
   * Delete tenant (soft delete by setting status to inactive)
   */
  async deleteTenant(tenantId: string, permanent: boolean = false): Promise<void> {
    if (permanent) {
      // Permanent deletion
      const { error } = await this.supabase
        .from('synthex_tenants')
        .delete()
        .eq('workspace_id', this.workspaceId)
        .eq('tenant_id', tenantId);

      if (error) {
        throw new Error(`Failed to delete tenant: ${error.message}`);
      }
    } else {
      // Soft delete (set status to inactive)
      await this.updateTenant(tenantId, { status: 'inactive' });
    }
  }

  /**
   * Get tenant statistics
   */
  async getTenantStats(tenantId: string): Promise<{
    services: {
      shopify?: {
        connected: boolean;
        shop?: string;
        productsCount?: number;
        ordersCount?: number;
      };
      googleMerchant?: {
        connected: boolean;
        merchantId?: string;
        productsSynced?: number;
        approvedProducts?: number;
      };
    };
    credentials: {
      total: number;
      active: number;
      expired: number;
    };
  }> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant "${tenantId}" not found`);
    }

    const stats: any = {
      services: {},
      credentials: { total: 0, active: 0, expired: 0 },
    };

    // Shopify stats
    if (tenant.type === 'shopify' || tenant.type === 'mixed') {
      const { data: shopifyProducts } = await this.supabase
        .from('shopify_products')
        .select('id', { count: 'exact' })
        .eq('workspace_id', this.workspaceId);

      const { data: shopifyOrders } = await this.supabase
        .from('shopify_orders')
        .select('id', { count: 'exact' })
        .eq('workspace_id', this.workspaceId);

      stats.services.shopify = {
        connected: !!tenant.metadata.shopifyShop,
        shop: tenant.metadata.shopifyShop,
        productsCount: shopifyProducts?.length || 0,
        ordersCount: shopifyOrders?.length || 0,
      };
    }

    // GMC stats
    if (tenant.type === 'google-merchant' || tenant.type === 'mixed') {
      const { data: gmcSync } = await this.supabase
        .from('gmc_product_sync')
        .select('id')
        .eq('workspace_id', this.workspaceId)
        .eq('merchant_id', tenant.metadata.gmcMerchantId || '');

      const { data: gmcStatus } = await this.supabase
        .from('gmc_product_status')
        .select('id')
        .eq('workspace_id', this.workspaceId)
        .eq('merchant_id', tenant.metadata.gmcMerchantId || '')
        .eq('destination_status', 'approved');

      stats.services.googleMerchant = {
        connected: !!tenant.metadata.gmcMerchantId,
        merchantId: tenant.metadata.gmcMerchantId,
        productsSynced: gmcSync?.length || 0,
        approvedProducts: gmcStatus?.length || 0,
      };
    }

    // Credentials stats
    const { data: credentials } = await this.supabase
      .from('credential_registry')
      .select('expires_at')
      .eq('workspace_id', this.workspaceId)
      .eq('tenant_id', tenantId);

    if (credentials) {
      stats.credentials.total = credentials.length;
      const now = new Date();

      for (const cred of credentials) {
        if (!cred.expires_at) {
          stats.credentials.active++;
        } else {
          const expiresAt = new Date(cred.expires_at);
          if (expiresAt > now) {
            stats.credentials.active++;
          } else {
            stats.credentials.expired++;
          }
        }
      }
    }

    return stats;
  }

  /**
   * Get workspace summary
   */
  async getWorkspaceSummary(): Promise<{
    totalTenants: number;
    activeTenants: number;
    inactiveTenants: number;
    byType: { shopify: number; googleMerchant: number; mixed: number };
    byMarket: Record<string, number>;
  }> {
    const { data: tenants } = await this.supabase
      .from('synthex_tenants')
      .select('status, type, market')
      .eq('workspace_id', this.workspaceId);

    if (!tenants) {
      return {
        totalTenants: 0,
        activeTenants: 0,
        inactiveTenants: 0,
        byType: { shopify: 0, googleMerchant: 0, mixed: 0 },
        byMarket: {},
      };
    }

    const summary = {
      totalTenants: tenants.length,
      activeTenants: tenants.filter((t: any) => t.status === 'active').length,
      inactiveTenants: tenants.filter((t: any) => t.status !== 'active').length,
      byType: {
        shopify: tenants.filter((t: any) => t.type === 'shopify').length,
        googleMerchant: tenants.filter((t: any) => t.type === 'google-merchant').length,
        mixed: tenants.filter((t: any) => t.type === 'mixed').length,
      },
      byMarket: {} as Record<string, number>,
    };

    // Count by market
    for (const tenant of tenants) {
      summary.byMarket[tenant.market] = (summary.byMarket[tenant.market] || 0) + 1;
    }

    return summary;
  }

  /**
   * Map database record to Tenant interface
   */
  private mapTenant(data: any): Tenant {
    return {
      id: data.id,
      workspaceId: data.workspace_id,
      tenantId: data.tenant_id,
      name: data.name,
      type: data.type,
      market: data.market,
      region: data.region,
      status: data.status,
      metadata: data.metadata || {},
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
