/**
 * Tenant Templates Service
 *
 * Pre-configured tenant setups for common business scenarios:
 * - Shopify SMB (small business)
 * - GMC Enterprise (large merchant)
 * - Mixed Multi-Brand (both platforms)
 * - Marketplace Seller (GMC only)
 * - Custom user-defined templates
 */

import { createClient } from '@supabase/supabase-js';
import { ConfigManager } from '../../utils/config-manager.js';
import { TenantManager, type Tenant, type CreateTenantInput } from '../tenant/tenant-manager.js';

export interface TenantTemplate {
  id: string;
  name: string;
  description: string;
  type: 'shopify' | 'google-merchant' | 'mixed';
  market: string;
  region: string;
  defaultMetadata: Record<string, any>;
  requiredFields: string[];
  optionalFields: string[];
  setupSteps: string[];
  isBuiltin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateInput {
  name: string;
  description: string;
  type: 'shopify' | 'google-merchant' | 'mixed';
  market: string;
  region: string;
  defaultMetadata?: Record<string, any>;
  requiredFields?: string[];
  optionalFields?: string[];
  setupSteps?: string[];
}

export class TenantTemplatesService {
  private supabase: any;
  private configManager: ConfigManager;
  private tenantManager: TenantManager;
  private workspaceId: string;

  // Built-in templates
  private readonly BUILTIN_TEMPLATES: TenantTemplate[] = [
    {
      id: 'shopify-smb-anz',
      name: 'Shopify SMB (ANZ)',
      description: 'Small business Shopify store in Australia/New Zealand market',
      type: 'shopify',
      market: 'ANZ_SMB',
      region: 'AU-SE1',
      defaultMetadata: {
        industry: 'Retail',
      },
      requiredFields: ['tenantId', 'name', 'shopifyShop'],
      optionalFields: ['industry', 'website', 'contactEmail', 'contactPhone'],
      setupSteps: [
        '1. Create tenant with Shopify shop domain',
        '2. Authenticate Shopify via OAuth: synthex auth login --service shopify --tenant-id YOUR_TENANT_ID',
        '3. Sync initial products: synthex shopify sync products --tenant-id YOUR_TENANT_ID',
        '4. Verify credentials: synthex tenant credentials list',
      ],
      isBuiltin: true,
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
    },
    {
      id: 'gmc-enterprise-us',
      name: 'Google Merchant Center Enterprise (US)',
      description: 'Large Google Merchant Center account for US enterprise customers',
      type: 'google-merchant',
      market: 'US_SMB',
      region: 'US-EA1',
      defaultMetadata: {
        industry: 'E-commerce',
      },
      requiredFields: ['tenantId', 'name', 'gmcMerchantId'],
      optionalFields: ['industry', 'website', 'contactEmail', 'contactPhone'],
      setupSteps: [
        '1. Create tenant with Google Merchant Center ID',
        '2. Authenticate GMC via OAuth: synthex auth login --service google-merchant --client-id YOUR_TENANT_ID',
        '3. Sync initial product feed: synthex google-merchant sync feed --tenant-id YOUR_TENANT_ID',
        '4. Check product status: synthex google-merchant products list --tenant-id YOUR_TENANT_ID',
      ],
      isBuiltin: true,
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
    },
    {
      id: 'mixed-multi-brand-anz',
      name: 'Multi-Brand Retailer (ANZ)',
      description: 'Multi-brand retailer using both Shopify and Google Merchant Center in ANZ',
      type: 'mixed',
      market: 'ANZ_SMB',
      region: 'AU-SE1',
      defaultMetadata: {
        industry: 'Retail',
      },
      requiredFields: ['tenantId', 'name', 'shopifyShop', 'gmcMerchantId'],
      optionalFields: ['industry', 'website', 'contactEmail', 'contactPhone'],
      setupSteps: [
        '1. Create tenant with both Shopify shop and GMC ID',
        '2. Authenticate Shopify: synthex auth login --service shopify --tenant-id YOUR_TENANT_ID',
        '3. Authenticate GMC: synthex auth login --service google-merchant --client-id YOUR_TENANT_ID',
        '4. Sync Shopify products: synthex shopify sync products --tenant-id YOUR_TENANT_ID',
        '5. Sync GMC feed: synthex google-merchant sync feed --tenant-id YOUR_TENANT_ID',
        '6. Verify all credentials: synthex tenant credentials list --tenant-id YOUR_TENANT_ID',
      ],
      isBuiltin: true,
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
    },
    {
      id: 'marketplace-seller-uk',
      name: 'Marketplace Seller (UK)',
      description: 'Marketplace-focused seller using Google Merchant Center in UK market',
      type: 'google-merchant',
      market: 'UK_SMB',
      region: 'EU-WE1',
      defaultMetadata: {
        industry: 'Marketplace',
      },
      requiredFields: ['tenantId', 'name', 'gmcMerchantId'],
      optionalFields: ['industry', 'website', 'contactEmail', 'contactPhone'],
      setupSteps: [
        '1. Create tenant with Google Merchant Center ID',
        '2. Authenticate GMC: synthex auth login --service google-merchant --client-id YOUR_TENANT_ID',
        '3. Configure marketplace feed: synthex google-merchant sync feed --tenant-id YOUR_TENANT_ID',
        '4. Monitor product status: synthex google-merchant products list --tenant-id YOUR_TENANT_ID',
      ],
      isBuiltin: true,
      createdAt: '2026-01-15T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
    },
  ];

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

    this.tenantManager = new TenantManager();
  }

  /**
   * List all available templates (built-in + custom)
   */
  async listTemplates(): Promise<TenantTemplate[]> {
    // Get custom templates from database
    const { data: customTemplates } = await this.supabase
      .from('tenant_templates')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .order('created_at', { ascending: false });

    const mapped = (customTemplates || []).map((t: any) => this.mapTemplate(t));

    // Combine built-in and custom templates
    return [...this.BUILTIN_TEMPLATES, ...mapped];
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<TenantTemplate | null> {
    // Check built-in templates first
    const builtin = this.BUILTIN_TEMPLATES.find((t) => t.id === templateId);
    if (builtin) {
      return builtin;
    }

    // Check custom templates
    const { data, error } = await this.supabase
      .from('tenant_templates')
      .select('*')
      .eq('workspace_id', this.workspaceId)
      .eq('id', templateId)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapTemplate(data);
  }

  /**
   * Create tenant from template
   */
  async createTenantFromTemplate(
    templateId: string,
    overrides: Partial<CreateTenantInput> & { tenantId: string; name: string }
  ): Promise<Tenant> {
    const template = await this.getTemplate(templateId);

    if (!template) {
      throw new Error(`Template "${templateId}" not found`);
    }

    // Validate required fields
    for (const field of template.requiredFields) {
      if (field === 'tenantId' || field === 'name') {
        // These are always required in overrides
        continue;
      }

      // Check if required field is in overrides metadata
      if (field === 'shopifyShop' && !overrides.metadata?.shopifyShop) {
        throw new Error(`Required field missing: ${field}`);
      }

      if (field === 'gmcMerchantId' && !overrides.metadata?.gmcMerchantId) {
        throw new Error(`Required field missing: ${field}`);
      }
    }

    // Build create input from template + overrides
    const input: CreateTenantInput = {
      tenantId: overrides.tenantId,
      name: overrides.name,
      type: overrides.type || template.type,
      market: overrides.market || template.market,
      region: overrides.region || template.region,
      metadata: {
        ...template.defaultMetadata,
        ...overrides.metadata,
      },
    };

    return await this.tenantManager.createTenant(input);
  }

  /**
   * Save custom template
   */
  async saveTemplate(input: CreateTemplateInput): Promise<TenantTemplate> {
    const { data, error } = await this.supabase
      .from('tenant_templates')
      .insert({
        workspace_id: this.workspaceId,
        name: input.name,
        description: input.description,
        type: input.type,
        market: input.market,
        region: input.region,
        default_metadata: input.defaultMetadata || {},
        required_fields: input.requiredFields || [],
        optional_fields: input.optionalFields || [],
        setup_steps: input.setupSteps || [],
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save template: ${error.message}`);
    }

    return this.mapTemplate(data);
  }

  /**
   * Delete custom template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    // Prevent deletion of built-in templates
    const builtin = this.BUILTIN_TEMPLATES.find((t) => t.id === templateId);
    if (builtin) {
      throw new Error('Cannot delete built-in template');
    }

    const { error } = await this.supabase
      .from('tenant_templates')
      .delete()
      .eq('workspace_id', this.workspaceId)
      .eq('id', templateId);

    if (error) {
      throw new Error(`Failed to delete template: ${error.message}`);
    }
  }

  /**
   * Map database record to TenantTemplate interface
   */
  private mapTemplate(data: any): TenantTemplate {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      market: data.market,
      region: data.region,
      defaultMetadata: data.default_metadata || {},
      requiredFields: data.required_fields || [],
      optionalFields: data.optional_fields || [],
      setupSteps: data.setup_steps || [],
      isBuiltin: false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}
