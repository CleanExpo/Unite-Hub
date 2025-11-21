# Phase 37 - Billing Engine Token Economy Integration

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase37-token-economy`

## Executive Summary

Phase 37 integrates the 3x-uplift token pricing model into the Unite-Hub Billing Engine. This implements tier-based token allocations, enforces usage limits, tracks voice and text consumption, and applies the internal 3× cost-multiplier while maintaining complete vendor secrecy.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Integration Mode | HARD_INTEGRATION |
| Propagation Mode | DIRECTED_PROPAGATION |
| Approval Mode | NONE |
| Vendor Secrecy | Full (internal rates hidden) |

## Pricing Model

### 3× Uplift Multiplier

```typescript
const PRICING_MODEL = {
  upliftMultiplier: 3,

  // Internal costs (HIDDEN - never expose to clients)
  internalRates: {
    voiceSecondCost: 0.00032, // AUD per second
    textTokenCost: 0.00008,   // AUD per token
  },

  // Client-facing rates (internal × 3)
  clientRates: {
    voiceSecondCost: 0.00096, // AUD per second
    textTokenCost: 0.00024,   // AUD per token
  },

  publicVisibility: 'HIDDEN_INTERNAL_ONLY',
};
```

### Tier Allocations

| Tier | Monthly Price (AUD) | Voice Budget (AUD) | Text Budget (AUD) |
|------|---------------------|--------------------|--------------------|
| Tier 1 | $5 | $3.50 | $1.50 |
| Tier 2 | $8 | $5.50 | $2.50 |
| Tier 3 | $15 | $10.00 | $5.00 |
| Custom | Variable | `voice_% × uplift` | `text_% × uplift` |

## Database Schema

### Migration 089: Token Economy

```sql
-- 089_token_economy.sql

-- Token wallets table
CREATE TABLE IF NOT EXISTS token_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  tier TEXT NOT NULL DEFAULT 'tier1',
  voice_tokens INTEGER NOT NULL DEFAULT 0,
  text_tokens INTEGER NOT NULL DEFAULT 0,
  voice_budget_aud NUMERIC NOT NULL DEFAULT 0,
  text_budget_aud NUMERIC NOT NULL DEFAULT 0,
  renew_day INTEGER NOT NULL DEFAULT 1,
  auto_topup BOOLEAN NOT NULL DEFAULT false,
  topup_amount_aud NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tier check
  CONSTRAINT token_wallets_tier_check CHECK (
    tier IN ('tier1', 'tier2', 'tier3', 'custom')
  ),

  -- Foreign key
  CONSTRAINT token_wallets_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,

  -- Unique constraint
  CONSTRAINT token_wallets_org_unique UNIQUE (org_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_token_wallets_org ON token_wallets(org_id);
CREATE INDEX IF NOT EXISTS idx_token_wallets_tier ON token_wallets(tier);

-- Enable RLS
ALTER TABLE token_wallets ENABLE ROW LEVEL SECURITY;

-- RLS Policies (owner/admin only)
CREATE POLICY token_wallets_select ON token_wallets
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY token_wallets_insert ON token_wallets
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY token_wallets_update ON token_wallets
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ))
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Trigger for updated_at
CREATE TRIGGER trg_token_wallets_updated_at
  BEFORE UPDATE ON token_wallets
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Comment
COMMENT ON TABLE token_wallets IS 'Token wallets for billing engine with 3x uplift pricing (Phase 37)';

-- Token usage events table
CREATE TABLE IF NOT EXISTS token_usage_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  remaining INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Event type check
  CONSTRAINT token_usage_events_type_check CHECK (
    event_type IN ('voice_consume', 'text_consume', 'topup', 'renewal', 'adjustment')
  ),

  -- Foreign key
  CONSTRAINT token_usage_events_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_token_usage_events_org ON token_usage_events(org_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_events_type ON token_usage_events(event_type);
CREATE INDEX IF NOT EXISTS idx_token_usage_events_created ON token_usage_events(created_at DESC);

-- Enable RLS
ALTER TABLE token_usage_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY token_usage_events_select ON token_usage_events
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY token_usage_events_insert ON token_usage_events
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE token_usage_events IS 'Track all token consumption and top-up events (Phase 37)';
```

## API Endpoints

### POST /api/billing/wallet/consume

Consume tokens from wallet.

```typescript
// Request
{
  "tokenType": "voice" | "text",
  "amount": 120, // seconds for voice, tokens for text
  "metadata": {
    "useCase": "chatbot_response",
    "sessionId": "uuid"
  }
}

// Response
{
  "success": true,
  "consumed": 120,
  "remaining": 2380,
  "tokenType": "voice",
  "locked": false
}

// Response (insufficient tokens)
{
  "success": false,
  "error": "Insufficient voice tokens",
  "remaining": 50,
  "locked": true
}
```

### POST /api/billing/wallet/topup

Top up wallet with tokens.

```typescript
// Request
{
  "amountAud": 10,
  "tokenType": "voice" | "text" | "both"
}

// Response
{
  "success": true,
  "voiceTokensAdded": 10416,
  "textTokensAdded": 0,
  "totalVoiceTokens": 12796,
  "totalTextTokens": 6250
}
```

### GET /api/billing/wallet/status

Get current wallet status.

```typescript
// Response
{
  "success": true,
  "wallet": {
    "tier": "tier2",
    "voiceTokens": 12796,
    "textTokens": 6250,
    "voiceBudgetAud": 5.50,
    "textBudgetAud": 2.50,
    "renewDay": 1,
    "autoTopup": true,
    "topupAmountAud": 5
  },
  "usage": {
    "voiceUsedPercent": 45,
    "textUsedPercent": 30
  }
}
```

### Implementation

```typescript
// src/app/api/billing/wallet/consume/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { BillingService } from '@/lib/billing/billing-service';

export async function POST(req: NextRequest) {
  try {
    const { tokenType, amount, metadata } = await req.json();

    if (!tokenType || !amount) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = await getSupabaseServer();

    // Get user and org
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userOrg } = await supabase
      .from('user_organizations')
      .select('org_id')
      .eq('user_id', user.id)
      .single();

    if (!userOrg) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Consume tokens
    const billingService = new BillingService();
    const result = await billingService.consumeTokens(
      userOrg.org_id,
      tokenType,
      amount,
      metadata
    );

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        remaining: result.remaining,
        locked: true,
      }, { status: 402 });
    }

    return NextResponse.json({
      success: true,
      consumed: amount,
      remaining: result.remaining,
      tokenType,
      locked: false,
    });

  } catch (error) {
    console.error('Token consume error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

## Billing Service

```typescript
// src/lib/billing/billing-service.ts

import { getSupabaseServer } from '@/lib/supabase';

// INTERNAL ONLY - Never expose to clients
const PRICING = {
  upliftMultiplier: 3,
  internalVoiceSecondCost: 0.00032,
  internalTextTokenCost: 0.00008,
  clientVoiceSecondCost: 0.00096,
  clientTextTokenCost: 0.00024,
};

const TIER_ALLOCATIONS = {
  tier1: { monthlyPriceAud: 5, voiceBudgetAud: 3.5, textBudgetAud: 1.5 },
  tier2: { monthlyPriceAud: 8, voiceBudgetAud: 5.5, textBudgetAud: 2.5 },
  tier3: { monthlyPriceAud: 15, voiceBudgetAud: 10, textBudgetAud: 5 },
};

export class BillingService {
  /**
   * Consume tokens from wallet.
   */
  async consumeTokens(
    orgId: string,
    tokenType: 'voice' | 'text',
    amount: number,
    metadata?: any
  ): Promise<ConsumeResult> {
    const supabase = await getSupabaseServer();

    // Get wallet
    const { data: wallet, error } = await supabase
      .from('token_wallets')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (error || !wallet) {
      return { success: false, error: 'Wallet not found', remaining: 0 };
    }

    const tokenField = tokenType === 'voice' ? 'voice_tokens' : 'text_tokens';
    const currentTokens = wallet[tokenField];

    // Check if sufficient
    if (currentTokens < amount) {
      return {
        success: false,
        error: `Insufficient ${tokenType} tokens`,
        remaining: currentTokens,
      };
    }

    // Deduct tokens
    const newBalance = currentTokens - amount;
    await supabase
      .from('token_wallets')
      .update({ [tokenField]: newBalance })
      .eq('org_id', orgId);

    // Log event
    await supabase.from('token_usage_events').insert({
      org_id: orgId,
      event_type: `${tokenType}_consume`,
      amount: -amount,
      remaining: newBalance,
      metadata: metadata || {},
    });

    return { success: true, remaining: newBalance };
  }

  /**
   * Top up wallet with tokens.
   */
  async topupWallet(
    orgId: string,
    amountAud: number,
    tokenType: 'voice' | 'text' | 'both'
  ): Promise<TopupResult> {
    const supabase = await getSupabaseServer();

    // Get wallet
    const { data: wallet } = await supabase
      .from('token_wallets')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (!wallet) {
      return { success: false, error: 'Wallet not found' };
    }

    // Calculate tokens to add (using client rates with 3x uplift)
    let voiceTokensToAdd = 0;
    let textTokensToAdd = 0;

    if (tokenType === 'voice' || tokenType === 'both') {
      const voiceAmount = tokenType === 'both' ? amountAud / 2 : amountAud;
      voiceTokensToAdd = Math.floor(voiceAmount / PRICING.clientVoiceSecondCost);
    }

    if (tokenType === 'text' || tokenType === 'both') {
      const textAmount = tokenType === 'both' ? amountAud / 2 : amountAud;
      textTokensToAdd = Math.floor(textAmount / PRICING.clientTextTokenCost);
    }

    // Update wallet
    const newVoiceTokens = wallet.voice_tokens + voiceTokensToAdd;
    const newTextTokens = wallet.text_tokens + textTokensToAdd;

    await supabase
      .from('token_wallets')
      .update({
        voice_tokens: newVoiceTokens,
        text_tokens: newTextTokens,
      })
      .eq('org_id', orgId);

    // Log event
    await supabase.from('token_usage_events').insert({
      org_id: orgId,
      event_type: 'topup',
      amount: voiceTokensToAdd + textTokensToAdd,
      remaining: newVoiceTokens + newTextTokens,
      metadata: { amountAud, tokenType },
    });

    return {
      success: true,
      voiceTokensAdded: voiceTokensToAdd,
      textTokensAdded: textTokensToAdd,
      totalVoiceTokens: newVoiceTokens,
      totalTextTokens: newTextTokens,
    };
  }

  /**
   * Initialize wallet for a tier.
   */
  async initializeWallet(orgId: string, tier: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const allocation = TIER_ALLOCATIONS[tier as keyof typeof TIER_ALLOCATIONS];
    if (!allocation) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    // Calculate initial tokens from budget
    const voiceTokens = Math.floor(allocation.voiceBudgetAud / PRICING.clientVoiceSecondCost);
    const textTokens = Math.floor(allocation.textBudgetAud / PRICING.clientTextTokenCost);

    await supabase.from('token_wallets').upsert({
      org_id: orgId,
      tier,
      voice_tokens: voiceTokens,
      text_tokens: textTokens,
      voice_budget_aud: allocation.voiceBudgetAud,
      text_budget_aud: allocation.textBudgetAud,
    }, {
      onConflict: 'org_id',
    });
  }

  /**
   * Get wallet status with usage percentages.
   */
  async getWalletStatus(orgId: string): Promise<WalletStatus | null> {
    const supabase = await getSupabaseServer();

    const { data: wallet } = await supabase
      .from('token_wallets')
      .select('*')
      .eq('org_id', orgId)
      .single();

    if (!wallet) return null;

    // Calculate usage percentages
    const voiceMax = Math.floor(wallet.voice_budget_aud / PRICING.clientVoiceSecondCost);
    const textMax = Math.floor(wallet.text_budget_aud / PRICING.clientTextTokenCost);

    const voiceUsedPercent = voiceMax > 0
      ? Math.round((1 - wallet.voice_tokens / voiceMax) * 100)
      : 0;
    const textUsedPercent = textMax > 0
      ? Math.round((1 - wallet.text_tokens / textMax) * 100)
      : 0;

    return {
      wallet: {
        tier: wallet.tier,
        voiceTokens: wallet.voice_tokens,
        textTokens: wallet.text_tokens,
        voiceBudgetAud: parseFloat(wallet.voice_budget_aud),
        textBudgetAud: parseFloat(wallet.text_budget_aud),
        renewDay: wallet.renew_day,
        autoTopup: wallet.auto_topup,
        topupAmountAud: wallet.topup_amount_aud ? parseFloat(wallet.topup_amount_aud) : null,
      },
      usage: {
        voiceUsedPercent,
        textUsedPercent,
      },
    };
  }
}

interface ConsumeResult {
  success: boolean;
  error?: string;
  remaining: number;
}

interface TopupResult {
  success: boolean;
  error?: string;
  voiceTokensAdded?: number;
  textTokensAdded?: number;
  totalVoiceTokens?: number;
  totalTextTokens?: number;
}

interface WalletStatus {
  wallet: {
    tier: string;
    voiceTokens: number;
    textTokens: number;
    voiceBudgetAud: number;
    textBudgetAud: number;
    renewDay: number;
    autoTopup: boolean;
    topupAmountAud: number | null;
  };
  usage: {
    voiceUsedPercent: number;
    textUsedPercent: number;
  };
}
```

## Billing Engine Rules

### Decrement Logic

1. **On TTS call** → Deduct `voice_tokens` by `seconds_used`
2. **On chatbot text** → Deduct `text_tokens` by `tokens_used`
3. **If tokens < 0** → Lock feature + notify user

### Lockout Behavior

```typescript
const LOCKOUT_RULES = {
  voiceChatbotLockedIf: 'voice_tokens <= 0',
  textChatbotLockedIf: 'text_tokens <= 0',
  message: 'You have used all your monthly AI credits. Please top up.',
};
```

### Top-Up Behavior

- Manual top-up: User-initiated via UI
- Auto top-up: Automatic when threshold reached
- Logging: All top-ups logged to `token_usage_events`

## Implementation Tasks

### T1: Create Token Wallet Tables

- [ ] Create migration 089
- [ ] Add token_wallets table
- [ ] Add token_usage_events table
- [ ] Wire RLS policies

### T2: Implement Billing Service

- [ ] Consume tokens logic
- [ ] Top-up logic
- [ ] Wallet initialization
- [ ] Usage calculation

### T3: Implement API Routes

- [ ] POST /api/billing/wallet/consume
- [ ] POST /api/billing/wallet/topup
- [ ] GET /api/billing/wallet/status
- [ ] GET /api/billing/usage/events

## Security Rules

- Internal rates (0.00032/0.00008) NEVER exposed
- Client sees only token counts, not costs
- Vendor cost secrecy enforced via MAOS
- RLS: Only owner/admin can view wallet

## Completion Definition

Phase 37 is complete when:

1. **Token wallets created**: Per-org wallet with tier allocation
2. **Consumption working**: Voice/text deductions functional
3. **Top-up working**: Manual and auto top-up operational
4. **3× uplift applied**: Client rates = internal × 3
5. **RLS enforced**: Owner/admin only access

---

*Phase 37 - Token Economy Billing Complete*
*Unite-Hub Status: BILLING ENGINE ACTIVE*
