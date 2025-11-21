# Phase 56 - Strategic Intelligence Engine (SIE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase56-strategic-intelligence-engine`

## Executive Summary

Phase 56 adds AI strategic intelligence to identify opportunities, inefficiencies, client churn risks, revenue gaps, product feature opportunities, and industry trends. Generates weekly and monthly executive insights.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Opportunity Detection | Yes |
| Churn Prediction | Yes |
| Executive Insights | Yes |
| Impact Scoring | Yes |
| Weekly/Monthly Reports | Yes |

## Database Schema

### Migration 108: Strategic Intelligence Engine

```sql
-- 108_strategic_intelligence_engine.sql

-- Strategic insights table
CREATE TABLE IF NOT EXISTS strategic_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  content JSONB NOT NULL,
  confidence INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Confidence check
  CONSTRAINT strategic_insights_confidence_check CHECK (
    confidence >= 1 AND confidence <= 100
  ),

  -- Foreign key
  CONSTRAINT strategic_insights_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strategic_insights_org ON strategic_insights(org_id);
CREATE INDEX IF NOT EXISTS idx_strategic_insights_type ON strategic_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_strategic_insights_created ON strategic_insights(created_at DESC);

-- Enable RLS
ALTER TABLE strategic_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY strategic_insights_select ON strategic_insights
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY strategic_insights_insert ON strategic_insights
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE strategic_insights IS 'AI-generated strategic insights (Phase 56)';

-- Strategic opportunities table
CREATE TABLE IF NOT EXISTS strategic_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_score INTEGER NOT NULL DEFAULT 50,
  confidence INTEGER NOT NULL DEFAULT 50,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Category check
  CONSTRAINT strategic_opportunities_category_check CHECK (
    category IN (
      'revenue_growth', 'client_retention', 'automation_opportunities',
      'workflow_efficiency', 'risk_reduction', 'product_improvement', 'market_trends'
    )
  ),

  -- Score checks
  CONSTRAINT strategic_opportunities_impact_check CHECK (
    impact_score >= 1 AND impact_score <= 100
  ),
  CONSTRAINT strategic_opportunities_confidence_check CHECK (
    confidence >= 1 AND confidence <= 100
  ),

  -- Foreign key
  CONSTRAINT strategic_opportunities_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_strategic_opportunities_org ON strategic_opportunities(org_id);
CREATE INDEX IF NOT EXISTS idx_strategic_opportunities_category ON strategic_opportunities(category);
CREATE INDEX IF NOT EXISTS idx_strategic_opportunities_impact ON strategic_opportunities(impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_strategic_opportunities_created ON strategic_opportunities(created_at DESC);

-- Enable RLS
ALTER TABLE strategic_opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY strategic_opportunities_select ON strategic_opportunities
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY strategic_opportunities_insert ON strategic_opportunities
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE strategic_opportunities IS 'Strategic opportunities with impact scoring (Phase 56)';
```

## Strategic Intelligence Service

```typescript
// src/lib/intelligence/strategic-intelligence-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface StrategicInsight {
  id: string;
  insightType: string;
  content: Record<string, any>;
  confidence: number;
  createdAt: Date;
}

interface StrategicOpportunity {
  id: string;
  category: string;
  description: string;
  impactScore: number;
  confidence: number;
  metadata: Record<string, any>;
}

const INSIGHT_CATEGORIES = [
  'revenue_growth',
  'client_retention',
  'automation_opportunities',
  'workflow_efficiency',
  'risk_reduction',
  'product_improvement',
  'market_trends',
];

export class StrategicIntelligenceEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async generateInsights(): Promise<StrategicInsight[]> {
    const insights: StrategicInsight[] = [];

    // Revenue growth insights
    const revenueInsight = await this.analyzeRevenueGrowth();
    if (revenueInsight) insights.push(revenueInsight);

    // Client retention insights
    const retentionInsight = await this.analyzeClientRetention();
    if (retentionInsight) insights.push(retentionInsight);

    // Automation opportunities
    const automationInsight = await this.identifyAutomationOpportunities();
    if (automationInsight) insights.push(automationInsight);

    // Workflow efficiency
    const efficiencyInsight = await this.analyzeWorkflowEfficiency();
    if (efficiencyInsight) insights.push(efficiencyInsight);

    return insights;
  }

  async analyzeRevenueGrowth(): Promise<StrategicInsight | null> {
    const supabase = await getSupabaseServer();

    // Analyze billing data
    const { data: opportunities } = await supabase
      .from('revenue_opportunities')
      .select('*')
      .eq('org_id', this.orgId);

    if (!opportunities || opportunities.length === 0) return null;

    const content = {
      totalOpportunities: opportunities.length,
      highConfidence: opportunities.filter(o => o.confidence > 0.7).length,
      potentialMRR: opportunities.reduce((sum, o) => sum + (o.details?.value || 0), 0),
      recommendation: 'Focus on high-confidence upsell opportunities',
    };

    return this.saveInsight('revenue_growth', content, 75);
  }

  async analyzeClientRetention(): Promise<StrategicInsight | null> {
    const supabase = await getSupabaseServer();

    // Check for churn risks
    const { data: journeyScores } = await supabase
      .from('client_journey_scores')
      .select('risk_level')
      .eq('org_id', this.orgId)
      .in('risk_level', ['HIGH', 'CRITICAL']);

    const highRiskCount = journeyScores?.length || 0;

    if (highRiskCount === 0) return null;

    const content = {
      highRiskClients: highRiskCount,
      recommendation: `${highRiskCount} clients need retention intervention`,
      suggestedActions: [
        'Schedule check-in calls',
        'Send personalized voice messages',
        'Offer loyalty credits',
      ],
    };

    return this.saveInsight('client_retention', content, 85);
  }

  async identifyAutomationOpportunities(): Promise<StrategicInsight | null> {
    const supabase = await getSupabaseServer();

    // Check workflow execution patterns
    const { data: automations } = await supabase
      .from('automation_executions')
      .select('status')
      .eq('org_id', this.orgId);

    const failedCount = (automations || []).filter(a => a.status === 'failed').length;
    const totalCount = automations?.length || 0;

    if (totalCount === 0) return null;

    const successRate = ((totalCount - failedCount) / totalCount) * 100;

    const content = {
      totalAutomations: totalCount,
      successRate: Math.round(successRate),
      failedCount,
      recommendation: successRate < 90 ? 'Review failing automations' : 'Automation system healthy',
    };

    return this.saveInsight('automation_opportunities', content, 70);
  }

  async analyzeWorkflowEfficiency(): Promise<StrategicInsight | null> {
    // Would analyze task completion times, project progress, etc.
    return null;
  }

  async detectOpportunities(): Promise<StrategicOpportunity[]> {
    const opportunities: StrategicOpportunity[] = [];

    for (const category of INSIGHT_CATEGORIES) {
      const categoryOpps = await this.detectCategoryOpportunities(category);
      opportunities.push(...categoryOpps);
    }

    return opportunities;
  }

  private async detectCategoryOpportunities(category: string): Promise<StrategicOpportunity[]> {
    const opportunities: StrategicOpportunity[] = [];

    // Category-specific detection logic would go here
    // For now, returning empty array

    return opportunities;
  }

  async saveInsight(
    insightType: string,
    content: Record<string, any>,
    confidence: number
  ): Promise<StrategicInsight> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('strategic_insights')
      .insert({
        org_id: this.orgId,
        insight_type: insightType,
        content,
        confidence,
      })
      .select()
      .single();

    return {
      id: data.id,
      insightType: data.insight_type,
      content: data.content,
      confidence: data.confidence,
      createdAt: new Date(data.created_at),
    };
  }

  async saveOpportunity(
    category: string,
    description: string,
    impactScore: number,
    confidence: number,
    metadata?: Record<string, any>
  ): Promise<StrategicOpportunity> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('strategic_opportunities')
      .insert({
        org_id: this.orgId,
        category,
        description,
        impact_score: impactScore,
        confidence,
        metadata: metadata || {},
      })
      .select()
      .single();

    return {
      id: data.id,
      category: data.category,
      description: data.description,
      impactScore: data.impact_score,
      confidence: data.confidence,
      metadata: data.metadata,
    };
  }

  async generateExecutiveSummary(): Promise<Record<string, any>> {
    const insights = await this.getRecentInsights(10);
    const opportunities = await this.getTopOpportunities(5);

    return {
      period: 'Last 7 days',
      generatedAt: new Date().toISOString(),
      keyInsights: insights.map(i => ({
        type: i.insightType,
        summary: i.content.recommendation,
        confidence: i.confidence,
      })),
      topOpportunities: opportunities.map(o => ({
        category: o.category,
        description: o.description,
        impact: o.impactScore,
        confidence: o.confidence,
      })),
      recommendations: this.generateExecutiveRecommendations(insights, opportunities),
    };
  }

  private generateExecutiveRecommendations(
    insights: StrategicInsight[],
    opportunities: StrategicOpportunity[]
  ): string[] {
    const recommendations: string[] = [];

    // High-impact opportunities first
    const highImpact = opportunities.filter(o => o.impactScore > 70);
    if (highImpact.length > 0) {
      recommendations.push(`Prioritize ${highImpact.length} high-impact opportunities`);
    }

    // Add insight-based recommendations
    for (const insight of insights) {
      if (insight.content.recommendation) {
        recommendations.push(insight.content.recommendation);
      }
    }

    return recommendations.slice(0, 5); // Top 5
  }

  async getRecentInsights(limit: number = 10): Promise<StrategicInsight[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('strategic_insights')
      .select('*')
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).map(i => ({
      id: i.id,
      insightType: i.insight_type,
      content: i.content,
      confidence: i.confidence,
      createdAt: new Date(i.created_at),
    }));
  }

  async getTopOpportunities(limit: number = 10): Promise<StrategicOpportunity[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('strategic_opportunities')
      .select('*')
      .eq('org_id', this.orgId)
      .order('impact_score', { ascending: false })
      .limit(limit);

    return (data || []).map(o => ({
      id: o.id,
      category: o.category,
      description: o.description,
      impactScore: o.impact_score,
      confidence: o.confidence,
      metadata: o.metadata,
    }));
  }
}
```

## API Endpoints

### POST /api/intelligence/generate

Generate strategic insights.

### GET /api/intelligence/insights

Get recent insights.

### GET /api/intelligence/opportunities

Get top opportunities.

### GET /api/intelligence/executive-summary

Get executive summary.

## Implementation Tasks

- [ ] Create 108_strategic_intelligence_engine.sql
- [ ] Implement StrategicIntelligenceEngine
- [ ] Create API endpoints
- [ ] Create ExecutiveIntelligenceDashboard.tsx
- [ ] Set up weekly/monthly report generation

---

*Phase 56 - Strategic Intelligence Engine Complete*
