# Phase 73 - AI Commercial Engine (ACE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase73-ai-commercial-engine`

## Executive Summary

Phase 73 provides an autonomous system for pricing, packaging, and positioning products/services. Generates commercial playbooks, value propositions, and go-to-market strategies.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Dynamic Pricing | Yes |
| Value Propositions | Yes |
| Go-to-Market | Yes |
| ROI Tracking | Yes |
| Strategy Generation | Yes |

## Database Schema

### Migration 125: AI Commercial Engine

```sql
-- 125_ai_commercial_engine.sql

-- Commercial offers table
CREATE TABLE IF NOT EXISTS commercial_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  offer_name TEXT NOT NULL,
  category TEXT NOT NULL,
  target_market TEXT,
  base_price NUMERIC NOT NULL DEFAULT 0,
  dynamic_price NUMERIC,
  value_proposition TEXT,
  generated_strategy JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT commercial_offers_status_check CHECK (
    status IN ('draft', 'active', 'paused', 'retired')
  ),

  -- Foreign key
  CONSTRAINT commercial_offers_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_commercial_offers_org ON commercial_offers(org_id);
CREATE INDEX IF NOT EXISTS idx_commercial_offers_category ON commercial_offers(category);
CREATE INDEX IF NOT EXISTS idx_commercial_offers_status ON commercial_offers(status);
CREATE INDEX IF NOT EXISTS idx_commercial_offers_created ON commercial_offers(created_at DESC);

-- Enable RLS
ALTER TABLE commercial_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY commercial_offers_select ON commercial_offers
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY commercial_offers_insert ON commercial_offers
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY commercial_offers_update ON commercial_offers
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE commercial_offers IS 'Commercial offers and pricing (Phase 73)';

-- Offer performance table
CREATE TABLE IF NOT EXISTS offer_performance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_id UUID NOT NULL,
  period TEXT NOT NULL,
  conversions INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC NOT NULL DEFAULT 0,
  roi_score NUMERIC NOT NULL DEFAULT 0,
  insights JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),

  -- ROI score check
  CONSTRAINT offer_performance_roi_check CHECK (
    roi_score >= 0
  ),

  -- Foreign key
  CONSTRAINT offer_performance_offer_fk
    FOREIGN KEY (offer_id) REFERENCES commercial_offers(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_offer_performance_offer ON offer_performance(offer_id);
CREATE INDEX IF NOT EXISTS idx_offer_performance_period ON offer_performance(period);
CREATE INDEX IF NOT EXISTS idx_offer_performance_roi ON offer_performance(roi_score DESC);
CREATE INDEX IF NOT EXISTS idx_offer_performance_recorded ON offer_performance(recorded_at DESC);

-- Enable RLS
ALTER TABLE offer_performance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY offer_performance_select ON offer_performance
  FOR SELECT TO authenticated
  USING (offer_id IN (
    SELECT id FROM commercial_offers
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY offer_performance_insert ON offer_performance
  FOR INSERT TO authenticated
  WITH CHECK (offer_id IN (
    SELECT id FROM commercial_offers
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE offer_performance IS 'Offer performance metrics (Phase 73)';
```

## Commercial Engine Service

```typescript
// src/lib/commercial/commercial-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface CommercialOffer {
  id: string;
  orgId: string;
  offerName: string;
  category: string;
  targetMarket?: string;
  basePrice: number;
  dynamicPrice?: number;
  valueProposition?: string;
  generatedStrategy: Record<string, any>;
  status: string;
  createdAt: Date;
}

interface OfferPerformance {
  id: string;
  offerId: string;
  period: string;
  conversions: number;
  revenue: number;
  roiScore: number;
  insights: Record<string, any>;
  recordedAt: Date;
}

interface CommercialPlaybook {
  positioning: string;
  valueProps: string[];
  pricingStrategy: string;
  targetSegments: string[];
  channels: string[];
  competitiveAdvantages: string[];
}

const OFFER_CATEGORIES = [
  'service',
  'product',
  'subscription',
  'consultation',
  'training',
  'maintenance',
  'other',
];

export class CommercialEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async createOffer(
    offerName: string,
    category: string,
    basePrice: number,
    targetMarket?: string,
    valueProposition?: string
  ): Promise<CommercialOffer> {
    const supabase = await getSupabaseServer();

    // Generate initial strategy
    const strategy = await this.generateStrategy(offerName, category, targetMarket);

    const { data } = await supabase
      .from('commercial_offers')
      .insert({
        org_id: this.orgId,
        offer_name: offerName,
        category,
        target_market: targetMarket,
        base_price: basePrice,
        value_proposition: valueProposition,
        generated_strategy: strategy,
        status: 'draft',
      })
      .select()
      .single();

    return this.mapToOffer(data);
  }

  private async generateStrategy(
    offerName: string,
    category: string,
    targetMarket?: string
  ): Promise<Record<string, any>> {
    // Would call AI to generate comprehensive strategy
    return {
      positioning: `Premium ${category} solution`,
      differentiators: ['Quality', 'Service', 'Innovation'],
      channels: ['Direct sales', 'Referrals', 'Digital'],
      messaging: {
        headline: `Transform your ${targetMarket || 'business'} with ${offerName}`,
        subheadline: 'Industry-leading solution backed by expertise',
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async optimizePrice(offerId: string): Promise<number> {
    const supabase = await getSupabaseServer();

    // Get offer and performance data
    const offer = await this.getOffer(offerId);
    const performance = await this.getPerformance(offerId);

    // Calculate optimal price based on performance
    let optimalPrice = offer.basePrice;

    if (performance.length > 0) {
      const avgRoi = performance.reduce((sum, p) => sum + p.roiScore, 0) / performance.length;
      const avgConversions = performance.reduce((sum, p) => sum + p.conversions, 0) / performance.length;

      // Adjust price based on performance
      if (avgRoi > 150 && avgConversions > 10) {
        optimalPrice = offer.basePrice * 1.15; // Increase by 15%
      } else if (avgRoi < 80 || avgConversions < 3) {
        optimalPrice = offer.basePrice * 0.9; // Decrease by 10%
      }
    }

    // Update dynamic price
    await supabase
      .from('commercial_offers')
      .update({ dynamic_price: optimalPrice })
      .eq('id', offerId);

    return optimalPrice;
  }

  async generatePlaybook(offerId: string): Promise<CommercialPlaybook> {
    const offer = await this.getOffer(offerId);
    const performance = await this.getPerformance(offerId);

    // Generate comprehensive playbook
    return {
      positioning: `${offer.offerName} - Leading ${offer.category} for ${offer.targetMarket || 'businesses'}`,
      valueProps: [
        offer.valueProposition || 'Superior quality and service',
        'Proven track record of success',
        'Expert support included',
        'Competitive pricing',
      ],
      pricingStrategy: performance.length > 0
        ? `Dynamic pricing based on ${performance.length} performance periods`
        : 'Value-based pricing with flexibility',
      targetSegments: [
        offer.targetMarket || 'Small to medium businesses',
        'Growth-focused organizations',
        'Quality-conscious buyers',
      ],
      channels: ['Direct sales', 'Partner network', 'Digital marketing', 'Referrals'],
      competitiveAdvantages: [
        'Industry expertise',
        'Customer-centric approach',
        'Innovative solutions',
        'Strong support infrastructure',
      ],
    };
  }

  async recordPerformance(
    offerId: string,
    period: string,
    conversions: number,
    revenue: number
  ): Promise<OfferPerformance> {
    const supabase = await getSupabaseServer();

    // Calculate ROI score
    const offer = await this.getOffer(offerId);
    const cost = offer.basePrice * conversions * 0.3; // Assume 30% cost
    const roiScore = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;

    // Generate insights
    const insights = {
      avgDealSize: conversions > 0 ? revenue / conversions : 0,
      priceEffectiveness: offer.dynamicPrice
        ? (offer.dynamicPrice / offer.basePrice) * 100
        : 100,
      trend: 'stable',
    };

    const { data } = await supabase
      .from('offer_performance')
      .insert({
        offer_id: offerId,
        period,
        conversions,
        revenue,
        roi_score: roiScore,
        insights,
      })
      .select()
      .single();

    return {
      id: data.id,
      offerId: data.offer_id,
      period: data.period,
      conversions: data.conversions,
      revenue: data.revenue,
      roiScore: data.roi_score,
      insights: data.insights,
      recordedAt: new Date(data.recorded_at),
    };
  }

  async getOffers(status?: string): Promise<CommercialOffer[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('commercial_offers')
      .select('*')
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data } = await query;

    return (data || []).map(o => this.mapToOffer(o));
  }

  async getOffer(offerId: string): Promise<CommercialOffer> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('commercial_offers')
      .select('*')
      .eq('id', offerId)
      .single();

    return this.mapToOffer(data);
  }

  async getPerformance(offerId: string): Promise<OfferPerformance[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('offer_performance')
      .select('*')
      .eq('offer_id', offerId)
      .order('recorded_at', { ascending: false });

    return (data || []).map(p => ({
      id: p.id,
      offerId: p.offer_id,
      period: p.period,
      conversions: p.conversions,
      revenue: p.revenue,
      roiScore: p.roi_score,
      insights: p.insights,
      recordedAt: new Date(p.recorded_at),
    }));
  }

  async updateOfferStatus(offerId: string, status: string): Promise<CommercialOffer> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('commercial_offers')
      .update({ status })
      .eq('id', offerId)
      .select()
      .single();

    return this.mapToOffer(data);
  }

  async getTopPerformers(limit: number = 5): Promise<CommercialOffer[]> {
    const supabase = await getSupabaseServer();

    // Get offers with best ROI
    const { data: performance } = await supabase
      .from('offer_performance')
      .select('offer_id, roi_score')
      .order('roi_score', { ascending: false })
      .limit(limit * 2);

    if (!performance || performance.length === 0) {
      return [];
    }

    const offerIds = [...new Set(performance.map(p => p.offer_id))].slice(0, limit);

    const { data: offers } = await supabase
      .from('commercial_offers')
      .select('*')
      .in('id', offerIds)
      .eq('org_id', this.orgId);

    return (offers || []).map(o => this.mapToOffer(o));
  }

  async getAnalytics(): Promise<{
    totalOffers: number;
    activeOffers: number;
    totalRevenue: number;
    avgRoi: number;
  }> {
    const supabase = await getSupabaseServer();

    const { count: totalOffers } = await supabase
      .from('commercial_offers')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', this.orgId);

    const { count: activeOffers } = await supabase
      .from('commercial_offers')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', this.orgId)
      .eq('status', 'active');

    const { data: performance } = await supabase
      .from('offer_performance')
      .select('revenue, roi_score, offer_id')
      .in('offer_id',
        (await supabase
          .from('commercial_offers')
          .select('id')
          .eq('org_id', this.orgId)
        ).data?.map(o => o.id) || []
      );

    const totalRevenue = (performance || []).reduce((sum, p) => sum + p.revenue, 0);
    const avgRoi = performance && performance.length > 0
      ? performance.reduce((sum, p) => sum + p.roi_score, 0) / performance.length
      : 0;

    return {
      totalOffers: totalOffers || 0,
      activeOffers: activeOffers || 0,
      totalRevenue,
      avgRoi,
    };
  }

  private mapToOffer(data: any): CommercialOffer {
    return {
      id: data.id,
      orgId: data.org_id,
      offerName: data.offer_name,
      category: data.category,
      targetMarket: data.target_market,
      basePrice: data.base_price,
      dynamicPrice: data.dynamic_price,
      valueProposition: data.value_proposition,
      generatedStrategy: data.generated_strategy,
      status: data.status,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## API Endpoints

### POST /api/commercial/offers

Create commercial offer.

### POST /api/commercial/optimize/:offerId

Optimize offer pricing.

### POST /api/commercial/playbook/:offerId

Generate commercial playbook.

### POST /api/commercial/performance

Record performance metrics.

### GET /api/commercial/offers

Get all offers.

### GET /api/commercial/analytics

Get commercial analytics.

### GET /api/commercial/top-performers

Get top performing offers.

## Implementation Tasks

- [ ] Create 125_ai_commercial_engine.sql
- [ ] Implement CommercialEngine
- [ ] Create API endpoints
- [ ] Create OfferBuilder.tsx
- [ ] Create PlaybookViewer.tsx
- [ ] Integrate with Dynamic Pricing (Phase 41)
- [ ] Integrate with Benchmarking (Phase 63)

---

*Phase 73 - AI Commercial Engine Complete*
