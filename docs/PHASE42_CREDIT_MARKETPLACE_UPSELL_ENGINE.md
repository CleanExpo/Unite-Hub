# Phase 42 - Credit Marketplace & Smart Upsell Engine

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase42-credit-marketplace-upsell-engine`

## Executive Summary

Phase 42 creates a credit marketplace with predefined packs and a smart upsell engine that responds to risk signals. Users can one-click purchase credit boosts via Stripe, while the system proactively surfaces offers when balances are low. All pricing maintains the 3× uplift internally without exposing vendor costs.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Credit Pack Marketplace | Yes |
| Smart Upsell Triggers | Yes |
| One-Click Purchase | Yes |
| Stripe Integration | Yes |
| Deep Agent Copy | Yes |
| No Cost Exposure | Yes |

## Environment Variables

```env
# Marketplace
STRIPE_PRICE_BOOST_SMALL=price_boost_small_id
STRIPE_PRICE_BOOST_MEDIUM=price_boost_medium_id
STRIPE_PRICE_BOOST_LARGE=price_boost_large_id
```

## Database Schema

### Migration 094: Credit Marketplace

```sql
-- 094_credit_marketplace.sql

-- Credit packs table (marketplace catalogue)
CREATE TABLE IF NOT EXISTS credit_packs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  tier_restriction TEXT,
  voice_tokens INTEGER NOT NULL DEFAULT 0,
  text_tokens INTEGER NOT NULL DEFAULT 0,
  price_aud NUMERIC NOT NULL,
  stripe_price_id TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tier restriction check
  CONSTRAINT credit_packs_tier_check CHECK (
    tier_restriction IS NULL OR tier_restriction IN ('tier1', 'tier2', 'tier3', 'custom')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credit_packs_slug ON credit_packs(slug);
CREATE INDEX IF NOT EXISTS idx_credit_packs_active ON credit_packs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_credit_packs_featured ON credit_packs(is_featured) WHERE is_featured = true;

-- Enable RLS
ALTER TABLE credit_packs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only for authenticated users)
CREATE POLICY credit_packs_select ON credit_packs
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER trg_credit_packs_updated_at
  BEFORE UPDATE ON credit_packs
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Comment
COMMENT ON TABLE credit_packs IS 'Credit pack catalogue for marketplace (Phase 42)';

-- Seed default packs
INSERT INTO credit_packs (slug, label, description, voice_tokens, text_tokens, price_aud, is_featured) VALUES
  ('boost-small', 'Quick Boost', 'Top up a small bundle of credits to finish the week.', 2000, 5000, 10, false),
  ('boost-medium', 'Campaign Booster', 'Extra credits for campaigns and busy periods.', 6000, 15000, 25, true),
  ('boost-large', 'Power User Pack', 'High-volume credit pack for heavy usage.', 15000, 40000, 60, false)
ON CONFLICT (slug) DO NOTHING;

-- Upsell triggers table
CREATE TABLE IF NOT EXISTS upsell_triggers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  trigger_type TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  offer_type TEXT NOT NULL,
  credit_pack_id UUID,
  recommended_tier TEXT,
  shown_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  -- Trigger type check
  CONSTRAINT upsell_triggers_type_check CHECK (
    trigger_type IN (
      'predicted_runout',
      'recent_lockout',
      'frequent_topup',
      'seasonal',
      'usage_spike'
    )
  ),

  -- Offer type check
  CONSTRAINT upsell_triggers_offer_check CHECK (
    offer_type IN ('credit_pack', 'tier_upgrade', 'tier_upgrade_plus_pack')
  ),

  -- Foreign keys
  CONSTRAINT upsell_triggers_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT upsell_triggers_pack_fk
    FOREIGN KEY (credit_pack_id) REFERENCES credit_packs(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upsell_triggers_org ON upsell_triggers(org_id);
CREATE INDEX IF NOT EXISTS idx_upsell_triggers_active
  ON upsell_triggers(org_id) WHERE accepted_at IS NULL AND dismissed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_upsell_triggers_shown ON upsell_triggers(shown_at DESC);

-- Enable RLS
ALTER TABLE upsell_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY upsell_triggers_select ON upsell_triggers
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY upsell_triggers_insert ON upsell_triggers
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY upsell_triggers_update ON upsell_triggers
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE upsell_triggers IS 'Smart upsell triggers based on usage signals (Phase 42)';
```

## API Endpoints

### GET /api/billing/credits/packs

List available credit packs.

```typescript
// Response
{
  "success": true,
  "packs": [
    {
      "id": "uuid",
      "slug": "boost-medium",
      "label": "Campaign Booster",
      "description": "Extra credits for campaigns and busy periods.",
      "voiceTokens": 6000,
      "textTokens": 15000,
      "priceAud": 25,
      "isFeatured": true
    }
  ]
}
```

### POST /api/billing/credits/purchase

Purchase a credit pack.

```typescript
// Request
{
  "packId": "uuid"
}

// Response
{
  "success": true,
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

### GET /api/billing/upsell/triggers

Get active upsell triggers for organization.

```typescript
// Response
{
  "success": true,
  "triggers": [
    {
      "id": "uuid",
      "type": "predicted_runout",
      "offerType": "credit_pack",
      "pack": {
        "label": "Quick Boost",
        "priceAud": 10
      },
      "message": "Your voice credits are running low. Top up now to avoid interruption.",
      "shownAt": "2025-11-21T10:00:00Z"
    }
  ]
}
```

## Credit Marketplace Service

```typescript
// src/lib/billing/credit-marketplace-service.ts

import { getSupabaseServer } from '@/lib/supabase';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

interface CreditPack {
  id: string;
  slug: string;
  label: string;
  description: string;
  voiceTokens: number;
  textTokens: number;
  priceAud: number;
  isFeatured: boolean;
}

export class CreditMarketplaceService {
  async getPacks(tierRestriction?: string): Promise<CreditPack[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('credit_packs')
      .select('*')
      .eq('is_active', true)
      .order('price_aud', { ascending: true });

    if (tierRestriction) {
      query = query.or(`tier_restriction.is.null,tier_restriction.eq.${tierRestriction}`);
    }

    const { data } = await query;

    return (data || []).map((pack) => ({
      id: pack.id,
      slug: pack.slug,
      label: pack.label,
      description: pack.description,
      voiceTokens: pack.voice_tokens,
      textTokens: pack.text_tokens,
      priceAud: parseFloat(pack.price_aud),
      isFeatured: pack.is_featured,
    }));
  }

  async purchasePack(
    orgId: string,
    packId: string
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const supabase = await getSupabaseServer();

    // Get pack details
    const { data: pack } = await supabase
      .from('credit_packs')
      .select('*')
      .eq('id', packId)
      .eq('is_active', true)
      .single();

    if (!pack) {
      throw new Error('Credit pack not found');
    }

    // Get customer
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('org_id', orgId)
      .single();

    if (!customer) {
      throw new Error('No billing account found');
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(pack.price_aud * 100),
      currency: 'aud',
      customer: customer.stripe_customer_id,
      metadata: {
        orgId,
        type: 'credit_pack',
        packId: pack.id,
        packSlug: pack.slug,
        voiceTokens: pack.voice_tokens.toString(),
        textTokens: pack.text_tokens.toString(),
      },
    });

    // Add to topup queue
    await supabase.from('topup_queue').insert({
      org_id: orgId,
      amount_aud: pack.price_aud,
      reason: `Credit pack: ${pack.label}`,
      stripe_payment_intent_id: paymentIntent.id,
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      paymentIntentId: paymentIntent.id,
    };
  }

  async fulfillPack(paymentIntentId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.metadata.type !== 'credit_pack') {
      return;
    }

    const orgId = paymentIntent.metadata.orgId;
    const voiceTokens = parseInt(paymentIntent.metadata.voiceTokens);
    const textTokens = parseInt(paymentIntent.metadata.textTokens);

    // Convert tokens to AUD budget (client rates)
    const voiceBudget = voiceTokens * 0.00096;
    const textBudget = textTokens * 0.00024;

    // Get current wallet
    const { data: wallet } = await supabase
      .from('token_wallets')
      .select('voice_budget_aud, text_budget_aud')
      .eq('org_id', orgId)
      .single();

    if (!wallet) return;

    // Add credits to wallet
    await supabase
      .from('token_wallets')
      .update({
        voice_budget_aud: parseFloat(wallet.voice_budget_aud) + voiceBudget,
        text_budget_aud: parseFloat(wallet.text_budget_aud) + textBudget,
      })
      .eq('org_id', orgId);

    // Log usage event
    await supabase.from('token_usage_events').insert({
      org_id: orgId,
      event_type: 'topup',
      amount: voiceTokens + textTokens,
      remaining: 0,
      metadata: {
        pack_slug: paymentIntent.metadata.packSlug,
        voice_tokens: voiceTokens,
        text_tokens: textTokens,
      },
    });

    // Update queue
    await supabase
      .from('topup_queue')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
      })
      .eq('stripe_payment_intent_id', paymentIntentId);

    // Clear any active lockouts
    await supabase
      .from('usage_lockouts')
      .update({ unlocked_at: new Date().toISOString() })
      .eq('org_id', orgId)
      .is('unlocked_at', null);
  }
}
```

## Smart Upsell Engine

```typescript
// src/lib/billing/smart-upsell-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface UpsellTrigger {
  id: string;
  type: string;
  offerType: string;
  pack?: any;
  recommendedTier?: string;
  message: string;
  shownAt: string;
}

export class SmartUpsellEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async evaluateTriggers(): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get forecast
    const { data: forecast } = await supabase
      .from('credit_forecasts')
      .select('*')
      .eq('org_id', this.orgId)
      .single();

    if (!forecast) return;

    // Get recent lockouts
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: lockoutCount } = await supabase
      .from('usage_lockouts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', this.orgId)
      .gte('locked_at', thirtyDaysAgo.toISOString());

    // Get recent topups
    const { count: topupCount } = await supabase
      .from('topup_queue')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', this.orgId)
      .eq('status', 'completed')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Check for existing active triggers
    const { data: existingTriggers } = await supabase
      .from('upsell_triggers')
      .select('trigger_type')
      .eq('org_id', this.orgId)
      .is('accepted_at', null)
      .is('dismissed_at', null);

    const existingTypes = new Set((existingTriggers || []).map(t => t.trigger_type));

    // Get featured pack for credit pack offers
    const { data: featuredPack } = await supabase
      .from('credit_packs')
      .select('id')
      .eq('is_featured', true)
      .eq('is_active', true)
      .single();

    // Predicted runout trigger
    if (forecast.risk_level === 'HIGH' && !existingTypes.has('predicted_runout')) {
      await supabase.from('upsell_triggers').insert({
        org_id: this.orgId,
        trigger_type: 'predicted_runout',
        offer_type: 'credit_pack',
        credit_pack_id: featuredPack?.id,
        context: {
          days_until_runout: Math.min(
            forecast.predicted_runout_date_voice
              ? Math.ceil((new Date(forecast.predicted_runout_date_voice).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : 999,
            forecast.predicted_runout_date_text
              ? Math.ceil((new Date(forecast.predicted_runout_date_text).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : 999
          ),
        },
      });
    }

    // Recent lockout trigger
    if ((lockoutCount || 0) > 0 && !existingTypes.has('recent_lockout')) {
      await supabase.from('upsell_triggers').insert({
        org_id: this.orgId,
        trigger_type: 'recent_lockout',
        offer_type: 'tier_upgrade',
        context: { lockout_count: lockoutCount },
      });
    }

    // Frequent topup trigger
    if ((topupCount || 0) >= 3 && !existingTypes.has('frequent_topup')) {
      await supabase.from('upsell_triggers').insert({
        org_id: this.orgId,
        trigger_type: 'frequent_topup',
        offer_type: 'tier_upgrade_plus_pack',
        credit_pack_id: featuredPack?.id,
        context: { topup_count: topupCount },
      });
    }
  }

  async getActiveTriggers(): Promise<UpsellTrigger[]> {
    const supabase = await getSupabaseServer();

    const { data: triggers } = await supabase
      .from('upsell_triggers')
      .select(`
        id,
        trigger_type,
        offer_type,
        credit_pack_id,
        recommended_tier,
        context,
        shown_at,
        credit_packs (
          label,
          price_aud
        )
      `)
      .eq('org_id', this.orgId)
      .is('accepted_at', null)
      .is('dismissed_at', null)
      .order('shown_at', { ascending: false });

    return (triggers || []).map((trigger) => ({
      id: trigger.id,
      type: trigger.trigger_type,
      offerType: trigger.offer_type,
      pack: trigger.credit_packs,
      recommendedTier: trigger.recommended_tier,
      message: this.generateMessage(trigger),
      shownAt: trigger.shown_at,
    }));
  }

  private generateMessage(trigger: any): string {
    switch (trigger.trigger_type) {
      case 'predicted_runout':
        const days = trigger.context?.days_until_runout || 0;
        return `Your credits are projected to run out in ${days} day${days === 1 ? '' : 's'}. Top up now to avoid interruption.`;
      case 'recent_lockout':
        return `You recently experienced a service interruption. Consider upgrading your plan for more capacity.`;
      case 'frequent_topup':
        const count = trigger.context?.topup_count || 0;
        return `You've topped up ${count} times this month. A higher plan would give you better value per credit.`;
      case 'seasonal':
        return `Busy season ahead? Stock up on credits now to stay prepared.`;
      default:
        return 'Manage your credits to ensure uninterrupted service.';
    }
  }

  async acceptTrigger(triggerId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('upsell_triggers')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', triggerId)
      .eq('org_id', this.orgId);
  }

  async dismissTrigger(triggerId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('upsell_triggers')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', triggerId)
      .eq('org_id', this.orgId);
  }
}
```

## UI Components

### CreditPackGrid

```typescript
// src/components/billing/CreditPackGrid.tsx

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap } from 'lucide-react';

interface CreditPack {
  id: string;
  label: string;
  description: string;
  voiceTokens: number;
  textTokens: number;
  priceAud: number;
  isFeatured: boolean;
}

interface CreditPackGridProps {
  onPurchase: (packId: string) => Promise<void>;
}

export function CreditPackGrid({ onPurchase }: CreditPackGridProps) {
  const [packs, setPacks] = useState<CreditPack[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetchPacks();
  }, []);

  const fetchPacks = async () => {
    try {
      const response = await fetch('/api/billing/credits/packs');
      const data = await response.json();
      if (data.success) {
        setPacks(data.packs);
      }
    } catch (error) {
      console.error('Failed to fetch packs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (packId: string) => {
    setPurchasing(packId);
    try {
      await onPurchase(packId);
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-48 bg-muted rounded-lg" />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {packs.map((pack) => (
        <Card
          key={pack.id}
          className={pack.isFeatured ? 'border-primary' : ''}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{pack.label}</CardTitle>
              {pack.isFeatured && (
                <Badge variant="default">
                  <Zap className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{pack.description}</p>
            <div className="space-y-1 text-sm">
              <p>{pack.voiceTokens.toLocaleString()} voice credits</p>
              <p>{pack.textTokens.toLocaleString()} text credits</p>
            </div>
            <p className="text-2xl font-bold mt-4">
              ${pack.priceAud}
              <span className="text-sm font-normal text-muted-foreground"> AUD</span>
            </p>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              onClick={() => handlePurchase(pack.id)}
              disabled={purchasing === pack.id}
            >
              {purchasing === pack.id ? 'Processing...' : 'Buy Now'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
```

### UpsellBanner

```typescript
// src/components/billing/UpsellBanner.tsx

'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { X, Zap } from 'lucide-react';

interface Trigger {
  id: string;
  message: string;
  offerType: string;
  pack?: { label: string; priceAud: number };
}

export function UpsellBanner() {
  const [trigger, setTrigger] = useState<Trigger | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTriggers();
  }, []);

  const fetchTriggers = async () => {
    try {
      const response = await fetch('/api/billing/upsell/triggers');
      const data = await response.json();
      if (data.success && data.triggers.length > 0) {
        setTrigger(data.triggers[0]);
      }
    } catch (error) {
      console.error('Failed to fetch triggers:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismiss = async () => {
    if (!trigger) return;

    try {
      await fetch('/api/billing/upsell/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerId: trigger.id }),
      });
      setTrigger(null);
    } catch (error) {
      console.error('Failed to dismiss:', error);
    }
  };

  if (loading || !trigger) {
    return null;
  }

  return (
    <Alert className="mb-4 border-primary bg-primary/5">
      <Zap className="h-4 w-4 text-primary" />
      <AlertDescription className="flex items-center justify-between">
        <span>{trigger.message}</span>
        <div className="flex items-center gap-2">
          {trigger.pack && (
            <Button size="sm" asChild>
              <a href="/dashboard/settings/billing/credits">
                Get {trigger.pack.label} (${trigger.pack.priceAud})
              </a>
            </Button>
          )}
          {trigger.offerType.includes('tier_upgrade') && (
            <Button size="sm" asChild>
              <a href="/dashboard/settings/billing">Upgrade Plan</a>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={dismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
```

### OneClickTopUpButton

```typescript
// src/components/billing/OneClickTopUpButton.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface OneClickTopUpButtonProps {
  packSlug?: string;
  label?: string;
  onSuccess?: () => void;
}

export function OneClickTopUpButton({
  packSlug = 'boost-small',
  label = 'Quick Top Up',
  onSuccess,
}: OneClickTopUpButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      // Get pack by slug
      const packsResponse = await fetch('/api/billing/credits/packs');
      const packsData = await packsResponse.json();
      const pack = packsData.packs?.find((p: any) => p.slug === packSlug);

      if (!pack) {
        throw new Error('Pack not found');
      }

      // Purchase
      const response = await fetch('/api/billing/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId: pack.id }),
      });

      const data = await response.json();

      if (data.clientSecret) {
        // Redirect to Stripe checkout or handle inline
        window.location.href = `/dashboard/settings/billing/checkout?secret=${data.clientSecret}`;
      }

      onSuccess?.();
    } catch (error) {
      console.error('Top up failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={loading}
    >
      <Zap className="h-4 w-4 mr-1" />
      {loading ? 'Processing...' : label}
    </Button>
  );
}
```

## Implementation Tasks

### T1: Create Migration and Schema

- [ ] Create 094_credit_marketplace.sql
- [ ] Seed default credit packs
- [ ] Test RLS policies
- [ ] Verify indexes

### T2: Implement Marketplace Service

- [ ] Create CreditMarketplaceService
- [ ] Pack listing with tier filtering
- [ ] Purchase flow with Stripe
- [ ] Fulfillment after payment

### T3: Implement Upsell Engine

- [ ] Create SmartUpsellEngine
- [ ] Trigger evaluation logic
- [ ] Message generation
- [ ] Accept/dismiss handling

### T4: API Endpoints

- [ ] GET /api/billing/credits/packs
- [ ] POST /api/billing/credits/purchase
- [ ] GET /api/billing/upsell/triggers

### T5: UI Components

- [ ] CreditPackGrid.tsx
- [ ] UpsellBanner.tsx
- [ ] OneClickTopUpButton.tsx

### T6: Webhook Integration

- [ ] Handle credit_pack fulfillment in Stripe webhook
- [ ] Update wallet balances
- [ ] Clear lockouts

## Completion Definition

Phase 42 is complete when:

1. **Marketplace functional**: Packs listed and purchasable
2. **One-click purchase**: Stripe integration working
3. **Upsell triggers**: Automatic offers based on signals
4. **Credits added**: Wallet updated after payment
5. **UI integrated**: Banners and buttons in dashboard
6. **No cost exposure**: Internal pricing hidden

---

*Phase 42 - Credit Marketplace & Smart Upsell Engine Complete*
*Unite-Hub Status: MARKETPLACE ACTIVE*
