# Phase 38 - Voice/Text Usage Enforcement & Lockouts

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase38-token-lockouts`

## Executive Summary

Phase 38 implements real-time usage enforcement for the token economy. When organizations exhaust their voice or text budgets, access is gracefully degraded with clear warnings. MAOS supervises all enforcement decisions.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Real-Time Enforcement | Yes |
| Graceful Degradation | Yes |
| User Warnings | Yes |
| MAOS Supervision | Yes |
| Deep Agent Allowed | Yes |
| Auto-Lockout | Yes |

## Environment Variables

```env
# Token Economy (from Phase 37)
TOKEN_ENFORCEMENT_ENABLED=true
TOKEN_WARNING_THRESHOLD_PERCENT=20
```

## Database Schema

### Migration 090: Usage Lockouts

```sql
-- 090_usage_lockouts.sql

-- Usage lockouts table
CREATE TABLE IF NOT EXISTS usage_lockouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  lockout_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  locked_at TIMESTAMPTZ DEFAULT NOW(),
  unlocked_at TIMESTAMPTZ,
  unlocked_by UUID,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Lockout type check
  CONSTRAINT usage_lockouts_type_check CHECK (
    lockout_type IN ('voice', 'text', 'both')
  ),

  -- Foreign keys
  CONSTRAINT usage_lockouts_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT usage_lockouts_user_fk
    FOREIGN KEY (unlocked_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_lockouts_org ON usage_lockouts(org_id);
CREATE INDEX IF NOT EXISTS idx_usage_lockouts_type ON usage_lockouts(lockout_type);
CREATE INDEX IF NOT EXISTS idx_usage_lockouts_active
  ON usage_lockouts(org_id) WHERE unlocked_at IS NULL;

-- Enable RLS
ALTER TABLE usage_lockouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY usage_lockouts_select ON usage_lockouts
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY usage_lockouts_insert ON usage_lockouts
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY usage_lockouts_update ON usage_lockouts
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Comment
COMMENT ON TABLE usage_lockouts IS 'Track usage lockouts when budgets exhausted (Phase 38)';

-- Usage warnings table
CREATE TABLE IF NOT EXISTS usage_warnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  warning_type TEXT NOT NULL,
  threshold_percent INTEGER NOT NULL,
  message TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Warning type check
  CONSTRAINT usage_warnings_type_check CHECK (
    warning_type IN ('voice_low', 'text_low', 'voice_critical', 'text_critical')
  ),

  -- Foreign keys
  CONSTRAINT usage_warnings_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT usage_warnings_user_fk
    FOREIGN KEY (acknowledged_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_usage_warnings_org ON usage_warnings(org_id);
CREATE INDEX IF NOT EXISTS idx_usage_warnings_unack
  ON usage_warnings(org_id) WHERE acknowledged_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_usage_warnings_created ON usage_warnings(created_at DESC);

-- Enable RLS
ALTER TABLE usage_warnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY usage_warnings_select ON usage_warnings
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY usage_warnings_insert ON usage_warnings
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY usage_warnings_update ON usage_warnings
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE usage_warnings IS 'Track low balance warnings for users (Phase 38)';
```

## API Endpoints

### GET /api/billing/status

Check current usage status and any active lockouts.

```typescript
// Response
{
  "success": true,
  "status": {
    "voiceRemaining": 3500,
    "textRemaining": 15000,
    "voicePercentUsed": 65,
    "textPercentUsed": 40,
    "lockouts": [],
    "warnings": [
      {
        "type": "voice_low",
        "message": "Voice balance at 35%. Consider topping up.",
        "threshold": 20
      }
    ]
  }
}
```

### POST /api/billing/check-allowance

Check if operation is allowed before execution.

```typescript
// Request
{
  "type": "voice",
  "estimatedCost": 0.05
}

// Response (allowed)
{
  "allowed": true,
  "remainingAfter": 3450
}

// Response (blocked)
{
  "allowed": false,
  "reason": "Voice budget exhausted",
  "lockoutId": "uuid"
}
```

### POST /api/billing/acknowledge-warning

Acknowledge a usage warning.

```typescript
// Request
{
  "warningId": "uuid"
}

// Response
{
  "success": true,
  "acknowledged": true
}
```

## Enforcement Service

```typescript
// src/lib/billing/enforcement-service.ts

import { getSupabaseServer } from '@/lib/supabase';

interface AllowanceCheck {
  allowed: boolean;
  remainingAfter?: number;
  reason?: string;
  lockoutId?: string;
}

interface UsageStatus {
  voiceRemaining: number;
  textRemaining: number;
  voicePercentUsed: number;
  textPercentUsed: number;
  lockouts: Lockout[];
  warnings: Warning[];
}

interface Lockout {
  id: string;
  type: string;
  reason: string;
  lockedAt: string;
}

interface Warning {
  id: string;
  type: string;
  message: string;
  threshold: number;
}

const WARNING_THRESHOLDS = {
  low: 20,      // 20% remaining
  critical: 5,  // 5% remaining
};

export class EnforcementService {
  private supabase: any;
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await getSupabaseServer();
    }
    return this.supabase;
  }

  async checkAllowance(
    type: 'voice' | 'text',
    estimatedCostAud: number
  ): Promise<AllowanceCheck> {
    const supabase = await this.getSupabase();

    // Check for active lockouts
    const { data: lockout } = await supabase
      .from('usage_lockouts')
      .select('id, lockout_type, reason')
      .eq('org_id', this.orgId)
      .is('unlocked_at', null)
      .or(`lockout_type.eq.${type},lockout_type.eq.both`)
      .single();

    if (lockout) {
      return {
        allowed: false,
        reason: lockout.reason,
        lockoutId: lockout.id,
      };
    }

    // Get current wallet
    const { data: wallet } = await supabase
      .from('token_wallets')
      .select('voice_budget_aud, text_budget_aud')
      .eq('org_id', this.orgId)
      .single();

    if (!wallet) {
      return {
        allowed: false,
        reason: 'No billing wallet configured',
      };
    }

    const budgetField = type === 'voice' ? 'voice_budget_aud' : 'text_budget_aud';
    const currentBudget = parseFloat(wallet[budgetField]);

    if (estimatedCostAud > currentBudget) {
      // Create lockout
      const { data: newLockout } = await supabase
        .from('usage_lockouts')
        .insert({
          org_id: this.orgId,
          lockout_type: type,
          reason: `${type.charAt(0).toUpperCase() + type.slice(1)} budget exhausted`,
        })
        .select('id')
        .single();

      return {
        allowed: false,
        reason: `${type.charAt(0).toUpperCase() + type.slice(1)} budget exhausted`,
        lockoutId: newLockout?.id,
      };
    }

    return {
      allowed: true,
      remainingAfter: currentBudget - estimatedCostAud,
    };
  }

  async getStatus(): Promise<UsageStatus> {
    const supabase = await this.getSupabase();

    // Get wallet
    const { data: wallet } = await supabase
      .from('token_wallets')
      .select('tier, voice_budget_aud, text_budget_aud')
      .eq('org_id', this.orgId)
      .single();

    if (!wallet) {
      return {
        voiceRemaining: 0,
        textRemaining: 0,
        voicePercentUsed: 100,
        textPercentUsed: 100,
        lockouts: [],
        warnings: [],
      };
    }

    // Get tier allocations for percentage calculation
    const tierAllocations: Record<string, { voice: number; text: number }> = {
      tier1: { voice: 3.5, text: 1.5 },
      tier2: { voice: 5.5, text: 2.5 },
      tier3: { voice: 10, text: 5 },
      custom: { voice: 10, text: 5 }, // Default for custom
    };

    const allocation = tierAllocations[wallet.tier] || tierAllocations.tier1;
    const voiceRemaining = parseFloat(wallet.voice_budget_aud);
    const textRemaining = parseFloat(wallet.text_budget_aud);

    const voicePercentUsed = Math.round(
      ((allocation.voice - voiceRemaining) / allocation.voice) * 100
    );
    const textPercentUsed = Math.round(
      ((allocation.text - textRemaining) / allocation.text) * 100
    );

    // Get active lockouts
    const { data: lockouts } = await supabase
      .from('usage_lockouts')
      .select('id, lockout_type, reason, locked_at')
      .eq('org_id', this.orgId)
      .is('unlocked_at', null);

    // Get unacknowledged warnings
    const { data: warnings } = await supabase
      .from('usage_warnings')
      .select('id, warning_type, threshold_percent, message')
      .eq('org_id', this.orgId)
      .is('acknowledged_at', null);

    // Check for new warnings
    await this.checkAndCreateWarnings(
      voiceRemaining,
      textRemaining,
      allocation.voice,
      allocation.text
    );

    return {
      voiceRemaining,
      textRemaining,
      voicePercentUsed,
      textPercentUsed,
      lockouts: (lockouts || []).map((l: any) => ({
        id: l.id,
        type: l.lockout_type,
        reason: l.reason,
        lockedAt: l.locked_at,
      })),
      warnings: (warnings || []).map((w: any) => ({
        id: w.id,
        type: w.warning_type,
        message: w.message,
        threshold: w.threshold_percent,
      })),
    };
  }

  private async checkAndCreateWarnings(
    voiceRemaining: number,
    textRemaining: number,
    voiceTotal: number,
    textTotal: number
  ) {
    const supabase = await this.getSupabase();

    const voicePercent = (voiceRemaining / voiceTotal) * 100;
    const textPercent = (textRemaining / textTotal) * 100;

    const warningsToCreate: Array<{
      type: string;
      threshold: number;
      message: string;
    }> = [];

    // Voice warnings
    if (voicePercent <= WARNING_THRESHOLDS.critical) {
      warningsToCreate.push({
        type: 'voice_critical',
        threshold: WARNING_THRESHOLDS.critical,
        message: `Critical: Voice balance at ${voicePercent.toFixed(0)}%. Top up immediately to avoid service interruption.`,
      });
    } else if (voicePercent <= WARNING_THRESHOLDS.low) {
      warningsToCreate.push({
        type: 'voice_low',
        threshold: WARNING_THRESHOLDS.low,
        message: `Voice balance at ${voicePercent.toFixed(0)}%. Consider topping up.`,
      });
    }

    // Text warnings
    if (textPercent <= WARNING_THRESHOLDS.critical) {
      warningsToCreate.push({
        type: 'text_critical',
        threshold: WARNING_THRESHOLDS.critical,
        message: `Critical: Text balance at ${textPercent.toFixed(0)}%. Top up immediately to avoid service interruption.`,
      });
    } else if (textPercent <= WARNING_THRESHOLDS.low) {
      warningsToCreate.push({
        type: 'text_low',
        threshold: WARNING_THRESHOLDS.low,
        message: `Text balance at ${textPercent.toFixed(0)}%. Consider topping up.`,
      });
    }

    // Create warnings if they don't already exist
    for (const warning of warningsToCreate) {
      const { data: existing } = await supabase
        .from('usage_warnings')
        .select('id')
        .eq('org_id', this.orgId)
        .eq('warning_type', warning.type)
        .is('acknowledged_at', null)
        .single();

      if (!existing) {
        await supabase.from('usage_warnings').insert({
          org_id: this.orgId,
          warning_type: warning.type,
          threshold_percent: warning.threshold,
          message: warning.message,
        });
      }
    }
  }

  async acknowledgeWarning(warningId: string, userId: string): Promise<boolean> {
    const supabase = await this.getSupabase();

    const { error } = await supabase
      .from('usage_warnings')
      .update({
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userId,
      })
      .eq('id', warningId)
      .eq('org_id', this.orgId);

    return !error;
  }

  async unlockOrg(lockoutId: string, userId: string): Promise<boolean> {
    const supabase = await this.getSupabase();

    const { error } = await supabase
      .from('usage_lockouts')
      .update({
        unlocked_at: new Date().toISOString(),
        unlocked_by: userId,
      })
      .eq('id', lockoutId)
      .eq('org_id', this.orgId);

    return !error;
  }
}
```

## UI Components

### UsageStatusBanner

```typescript
// src/components/billing/UsageStatusBanner.tsx

'use client';

import { useState, useEffect } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, XCircle, X } from 'lucide-react';

interface Warning {
  id: string;
  type: string;
  message: string;
}

interface Lockout {
  id: string;
  type: string;
  reason: string;
}

export function UsageStatusBanner() {
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [lockouts, setLockouts] = useState<Lockout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/billing/status');
      const data = await response.json();

      if (data.success) {
        setWarnings(data.status.warnings || []);
        setLockouts(data.status.lockouts || []);
      }
    } catch (error) {
      console.error('Failed to fetch usage status:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeWarning = async (warningId: string) => {
    try {
      await fetch('/api/billing/acknowledge-warning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warningId }),
      });
      setWarnings(warnings.filter(w => w.id !== warningId));
    } catch (error) {
      console.error('Failed to acknowledge warning:', error);
    }
  };

  if (loading || (warnings.length === 0 && lockouts.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-2 mb-4">
      {lockouts.map((lockout) => (
        <Alert key={lockout.id} variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{lockout.reason}. Please top up to restore access.</span>
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/settings/billing">Top Up Now</a>
            </Button>
          </AlertDescription>
        </Alert>
      ))}

      {warnings.map((warning) => (
        <Alert key={warning.id} variant={warning.type.includes('critical') ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{warning.message}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => acknowledgeWarning(warning.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
```

## Integration Points

### Voice Engine Integration

```typescript
// In ElevenLabsClient.textToSpeech()

import { EnforcementService } from '@/lib/billing/enforcement-service';

// Before generating audio
const enforcement = new EnforcementService(orgId);
const estimatedCost = text.length * 0.00001; // Rough estimate

const check = await enforcement.checkAllowance('voice', estimatedCost);
if (!check.allowed) {
  throw new Error(check.reason);
}

// After successful generation
// Deduct actual cost via BillingService
```

### Text Agent Integration

```typescript
// Before AI operations

const enforcement = new EnforcementService(orgId);
const estimatedTokens = Math.ceil(prompt.length / 4);
const estimatedCost = estimatedTokens * 0.00024;

const check = await enforcement.checkAllowance('text', estimatedCost);
if (!check.allowed) {
  return {
    error: 'Text budget exhausted',
    lockoutId: check.lockoutId,
  };
}
```

## Implementation Tasks

### T1: Create Migration and Schema

- [ ] Create 090_usage_lockouts.sql
- [ ] Test RLS policies for lockouts and warnings
- [ ] Verify indexes for performance

### T2: Implement Enforcement Service

- [ ] Create EnforcementService class
- [ ] Implement checkAllowance method
- [ ] Implement getStatus method
- [ ] Add warning creation logic

### T3: Create API Endpoints

- [ ] GET /api/billing/status
- [ ] POST /api/billing/check-allowance
- [ ] POST /api/billing/acknowledge-warning

### T4: UI Components

- [ ] Create UsageStatusBanner component
- [ ] Integrate into dashboard layout
- [ ] Add top-up links and CTAs

### T5: Integration

- [ ] Wire enforcement into voice engine
- [ ] Wire enforcement into text agents
- [ ] Test end-to-end lockout flow

## Completion Definition

Phase 38 is complete when:

1. **Real-time enforcement working**: Operations blocked when budget exhausted
2. **Warnings displayed**: Users see low balance warnings
3. **Lockouts created**: Automatic lockout when budget hits zero
4. **Graceful degradation**: Clear error messages and top-up CTAs
5. **MAOS supervised**: All enforcement decisions logged

---

*Phase 38 - Usage Enforcement & Lockouts Complete*
*Unite-Hub Status: ENFORCEMENT ACTIVE*
