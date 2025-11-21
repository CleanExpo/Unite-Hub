# Phase 66 - Strategic Growth Advisor (SGA)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase66-strategic-growth-advisor`

## Executive Summary

Phase 66 transforms benchmarks, brand intelligence, academy data, revenue patterns, and user behaviour into a personalised strategic advisor for each organization. Provides growth plans, risk warnings, opportunity alerts, and automatic roadmap suggestions.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Growth Plans | Yes |
| Risk Warnings | Yes |
| Opportunity Alerts | Yes |
| Roadmap Suggestions | Yes |
| Concierge Integration | Yes |

## Database Schema

### Migration 118: Strategic Growth Advisor

```sql
-- 118_strategic_growth_advisor.sql

-- Advisor recommendations table
CREATE TABLE IF NOT EXISTS advisor_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  brand_id UUID,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  recommendation JSONB NOT NULL,
  evidence JSONB DEFAULT '[]'::jsonb,
  confidence NUMERIC NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Category check
  CONSTRAINT advisor_recommendations_category_check CHECK (
    category IN (
      'marketing', 'operations', 'automation', 'staff_training',
      'customer_success', 'revenue', 'risk_mitigation', 'industry_positioning'
    )
  ),

  -- Priority check
  CONSTRAINT advisor_recommendations_priority_check CHECK (
    priority IN ('low', 'medium', 'high', 'critical')
  ),

  -- Confidence check
  CONSTRAINT advisor_recommendations_confidence_check CHECK (
    confidence >= 0 AND confidence <= 100
  ),

  -- Foreign keys
  CONSTRAINT advisor_recommendations_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT advisor_recommendations_brand_fk
    FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_advisor_recommendations_org ON advisor_recommendations(org_id);
CREATE INDEX IF NOT EXISTS idx_advisor_recommendations_brand ON advisor_recommendations(brand_id);
CREATE INDEX IF NOT EXISTS idx_advisor_recommendations_category ON advisor_recommendations(category);
CREATE INDEX IF NOT EXISTS idx_advisor_recommendations_priority ON advisor_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_advisor_recommendations_created ON advisor_recommendations(created_at DESC);

-- Enable RLS
ALTER TABLE advisor_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY advisor_recommendations_select ON advisor_recommendations
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY advisor_recommendations_insert ON advisor_recommendations
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY advisor_recommendations_update ON advisor_recommendations
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE advisor_recommendations IS 'Strategic growth recommendations (Phase 66)';
```

## Strategic Advisor Engine Service

```typescript
// src/lib/advisor/strategic-advisor-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface AdvisorRecommendation {
  id: string;
  orgId: string;
  brandId?: string;
  category: string;
  priority: string;
  recommendation: RecommendationContent;
  evidence: EvidenceItem[];
  confidence: number;
  createdAt: Date;
}

interface RecommendationContent {
  title: string;
  description: string;
  action: string;
  expectedOutcome: string;
  timeline: string;
}

interface EvidenceItem {
  source: string;
  data: string;
  weight: number;
}

interface GrowthPlan {
  orgId: string;
  brandId?: string;
  period: string;
  phases: {
    days: number;
    focus: string;
    actions: string[];
    metrics: string[];
  }[];
}

const CATEGORIES = [
  'marketing',
  'operations',
  'automation',
  'staff_training',
  'customer_success',
  'revenue',
  'risk_mitigation',
  'industry_positioning',
];

export class StrategicAdvisorEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async generateRecommendations(brandId?: string): Promise<AdvisorRecommendation[]> {
    const supabase = await getSupabaseServer();

    // Gather intelligence from all sources
    const brandInsights = brandId ? await this.getBrandInsights(brandId) : null;
    const academyProgress = await this.getAcademyProgress();
    const benchmarkData = await this.getBenchmarkData();
    const revenueData = await this.getRevenueData();
    const supportData = await this.getSupportData();

    const recommendations: AdvisorRecommendation[] = [];

    // Marketing recommendations
    const marketingRecs = this.analyzeMarketing(brandInsights, benchmarkData);
    for (const rec of marketingRecs) {
      const { data } = await supabase
        .from('advisor_recommendations')
        .insert({
          org_id: this.orgId,
          brand_id: brandId,
          category: 'marketing',
          ...rec,
        })
        .select()
        .single();
      recommendations.push(this.mapToRecommendation(data));
    }

    // Operations recommendations
    const opsRecs = this.analyzeOperations(benchmarkData, supportData);
    for (const rec of opsRecs) {
      const { data } = await supabase
        .from('advisor_recommendations')
        .insert({
          org_id: this.orgId,
          brand_id: brandId,
          category: 'operations',
          ...rec,
        })
        .select()
        .single();
      recommendations.push(this.mapToRecommendation(data));
    }

    // Staff training recommendations
    const trainingRecs = this.analyzeTraining(academyProgress, benchmarkData);
    for (const rec of trainingRecs) {
      const { data } = await supabase
        .from('advisor_recommendations')
        .insert({
          org_id: this.orgId,
          brand_id: brandId,
          category: 'staff_training',
          ...rec,
        })
        .select()
        .single();
      recommendations.push(this.mapToRecommendation(data));
    }

    // Revenue recommendations
    const revenueRecs = this.analyzeRevenue(revenueData, benchmarkData);
    for (const rec of revenueRecs) {
      const { data } = await supabase
        .from('advisor_recommendations')
        .insert({
          org_id: this.orgId,
          brand_id: brandId,
          category: 'revenue',
          ...rec,
        })
        .select()
        .single();
      recommendations.push(this.mapToRecommendation(data));
    }

    // Risk mitigation
    if (brandInsights) {
      const riskRecs = this.analyzeRisks(brandInsights);
      for (const rec of riskRecs) {
        const { data } = await supabase
          .from('advisor_recommendations')
          .insert({
            org_id: this.orgId,
            brand_id: brandId,
            category: 'risk_mitigation',
            ...rec,
          })
          .select()
          .single();
        recommendations.push(this.mapToRecommendation(data));
      }
    }

    return recommendations;
  }

  private async getBrandInsights(brandId: string): Promise<Record<string, any> | null> {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from('brand_insights')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    return data;
  }

  private async getAcademyProgress(): Promise<Record<string, any>> {
    // Would fetch from lesson_progress (Phase 62)
    return { completionRate: 45, certifications: 2 };
  }

  private async getBenchmarkData(): Promise<Record<string, any>> {
    // Would fetch from benchmarks (Phase 63)
    return {
      response_time: 70,
      client_satisfaction: 75,
      automation_usage: 40,
    };
  }

  private async getRevenueData(): Promise<Record<string, any>> {
    // Would fetch from revenue tables (Phases 39-42)
    return { mrr: 5000, growth: 10, churn: 3 };
  }

  private async getSupportData(): Promise<Record<string, any>> {
    // Would fetch from support_tickets (Phase 60)
    return { avgResolutionTime: 4, escalationRate: 8 };
  }

  private analyzeMarketing(
    insights: Record<string, any> | null,
    benchmarks: Record<string, any>
  ): Partial<AdvisorRecommendation>[] {
    const recs: Partial<AdvisorRecommendation>[] = [];

    if (insights?.weaknesses?.some((w: any) => w.title.includes('campaign'))) {
      recs.push({
        priority: 'high',
        recommendation: {
          title: 'Improve campaign performance',
          description: 'Current campaign metrics are below industry average',
          action: 'Analyze top-performing campaigns and replicate patterns',
          expectedOutcome: '20% improvement in conversion rate',
          timeline: '30 days',
        },
        evidence: [{ source: 'Brand Insights', data: 'Campaign weakness detected', weight: 0.8 }],
        confidence: 75,
      });
    }

    return recs;
  }

  private analyzeOperations(
    benchmarks: Record<string, any>,
    support: Record<string, any>
  ): Partial<AdvisorRecommendation>[] {
    const recs: Partial<AdvisorRecommendation>[] = [];

    if (support.escalationRate > 10) {
      recs.push({
        priority: 'high',
        recommendation: {
          title: 'Reduce support escalations',
          description: `Escalation rate of ${support.escalationRate}% is impacting operations`,
          action: 'Implement tier-1 response templates and knowledge base',
          expectedOutcome: '50% reduction in escalations',
          timeline: '14 days',
        },
        evidence: [{ source: 'Support Data', data: `${support.escalationRate}% escalation rate`, weight: 0.9 }],
        confidence: 85,
      });
    }

    return recs;
  }

  private analyzeTraining(
    academy: Record<string, any>,
    benchmarks: Record<string, any>
  ): Partial<AdvisorRecommendation>[] {
    const recs: Partial<AdvisorRecommendation>[] = [];

    if (academy.completionRate < 50) {
      recs.push({
        priority: 'medium',
        recommendation: {
          title: 'Increase training completion',
          description: `Only ${academy.completionRate}% of training completed`,
          action: 'Implement training reminders and gamification',
          expectedOutcome: '75% completion rate',
          timeline: '60 days',
        },
        evidence: [{ source: 'Academy Progress', data: `${academy.completionRate}% completion`, weight: 0.7 }],
        confidence: 70,
      });
    }

    if (benchmarks.automation_usage < 50) {
      recs.push({
        priority: 'high',
        recommendation: {
          title: 'Automation training needed',
          description: 'Low automation adoption indicates training gap',
          action: 'Generate automation curriculum via AACG (Phase 65)',
          expectedOutcome: 'Double automation usage',
          timeline: '45 days',
        },
        evidence: [{ source: 'Benchmarks', data: `${benchmarks.automation_usage}% automation usage`, weight: 0.8 }],
        confidence: 80,
      });
    }

    return recs;
  }

  private analyzeRevenue(
    revenue: Record<string, any>,
    benchmarks: Record<string, any>
  ): Partial<AdvisorRecommendation>[] {
    const recs: Partial<AdvisorRecommendation>[] = [];

    if (revenue.churn > 5) {
      recs.push({
        priority: 'critical',
        recommendation: {
          title: 'Address churn immediately',
          description: `${revenue.churn}% churn rate is eroding revenue`,
          action: 'Implement churn prediction and proactive outreach',
          expectedOutcome: 'Reduce churn to <3%',
          timeline: '30 days',
        },
        evidence: [{ source: 'Revenue Data', data: `${revenue.churn}% monthly churn`, weight: 1.0 }],
        confidence: 90,
      });
    }

    return recs;
  }

  private analyzeRisks(insights: Record<string, any>): Partial<AdvisorRecommendation>[] {
    const recs: Partial<AdvisorRecommendation>[] = [];

    for (const risk of insights.risks || []) {
      recs.push({
        priority: 'critical',
        recommendation: {
          title: `Mitigate: ${risk.title}`,
          description: risk.description,
          action: 'Immediate action required to prevent impact',
          expectedOutcome: 'Risk eliminated or reduced',
          timeline: '7 days',
        },
        evidence: (risk.evidence || []).map((e: string) => ({
          source: 'Brand Insights',
          data: e,
          weight: 0.9,
        })),
        confidence: 85,
      });
    }

    return recs;
  }

  async generateGrowthPlan(brandId?: string): Promise<GrowthPlan> {
    // Get recommendations sorted by priority
    const recs = await this.getRecommendations(brandId);

    const criticalRecs = recs.filter(r => r.priority === 'critical');
    const highRecs = recs.filter(r => r.priority === 'high');
    const mediumRecs = recs.filter(r => r.priority === 'medium');

    return {
      orgId: this.orgId,
      brandId,
      period: '90_days',
      phases: [
        {
          days: 30,
          focus: 'Critical fixes and quick wins',
          actions: criticalRecs.map(r => r.recommendation.action),
          metrics: ['Risk score reduction', 'Churn prevention'],
        },
        {
          days: 60,
          focus: 'High-impact improvements',
          actions: highRecs.map(r => r.recommendation.action),
          metrics: ['Benchmark improvements', 'Revenue growth'],
        },
        {
          days: 90,
          focus: 'Optimization and scaling',
          actions: mediumRecs.map(r => r.recommendation.action),
          metrics: ['Efficiency gains', 'Team performance'],
        },
      ],
    };
  }

  async getRecommendations(brandId?: string): Promise<AdvisorRecommendation[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('advisor_recommendations')
      .select('*')
      .eq('org_id', this.orgId)
      .order('priority', { ascending: true })
      .order('confidence', { ascending: false });

    if (brandId) {
      query = query.eq('brand_id', brandId);
    }

    const { data } = await query;

    return (data || []).map(r => this.mapToRecommendation(r));
  }

  async getRecommendationsByCategory(category: string): Promise<AdvisorRecommendation[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('advisor_recommendations')
      .select('*')
      .eq('org_id', this.orgId)
      .eq('category', category)
      .order('priority', { ascending: true });

    return (data || []).map(r => this.mapToRecommendation(r));
  }

  private mapToRecommendation(data: any): AdvisorRecommendation {
    return {
      id: data.id,
      orgId: data.org_id,
      brandId: data.brand_id,
      category: data.category,
      priority: data.priority,
      recommendation: data.recommendation,
      evidence: data.evidence,
      confidence: data.confidence,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## API Endpoints

### POST /api/advisor/generate

Generate recommendations.

### GET /api/advisor/recommendations

Get recommendations.

### GET /api/advisor/growth-plan

Get 30/60/90 day growth plan.

### GET /api/advisor/category/:category

Get recommendations by category.

## Implementation Tasks

- [ ] Create 118_strategic_growth_advisor.sql
- [ ] Implement StrategicAdvisorEngine
- [ ] Create API endpoints
- [ ] Create GrowthPlanDashboard.tsx
- [ ] Create AdvisorChat.tsx
- [ ] Integrate with Concierge AI

---

*Phase 66 - Strategic Growth Advisor Complete*
