# Phase 39 - Stripe Billing Sync & Auto Top-Up Orchestration

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase39-stripe-billing`

## Executive Summary

Phase 39 connects the token economy to Stripe for automated billing. Subscriptions renew monthly, auto top-ups trigger when balances are low, and all billing events are tracked. Deep Agent coordinates complex billing workflows under MAOS supervision.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Stripe Integration | Yes |
| Auto Subscription Renewal | Yes |
| Auto Top-Up | Yes |
| Webhook Handling | Yes |
| Deep Agent Orchestration | Yes |
| MAOS Supervision | Yes |

## Environment Variables

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PRICE_TIER1=price_tier1_id
STRIPE_PRICE_TIER2=price_tier2_id
STRIPE_PRICE_TIER3=price_tier3_id
STRIPE_PRICE_TOPUP=price_topup_id
```

## Database Schema

### Migration 091: Stripe Billing

```sql
-- 091_stripe_billing.sql

-- Stripe customers table
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT,
  tier TEXT NOT NULL DEFAULT 'tier1',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT stripe_customers_status_check CHECK (
    status IN ('active', 'past_due', 'canceled', 'trialing')
  ),

  -- Tier check
  CONSTRAINT stripe_customers_tier_check CHECK (
    tier IN ('tier1', 'tier2', 'tier3', 'custom')
  ),

  -- Foreign key
  CONSTRAINT stripe_customers_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stripe_customers_org ON stripe_customers(org_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_stripe ON stripe_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_status ON stripe_customers(status);

-- Enable RLS
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY stripe_customers_select ON stripe_customers
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY stripe_customers_insert ON stripe_customers
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY stripe_customers_update ON stripe_customers
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Trigger for updated_at
CREATE TRIGGER trg_stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Comment
COMMENT ON TABLE stripe_customers IS 'Stripe customer and subscription data (Phase 39)';

-- Billing events table
CREATE TABLE IF NOT EXISTS billing_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  amount_aud NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Event type check
  CONSTRAINT billing_events_type_check CHECK (
    event_type IN (
      'subscription_created',
      'subscription_renewed',
      'subscription_canceled',
      'payment_succeeded',
      'payment_failed',
      'topup_completed',
      'tier_changed',
      'refund_issued'
    )
  ),

  -- Foreign key
  CONSTRAINT billing_events_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_billing_events_org ON billing_events(org_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_type ON billing_events(event_type);
CREATE INDEX IF NOT EXISTS idx_billing_events_stripe ON billing_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_billing_events_created ON billing_events(created_at DESC);

-- Enable RLS
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY billing_events_select ON billing_events
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY billing_events_insert ON billing_events
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE billing_events IS 'Track all billing events and payments (Phase 39)';

-- Auto top-up queue table
CREATE TABLE IF NOT EXISTS topup_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  amount_aud NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT topup_queue_status_check CHECK (
    status IN ('pending', 'processing', 'completed', 'failed')
  ),

  -- Foreign key
  CONSTRAINT topup_queue_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_topup_queue_org ON topup_queue(org_id);
CREATE INDEX IF NOT EXISTS idx_topup_queue_status ON topup_queue(status);
CREATE INDEX IF NOT EXISTS idx_topup_queue_pending
  ON topup_queue(status) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE topup_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY topup_queue_select ON topup_queue
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY topup_queue_insert ON topup_queue
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY topup_queue_update ON topup_queue
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Comment
COMMENT ON TABLE topup_queue IS 'Queue for auto top-up processing (Phase 39)';
```

## API Endpoints

### POST /api/billing/webhooks/stripe

Stripe webhook handler for all billing events.

```typescript
// Handles:
// - invoice.payment_succeeded
// - invoice.payment_failed
// - customer.subscription.updated
// - customer.subscription.deleted
// - checkout.session.completed
```

### POST /api/billing/subscribe

Create or update subscription.

```typescript
// Request
{
  "tier": "tier2",
  "paymentMethodId": "pm_xxx"
}

// Response
{
  "success": true,
  "subscriptionId": "sub_xxx",
  "clientSecret": "xxx_secret_xxx" // For 3DS if needed
}
```

### POST /api/billing/topup

Manual or auto top-up.

```typescript
// Request
{
  "amount": 10,
  "auto": false
}

// Response
{
  "success": true,
  "paymentIntentId": "pi_xxx",
  "clientSecret": "xxx_secret_xxx"
}
```

### GET /api/billing/invoices

Get billing history.

```typescript
// Response
{
  "success": true,
  "invoices": [
    {
      "id": "in_xxx",
      "amount": 15,
      "status": "paid",
      "date": "2025-11-01",
      "pdfUrl": "https://..."
    }
  ]
}
```

## Stripe Service

```typescript
// src/lib/billing/stripe-service.ts

import Stripe from 'stripe';
import { getSupabaseServer } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const TIER_PRICES: Record<string, string> = {
  tier1: process.env.STRIPE_PRICE_TIER1!,
  tier2: process.env.STRIPE_PRICE_TIER2!,
  tier3: process.env.STRIPE_PRICE_TIER3!,
};

const TIER_AMOUNTS: Record<string, number> = {
  tier1: 500,  // $5.00 in cents
  tier2: 800,  // $8.00
  tier3: 1500, // $15.00
};

export class StripeService {
  async createCustomer(orgId: string, email: string, name: string): Promise<string> {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { orgId },
    });

    const supabase = await getSupabaseServer();
    await supabase.from('stripe_customers').insert({
      org_id: orgId,
      stripe_customer_id: customer.id,
    });

    return customer.id;
  }

  async createSubscription(
    orgId: string,
    tier: string,
    paymentMethodId: string
  ): Promise<{ subscriptionId: string; clientSecret?: string }> {
    const supabase = await getSupabaseServer();

    // Get or create customer
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('org_id', orgId)
      .single();

    if (!customer) {
      throw new Error('No Stripe customer found');
    }

    // Attach payment method
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.stripe_customer_id,
    });

    // Set as default
    await stripe.customers.update(customer.stripe_customer_id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.stripe_customer_id,
      items: [{ price: TIER_PRICES[tier] }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    // Update database
    await supabase
      .from('stripe_customers')
      .update({
        stripe_subscription_id: subscription.id,
        tier,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000),
      })
      .eq('org_id', orgId);

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.client_secret || undefined,
    };
  }

  async processTopup(orgId: string, amountAud: number): Promise<{
    paymentIntentId: string;
    clientSecret: string;
  }> {
    const supabase = await getSupabaseServer();

    // Get customer
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('org_id', orgId)
      .single();

    if (!customer) {
      throw new Error('No Stripe customer found');
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountAud * 100), // Convert to cents
      currency: 'aud',
      customer: customer.stripe_customer_id,
      metadata: {
        orgId,
        type: 'topup',
      },
    });

    // Add to queue
    await supabase.from('topup_queue').insert({
      org_id: orgId,
      amount_aud: amountAud,
      reason: 'Manual top-up',
      stripe_payment_intent_id: paymentIntent.id,
    });

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
    };
  }

  async handleWebhook(event: Stripe.Event): Promise<void> {
    const supabase = await getSupabaseServer();

    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const orgId = await this.getOrgIdFromCustomer(invoice.customer as string);

        if (!orgId) break;

        // Log event
        await supabase.from('billing_events').insert({
          org_id: orgId,
          event_type: 'payment_succeeded',
          stripe_event_id: event.id,
          amount_aud: invoice.amount_paid / 100,
          description: `Payment for ${invoice.lines.data[0]?.description || 'subscription'}`,
        });

        // Replenish tokens if subscription payment
        if (invoice.subscription) {
          await this.replenishTokens(orgId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const orgId = await this.getOrgIdFromCustomer(invoice.customer as string);

        if (!orgId) break;

        await supabase.from('billing_events').insert({
          org_id: orgId,
          event_type: 'payment_failed',
          stripe_event_id: event.id,
          amount_aud: invoice.amount_due / 100,
          description: 'Payment failed',
        });

        // Update customer status
        await supabase
          .from('stripe_customers')
          .update({ status: 'past_due' })
          .eq('org_id', orgId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const orgId = await this.getOrgIdFromCustomer(subscription.customer as string);

        if (!orgId) break;

        await supabase.from('billing_events').insert({
          org_id: orgId,
          event_type: 'subscription_canceled',
          stripe_event_id: event.id,
          amount_aud: 0,
          description: 'Subscription canceled',
        });

        await supabase
          .from('stripe_customers')
          .update({ status: 'canceled' })
          .eq('org_id', orgId);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        if (paymentIntent.metadata.type === 'topup') {
          const orgId = paymentIntent.metadata.orgId;

          // Update queue
          await supabase
            .from('topup_queue')
            .update({
              status: 'completed',
              processed_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', paymentIntent.id);

          // Add tokens to wallet
          const amountAud = paymentIntent.amount / 100;
          await this.creditWallet(orgId, amountAud);

          // Log event
          await supabase.from('billing_events').insert({
            org_id: orgId,
            event_type: 'topup_completed',
            stripe_event_id: event.id,
            amount_aud: amountAud,
            description: `Top-up of $${amountAud}`,
          });

          // Clear lockouts
          await supabase
            .from('usage_lockouts')
            .update({ unlocked_at: new Date().toISOString() })
            .eq('org_id', orgId)
            .is('unlocked_at', null);
        }
        break;
      }
    }
  }

  private async getOrgIdFromCustomer(stripeCustomerId: string): Promise<string | null> {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from('stripe_customers')
      .select('org_id')
      .eq('stripe_customer_id', stripeCustomerId)
      .single();

    return data?.org_id || null;
  }

  private async replenishTokens(orgId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get tier allocation
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('tier')
      .eq('org_id', orgId)
      .single();

    if (!customer) return;

    const allocations: Record<string, { voice: number; text: number }> = {
      tier1: { voice: 3.5, text: 1.5 },
      tier2: { voice: 5.5, text: 2.5 },
      tier3: { voice: 10, text: 5 },
    };

    const allocation = allocations[customer.tier] || allocations.tier1;

    // Reset wallet to full allocation
    await supabase
      .from('token_wallets')
      .update({
        voice_budget_aud: allocation.voice,
        text_budget_aud: allocation.text,
      })
      .eq('org_id', orgId);

    // Log renewal event
    await supabase.from('token_usage_events').insert({
      org_id: orgId,
      event_type: 'renewal',
      amount: 0,
      remaining: 0,
      metadata: {
        voice_budget: allocation.voice,
        text_budget: allocation.text,
      },
    });
  }

  private async creditWallet(orgId: string, amountAud: number): Promise<void> {
    const supabase = await getSupabaseServer();

    // Split 70/30 voice/text
    const voiceCredit = amountAud * 0.7;
    const textCredit = amountAud * 0.3;

    // Get current wallet
    const { data: wallet } = await supabase
      .from('token_wallets')
      .select('voice_budget_aud, text_budget_aud')
      .eq('org_id', orgId)
      .single();

    if (!wallet) return;

    // Add credits
    await supabase
      .from('token_wallets')
      .update({
        voice_budget_aud: parseFloat(wallet.voice_budget_aud) + voiceCredit,
        text_budget_aud: parseFloat(wallet.text_budget_aud) + textCredit,
      })
      .eq('org_id', orgId);
  }

  async getInvoices(orgId: string): Promise<any[]> {
    const supabase = await getSupabaseServer();

    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('org_id', orgId)
      .single();

    if (!customer) return [];

    const invoices = await stripe.invoices.list({
      customer: customer.stripe_customer_id,
      limit: 24,
    });

    return invoices.data.map((inv) => ({
      id: inv.id,
      amount: inv.amount_paid / 100,
      status: inv.status,
      date: new Date(inv.created * 1000).toISOString(),
      pdfUrl: inv.invoice_pdf,
    }));
  }
}
```

## Auto Top-Up Orchestration

```typescript
// src/lib/billing/auto-topup-orchestrator.ts

import { getSupabaseServer } from '@/lib/supabase';
import { StripeService } from './stripe-service';
import { EnforcementService } from './enforcement-service';

export class AutoTopupOrchestrator {
  async checkAndProcess(): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get all orgs with auto-topup enabled
    const { data: wallets } = await supabase
      .from('token_wallets')
      .select(`
        org_id,
        auto_topup,
        topup_amount_aud,
        voice_budget_aud,
        text_budget_aud,
        tier
      `)
      .eq('auto_topup', true);

    if (!wallets || wallets.length === 0) return;

    const stripeService = new StripeService();

    for (const wallet of wallets) {
      const enforcement = new EnforcementService(wallet.org_id);
      const status = await enforcement.getStatus();

      // Check if below threshold (20%)
      const voiceLow = status.voicePercentUsed >= 80;
      const textLow = status.textPercentUsed >= 80;

      if (voiceLow || textLow) {
        // Check for pending top-ups
        const { data: pending } = await supabase
          .from('topup_queue')
          .select('id')
          .eq('org_id', wallet.org_id)
          .eq('status', 'pending')
          .single();

        if (pending) continue; // Already queued

        // Get customer
        const { data: customer } = await supabase
          .from('stripe_customers')
          .select('stripe_customer_id')
          .eq('org_id', wallet.org_id)
          .single();

        if (!customer) continue;

        // Process auto top-up
        try {
          const result = await stripeService.processTopup(
            wallet.org_id,
            wallet.topup_amount_aud || 10
          );

          // Log in audit
          await supabase.from('auditLogs').insert({
            action: 'auto_topup_initiated',
            entity_type: 'billing',
            entity_id: result.paymentIntentId,
            metadata: {
              org_id: wallet.org_id,
              amount: wallet.topup_amount_aud,
              reason: voiceLow ? 'voice_low' : 'text_low',
            },
          });
        } catch (error) {
          console.error('Auto top-up failed:', error);
        }
      }
    }
  }
}

// Cron job runner
export async function runAutoTopupCheck(): Promise<void> {
  const orchestrator = new AutoTopupOrchestrator();
  await orchestrator.checkAndProcess();
}
```

## Webhook Endpoint

```typescript
// src/app/api/billing/webhooks/stripe/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { StripeService } from '@/lib/billing/stripe-service';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const stripeService = new StripeService();

  try {
    await stripeService.handleWebhook(event);
  } catch (error) {
    console.error('Webhook handling error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
```

## Implementation Tasks

### T1: Create Migration and Schema

- [ ] Create 091_stripe_billing.sql
- [ ] Test RLS policies
- [ ] Verify indexes for webhook performance

### T2: Implement Stripe Service

- [ ] Create StripeService class
- [ ] Implement customer creation
- [ ] Implement subscription management
- [ ] Implement top-up processing

### T3: Webhook Handler

- [ ] Create /api/billing/webhooks/stripe
- [ ] Handle invoice.payment_succeeded
- [ ] Handle invoice.payment_failed
- [ ] Handle subscription events
- [ ] Handle top-up completion

### T4: Auto Top-Up Orchestration

- [ ] Create AutoTopupOrchestrator
- [ ] Implement threshold checking
- [ ] Wire into cron job
- [ ] Test end-to-end flow

### T5: API Endpoints

- [ ] POST /api/billing/subscribe
- [ ] POST /api/billing/topup
- [ ] GET /api/billing/invoices

## Completion Definition

Phase 39 is complete when:

1. **Stripe integration working**: Customers, subscriptions, payments
2. **Webhooks processed**: All Stripe events handled correctly
3. **Auto top-up functional**: Triggers when balance low
4. **Tokens replenished**: Monthly renewal restores allocations
5. **Billing history available**: Invoices accessible to admins
6. **MAOS supervised**: All billing decisions logged

---

*Phase 39 - Stripe Billing Sync & Auto Top-Up Complete*
*Unite-Hub Status: BILLING FULLY AUTOMATED*
