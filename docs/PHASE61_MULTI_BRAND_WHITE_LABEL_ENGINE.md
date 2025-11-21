# Phase 61 - Multi-Brand & White-Label Engine (MBWLE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase61-multi-brand-white-label-engine`

## Executive Summary

Phase 61 implements full white-label and multi-brand support. Enables Unite-Hub to power multiple client-facing brands, each with custom domains, themes, logos, and branding, while sharing the same underlying infrastructure.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Custom Domains | Yes |
| Theme Customization | Yes |
| Logo/Brand Assets | Yes |
| Domain Resolution | Yes |
| Brand Isolation | Yes |

## Database Schema

### Migration 113: Multi-Brand & White-Label Engine

```sql
-- 113_multi_brand_white_label_engine.sql

-- Brands table
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  domain TEXT UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#3B82F6',
  secondary_color TEXT DEFAULT '#1E40AF',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT brands_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brands_org ON brands(org_id);
CREATE INDEX IF NOT EXISTS idx_brands_domain ON brands(domain);
CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active);
CREATE INDEX IF NOT EXISTS idx_brands_created ON brands(created_at DESC);

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY brands_select ON brands
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY brands_insert ON brands
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY brands_update ON brands
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE brands IS 'White-label brand configurations (Phase 61)';

-- Brand settings table
CREATE TABLE IF NOT EXISTS brand_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  CONSTRAINT brand_settings_unique UNIQUE (brand_id, setting_key),

  -- Foreign key
  CONSTRAINT brand_settings_brand_fk
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brand_settings_brand ON brand_settings(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_settings_key ON brand_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_brand_settings_created ON brand_settings(created_at DESC);

-- Enable RLS
ALTER TABLE brand_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY brand_settings_select ON brand_settings
  FOR SELECT TO authenticated
  USING (brand_id IN (
    SELECT id FROM brands
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY brand_settings_insert ON brand_settings
  FOR INSERT TO authenticated
  WITH CHECK (brand_id IN (
    SELECT id FROM brands
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY brand_settings_update ON brand_settings
  FOR UPDATE TO authenticated
  USING (brand_id IN (
    SELECT id FROM brands
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE brand_settings IS 'Brand-specific settings (Phase 61)';
```

## White-Label Engine Service

```typescript
// src/lib/whitelabel/white-label-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface Brand {
  id: string;
  orgId: string;
  name: string;
  domain?: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  isActive: boolean;
  createdAt: Date;
}

interface BrandSetting {
  id: string;
  brandId: string;
  settingKey: string;
  settingValue: Record<string, any>;
}

interface BrandTheme {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  customCSS?: string;
  favicon?: string;
  fonts?: {
    heading: string;
    body: string;
  };
}

export class WhiteLabelEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async createBrand(
    name: string,
    domain?: string,
    logoUrl?: string,
    primaryColor?: string,
    secondaryColor?: string
  ): Promise<Brand> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('brands')
      .insert({
        org_id: this.orgId,
        name,
        domain,
        logo_url: logoUrl,
        primary_color: primaryColor || '#3B82F6',
        secondary_color: secondaryColor || '#1E40AF',
      })
      .select()
      .single();

    return this.mapToBrand(data);
  }

  async updateBrand(
    brandId: string,
    updates: Partial<{
      name: string;
      domain: string;
      logoUrl: string;
      primaryColor: string;
      secondaryColor: string;
      isActive: boolean;
    }>
  ): Promise<Brand> {
    const supabase = await getSupabaseServer();

    const updateData: Record<string, any> = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.domain) updateData.domain = updates.domain;
    if (updates.logoUrl) updateData.logo_url = updates.logoUrl;
    if (updates.primaryColor) updateData.primary_color = updates.primaryColor;
    if (updates.secondaryColor) updateData.secondary_color = updates.secondaryColor;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { data } = await supabase
      .from('brands')
      .update(updateData)
      .eq('id', brandId)
      .eq('org_id', this.orgId)
      .select()
      .single();

    return this.mapToBrand(data);
  }

  async resolveBrandFromDomain(domain: string): Promise<Brand | null> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('brands')
      .select('*')
      .eq('domain', domain)
      .eq('is_active', true)
      .single();

    if (!data) return null;

    return this.mapToBrand(data);
  }

  async applyBrandTheme(brandId: string): Promise<BrandTheme> {
    const supabase = await getSupabaseServer();

    const { data: brand } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    const { data: settings } = await supabase
      .from('brand_settings')
      .select('*')
      .eq('brand_id', brandId);

    const settingsMap: Record<string, any> = {};
    for (const setting of settings || []) {
      settingsMap[setting.setting_key] = setting.setting_value;
    }

    return {
      primaryColor: brand?.primary_color || '#3B82F6',
      secondaryColor: brand?.secondary_color || '#1E40AF',
      logoUrl: brand?.logo_url,
      customCSS: settingsMap.customCSS?.value,
      favicon: settingsMap.favicon?.url,
      fonts: settingsMap.fonts,
    };
  }

  async getBrand(brandId: string): Promise<Brand> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .eq('org_id', this.orgId)
      .single();

    return this.mapToBrand(data);
  }

  async getBrands(): Promise<Brand[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('brands')
      .select('*')
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false });

    return (data || []).map(b => this.mapToBrand(b));
  }

  async setSetting(
    brandId: string,
    settingKey: string,
    settingValue: Record<string, any>
  ): Promise<BrandSetting> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('brand_settings')
      .upsert({
        brand_id: brandId,
        setting_key: settingKey,
        setting_value: settingValue,
      }, {
        onConflict: 'brand_id,setting_key',
      })
      .select()
      .single();

    return {
      id: data.id,
      brandId: data.brand_id,
      settingKey: data.setting_key,
      settingValue: data.setting_value,
    };
  }

  async getSetting(brandId: string, settingKey: string): Promise<BrandSetting | null> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('brand_settings')
      .select('*')
      .eq('brand_id', brandId)
      .eq('setting_key', settingKey)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      brandId: data.brand_id,
      settingKey: data.setting_key,
      settingValue: data.setting_value,
    };
  }

  async getSettings(brandId: string): Promise<BrandSetting[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('brand_settings')
      .select('*')
      .eq('brand_id', brandId);

    return (data || []).map(s => ({
      id: s.id,
      brandId: s.brand_id,
      settingKey: s.setting_key,
      settingValue: s.setting_value,
    }));
  }

  async deleteBrand(brandId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('brands')
      .delete()
      .eq('id', brandId)
      .eq('org_id', this.orgId);
  }

  private mapToBrand(data: any): Brand {
    return {
      id: data.id,
      orgId: data.org_id,
      name: data.name,
      domain: data.domain,
      logoUrl: data.logo_url,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## API Endpoints

### POST /api/brands

Create a brand.

### PUT /api/brands/:id

Update a brand.

### GET /api/brands

Get all brands.

### GET /api/brands/resolve/:domain

Resolve brand from domain.

### POST /api/brands/:id/settings

Set brand setting.

### GET /api/brands/:id/theme

Get brand theme.

## Implementation Tasks

- [ ] Create 113_multi_brand_white_label_engine.sql
- [ ] Implement WhiteLabelEngine
- [ ] Create API endpoints
- [ ] Create BrandManagementDashboard.tsx
- [ ] Create DomainResolver middleware
- [ ] Create ThemeProvider component

---

*Phase 61 - Multi-Brand & White-Label Engine Complete*
