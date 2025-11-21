# Phase 59 - Autonomous Marketing Engine (AME)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase59-autonomous-marketing-engine`

## Executive Summary

Phase 59 implements autonomous creation, execution, and optimisation of marketing assets for Unite-Hub and client businesses. Produces campaigns, landing pages, funnels, social posts, email sequences, and predictive audience targeting using fully internalised AI engines.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Auto Campaign Generation | Yes |
| Multi-Asset Support | Yes |
| Performance Prediction | Yes |
| AI Asset Generation | Yes |
| Voice/Image Integration | Yes |

## Database Schema

### Migration 111: Autonomous Marketing Engine

```sql
-- 111_autonomous_marketing_engine.sql

-- Marketing campaigns table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  campaign_type TEXT NOT NULL,
  objective TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  performance JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Campaign type check
  CONSTRAINT marketing_campaigns_type_check CHECK (
    campaign_type IN (
      'lead_gen', 'brand_awareness', 'client_retention',
      're_engagement', 'upsell', 'referral'
    )
  ),

  -- Status check
  CONSTRAINT marketing_campaigns_status_check CHECK (
    status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'archived')
  ),

  -- Foreign key
  CONSTRAINT marketing_campaigns_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_org ON marketing_campaigns(org_id);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type ON marketing_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created ON marketing_campaigns(created_at DESC);

-- Enable RLS
ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY marketing_campaigns_select ON marketing_campaigns
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY marketing_campaigns_insert ON marketing_campaigns
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY marketing_campaigns_update ON marketing_campaigns
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE marketing_campaigns IS 'Autonomous marketing campaigns (Phase 59)';

-- Marketing assets table
CREATE TABLE IF NOT EXISTS marketing_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL,
  asset_type TEXT NOT NULL,
  content JSONB NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Asset type check
  CONSTRAINT marketing_assets_type_check CHECK (
    asset_type IN (
      'landing_page', 'email_sequence', 'social_post',
      'video_script', 'ad_creative', 'voice_ad', 'image_asset'
    )
  ),

  -- Foreign key
  CONSTRAINT marketing_assets_campaign_fk
    FOREIGN KEY (campaign_id) REFERENCES marketing_campaigns(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marketing_assets_campaign ON marketing_assets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_type ON marketing_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_created ON marketing_assets(created_at DESC);

-- Enable RLS
ALTER TABLE marketing_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY marketing_assets_select ON marketing_assets
  FOR SELECT TO authenticated
  USING (campaign_id IN (
    SELECT id FROM marketing_campaigns
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY marketing_assets_insert ON marketing_assets
  FOR INSERT TO authenticated
  WITH CHECK (campaign_id IN (
    SELECT id FROM marketing_campaigns
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE marketing_assets IS 'Marketing campaign assets (Phase 59)';
```

## Marketing Engine Service

```typescript
// src/lib/marketing/marketing-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface MarketingCampaign {
  id: string;
  orgId: string;
  campaignType: string;
  objective: string;
  status: string;
  performance: Record<string, any>;
  createdAt: Date;
}

interface MarketingAsset {
  id: string;
  campaignId: string;
  assetType: string;
  content: Record<string, any>;
  metadata: Record<string, any>;
}

const CAMPAIGN_TYPES = [
  'lead_gen',
  'brand_awareness',
  'client_retention',
  're_engagement',
  'upsell',
  'referral',
];

const ASSET_TYPES = [
  'landing_page',
  'email_sequence',
  'social_post',
  'video_script',
  'ad_creative',
  'voice_ad',
  'image_asset',
];

export class MarketingEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async createCampaign(
    campaignType: string,
    objective: string
  ): Promise<MarketingCampaign> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('marketing_campaigns')
      .insert({
        org_id: this.orgId,
        campaign_type: campaignType,
        objective,
      })
      .select()
      .single();

    return this.mapToCampaign(data);
  }

  async generateCampaignAssets(campaignId: string): Promise<MarketingAsset[]> {
    const campaign = await this.getCampaign(campaignId);
    const assets: MarketingAsset[] = [];

    // Generate assets based on campaign type
    const assetTypes = this.getAssetTypesForCampaign(campaign.campaignType);

    for (const assetType of assetTypes) {
      const asset = await this.generateAsset(campaignId, assetType, campaign);
      assets.push(asset);
    }

    return assets;
  }

  private getAssetTypesForCampaign(campaignType: string): string[] {
    const mapping: Record<string, string[]> = {
      lead_gen: ['landing_page', 'email_sequence', 'ad_creative'],
      brand_awareness: ['social_post', 'video_script', 'image_asset'],
      client_retention: ['email_sequence', 'voice_ad'],
      re_engagement: ['email_sequence', 'social_post'],
      upsell: ['email_sequence', 'landing_page'],
      referral: ['email_sequence', 'social_post', 'landing_page'],
    };
    return mapping[campaignType] || ['email_sequence'];
  }

  async generateAsset(
    campaignId: string,
    assetType: string,
    campaign: MarketingCampaign
  ): Promise<MarketingAsset> {
    const supabase = await getSupabaseServer();

    // Generate content based on type
    const content = await this.buildAssetContent(assetType, campaign);

    const { data } = await supabase
      .from('marketing_assets')
      .insert({
        campaign_id: campaignId,
        asset_type: assetType,
        content,
        metadata: {
          generated: true,
          generatedAt: new Date().toISOString(),
        },
      })
      .select()
      .single();

    return {
      id: data.id,
      campaignId: data.campaign_id,
      assetType: data.asset_type,
      content: data.content,
      metadata: data.metadata,
    };
  }

  private async buildAssetContent(
    assetType: string,
    campaign: MarketingCampaign
  ): Promise<Record<string, any>> {
    switch (assetType) {
      case 'landing_page':
        return {
          headline: `Achieve ${campaign.objective}`,
          subheadline: 'Transform your business today',
          cta: 'Get Started',
          sections: ['hero', 'features', 'testimonials', 'cta'],
        };
      case 'email_sequence':
        return {
          emails: [
            { subject: 'Welcome', body: 'Getting started...', day: 0 },
            { subject: 'Quick win', body: 'Here is a tip...', day: 2 },
            { subject: 'Case study', body: 'See how others...', day: 5 },
          ],
        };
      case 'social_post':
        return {
          platforms: ['linkedin', 'twitter'],
          posts: [
            { text: `Did you know? ${campaign.objective}`, hashtags: ['business'] },
          ],
        };
      case 'video_script':
        return {
          duration: '60s',
          script: `Opening hook... Problem... Solution... CTA`,
        };
      case 'ad_creative':
        return {
          headline: campaign.objective,
          description: 'Learn more about how we can help',
          cta: 'Learn More',
        };
      case 'voice_ad':
        return {
          script: `Hey there! Looking to ${campaign.objective}? We can help.`,
          voiceId: 'default',
          duration: '30s',
        };
      case 'image_asset':
        return {
          type: 'banner',
          dimensions: { width: 1200, height: 628 },
          text: campaign.objective,
        };
      default:
        return {};
    }
  }

  async predictPerformance(campaignId: string): Promise<{
    estimatedReach: number;
    estimatedConversions: number;
    confidence: number;
  }> {
    // Would use historical data and ML to predict
    return {
      estimatedReach: 5000,
      estimatedConversions: 250,
      confidence: 75,
    };
  }

  async updateCampaignStatus(campaignId: string, status: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('marketing_campaigns')
      .update({ status })
      .eq('id', campaignId)
      .eq('org_id', this.orgId);
  }

  async getCampaign(campaignId: string): Promise<MarketingCampaign> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('id', campaignId)
      .eq('org_id', this.orgId)
      .single();

    return this.mapToCampaign(data);
  }

  async getCampaigns(): Promise<MarketingCampaign[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('marketing_campaigns')
      .select('*')
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false });

    return (data || []).map(c => this.mapToCampaign(c));
  }

  async getAssets(campaignId: string): Promise<MarketingAsset[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('marketing_assets')
      .select('*')
      .eq('campaign_id', campaignId);

    return (data || []).map(a => ({
      id: a.id,
      campaignId: a.campaign_id,
      assetType: a.asset_type,
      content: a.content,
      metadata: a.metadata,
    }));
  }

  private mapToCampaign(data: any): MarketingCampaign {
    return {
      id: data.id,
      orgId: data.org_id,
      campaignType: data.campaign_type,
      objective: data.objective,
      status: data.status,
      performance: data.performance,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## API Endpoints

### POST /api/marketing/campaign

Create a campaign.

### POST /api/marketing/generate-assets/:id

Generate assets for campaign.

### GET /api/marketing/campaigns

Get campaigns.

### GET /api/marketing/predict/:id

Predict campaign performance.

## Implementation Tasks

- [ ] Create 111_autonomous_marketing_engine.sql
- [ ] Implement MarketingEngine
- [ ] Create API endpoints
- [ ] Create MarketingDashboard.tsx
- [ ] Create AutoCampaignScheduler
- [ ] Create FunnelPerformancePredictor

---

*Phase 59 - Autonomous Marketing Engine Complete*
