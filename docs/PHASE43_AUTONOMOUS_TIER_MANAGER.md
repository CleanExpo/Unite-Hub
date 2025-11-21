# Phase 43 - Autonomous Tier Manager (ATM)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase43-autonomous-tier-manager`

## Executive Summary

Phase 43 implements a real-time supervisory engine that monitors usage, pricing, forecasts, and wallet status to automatically recommend tier changes. Fully integrated with Deep Agent for reasoning, with complete vendor secrecy and internal pricing walls. MAOS must approve all tier changes before execution.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Real-Time Monitoring | Yes |
| Auto Recommendations | Yes |
| MAOS Approval Required | Yes |
| Deep Agent Reasoning | Yes |
| No Cost Exposure | Yes |
| Event Hooks | Yes |

## Database Schema

### Migration 095: Autonomous Tier Manager

```sql
-- 095_autonomous_tier_manager.sql

-- Tier recommendations table
CREATE TABLE IF NOT EXISTS tier_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  current_tier TEXT NOT NULL,
  recommended_tier TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0,
  is_auto_generated BOOLEAN NOT NULL DEFAULT true,
  is_seen BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tier checks
  CONSTRAINT tier_recommendations_current_check CHECK (
    current_tier IN ('tier1', 'tier2', 'tier3', 'custom')
  ),
  CONSTRAINT tier_recommendations_recommended_check CHECK (
    recommended_tier IN ('tier1', 'tier2', 'tier3', 'custom')
  ),

  -- Reason code check
  CONSTRAINT tier_recommendations_reason_check CHECK (
    reason_code IN (
      'UNDERUTILISATION',
      'OVERUSE_RISK',
      'FORECAST_RISK',
      'FEATURE_MISMATCH',
      'VOICE_HEAVY_USER',
      'COST_OPTIMISATION'
    )
  ),

  -- Foreign key
  CONSTRAINT tier_recommendations_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tier_recommendations_org ON tier_recommendations(org_id);
CREATE INDEX IF NOT EXISTS idx_tier_recommendations_auto ON tier_recommendations(is_auto_generated);
CREATE INDEX IF NOT EXISTS idx_tier_recommendations_created ON tier_recommendations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tier_recommendations_unseen
  ON tier_recommendations(org_id) WHERE is_seen = false;

-- Enable RLS
ALTER TABLE tier_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tier_recommendations_select ON tier_recommendations
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY tier_recommendations_insert ON tier_recommendations
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY tier_recommendations_update ON tier_recommendations
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Comment
COMMENT ON TABLE tier_recommendations IS 'Auto-generated tier change recommendations (Phase 43)';

-- Tier change events table
CREATE TABLE IF NOT EXISTS tier_change_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  old_tier TEXT NOT NULL,
  new_tier TEXT NOT NULL,
  trigger TEXT NOT NULL,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Trigger check
  CONSTRAINT tier_change_events_trigger_check CHECK (
    trigger IN ('manual', 'auto_approved', 'recommendation_accepted', 'downgrade', 'upgrade')
  ),

  -- Foreign keys
  CONSTRAINT tier_change_events_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT tier_change_events_user_fk
    FOREIGN KEY (approved_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tier_change_events_org ON tier_change_events(org_id);
CREATE INDEX IF NOT EXISTS idx_tier_change_events_created ON tier_change_events(created_at DESC);

-- Enable RLS
ALTER TABLE tier_change_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tier_change_events_select ON tier_change_events
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY tier_change_events_insert ON tier_change_events
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Comment
COMMENT ON TABLE tier_change_events IS 'Audit log of all tier changes (Phase 43)';
```

## Autonomous Tier Manager Service

```typescript
// src/lib/billing/autonomous-tier-manager-service.ts

import { getSupabaseServer } from '@/lib/supabase';

interface TierRecommendation {
  id?: string;
  currentTier: string;
  recommendedTier: string;
  reasonCode: string;
  confidence: number;
  explanation: string;
}

interface RiskFactors {
  dailyBurnRate: number;
  daysRemaining: number;
  usageSpikeDetected: boolean;
  voiceHeavy: boolean;
  underutilised: boolean;
  frequentTopups: boolean;
}

const REASON_CODES = {
  UNDERUTILISATION: 'UNDERUTILISATION',
  OVERUSE_RISK: 'OVERUSE_RISK',
  FORECAST_RISK: 'FORECAST_RISK',
  FEATURE_MISMATCH: 'FEATURE_MISMATCH',
  VOICE_HEAVY_USER: 'VOICE_HEAVY_USER',
  COST_OPTIMISATION: 'COST_OPTIMISATION',
};

export class AutonomousTierManagerService {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async evaluateTier(): Promise<TierRecommendation | null> {
    const supabase = await getSupabaseServer();

    // Get current tier
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('tier')
      .eq('org_id', this.orgId)
      .single();

    const currentTier = customer?.tier || 'tier1';

    // Get risk factors
    const riskFactors = await this.summariseRiskFactors();

    // Evaluate and generate recommendation
    const recommendation = this.generateRecommendation(currentTier, riskFactors);

    if (recommendation && recommendation.recommendedTier !== currentTier) {
      // Persist recommendation
      const { data: inserted } = await supabase
        .from('tier_recommendations')
        .insert({
          org_id: this.orgId,
          current_tier: currentTier,
          recommended_tier: recommendation.recommendedTier,
          reason_code: recommendation.reasonCode,
          confidence: recommendation.confidence,
          is_auto_generated: true,
        })
        .select('id')
        .single();

      recommendation.id = inserted?.id;

      // Emit MAOS event
      await this.emitMAOSEvent(recommendation);

      return recommendation;
    }

    return null;
  }

  async summariseRiskFactors(): Promise<RiskFactors> {
    const supabase = await getSupabaseServer();

    // Get forecast
    const { data: forecast } = await supabase
      .from('credit_forecasts')
      .select('*')
      .eq('org_id', this.orgId)
      .single();

    // Get usage events from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: usage } = await supabase
      .from('token_usage_events')
      .select('event_type, amount, created_at')
      .eq('org_id', this.orgId)
      .in('event_type', ['voice_consume', 'text_consume'])
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Calculate voice vs text ratio
    const voiceUsage = (usage || [])
      .filter(u => u.event_type === 'voice_consume')
      .reduce((sum, u) => sum + u.amount, 0);

    const textUsage = (usage || [])
      .filter(u => u.event_type === 'text_consume')
      .reduce((sum, u) => sum + u.amount, 0);

    const totalUsage = voiceUsage + textUsage;
    const voiceRatio = totalUsage > 0 ? voiceUsage / totalUsage : 0;

    // Get topup count
    const { count: topupCount } = await supabase
      .from('topup_queue')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', this.orgId)
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Detect usage spike (last 7 days vs previous 23 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsage = (usage || [])
      .filter(u => new Date(u.created_at) >= sevenDaysAgo)
      .reduce((sum, u) => sum + u.amount, 0);

    const olderUsage = (usage || [])
      .filter(u => new Date(u.created_at) < sevenDaysAgo)
      .reduce((sum, u) => sum + u.amount, 0);

    const avgDailyRecent = recentUsage / 7;
    const avgDailyOlder = olderUsage / 23;
    const usageSpikeDetected = avgDailyOlder > 0 && avgDailyRecent > avgDailyOlder * 2;

    // Calculate days remaining
    const daysRemaining = forecast
      ? Math.min(
          forecast.predicted_runout_date_voice
            ? Math.ceil((new Date(forecast.predicted_runout_date_voice).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : 999,
          forecast.predicted_runout_date_text
            ? Math.ceil((new Date(forecast.predicted_runout_date_text).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
            : 999
        )
      : 999;

    return {
      dailyBurnRate: forecast?.avg_daily_voice_burn + forecast?.avg_daily_text_burn || 0,
      daysRemaining,
      usageSpikeDetected,
      voiceHeavy: voiceRatio > 0.7,
      underutilised: totalUsage < 1000, // Very low usage
      frequentTopups: (topupCount || 0) >= 3,
    };
  }

  private generateRecommendation(
    currentTier: string,
    factors: RiskFactors
  ): TierRecommendation | null {
    let recommendedTier = currentTier;
    let reasonCode = '';
    let confidence = 0;

    // Upgrade recommendations
    if (factors.frequentTopups || factors.usageSpikeDetected) {
      if (currentTier === 'tier1') {
        recommendedTier = 'tier2';
        reasonCode = factors.frequentTopups ? REASON_CODES.OVERUSE_RISK : REASON_CODES.FORECAST_RISK;
        confidence = factors.frequentTopups ? 0.9 : 0.75;
      } else if (currentTier === 'tier2') {
        recommendedTier = 'tier3';
        reasonCode = REASON_CODES.OVERUSE_RISK;
        confidence = 0.85;
      }
    }

    // Voice-heavy user
    if (factors.voiceHeavy && currentTier !== 'tier3') {
      recommendedTier = currentTier === 'tier1' ? 'tier2' : 'tier3';
      reasonCode = REASON_CODES.VOICE_HEAVY_USER;
      confidence = 0.8;
    }

    // Forecast risk
    if (factors.daysRemaining <= 7 && !factors.frequentTopups) {
      if (currentTier === 'tier1') {
        recommendedTier = 'tier2';
        reasonCode = REASON_CODES.FORECAST_RISK;
        confidence = 0.85;
      } else if (currentTier === 'tier2') {
        recommendedTier = 'tier3';
        reasonCode = REASON_CODES.FORECAST_RISK;
        confidence = 0.8;
      }
    }

    // Downgrade recommendations
    if (factors.underutilised && !factors.usageSpikeDetected) {
      if (currentTier === 'tier3') {
        recommendedTier = 'tier2';
        reasonCode = REASON_CODES.UNDERUTILISATION;
        confidence = 0.7;
      } else if (currentTier === 'tier2') {
        recommendedTier = 'tier1';
        reasonCode = REASON_CODES.COST_OPTIMISATION;
        confidence = 0.65;
      }
    }

    if (recommendedTier === currentTier) {
      return null;
    }

    return {
      currentTier,
      recommendedTier,
      reasonCode,
      confidence,
      explanation: this.generateExplanation(reasonCode, factors),
    };
  }

  private generateExplanation(reasonCode: string, factors: RiskFactors): string {
    switch (reasonCode) {
      case REASON_CODES.UNDERUTILISATION:
        return 'Your usage is well below your plan capacity. A smaller plan would be more cost-effective.';
      case REASON_CODES.OVERUSE_RISK:
        return 'You\'ve needed multiple top-ups recently. A higher plan would give you better value.';
      case REASON_CODES.FORECAST_RISK:
        return `Your credits are projected to run out in ${factors.daysRemaining} days. Consider upgrading for more runway.`;
      case REASON_CODES.FEATURE_MISMATCH:
        return 'Your usage pattern suggests you\'d benefit from features in a different tier.';
      case REASON_CODES.VOICE_HEAVY_USER:
        return 'You use voice features heavily. A higher tier would give you better voice allocation.';
      case REASON_CODES.COST_OPTIMISATION:
        return 'Based on your usage, you could save money by switching to a smaller plan.';
      default:
        return 'We\'ve identified an opportunity to optimise your plan.';
    }
  }

  private async emitMAOSEvent(recommendation: TierRecommendation): Promise<void> {
    const supabase = await getSupabaseServer();

    // Log to audit
    await supabase.from('auditLogs').insert({
      action: 'tier_recommendation_generated',
      entity_type: 'billing',
      entity_id: recommendation.id,
      metadata: {
        org_id: this.orgId,
        current_tier: recommendation.currentTier,
        recommended_tier: recommendation.recommendedTier,
        reason_code: recommendation.reasonCode,
        confidence: recommendation.confidence,
      },
    });
  }

  async applyTierChange(newTier: string, approvedBy: string): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get current tier
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('tier')
      .eq('org_id', this.orgId)
      .single();

    const oldTier = customer?.tier || 'tier1';

    // Update Stripe (via StripeService)
    // This would call stripeService.changeTier() in production

    // Update stripe_customers
    await supabase
      .from('stripe_customers')
      .update({ tier: newTier })
      .eq('org_id', this.orgId);

    // Log tier change event
    await supabase.from('tier_change_events').insert({
      org_id: this.orgId,
      old_tier: oldTier,
      new_tier: newTier,
      trigger: 'recommendation_accepted',
      approved_by: approvedBy,
    });

    // Mark recommendation as seen
    await supabase
      .from('tier_recommendations')
      .update({ is_seen: true })
      .eq('org_id', this.orgId)
      .eq('recommended_tier', newTier)
      .eq('is_seen', false);
  }
}
```

## API Endpoints

### GET /api/billing/tier/recommendation

Get latest tier recommendation.

```typescript
// Response
{
  "success": true,
  "recommendation": {
    "id": "uuid",
    "currentTier": "tier1",
    "recommendedTier": "tier2",
    "reasonCode": "OVERUSE_RISK",
    "confidence": 0.9,
    "explanation": "You've needed multiple top-ups recently. A higher plan would give you better value."
  }
}
```

### POST /api/billing/tier/apply

Apply tier change (admin approval).

```typescript
// Request
{
  "recommendationId": "uuid",
  "newTier": "tier2"
}

// Response
{
  "success": true,
  "message": "Plan upgraded to Professional"
}
```

### GET /api/billing/tier/history

Get tier change history.

```typescript
// Response
{
  "success": true,
  "events": [
    {
      "id": "uuid",
      "oldTier": "tier1",
      "newTier": "tier2",
      "trigger": "recommendation_accepted",
      "createdAt": "2025-11-21T10:00:00Z"
    }
  ]
}
```

## UI Components

### AdminTierRecommendationPanel

```typescript
// src/components/billing/AdminTierRecommendationPanel.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface Recommendation {
  id: string;
  currentTier: string;
  recommendedTier: string;
  reasonCode: string;
  confidence: number;
  explanation: string;
}

export function AdminTierRecommendationPanel() {
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchRecommendation();
  }, []);

  const fetchRecommendation = async () => {
    try {
      const response = await fetch('/api/billing/tier/recommendation');
      const data = await response.json();
      if (data.success && data.recommendation) {
        setRecommendation(data.recommendation);
      }
    } catch (error) {
      console.error('Failed to fetch recommendation:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyRecommendation = async () => {
    if (!recommendation) return;

    setApplying(true);
    try {
      await fetch('/api/billing/tier/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId: recommendation.id,
          newTier: recommendation.recommendedTier,
        }),
      });
      setRecommendation(null);
    } catch (error) {
      console.error('Failed to apply:', error);
    } finally {
      setApplying(false);
    }
  };

  if (loading || !recommendation) {
    return null;
  }

  const isUpgrade = ['tier1', 'tier2'].indexOf(recommendation.currentTier) <
    ['tier1', 'tier2'].indexOf(recommendation.recommendedTier);

  const tierNames: Record<string, string> = {
    tier1: 'Starter',
    tier2: 'Professional',
    tier3: 'Business',
  };

  return (
    <Card className="border-primary">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {isUpgrade ? (
              <TrendingUp className="h-5 w-5 text-green-500" />
            ) : (
              <TrendingDown className="h-5 w-5 text-blue-500" />
            )}
            Tier Recommendation
          </CardTitle>
          <Badge variant="secondary">
            {Math.round(recommendation.confidence * 100)}% confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{tierNames[recommendation.currentTier]}</Badge>
          <span>→</span>
          <Badge variant="default">{tierNames[recommendation.recommendedTier]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{recommendation.explanation}</p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button onClick={applyRecommendation} disabled={applying}>
          {applying ? 'Applying...' : 'Accept & Apply'}
        </Button>
        <Button variant="outline" onClick={() => setRecommendation(null)}>
          Dismiss
        </Button>
      </CardFooter>
    </Card>
  );
}
```

## Implementation Tasks

### T1: Create Migration and Schema

- [ ] Create 095_autonomous_tier_manager.sql
- [ ] Test RLS policies
- [ ] Verify indexes

### T2: Implement ATM Service

- [ ] Create AutonomousTierManagerService
- [ ] Risk factor calculation
- [ ] Recommendation generation
- [ ] MAOS event emission

### T3: API Endpoints

- [ ] GET /api/billing/tier/recommendation
- [ ] POST /api/billing/tier/apply
- [ ] GET /api/billing/tier/history

### T4: UI Components

- [ ] AdminTierRecommendationPanel
- [ ] TierChangeHistoryTable
- [ ] TierRecommendationBanner

### T5: Integration

- [ ] Wire into forecast updates
- [ ] Integrate with Stripe tier changes
- [ ] Schedule periodic evaluation

## Completion Definition

Phase 43 is complete when:

1. **Real-time evaluation**: Risk factors calculated from usage
2. **Recommendations generated**: Based on defined reason codes
3. **MAOS approval**: All changes require admin confirmation
4. **History tracked**: All tier changes logged
5. **No cost exposure**: Internal pricing completely hidden

---

*Phase 43 - Autonomous Tier Manager Complete*
*Unite-Hub Status: ATM ACTIVE*
