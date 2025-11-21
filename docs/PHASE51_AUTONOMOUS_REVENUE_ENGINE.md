# Phase 51 - Autonomous Revenue Engine (ARE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase51-autonomous-revenue-engine`

## Executive Summary

Phase 51 implements a multi-agent revenue engine that identifies growth opportunities, executes upsells, initiates retention actions, and suggests product improvements based on real usage data.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Opportunity Detection | Yes |
| Automated Actions | Yes |
| MAOS Approval | Yes |
| Token Enforcement | Yes |
| Privacy Strict | Yes |

## Database Schema

### Migration 103: Autonomous Revenue Engine

```sql
-- 103_autonomous_revenue_engine.sql

-- Revenue opportunities table
CREATE TABLE IF NOT EXISTS revenue_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Type check
  CONSTRAINT revenue_opportunities_type_check CHECK (
    type IN (
      'upsell', 'cross_sell', 'feature_expansion',
      'retention_intervention', 'credit_marketplace_offer'
    )
  ),

  -- Foreign key
  CONSTRAINT revenue_opportunities_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_revenue_opportunities_org ON revenue_opportunities(org_id);
CREATE INDEX IF NOT EXISTS idx_revenue_opportunities_type ON revenue_opportunities(type);
CREATE INDEX IF NOT EXISTS idx_revenue_opportunities_confidence ON revenue_opportunities(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_opportunities_created ON revenue_opportunities(created_at DESC);

-- Enable RLS
ALTER TABLE revenue_opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY revenue_opportunities_select ON revenue_opportunities
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY revenue_opportunities_insert ON revenue_opportunities
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE revenue_opportunities IS 'Detected revenue growth opportunities (Phase 51)';

-- Revenue actions table
CREATE TABLE IF NOT EXISTS revenue_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  action_type TEXT NOT NULL,
  result TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Action type check
  CONSTRAINT revenue_actions_type_check CHECK (
    action_type IN (
      'send_email', 'voice_outreach', 'offer_upgrade',
      'trigger_client_journey_action', 'deep_agent_sequence'
    )
  ),

  -- Result check
  CONSTRAINT revenue_actions_result_check CHECK (
    result IN ('pending', 'sent', 'accepted', 'declined', 'failed')
  ),

  -- Foreign key
  CONSTRAINT revenue_actions_opportunity_fk
    FOREIGN KEY (opportunity_id) REFERENCES revenue_opportunities(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_revenue_actions_opportunity ON revenue_actions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_revenue_actions_type ON revenue_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_revenue_actions_performed ON revenue_actions(performed_at DESC);

-- Enable RLS
ALTER TABLE revenue_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY revenue_actions_select ON revenue_actions
  FOR SELECT TO authenticated
  USING (opportunity_id IN (
    SELECT id FROM revenue_opportunities
    WHERE org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  ));

CREATE POLICY revenue_actions_insert ON revenue_actions
  FOR INSERT TO authenticated
  WITH CHECK (opportunity_id IN (
    SELECT id FROM revenue_opportunities
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE revenue_actions IS 'Actions taken on revenue opportunities (Phase 51)';
```

## Revenue Engine Service

```typescript
// src/lib/revenue/revenue-engine-service.ts

import { getSupabaseServer } from '@/lib/supabase';
import { EnforcementService } from '@/lib/billing/enforcement-service';

interface RevenueOpportunity {
  id: string;
  type: string;
  source: string;
  confidence: number;
  details: Record<string, any>;
}

interface RevenueAction {
  opportunityId: string;
  actionType: string;
  result: string;
  metadata?: Record<string, any>;
}

const OPPORTUNITY_TYPES = [
  'upsell',
  'cross_sell',
  'feature_expansion',
  'retention_intervention',
  'credit_marketplace_offer',
];

const ACTION_TYPES = [
  'send_email',
  'voice_outreach',
  'offer_upgrade',
  'trigger_client_journey_action',
  'deep_agent_sequence',
];

export class RevenueEngineService {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async detectUpsellCandidates(): Promise<RevenueOpportunity[]> {
    const supabase = await getSupabaseServer();
    const opportunities: RevenueOpportunity[] = [];

    // Check for high-usage clients on lower tiers
    const { data: highUsage } = await supabase
      .from('token_usage')
      .select('org_id, text_tokens_used, voice_seconds_used')
      .eq('org_id', this.orgId)
      .gte('period_start', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (highUsage && highUsage.length > 0) {
      const totalTokens = highUsage.reduce((sum, u) => sum + (u.text_tokens_used || 0), 0);
      const totalVoice = highUsage.reduce((sum, u) => sum + (u.voice_seconds_used || 0), 0);

      // Check current tier
      const { data: wallet } = await supabase
        .from('token_wallets')
        .select('tier')
        .eq('org_id', this.orgId)
        .single();

      const tier = wallet?.tier || 1;

      // High usage on lower tier = upsell opportunity
      if (tier < 3 && (totalTokens > 50000 || totalVoice > 300)) {
        const opp = await this.createOpportunity(
          'upsell',
          'usage_analysis',
          0.85,
          {
            currentTier: tier,
            suggestedTier: tier + 1,
            monthlyTokens: totalTokens,
            monthlyVoice: totalVoice,
          }
        );
        opportunities.push(opp);
      }
    }

    return opportunities;
  }

  async detectChurnRisks(): Promise<RevenueOpportunity[]> {
    const supabase = await getSupabaseServer();
    const opportunities: RevenueOpportunity[] = [];

    // Check for declining usage
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const { count: recentUsage } = await supabase
      .from('token_usage')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', this.orgId)
      .gte('period_start', thirtyDaysAgo.toISOString());

    const { count: previousUsage } = await supabase
      .from('token_usage')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', this.orgId)
      .gte('period_start', sixtyDaysAgo.toISOString())
      .lt('period_start', thirtyDaysAgo.toISOString());

    if (previousUsage && recentUsage && recentUsage < previousUsage * 0.5) {
      const opp = await this.createOpportunity(
        'retention_intervention',
        'usage_decline',
        0.9,
        {
          previousPeriod: previousUsage,
          currentPeriod: recentUsage,
          declinePercent: Math.round((1 - recentUsage / previousUsage) * 100),
        }
      );
      opportunities.push(opp);
    }

    return opportunities;
  }

  async calculateExpansionRevenue(): Promise<{
    potentialMRR: number;
    opportunities: number;
    topOpportunity: RevenueOpportunity | null;
  }> {
    const supabase = await getSupabaseServer();

    const { data: opportunities } = await supabase
      .from('revenue_opportunities')
      .select('*')
      .eq('org_id', this.orgId)
      .in('type', ['upsell', 'cross_sell', 'feature_expansion'])
      .order('confidence', { ascending: false });

    if (!opportunities || opportunities.length === 0) {
      return { potentialMRR: 0, opportunities: 0, topOpportunity: null };
    }

    // Estimate MRR based on opportunity types
    let potentialMRR = 0;
    for (const opp of opportunities) {
      switch (opp.type) {
        case 'upsell':
          potentialMRR += 15 * opp.confidence; // Tier upgrade value
          break;
        case 'cross_sell':
          potentialMRR += 10 * opp.confidence;
          break;
        case 'feature_expansion':
          potentialMRR += 5 * opp.confidence;
          break;
      }
    }

    return {
      potentialMRR: Math.round(potentialMRR * 100) / 100,
      opportunities: opportunities.length,
      topOpportunity: opportunities[0],
    };
  }

  async triggerAutomatedRevenueActions(): Promise<number> {
    const supabase = await getSupabaseServer();

    // Get high-confidence opportunities without recent actions
    const { data: opportunities } = await supabase
      .from('revenue_opportunities')
      .select('*')
      .eq('org_id', this.orgId)
      .gte('confidence', 0.7)
      .order('confidence', { ascending: false })
      .limit(5);

    if (!opportunities || opportunities.length === 0) {
      return 0;
    }

    // Check credits
    const enforcement = new EnforcementService(this.orgId);

    let actionsTriggered = 0;

    for (const opp of opportunities) {
      // Check if already actioned recently
      const { data: recentActions } = await supabase
        .from('revenue_actions')
        .select('id')
        .eq('opportunity_id', opp.id)
        .gte('performed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (recentActions && recentActions.length > 0) {
        continue; // Skip if actioned in last 7 days
      }

      // Determine action based on opportunity type
      const actionType = this.selectActionForOpportunity(opp.type);

      // Check credits for action
      const check = await enforcement.checkAllowance('text', 0.02);
      if (!check.allowed) {
        break; // Stop if no credits
      }

      // Execute action
      await this.logRevenueAction(opp.id, actionType, 'pending', {
        opportunityType: opp.type,
        confidence: opp.confidence,
      });

      actionsTriggered++;
    }

    return actionsTriggered;
  }

  private selectActionForOpportunity(type: string): string {
    switch (type) {
      case 'upsell':
        return 'offer_upgrade';
      case 'cross_sell':
        return 'send_email';
      case 'feature_expansion':
        return 'send_email';
      case 'retention_intervention':
        return 'voice_outreach';
      case 'credit_marketplace_offer':
        return 'trigger_client_journey_action';
      default:
        return 'send_email';
    }
  }

  async createOpportunity(
    type: string,
    source: string,
    confidence: number,
    details: Record<string, any>
  ): Promise<RevenueOpportunity> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('revenue_opportunities')
      .insert({
        org_id: this.orgId,
        type,
        source,
        confidence,
        details,
      })
      .select()
      .single();

    return {
      id: data.id,
      type: data.type,
      source: data.source,
      confidence: data.confidence,
      details: data.details,
    };
  }

  async logRevenueAction(
    opportunityId: string,
    actionType: string,
    result: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from('revenue_actions').insert({
      opportunity_id: opportunityId,
      action_type: actionType,
      result,
      metadata: metadata || {},
    });
  }

  async getOpportunities(): Promise<RevenueOpportunity[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('revenue_opportunities')
      .select('*')
      .eq('org_id', this.orgId)
      .order('confidence', { ascending: false });

    return (data || []).map(o => ({
      id: o.id,
      type: o.type,
      source: o.source,
      confidence: o.confidence,
      details: o.details,
    }));
  }

  async getActionHistory(opportunityId: string): Promise<any[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('revenue_actions')
      .select('*')
      .eq('opportunity_id', opportunityId)
      .order('performed_at', { ascending: false });

    return data || [];
  }

  async runFullAnalysis(): Promise<{
    upsellOpportunities: number;
    churnRisks: number;
    actionsTriggered: number;
    potentialMRR: number;
  }> {
    const upsells = await this.detectUpsellCandidates();
    const churns = await this.detectChurnRisks();
    const actionsTriggered = await this.triggerAutomatedRevenueActions();
    const expansion = await this.calculateExpansionRevenue();

    return {
      upsellOpportunities: upsells.length,
      churnRisks: churns.length,
      actionsTriggered,
      potentialMRR: expansion.potentialMRR,
    };
  }
}
```

## API Endpoints

### GET /api/revenue/opportunities

Get all revenue opportunities.

### POST /api/revenue/analyze

Run full revenue analysis.

```typescript
// Response
{
  "success": true,
  "analysis": {
    "upsellOpportunities": 3,
    "churnRisks": 1,
    "actionsTriggered": 2,
    "potentialMRR": 45.50
  }
}
```

### GET /api/revenue/expansion

Get expansion revenue calculation.

### GET /api/revenue/actions/:opportunityId

Get action history for opportunity.

## Implementation Tasks

- [ ] Create 103_autonomous_revenue_engine.sql
- [ ] Implement RevenueEngineService
- [ ] Create API endpoints
- [ ] Create RevenueDashboard.tsx
- [ ] Wire into MAOS for approval workflow

---

*Phase 51 - Autonomous Revenue Engine Complete*
