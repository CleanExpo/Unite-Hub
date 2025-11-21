# Phase 41 - Dynamic Pricing & Tier Optimisation Engine

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase41-dynamic-pricing-engine`

## Executive Summary

Phase 41 introduces a dynamic pricing engine that analyzes usage patterns to recommend better plans for organizations. The system identifies under-users and over-users, suggests tier changes, and calculates potential savings—all while keeping the 3× uplift model completely hidden.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Usage Pattern Analysis | Yes |
| Tier Recommendations | Yes |
| Admin Approval Required | Yes |
| Stripe Integration | Yes |
| No Cost Exposure | Yes |
| Deep Agent Advisor | Yes |

## Environment Variables

```env
# Pricing Engine
PRICING_UNDERUSE_THRESHOLD_PERCENT=30
PRICING_OVERUSE_THRESHOLD_PERCENT=90
```

## Database Schema

### Migration 093: Pricing Rules & Recommendations

```sql
-- 093_pricing_engine.sql

-- Pricing rules table (internal configuration)
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  scope TEXT NOT NULL DEFAULT 'global',
  region TEXT,
  industry TEXT,
  min_monthly_spend NUMERIC,
  max_monthly_spend NUMERIC,
  voice_weight NUMERIC NOT NULL DEFAULT 0.7,
  text_weight NUMERIC NOT NULL DEFAULT 0.3,
  base_multiplier NUMERIC NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Scope check
  CONSTRAINT pricing_rules_scope_check CHECK (
    scope IN ('global', 'region', 'industry', 'custom')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pricing_rules_slug ON pricing_rules(slug);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_active ON pricing_rules(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies (internal only - no public access)
CREATE POLICY pricing_rules_internal ON pricing_rules
  FOR ALL TO authenticated
  USING (false)
  WITH CHECK (false);

-- Trigger for updated_at
CREATE TRIGGER trg_pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Comment
COMMENT ON TABLE pricing_rules IS 'Internal pricing rules for tier optimization (Phase 41)';

-- Pricing recommendations table
CREATE TABLE IF NOT EXISTS pricing_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  current_tier TEXT NOT NULL,
  recommended_tier TEXT NOT NULL,
  estimated_monthly_savings NUMERIC NOT NULL DEFAULT 0,
  estimated_additional_capacity_percent NUMERIC NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT false,
  dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  actioned_at TIMESTAMPTZ,

  -- Tier checks
  CONSTRAINT pricing_recommendations_current_tier_check CHECK (
    current_tier IN ('tier1', 'tier2', 'tier3', 'custom')
  ),
  CONSTRAINT pricing_recommendations_recommended_tier_check CHECK (
    recommended_tier IN ('tier1', 'tier2', 'tier3', 'custom')
  ),

  -- Foreign key
  CONSTRAINT pricing_recommendations_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pricing_recommendations_org ON pricing_recommendations(org_id);
CREATE INDEX IF NOT EXISTS idx_pricing_recommendations_pending
  ON pricing_recommendations(org_id) WHERE accepted = false AND dismissed = false;
CREATE INDEX IF NOT EXISTS idx_pricing_recommendations_created ON pricing_recommendations(created_at DESC);

-- Enable RLS
ALTER TABLE pricing_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY pricing_recommendations_select ON pricing_recommendations
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY pricing_recommendations_insert ON pricing_recommendations
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY pricing_recommendations_update ON pricing_recommendations
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Comment
COMMENT ON TABLE pricing_recommendations IS 'Per-org tier optimization recommendations (Phase 41)';
```

## API Endpoints

### GET /api/billing/pricing/recommendation

Get current tier recommendation.

```typescript
// Response
{
  "success": true,
  "recommendation": {
    "id": "uuid",
    "currentTier": "tier1",
    "recommendedTier": "tier2",
    "estimatedMonthlySavings": 0,
    "estimatedAdditionalCapacity": 80,
    "reason": "Your usage pattern suggests you'd benefit from more credits.",
    "explanation": "Over the last 30 days, you've had 3 top-ups and 2 near-lockout situations. Tier 2 would give you 80% more capacity for better value."
  }
}
```

### POST /api/billing/pricing/apply

Apply recommended tier change (admin-only).

```typescript
// Request
{
  "recommendationId": "uuid"
}

// Response
{
  "success": true,
  "newTier": "tier2",
  "message": "Your plan has been upgraded to Tier 2. Changes take effect immediately."
}
```

## Dynamic Pricing Service

```typescript
// src/lib/billing/dynamic-pricing-service.ts

import { getSupabaseServer } from '@/lib/supabase';
import { StripeService } from './stripe-service';

interface Recommendation {
  id?: string;
  currentTier: string;
  recommendedTier: string;
  estimatedMonthlySavings: number;
  estimatedAdditionalCapacity: number;
  reason: string;
  explanation?: string;
}

const TIER_PRICES = {
  tier1: 5,
  tier2: 8,
  tier3: 15,
};

const TIER_CAPACITIES = {
  tier1: { voice: 3.5, text: 1.5 },
  tier2: { voice: 5.5, text: 2.5 },
  tier3: { voice: 10, text: 5 },
};

const UNDERUSE_THRESHOLD = parseInt(process.env.PRICING_UNDERUSE_THRESHOLD_PERCENT || '30');
const OVERUSE_THRESHOLD = parseInt(process.env.PRICING_OVERUSE_THRESHOLD_PERCENT || '90');

export class DynamicPricingService {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async analyzeAndRecommend(): Promise<Recommendation> {
    const supabase = await getSupabaseServer();

    // Get current tier
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('tier')
      .eq('org_id', this.orgId)
      .single();

    const currentTier = customer?.tier || 'tier1';

    // Get usage patterns from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: usage } = await supabase
      .from('token_usage_events')
      .select('event_type, amount')
      .eq('org_id', this.orgId)
      .in('event_type', ['voice_consume', 'text_consume'])
      .gte('created_at', thirtyDaysAgo.toISOString());

    const voiceUsed = (usage || [])
      .filter(u => u.event_type === 'voice_consume')
      .reduce((sum, u) => sum + u.amount, 0);

    const textUsed = (usage || [])
      .filter(u => u.event_type === 'text_consume')
      .reduce((sum, u) => sum + u.amount, 0);

    // Get top-up count
    const { count: topupCount } = await supabase
      .from('topup_queue')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', this.orgId)
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Get lockout count
    const { count: lockoutCount } = await supabase
      .from('usage_lockouts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', this.orgId)
      .gte('locked_at', thirtyDaysAgo.toISOString());

    // Calculate usage percentage
    const currentCapacity = TIER_CAPACITIES[currentTier as keyof typeof TIER_CAPACITIES];
    const voiceCapacity = currentCapacity.voice * 30; // Monthly
    const textCapacity = currentCapacity.text * 30;

    const voiceUsagePercent = (voiceUsed / voiceCapacity) * 100;
    const textUsagePercent = (textUsed / textCapacity) * 100;
    const avgUsagePercent = (voiceUsagePercent + textUsagePercent) / 2;

    // Determine recommendation
    let recommendedTier = currentTier;
    let reason = '';
    let estimatedSavings = 0;
    let additionalCapacity = 0;

    // Over-using: recommend upgrade
    if (avgUsagePercent > OVERUSE_THRESHOLD || (topupCount || 0) >= 2 || (lockoutCount || 0) >= 1) {
      if (currentTier === 'tier1') {
        recommendedTier = 'tier2';
        additionalCapacity = 80;
        reason = 'Your usage pattern suggests you would benefit from more credits.';
      } else if (currentTier === 'tier2') {
        recommendedTier = 'tier3';
        additionalCapacity = 100;
        reason = 'Heavy usage detected. A higher tier would provide better value.';
      }
    }
    // Under-using: recommend downgrade
    else if (avgUsagePercent < UNDERUSE_THRESHOLD && (topupCount || 0) === 0) {
      if (currentTier === 'tier3') {
        recommendedTier = 'tier2';
        estimatedSavings = TIER_PRICES.tier3 - TIER_PRICES.tier2;
        reason = 'Your current usage is well below your plan capacity.';
      } else if (currentTier === 'tier2') {
        recommendedTier = 'tier1';
        estimatedSavings = TIER_PRICES.tier2 - TIER_PRICES.tier1;
        reason = 'You could save money by switching to a smaller plan.';
      }
    }

    // If no change recommended
    if (recommendedTier === currentTier) {
      reason = 'Your current plan fits your usage well.';
    }

    const recommendation: Recommendation = {
      currentTier,
      recommendedTier,
      estimatedMonthlySavings: estimatedSavings,
      estimatedAdditionalCapacity: additionalCapacity,
      reason,
    };

    // Persist if different tier
    if (recommendedTier !== currentTier) {
      const { data: inserted } = await supabase
        .from('pricing_recommendations')
        .insert({
          org_id: this.orgId,
          current_tier: currentTier,
          recommended_tier: recommendedTier,
          estimated_monthly_savings: estimatedSavings,
          estimated_additional_capacity_percent: additionalCapacity,
          reason,
        })
        .select('id')
        .single();

      recommendation.id = inserted?.id;
    }

    return recommendation;
  }

  async getActiveRecommendation(): Promise<Recommendation | null> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('pricing_recommendations')
      .select('*')
      .eq('org_id', this.orgId)
      .eq('accepted', false)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!data) return null;

    return {
      id: data.id,
      currentTier: data.current_tier,
      recommendedTier: data.recommended_tier,
      estimatedMonthlySavings: parseFloat(data.estimated_monthly_savings),
      estimatedAdditionalCapacity: parseFloat(data.estimated_additional_capacity_percent),
      reason: data.reason,
    };
  }

  async applyRecommendation(recommendationId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get recommendation
    const { data: recommendation } = await supabase
      .from('pricing_recommendations')
      .select('recommended_tier')
      .eq('id', recommendationId)
      .eq('org_id', this.orgId)
      .single();

    if (!recommendation) {
      throw new Error('Recommendation not found');
    }

    // Update Stripe subscription
    const stripeService = new StripeService();
    await stripeService.changeTier(this.orgId, recommendation.recommended_tier);

    // Mark as accepted
    await supabase
      .from('pricing_recommendations')
      .update({
        accepted: true,
        actioned_at: new Date().toISOString(),
      })
      .eq('id', recommendationId);

    // Update stripe_customers tier
    await supabase
      .from('stripe_customers')
      .update({ tier: recommendation.recommended_tier })
      .eq('org_id', this.orgId);

    // Log billing event
    await supabase.from('billing_events').insert({
      org_id: this.orgId,
      event_type: 'tier_changed',
      amount_aud: 0,
      description: `Tier changed to ${recommendation.recommended_tier}`,
      metadata: { recommendation_id: recommendationId },
    });
  }

  async dismissRecommendation(recommendationId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('pricing_recommendations')
      .update({
        dismissed: true,
        actioned_at: new Date().toISOString(),
      })
      .eq('id', recommendationId)
      .eq('org_id', this.orgId);
  }
}
```

## Deep Agent Pricing Advisor

```typescript
// src/lib/billing/pricing-advisor.ts

interface PricingExplanation {
  headline: string;
  body: string;
  cta: string;
}

export function generatePricingExplanation(
  recommendation: any,
  context: { topupCount: number; lockoutCount: number }
): PricingExplanation {
  const { currentTier, recommendedTier, estimatedMonthlySavings, estimatedAdditionalCapacity } = recommendation;

  // Upgrade recommendation
  if (estimatedAdditionalCapacity > 0) {
    let headline = `Consider upgrading to ${formatTierName(recommendedTier)}`;
    let body = '';

    if (context.lockoutCount > 0) {
      body = `You've experienced ${context.lockoutCount} service interruption${context.lockoutCount > 1 ? 's' : ''} recently. `;
    }
    if (context.topupCount >= 2) {
      body += `With ${context.topupCount} top-ups this month, a higher tier would give you ${estimatedAdditionalCapacity}% more capacity at better value per credit.`;
    } else {
      body += `Your usage suggests ${formatTierName(recommendedTier)} would be a better fit, giving you ${estimatedAdditionalCapacity}% more capacity.`;
    }

    return {
      headline,
      body,
      cta: `Upgrade to ${formatTierName(recommendedTier)}`,
    };
  }

  // Downgrade recommendation
  if (estimatedMonthlySavings > 0) {
    return {
      headline: `Save $${estimatedMonthlySavings}/month`,
      body: `Your usage is well below your current plan's capacity. Switching to ${formatTierName(recommendedTier)} would save you $${estimatedMonthlySavings} per month while still meeting your needs.`,
      cta: `Switch to ${formatTierName(recommendedTier)}`,
    };
  }

  // No change
  return {
    headline: 'Your plan is a good fit',
    body: 'Based on your usage patterns, your current plan provides the right balance of capacity and value.',
    cta: 'View plan details',
  };
}

function formatTierName(tier: string): string {
  const names: Record<string, string> = {
    tier1: 'Starter',
    tier2: 'Professional',
    tier3: 'Business',
    custom: 'Custom',
  };
  return names[tier] || tier;
}
```

## UI Components

### PlanRecommendationCard

```typescript
// src/components/billing/PlanRecommendationCard.tsx

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, X } from 'lucide-react';

interface Recommendation {
  id: string;
  currentTier: string;
  recommendedTier: string;
  estimatedMonthlySavings: number;
  estimatedAdditionalCapacity: number;
  reason: string;
}

interface PlanRecommendationCardProps {
  recommendation: Recommendation;
  onApply: (id: string) => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
}

export function PlanRecommendationCard({
  recommendation,
  onApply,
  onDismiss,
}: PlanRecommendationCardProps) {
  const [loading, setLoading] = useState(false);

  const isUpgrade = recommendation.estimatedAdditionalCapacity > 0;
  const tierNames: Record<string, string> = {
    tier1: 'Starter',
    tier2: 'Professional',
    tier3: 'Business',
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      await onApply(recommendation.id);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    setLoading(true);
    try {
      await onDismiss(recommendation.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            {isUpgrade ? (
              <ArrowUp className="h-5 w-5 text-green-500" />
            ) : (
              <ArrowDown className="h-5 w-5 text-blue-500" />
            )}
            Plan Recommendation
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleDismiss} disabled={loading}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{tierNames[recommendation.currentTier]}</Badge>
          <span>→</span>
          <Badge variant="default">{tierNames[recommendation.recommendedTier]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
        {isUpgrade ? (
          <p className="text-sm font-medium text-green-600">
            +{recommendation.estimatedAdditionalCapacity}% more capacity
          </p>
        ) : (
          <p className="text-sm font-medium text-blue-600">
            Save ${recommendation.estimatedMonthlySavings}/month
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleApply} disabled={loading}>
          {isUpgrade ? 'Upgrade Now' : 'Switch Plan'}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

### PlanComparisonTable

```typescript
// src/components/billing/PlanComparisonTable.tsx

'use client';

import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    tier: 'tier1',
    price: 5,
    features: ['Basic voice credits', 'Standard text credits', 'Email support'],
  },
  {
    name: 'Professional',
    tier: 'tier2',
    price: 8,
    features: ['More voice credits', 'More text credits', 'Priority support', 'Auto top-up'],
  },
  {
    name: 'Business',
    tier: 'tier3',
    price: 15,
    features: ['Maximum voice credits', 'Maximum text credits', 'Dedicated support', 'Custom integrations'],
  },
];

interface PlanComparisonTableProps {
  currentTier: string;
  recommendedTier?: string;
}

export function PlanComparisonTable({ currentTier, recommendedTier }: PlanComparisonTableProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {plans.map((plan) => (
        <div
          key={plan.tier}
          className={`p-4 rounded-lg border ${
            plan.tier === recommendedTier
              ? 'border-primary bg-primary/5'
              : plan.tier === currentTier
              ? 'border-muted-foreground'
              : 'border-muted'
          }`}
        >
          <h3 className="font-semibold">{plan.name}</h3>
          <p className="text-2xl font-bold mt-2">${plan.price}<span className="text-sm font-normal">/mo</span></p>
          <ul className="mt-4 space-y-2">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
          {plan.tier === currentTier && (
            <p className="mt-4 text-sm text-muted-foreground">Current plan</p>
          )}
          {plan.tier === recommendedTier && (
            <p className="mt-4 text-sm font-medium text-primary">Recommended</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Implementation Tasks

### T1: Create Migration and Schema

- [ ] Create 093_pricing_engine.sql
- [ ] Test RLS policies (internal-only for rules)
- [ ] Verify indexes

### T2: Implement Pricing Service

- [ ] Create DynamicPricingService
- [ ] Usage pattern analysis
- [ ] Tier recommendation logic
- [ ] Stripe tier change integration

### T3: API Endpoints

- [ ] GET /api/billing/pricing/recommendation
- [ ] POST /api/billing/pricing/apply

### T4: Deep Agent Advisor

- [ ] Create generatePricingExplanation
- [ ] Human-readable copy
- [ ] No cost/vendor exposure

### T5: UI Components

- [ ] PlanRecommendationCard.tsx
- [ ] PlanComparisonTable.tsx
- [ ] ApplyRecommendationModal.tsx

## Completion Definition

Phase 41 is complete when:

1. **Usage analyzed**: Pattern detection for under/over-use
2. **Recommendations generated**: Tier suggestions persisted
3. **Admin approval**: Changes require explicit confirmation
4. **Stripe updated**: Subscriptions changed via API
5. **Human-readable**: Deep Agent generates clear explanations
6. **No cost exposure**: Internal multipliers completely hidden

---

*Phase 41 - Dynamic Pricing & Tier Optimisation Complete*
*Unite-Hub Status: PRICING ENGINE ACTIVE*
