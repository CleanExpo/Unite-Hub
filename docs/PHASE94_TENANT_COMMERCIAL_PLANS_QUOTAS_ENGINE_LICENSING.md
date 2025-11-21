# Phase 94: Tenant Commercial Plans, Quotas & Engine Licensing (TCPQEL)

## Overview

The Tenant Commercial Plans, Quotas & Engine Licensing engine (TCPQEL) implements a universal commercial engine defining subscription tiers, usage quotas, per-engine licensing, overage rules, and billing alignment across all Unite-Hub engines.

## Database Schema

### Tables

#### tcpqel_plans
Defines subscription tiers and included engines.

```sql
CREATE TABLE tcpqel_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_name TEXT NOT NULL UNIQUE,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  included_engines JSONB DEFAULT '[]'::jsonb,
  usage_limits JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### tcpqel_tenant_plans
Maps tenants to plans and applied quotas.

```sql
CREATE TABLE tcpqel_tenant_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  plan_id UUID NOT NULL,
  active BOOLEAN DEFAULT true,
  quota_usage JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT tcpqel_tenant_plans_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT tcpqel_tenant_plans_plan_fk
    FOREIGN KEY (plan_id) REFERENCES tcpqel_plans(id) ON DELETE RESTRICT
);
```

#### tcpqel_engine_licenses
Per-engine licensing for tenants beyond base plans.

```sql
CREATE TABLE tcpqel_engine_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  engine_name TEXT NOT NULL,
  licensed BOOLEAN DEFAULT true,
  quota JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT tcpqel_engine_licenses_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);
```

## TypeScript Service

### TCPQELEngine.ts

```typescript
import { createClient } from '@supabase/supabase-js';

export class TCPQELEngine {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async checkQuota(tenantId: string, engine: string, amount: number): Promise<{
    allowed: boolean;
    remaining: number;
    reason?: string;
  }> {
    const { data: tenantPlan } = await this.supabase
      .from('tcpqel_tenant_plans')
      .select('*, tcpqel_plans(*)')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .single();

    if (!tenantPlan) {
      return { allowed: false, remaining: 0, reason: 'No active plan' };
    }

    const limits = tenantPlan.tcpqel_plans?.usage_limits || {};
    const usage = tenantPlan.quota_usage || {};
    const limit = limits[engine] || 0;
    const used = usage[engine] || 0;
    const remaining = limit - used;

    if (amount > remaining) {
      return { allowed: false, remaining, reason: 'Quota exceeded' };
    }

    return { allowed: true, remaining: remaining - amount };
  }

  async allocatePlan(tenantId: string, planId: string): Promise<void> {
    await this.supabase
      .from('tcpqel_tenant_plans')
      .update({ active: false })
      .eq('tenant_id', tenantId);

    await this.supabase.from('tcpqel_tenant_plans').insert({
      tenant_id: tenantId,
      plan_id: planId,
      active: true,
      quota_usage: {}
    });
  }

  async chargeOverage(tenantId: string, engine: string, amount: number): Promise<void> {
    const { data: tenantPlan } = await this.supabase
      .from('tcpqel_tenant_plans')
      .select('id, quota_usage')
      .eq('tenant_id', tenantId)
      .eq('active', true)
      .single();

    if (!tenantPlan) return;

    const usage = tenantPlan.quota_usage || {};
    usage[engine] = (usage[engine] || 0) + amount;

    await this.supabase
      .from('tcpqel_tenant_plans')
      .update({ quota_usage: usage })
      .eq('id', tenantPlan.id);
  }

  async enforceLockout(tenantId: string, engine: string): Promise<boolean> {
    const check = await this.checkQuota(tenantId, engine, 0);
    return check.remaining <= 0;
  }
}

export const tcpqelEngine = new TCPQELEngine();
```

## Migration

See `supabase/migrations/146_tenant_commercial_plans_quotas_licensing.sql`
