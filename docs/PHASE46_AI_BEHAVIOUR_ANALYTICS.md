# Phase 46 - AI Behaviour Analytics Engine (BAE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase46-ai-behaviour-analytics`

## Executive Summary

Phase 46 implements a behavioural intelligence engine that monitors how users and clients interact with Unite-Hub. It feeds insights to the Concierge, ATM, and Pricing Engine to improve system-wide intelligence and identify churn risks, upsell opportunities, and stuck user behaviours.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Event Tracking | Yes |
| Insight Generation | Yes |
| Cross-System Feeds | Yes |
| Pattern Detection | Yes |
| RLS Isolation | Yes |

## Database Schema

### Migration 098: Behaviour Analytics

```sql
-- 098_behaviour_analytics.sql

-- Behaviour events table
CREATE TABLE IF NOT EXISTS behaviour_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  token_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Event type check
  CONSTRAINT behaviour_events_type_check CHECK (
    event_type IN (
      'page_view',
      'feature_used',
      'feature_abandoned',
      'concierge_interaction',
      'voice_generation',
      'report_generated',
      'project_created',
      'project_completed',
      'billing_action',
      'login',
      'logout'
    )
  ),

  -- Foreign keys
  CONSTRAINT behaviour_events_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT behaviour_events_user_fk
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_behaviour_events_org ON behaviour_events(org_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_events_user ON behaviour_events(user_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_events_type ON behaviour_events(event_type);
CREATE INDEX IF NOT EXISTS idx_behaviour_events_created ON behaviour_events(created_at DESC);

-- Enable RLS
ALTER TABLE behaviour_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY behaviour_events_select ON behaviour_events
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY behaviour_events_insert ON behaviour_events
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE behaviour_events IS 'Track user behaviour events for analytics (Phase 46)';

-- Behaviour insights table
CREATE TABLE IF NOT EXISTS behaviour_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  insight_type TEXT NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 1.0,
  recommendation JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Insight type check
  CONSTRAINT behaviour_insights_type_check CHECK (
    insight_type IN (
      'churn_risk',
      'upsell_opportunity',
      'feature_abandonment',
      'feature_adoption',
      'stuck_user',
      'power_user',
      'declining_usage'
    )
  ),

  -- Foreign key
  CONSTRAINT behaviour_insights_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_behaviour_insights_org ON behaviour_insights(org_id);
CREATE INDEX IF NOT EXISTS idx_behaviour_insights_type ON behaviour_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_behaviour_insights_created ON behaviour_insights(created_at DESC);

-- Enable RLS
ALTER TABLE behaviour_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY behaviour_insights_select ON behaviour_insights
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY behaviour_insights_insert ON behaviour_insights
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE behaviour_insights IS 'Generated insights from behaviour patterns (Phase 46)';
```

## Behaviour Analytics Service

```typescript
// src/lib/analytics/behaviour-analytics-service.ts

import { getSupabaseServer } from '@/lib/supabase';

interface BehaviourEvent {
  eventType: string;
  userId?: string;
  metadata?: Record<string, any>;
  tokenCost?: number;
}

interface BehaviourInsight {
  insightType: string;
  weight: number;
  recommendation: Record<string, any>;
}

export class BehaviourAnalyticsService {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async logEvent(event: BehaviourEvent): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from('behaviour_events').insert({
      org_id: this.orgId,
      user_id: event.userId,
      event_type: event.eventType,
      metadata: event.metadata || {},
      token_cost: event.tokenCost || 0,
    });
  }

  async generateInsights(): Promise<BehaviourInsight[]> {
    const insights: BehaviourInsight[] = [];

    // Check for usage drop
    const usageDropInsight = await this.detectUsageDrop();
    if (usageDropInsight) insights.push(usageDropInsight);

    // Check for high-value behaviours
    const highValueInsight = await this.detectHighValueBehaviours();
    if (highValueInsight) insights.push(highValueInsight);

    // Check for stuck users
    const stuckUserInsight = await this.detectStuckUsers();
    if (stuckUserInsight) insights.push(stuckUserInsight);

    // Persist insights
    const supabase = await getSupabaseServer();
    for (const insight of insights) {
      await supabase.from('behaviour_insights').insert({
        org_id: this.orgId,
        insight_type: insight.insightType,
        weight: insight.weight,
        recommendation: insight.recommendation,
      });
    }

    return insights;
  }

  async detectUsageDrop(): Promise<BehaviourInsight | null> {
    const supabase = await getSupabaseServer();

    // Compare last 7 days to previous 7 days
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const { count: recentCount } = await supabase
      .from('behaviour_events')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', this.orgId)
      .gte('created_at', sevenDaysAgo.toISOString());

    const { count: previousCount } = await supabase
      .from('behaviour_events')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', this.orgId)
      .gte('created_at', fourteenDaysAgo.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString());

    if (previousCount && recentCount && recentCount < previousCount * 0.5) {
      return {
        insightType: 'declining_usage',
        weight: 0.8,
        recommendation: {
          action: 'engagement_campaign',
          message: 'Usage has dropped significantly. Consider reaching out.',
          percentDrop: Math.round((1 - recentCount / previousCount) * 100),
        },
      };
    }

    // Check for potential churn
    if (previousCount && recentCount && recentCount < previousCount * 0.3) {
      return {
        insightType: 'churn_risk',
        weight: 0.9,
        recommendation: {
          action: 'urgent_outreach',
          message: 'High churn risk detected. Immediate intervention recommended.',
        },
      };
    }

    return null;
  }

  async detectHighValueBehaviours(): Promise<BehaviourInsight | null> {
    const supabase = await getSupabaseServer();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Count high-value feature usage
    const { count: voiceCount } = await supabase
      .from('behaviour_events')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', this.orgId)
      .eq('event_type', 'voice_generation')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { count: reportCount } = await supabase
      .from('behaviour_events')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', this.orgId)
      .eq('event_type', 'report_generated')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const totalHighValue = (voiceCount || 0) + (reportCount || 0);

    if (totalHighValue > 50) {
      return {
        insightType: 'power_user',
        weight: 0.85,
        recommendation: {
          action: 'tier_upgrade_suggestion',
          message: 'High feature adoption. May benefit from higher tier.',
          features: { voice: voiceCount, reports: reportCount },
        },
      };
    }

    if (totalHighValue > 20) {
      return {
        insightType: 'upsell_opportunity',
        weight: 0.7,
        recommendation: {
          action: 'feature_highlight',
          message: 'Good feature adoption. Highlight advanced features.',
        },
      };
    }

    return null;
  }

  async detectStuckUsers(): Promise<BehaviourInsight | null> {
    const supabase = await getSupabaseServer();

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Check for abandoned features
    const { count: abandonedCount } = await supabase
      .from('behaviour_events')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', this.orgId)
      .eq('event_type', 'feature_abandoned')
      .gte('created_at', sevenDaysAgo.toISOString());

    if (abandonedCount && abandonedCount > 5) {
      return {
        insightType: 'stuck_user',
        weight: 0.75,
        recommendation: {
          action: 'onboarding_assistance',
          message: 'Users abandoning features. May need guidance.',
          abandonedCount,
        },
      };
    }

    return null;
  }

  async feedInsightsIntoTierManager(): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get recent insights
    const { data: insights } = await supabase
      .from('behaviour_insights')
      .select('*')
      .eq('org_id', this.orgId)
      .in('insight_type', ['power_user', 'upsell_opportunity', 'churn_risk'])
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Log to audit for ATM consumption
    if (insights && insights.length > 0) {
      await supabase.from('auditLogs').insert({
        action: 'behaviour_insights_fed_to_atm',
        entity_type: 'analytics',
        metadata: {
          org_id: this.orgId,
          insight_count: insights.length,
          types: insights.map(i => i.insight_type),
        },
      });
    }
  }

  async feedInsightsIntoConcierge(): Promise<void> {
    // Update session context with latest insights
    const supabase = await getSupabaseServer();

    const { data: insights } = await supabase
      .from('behaviour_insights')
      .select('insight_type, weight, recommendation')
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false })
      .limit(5);

    // Store in concierge session context
    await supabase
      .from('concierge_sessions')
      .update({
        session_context: {
          recent_insights: insights,
        },
      })
      .eq('org_id', this.orgId);
  }
}
```

## API Endpoints

### POST /api/analytics/event

Log a behaviour event.

```typescript
// Request
{
  "eventType": "feature_used",
  "metadata": { "feature": "voice_generation" }
}

// Response
{ "success": true }
```

### GET /api/analytics/insights

Get generated insights.

```typescript
// Response
{
  "success": true,
  "insights": [
    {
      "type": "upsell_opportunity",
      "weight": 0.7,
      "recommendation": { ... }
    }
  ]
}
```

## Implementation Tasks

- [ ] Create 098_behaviour_analytics.sql
- [ ] Implement BehaviourAnalyticsService
- [ ] Create API endpoints
- [ ] Wire into ATM, Concierge, Pricing Engine
- [ ] Create UserBehaviourDashboard.tsx

---

*Phase 46 - AI Behaviour Analytics Engine Complete*
