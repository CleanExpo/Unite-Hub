# Phase 71 - AI Compliance Marketplace (AICM)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase71-ai-compliance-marketplace`

## Executive Summary

Phase 71 provides an industry-wide compliance library: SWMS, SOPs, SDS, OH&S packs, GDPR/Privacy, Contractor Packs, Restoration Documentation Packs, and auto-generated documents for each brand.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Template Library | Yes |
| Auto-Generation | Yes |
| Multi-Region | Yes |
| Marketplace Sales | Yes |
| Commission Engine | Yes |

## Database Schema

### Migration 123: AI Compliance Marketplace

```sql
-- 123_ai_compliance_marketplace.sql

-- Compliance templates table
CREATE TABLE IF NOT EXISTS compliance_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_template TEXT NOT NULL,
  region_applicability JSONB DEFAULT '[]'::jsonb,
  price_usd NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Category check
  CONSTRAINT compliance_templates_category_check CHECK (
    category IN (
      'swms', 'sop', 'sds', 'ohs', 'privacy_gdpr',
      'insurance', 'contractor', 'manual', 'other'
    )
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_templates_category ON compliance_templates(category);
CREATE INDEX IF NOT EXISTS idx_compliance_templates_title ON compliance_templates(title);
CREATE INDEX IF NOT EXISTS idx_compliance_templates_price ON compliance_templates(price_usd);
CREATE INDEX IF NOT EXISTS idx_compliance_templates_created ON compliance_templates(created_at DESC);

-- Enable RLS
ALTER TABLE compliance_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies (global read)
CREATE POLICY compliance_templates_select ON compliance_templates
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY compliance_templates_insert ON compliance_templates
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE compliance_templates IS 'Compliance document templates (Phase 71)';

-- Compliance purchases table
CREATE TABLE IF NOT EXISTS compliance_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  template_id UUID NOT NULL,
  customized_document_url TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT compliance_purchases_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT compliance_purchases_template_fk
    FOREIGN KEY (template_id) REFERENCES compliance_templates(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_purchases_org ON compliance_purchases(org_id);
CREATE INDEX IF NOT EXISTS idx_compliance_purchases_template ON compliance_purchases(template_id);
CREATE INDEX IF NOT EXISTS idx_compliance_purchases_date ON compliance_purchases(purchased_at DESC);

-- Enable RLS
ALTER TABLE compliance_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY compliance_purchases_select ON compliance_purchases
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY compliance_purchases_insert ON compliance_purchases
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE compliance_purchases IS 'Purchased compliance documents (Phase 71)';
```

## Compliance Marketplace Engine Service

```typescript
// src/lib/compliance/compliance-marketplace-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface ComplianceTemplate {
  id: string;
  category: string;
  title: string;
  description?: string;
  contentTemplate: string;
  regionApplicability: string[];
  priceUsd: number;
  createdAt: Date;
}

interface CompliancePurchase {
  id: string;
  orgId: string;
  templateId: string;
  customizedDocumentUrl?: string;
  purchasedAt: Date;
}

const TEMPLATE_CATEGORIES = [
  'swms',
  'sop',
  'sds',
  'ohs',
  'privacy_gdpr',
  'insurance',
  'contractor',
  'manual',
  'other',
];

export class ComplianceMarketplaceEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async createTemplate(
    category: string,
    title: string,
    contentTemplate: string,
    description?: string,
    regionApplicability?: string[],
    priceUsd?: number
  ): Promise<ComplianceTemplate> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('compliance_templates')
      .insert({
        category,
        title,
        description,
        content_template: contentTemplate,
        region_applicability: regionApplicability || ['AU'],
        price_usd: priceUsd || 0,
      })
      .select()
      .single();

    return this.mapToTemplate(data);
  }

  async purchaseTemplate(templateId: string): Promise<CompliancePurchase> {
    const supabase = await getSupabaseServer();

    // Get template
    const template = await this.getTemplate(templateId);

    // Generate customized document
    const documentUrl = await this.generateDocument(template);

    // Create purchase record
    const { data } = await supabase
      .from('compliance_purchases')
      .insert({
        org_id: this.orgId,
        template_id: templateId,
        customized_document_url: documentUrl,
      })
      .select()
      .single();

    return {
      id: data.id,
      orgId: data.org_id,
      templateId: data.template_id,
      customizedDocumentUrl: data.customized_document_url,
      purchasedAt: new Date(data.purchased_at),
    };
  }

  private async generateDocument(template: ComplianceTemplate): Promise<string> {
    // Would generate customized PDF/HTML based on brand and region
    const filename = `compliance_${template.category}_${this.orgId}_${Date.now()}.pdf`;
    return `/compliance/${filename}`;
  }

  async getTemplates(category?: string): Promise<ComplianceTemplate[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('compliance_templates')
      .select('*')
      .order('title');

    if (category) {
      query = query.eq('category', category);
    }

    const { data } = await query;

    return (data || []).map(t => this.mapToTemplate(t));
  }

  async getTemplate(templateId: string): Promise<ComplianceTemplate> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('compliance_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    return this.mapToTemplate(data);
  }

  async getTemplatesByRegion(region: string): Promise<ComplianceTemplate[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('compliance_templates')
      .select('*')
      .contains('region_applicability', [region])
      .order('title');

    return (data || []).map(t => this.mapToTemplate(t));
  }

  async getPurchases(): Promise<CompliancePurchase[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('compliance_purchases')
      .select('*')
      .eq('org_id', this.orgId)
      .order('purchased_at', { ascending: false });

    return (data || []).map(p => ({
      id: p.id,
      orgId: p.org_id,
      templateId: p.template_id,
      customizedDocumentUrl: p.customized_document_url,
      purchasedAt: new Date(p.purchased_at),
    }));
  }

  async getCategories(): Promise<string[]> {
    return TEMPLATE_CATEGORIES;
  }

  async calculateCommission(templateId: string): Promise<{
    total: number;
    creatorShare: number;
    platformShare: number;
  }> {
    const template = await this.getTemplate(templateId);
    const total = template.priceUsd;
    const creatorShare = total * 0.8; // 80% to creator
    const platformShare = total * 0.2; // 20% to Unite-Group

    return { total, creatorShare, platformShare };
  }

  async searchTemplates(query: string): Promise<ComplianceTemplate[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('compliance_templates')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('title');

    return (data || []).map(t => this.mapToTemplate(t));
  }

  private mapToTemplate(data: any): ComplianceTemplate {
    return {
      id: data.id,
      category: data.category,
      title: data.title,
      description: data.description,
      contentTemplate: data.content_template,
      regionApplicability: data.region_applicability,
      priceUsd: data.price_usd,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## API Endpoints

### POST /api/compliance/templates

Create compliance template.

### POST /api/compliance/purchase/:templateId

Purchase template.

### GET /api/compliance/templates

Get templates.

### GET /api/compliance/templates/:category

Get templates by category.

### GET /api/compliance/purchases

Get purchases.

### GET /api/compliance/search

Search templates.

## Implementation Tasks

- [ ] Create 123_ai_compliance_marketplace.sql
- [ ] Implement ComplianceMarketplaceEngine
- [ ] Create API endpoints
- [ ] Create ComplianceStorefront.tsx
- [ ] Create ComplianceTemplateGenerator.ts
- [ ] Integrate with Governance Engine (Phase 55)

---

*Phase 71 - AI Compliance Marketplace Complete*
