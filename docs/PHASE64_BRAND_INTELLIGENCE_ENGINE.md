# Phase 64 - Brand Intelligence Engine (BIE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase64-brand-intelligence-engine`

## Executive Summary

Phase 64 connects white-label branding, global benchmarks, client behaviour, and industry metadata into a unified brand intelligence layer. Automatically evaluates each client brand's strengths, weaknesses, opportunities and risks.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| SWOT Analysis | Yes |
| Benchmark Integration | Yes |
| Scorecard Generation | Yes |
| Auto Improvement Plans | Yes |
| Risk/Opportunity Alerts | Yes |

## Database Schema

### Migration 116: Brand Intelligence Engine

```sql
-- 116_brand_intelligence_engine.sql

-- Brand insights table
CREATE TABLE IF NOT EXISTS brand_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL,
  org_id UUID NOT NULL,
  period TEXT NOT NULL,
  benchmarks_used JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  opportunities JSONB DEFAULT '[]'::jsonb,
  risks JSONB DEFAULT '[]'::jsonb,
  scorecard JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT brand_insights_brand_fk
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  CONSTRAINT brand_insights_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brand_insights_brand ON brand_insights(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_insights_org ON brand_insights(org_id);
CREATE INDEX IF NOT EXISTS idx_brand_insights_period ON brand_insights(period);
CREATE INDEX IF NOT EXISTS idx_brand_insights_created ON brand_insights(created_at DESC);

-- Enable RLS
ALTER TABLE brand_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY brand_insights_select ON brand_insights
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY brand_insights_insert ON brand_insights
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY brand_insights_update ON brand_insights
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE brand_insights IS 'Brand SWOT analysis and scorecards (Phase 64)';
```

## Brand Intelligence Engine Service

```typescript
// src/lib/intelligence/brand-intelligence-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface BrandInsight {
  id: string;
  brandId: string;
  orgId: string;
  period: string;
  benchmarksUsed: string[];
  strengths: InsightItem[];
  weaknesses: InsightItem[];
  opportunities: InsightItem[];
  risks: InsightItem[];
  scorecard: BrandScorecard;
  createdAt: Date;
}

interface InsightItem {
  title: string;
  description: string;
  evidence: string[];
  severity?: number;
}

interface BrandScorecard {
  brandStrengthScore: number;
  trustScore: number;
  clientExperienceScore: number;
  operationalHealthScore: number;
  revenueOpportunityIndex: number;
  automationReadinessScore: number;
  overall: number;
}

interface ImprovementPlan {
  brandId: string;
  period: string;
  actions: {
    priority: number;
    action: string;
    expectedImpact: string;
    timeline: string;
  }[];
}

export class BrandIntelligenceEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async generateInsights(brandId: string, period: string): Promise<BrandInsight> {
    const supabase = await getSupabaseServer();

    // Gather data from various sources
    const benchmarkData = await this.gatherBenchmarkData(brandId);
    const campaignData = await this.gatherCampaignData();
    const supportData = await this.gatherSupportData();
    const journeyData = await this.gatherJourneyData();

    // Analyze strengths
    const strengths = this.analyzeStrengths(benchmarkData, campaignData);

    // Analyze weaknesses
    const weaknesses = this.analyzeWeaknesses(benchmarkData, supportData);

    // Identify opportunities
    const opportunities = this.identifyOpportunities(benchmarkData, journeyData);

    // Identify risks
    const risks = this.identifyRisks(benchmarkData, supportData);

    // Generate scorecard
    const scorecard = this.generateScorecard(benchmarkData, campaignData, supportData);

    // Save insights
    const { data } = await supabase
      .from('brand_insights')
      .insert({
        brand_id: brandId,
        org_id: this.orgId,
        period,
        benchmarks_used: benchmarkData.dimensions,
        strengths,
        weaknesses,
        opportunities,
        risks,
        scorecard,
      })
      .select()
      .single();

    return this.mapToInsight(data);
  }

  private async gatherBenchmarkData(brandId: string): Promise<{
    dimensions: string[];
    percentiles: Record<string, number>;
  }> {
    // Would fetch from benchmarks table (Phase 63)
    return {
      dimensions: ['response_time', 'task_completion_rate', 'client_satisfaction'],
      percentiles: {
        response_time: 75,
        task_completion_rate: 60,
        client_satisfaction: 80,
      },
    };
  }

  private async gatherCampaignData(): Promise<Record<string, any>> {
    // Would fetch from marketing_campaigns table (Phase 59)
    return {
      activeCampaigns: 3,
      avgConversionRate: 12,
      totalReach: 5000,
    };
  }

  private async gatherSupportData(): Promise<Record<string, any>> {
    // Would fetch from support_tickets table (Phase 60)
    return {
      avgResolutionTime: 4,
      openTickets: 2,
      escalationRate: 5,
    };
  }

  private async gatherJourneyData(): Promise<Record<string, any>> {
    // Would fetch from client_journeys table (Phase 50)
    return {
      avgJourneyLength: 14,
      conversionRate: 25,
      dropoffPoints: ['proposal', 'payment'],
    };
  }

  private analyzeStrengths(
    benchmarks: { percentiles: Record<string, number> },
    campaigns: Record<string, any>
  ): InsightItem[] {
    const strengths: InsightItem[] = [];

    for (const [dim, percentile] of Object.entries(benchmarks.percentiles)) {
      if (percentile >= 75) {
        strengths.push({
          title: `High ${dim.replace(/_/g, ' ')}`,
          description: `Performing in top ${100 - percentile}% of industry`,
          evidence: [`Percentile: ${percentile}%`],
        });
      }
    }

    if (campaigns.avgConversionRate > 10) {
      strengths.push({
        title: 'Strong campaign conversion',
        description: `Conversion rate of ${campaigns.avgConversionRate}% exceeds industry average`,
        evidence: [`${campaigns.activeCampaigns} active campaigns`],
      });
    }

    return strengths;
  }

  private analyzeWeaknesses(
    benchmarks: { percentiles: Record<string, number> },
    support: Record<string, any>
  ): InsightItem[] {
    const weaknesses: InsightItem[] = [];

    for (const [dim, percentile] of Object.entries(benchmarks.percentiles)) {
      if (percentile < 40) {
        weaknesses.push({
          title: `Low ${dim.replace(/_/g, ' ')}`,
          description: `Performing below 40th percentile`,
          evidence: [`Percentile: ${percentile}%`],
          severity: 40 - percentile,
        });
      }
    }

    if (support.escalationRate > 10) {
      weaknesses.push({
        title: 'High support escalation rate',
        description: `${support.escalationRate}% of tickets require escalation`,
        evidence: [`${support.openTickets} open tickets`],
        severity: support.escalationRate,
      });
    }

    return weaknesses;
  }

  private identifyOpportunities(
    benchmarks: { percentiles: Record<string, number> },
    journey: Record<string, any>
  ): InsightItem[] {
    const opportunities: InsightItem[] = [];

    // Check for quick wins
    for (const [dim, percentile] of Object.entries(benchmarks.percentiles)) {
      if (percentile >= 40 && percentile < 60) {
        opportunities.push({
          title: `Improve ${dim.replace(/_/g, ' ')}`,
          description: `Small improvements could move to top quartile`,
          evidence: [`Current percentile: ${percentile}%`],
        });
      }
    }

    // Journey optimization
    if (journey.dropoffPoints.length > 0) {
      opportunities.push({
        title: 'Journey optimization',
        description: `Address dropoff points to improve conversion`,
        evidence: journey.dropoffPoints.map((p: string) => `Dropoff at: ${p}`),
      });
    }

    return opportunities;
  }

  private identifyRisks(
    benchmarks: { percentiles: Record<string, number> },
    support: Record<string, any>
  ): InsightItem[] {
    const risks: InsightItem[] = [];

    // Critical benchmark risks
    for (const [dim, percentile] of Object.entries(benchmarks.percentiles)) {
      if (percentile < 25) {
        risks.push({
          title: `Critical: ${dim.replace(/_/g, ' ')}`,
          description: `Bottom quartile performance requires immediate attention`,
          evidence: [`Percentile: ${percentile}%`],
          severity: 25 - percentile,
        });
      }
    }

    // Support overwhelm risk
    if (support.openTickets > 10) {
      risks.push({
        title: 'Support backlog risk',
        description: `High volume of open tickets may impact client satisfaction`,
        evidence: [`${support.openTickets} open tickets`],
        severity: support.openTickets,
      });
    }

    return risks;
  }

  private generateScorecard(
    benchmarks: { percentiles: Record<string, number> },
    campaigns: Record<string, any>,
    support: Record<string, any>
  ): BrandScorecard {
    const brandStrengthScore = Math.round(
      Object.values(benchmarks.percentiles).reduce((a, b) => a + b, 0) /
      Object.values(benchmarks.percentiles).length
    );

    const trustScore = Math.min(100, benchmarks.percentiles.client_satisfaction || 50);
    const clientExperienceScore = 100 - (support.escalationRate || 0) * 2;
    const operationalHealthScore = benchmarks.percentiles.task_completion_rate || 50;
    const revenueOpportunityIndex = Math.min(100, (campaigns.avgConversionRate || 0) * 5);
    const automationReadinessScore = 70; // Would calculate from automation usage

    const overall = Math.round(
      (brandStrengthScore + trustScore + clientExperienceScore +
       operationalHealthScore + revenueOpportunityIndex + automationReadinessScore) / 6
    );

    return {
      brandStrengthScore,
      trustScore,
      clientExperienceScore,
      operationalHealthScore,
      revenueOpportunityIndex,
      automationReadinessScore,
      overall,
    };
  }

  async generateImprovementPlan(brandId: string): Promise<ImprovementPlan> {
    const supabase = await getSupabaseServer();

    // Get latest insights
    const { data: insight } = await supabase
      .from('brand_insights')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!insight) {
      throw new Error('No insights available for brand');
    }

    const actions: ImprovementPlan['actions'] = [];

    // Priority 1: Address risks
    for (const risk of insight.risks || []) {
      actions.push({
        priority: 1,
        action: `Mitigate: ${risk.title}`,
        expectedImpact: 'Risk reduction',
        timeline: '7 days',
      });
    }

    // Priority 2: Fix weaknesses
    for (const weakness of insight.weaknesses || []) {
      actions.push({
        priority: 2,
        action: `Improve: ${weakness.title}`,
        expectedImpact: 'Performance improvement',
        timeline: '30 days',
      });
    }

    // Priority 3: Capture opportunities
    for (const opportunity of insight.opportunities || []) {
      actions.push({
        priority: 3,
        action: `Pursue: ${opportunity.title}`,
        expectedImpact: 'Growth opportunity',
        timeline: '60 days',
      });
    }

    return {
      brandId,
      period: insight.period,
      actions,
    };
  }

  async getInsights(brandId: string): Promise<BrandInsight[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('brand_insights')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    return (data || []).map(i => this.mapToInsight(i));
  }

  async getLatestInsight(brandId: string): Promise<BrandInsight | null> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('brand_insights')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    return this.mapToInsight(data);
  }

  private mapToInsight(data: any): BrandInsight {
    return {
      id: data.id,
      brandId: data.brand_id,
      orgId: data.org_id,
      period: data.period,
      benchmarksUsed: data.benchmarks_used,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      opportunities: data.opportunities,
      risks: data.risks,
      scorecard: data.scorecard,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## API Endpoints

### POST /api/intelligence/brand/:brandId/generate

Generate brand insights.

### GET /api/intelligence/brand/:brandId/insights

Get brand insights.

### GET /api/intelligence/brand/:brandId/improvement-plan

Get improvement plan.

### GET /api/intelligence/brand/:brandId/scorecard

Get brand scorecard.

## Implementation Tasks

- [ ] Create 116_brand_intelligence_engine.sql
- [ ] Implement BrandIntelligenceEngine
- [ ] Create API endpoints
- [ ] Create BrandInsightsDashboard.tsx
- [ ] Create BrandStrengthsMatrix.tsx
- [ ] Integrate with Concierge AI

---

*Phase 64 - Brand Intelligence Engine Complete*
