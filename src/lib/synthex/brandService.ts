/**
 * Synthex Brand Service
 * Phase B39: White-Label & Multi-Brand Settings
 *
 * Manages multiple brands per tenant with white-label
 * configuration including logos, colors, domains, and
 * per-brand campaign targeting.
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// =====================================================
// Types
// =====================================================

export interface Brand {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description?: string;
  // Visual branding
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  text_color: string;
  background_color: string;
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  // Custom domains
  sending_domain?: string;
  custom_domain?: string;
  // Email settings
  from_name?: string;
  from_email?: string;
  reply_to_email?: string;
  // Status
  is_default: boolean;
  is_active: boolean;
  // Metadata
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BrandFeature {
  id: string;
  brand_id: string;
  feature_key: string;
  enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BrandAsset {
  id: string;
  brand_id: string;
  asset_type: 'logo' | 'icon' | 'background' | 'font' | 'image' | 'video';
  name: string;
  url: string;
  mime_type?: string;
  file_size?: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface BrandTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
}

export interface CreateBrandInput {
  name: string;
  slug?: string;
  description?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  text_color?: string;
  background_color?: string;
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  sending_domain?: string;
  custom_domain?: string;
  from_name?: string;
  from_email?: string;
  reply_to_email?: string;
  is_default?: boolean;
  metadata?: Record<string, unknown>;
}

export interface UpdateBrandInput {
  name?: string;
  slug?: string;
  description?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  text_color?: string;
  background_color?: string;
  logo_url?: string;
  logo_dark_url?: string;
  favicon_url?: string;
  sending_domain?: string;
  custom_domain?: string;
  from_name?: string;
  from_email?: string;
  reply_to_email?: string;
  is_default?: boolean;
  is_active?: boolean;
  metadata?: Record<string, unknown>;
}

// =====================================================
// Brand CRUD
// =====================================================

/**
 * List all brands for a tenant
 */
export async function listBrands(tenantId: string): Promise<Brand[]> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_brands')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to list brands: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a single brand by ID
 */
export async function getBrand(
  brandId: string,
  tenantId: string
): Promise<Brand | null> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_brands')
    .select('*')
    .eq('id', brandId)
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get brand: ${error.message}`);
  }

  return data;
}

/**
 * Create a new brand
 */
export async function createBrand(
  tenantId: string,
  input: CreateBrandInput
): Promise<Brand> {
  const supabase = supabaseAdmin;

  // Generate slug if not provided
  const slug = input.slug || generateSlug(input.name);

  const { data, error } = await supabase
    .from('synthex_brands')
    .insert({
      tenant_id: tenantId,
      name: input.name,
      slug,
      description: input.description,
      primary_color: input.primary_color || '#ff6b35',
      secondary_color: input.secondary_color || '#1a1a2e',
      accent_color: input.accent_color || '#f39c12',
      text_color: input.text_color || '#ffffff',
      background_color: input.background_color || '#0f0f1a',
      logo_url: input.logo_url,
      logo_dark_url: input.logo_dark_url,
      favicon_url: input.favicon_url,
      sending_domain: input.sending_domain,
      custom_domain: input.custom_domain,
      from_name: input.from_name,
      from_email: input.from_email,
      reply_to_email: input.reply_to_email,
      is_default: input.is_default || false,
      is_active: true,
      metadata: input.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create brand: ${error.message}`);
  }

  return data;
}

/**
 * Update a brand
 */
export async function updateBrand(
  brandId: string,
  tenantId: string,
  patch: UpdateBrandInput
): Promise<Brand> {
  const supabase = supabaseAdmin;

  // Verify ownership first
  const existing = await getBrand(brandId, tenantId);
  if (!existing) {
    throw new Error('Brand not found');
  }

  const { data, error } = await supabase
    .from('synthex_brands')
    .update(patch)
    .eq('id', brandId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update brand: ${error.message}`);
  }

  return data;
}

/**
 * Delete a brand
 */
export async function deleteBrand(
  brandId: string,
  tenantId: string
): Promise<void> {
  const supabase = supabaseAdmin;

  // Verify ownership first
  const existing = await getBrand(brandId, tenantId);
  if (!existing) {
    throw new Error('Brand not found');
  }

  if (existing.is_default) {
    throw new Error('Cannot delete the default brand. Set another brand as default first.');
  }

  const { error } = await supabase
    .from('synthex_brands')
    .delete()
    .eq('id', brandId)
    .eq('tenant_id', tenantId);

  if (error) {
    throw new Error(`Failed to delete brand: ${error.message}`);
  }
}

// =====================================================
// Default Brand Management
// =====================================================

/**
 * Set a brand as the default for the tenant
 * (Trigger will unset other defaults)
 */
export async function setDefaultBrand(
  brandId: string,
  tenantId: string
): Promise<Brand> {
  const supabase = supabaseAdmin;

  // Verify ownership first
  const existing = await getBrand(brandId, tenantId);
  if (!existing) {
    throw new Error('Brand not found');
  }

  const { data, error } = await supabase
    .from('synthex_brands')
    .update({ is_default: true })
    .eq('id', brandId)
    .eq('tenant_id', tenantId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to set default brand: ${error.message}`);
  }

  return data;
}

/**
 * Get the default brand for a tenant
 */
export async function getDefaultBrand(tenantId: string): Promise<Brand | null> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_brands')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_default', true)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No default brand, try to get any active brand
      const { data: anyBrand } = await supabase
        .from('synthex_brands')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .limit(1)
        .single();

      return anyBrand || null;
    }
    throw new Error(`Failed to get default brand: ${error.message}`);
  }

  return data;
}

// =====================================================
// Brand Resolution
// =====================================================

/**
 * Get the active brand for a given context (domain or tenant)
 */
export async function getActiveBrandForContext(
  tenantId: string,
  hostHeader?: string
): Promise<Brand | null> {
  const supabase = supabaseAdmin;

  // Try to resolve by custom domain first
  if (hostHeader) {
    const { data: domainBrand } = await supabase
      .from('synthex_brands')
      .select('*')
      .eq('custom_domain', hostHeader)
      .eq('is_active', true)
      .single();

    if (domainBrand) {
      return domainBrand;
    }
  }

  // Fall back to default brand for tenant
  return getDefaultBrand(tenantId);
}

/**
 * Get brand by custom domain
 */
export async function getBrandByDomain(domain: string): Promise<Brand | null> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_brands')
    .select('*')
    .eq('custom_domain', domain)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to get brand by domain: ${error.message}`);
  }

  return data;
}

// =====================================================
// Brand Theme
// =====================================================

/**
 * Get the theme configuration for a brand
 */
export function getBrandTheme(brand: Brand): BrandTheme {
  return {
    primaryColor: brand.primary_color,
    secondaryColor: brand.secondary_color,
    accentColor: brand.accent_color,
    textColor: brand.text_color,
    backgroundColor: brand.background_color,
    logoUrl: brand.logo_url,
    logoDarkUrl: brand.logo_dark_url,
    faviconUrl: brand.favicon_url,
  };
}

/**
 * Get CSS custom properties for a brand theme
 */
export function getBrandCSSVariables(brand: Brand): Record<string, string> {
  return {
    '--brand-primary': brand.primary_color,
    '--brand-secondary': brand.secondary_color,
    '--brand-accent': brand.accent_color,
    '--brand-text': brand.text_color,
    '--brand-background': brand.background_color,
  };
}

// =====================================================
// Brand Features
// =====================================================

/**
 * Get features for a brand
 */
export async function getBrandFeatures(brandId: string): Promise<BrandFeature[]> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_brand_features')
    .select('*')
    .eq('brand_id', brandId);

  if (error) {
    throw new Error(`Failed to get brand features: ${error.message}`);
  }

  return data || [];
}

/**
 * Set a feature for a brand
 */
export async function setBrandFeature(
  brandId: string,
  featureKey: string,
  enabled: boolean,
  config?: Record<string, unknown>
): Promise<BrandFeature> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_brand_features')
    .upsert(
      {
        brand_id: brandId,
        feature_key: featureKey,
        enabled,
        config: config || {},
      },
      {
        onConflict: 'brand_id,feature_key',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to set brand feature: ${error.message}`);
  }

  return data;
}

/**
 * Check if a feature is enabled for a brand
 */
export async function isBrandFeatureEnabled(
  brandId: string,
  featureKey: string
): Promise<boolean> {
  const supabase = supabaseAdmin;

  const { data } = await supabase
    .from('synthex_brand_features')
    .select('enabled')
    .eq('brand_id', brandId)
    .eq('feature_key', featureKey)
    .single();

  return data?.enabled ?? true; // Default to enabled if not set
}

// =====================================================
// Brand Assets
// =====================================================

/**
 * Get assets for a brand
 */
export async function getBrandAssets(
  brandId: string,
  assetType?: string
): Promise<BrandAsset[]> {
  const supabase = supabaseAdmin;

  let query = supabase
    .from('synthex_brand_assets')
    .select('*')
    .eq('brand_id', brandId);

  if (assetType) {
    query = query.eq('asset_type', assetType);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get brand assets: ${error.message}`);
  }

  return data || [];
}

/**
 * Add an asset to a brand
 */
export async function addBrandAsset(
  brandId: string,
  asset: {
    asset_type: BrandAsset['asset_type'];
    name: string;
    url: string;
    mime_type?: string;
    file_size?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<BrandAsset> {
  const supabase = supabaseAdmin;

  const { data, error } = await supabase
    .from('synthex_brand_assets')
    .insert({
      brand_id: brandId,
      ...asset,
      metadata: asset.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add brand asset: ${error.message}`);
  }

  return data;
}

/**
 * Delete a brand asset
 */
export async function deleteBrandAsset(assetId: string): Promise<void> {
  const supabase = supabaseAdmin;

  const { error } = await supabase
    .from('synthex_brand_assets')
    .delete()
    .eq('id', assetId);

  if (error) {
    throw new Error(`Failed to delete brand asset: ${error.message}`);
  }
}

// =====================================================
// Helpers
// =====================================================

/**
 * Generate a URL-safe slug from a name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}
