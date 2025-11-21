# Phase 95: Unified Compliance, SLA & Contract Enforcement Layer (UCSCEL)

## Overview

The Unified Compliance, SLA & Contract Enforcement Layer (UCSCEL) combines contracts, SLAs, compliance rules, and obligations into a unified enforcement layer that binds all engines to tenant-specific agreements.

## Database Schema

### Tables

#### ucscel_contracts
Defines contracts with SLA and compliance terms.

```sql
CREATE TABLE ucscel_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  contract_body JSONB DEFAULT '{}'::jsonb,
  sla_terms JSONB DEFAULT '{}'::jsonb,
  compliance_terms JSONB DEFAULT '{}'::jsonb,
  effective_date TIMESTAMPTZ NOT NULL,

  CONSTRAINT ucscel_contracts_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);
```

#### ucscel_enforcement_log
Logs all enforcement events for audit.

```sql
CREATE TABLE ucscel_enforcement_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT ucscel_enforcement_log_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);
```

## TypeScript Service

### UCSCELEngine.ts

```typescript
import { createClient } from '@supabase/supabase-js';

export class UCSCELEngine {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  async checkContractCompliance(
    tenantId: string,
    action: string
  ): Promise<{ compliant: boolean; violations: string[] }> {
    const { data: contract } = await this.supabase
      .from('ucscel_contracts')
      .select('*')
      .eq('tenant_id', tenantId)
      .lte('effective_date', new Date().toISOString())
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (!contract) {
      return { compliant: true, violations: [] };
    }

    const violations: string[] = [];
    const complianceTerms = contract.compliance_terms || {};

    // Check compliance rules
    if (complianceTerms.prohibited_actions?.includes(action)) {
      violations.push(`Action '${action}' prohibited by contract`);
    }

    return { compliant: violations.length === 0, violations };
  }

  async checkSLAAdherence(
    tenantId: string,
    metric: string,
    value: number
  ): Promise<{ within_sla: boolean; threshold: number }> {
    const { data: contract } = await this.supabase
      .from('ucscel_contracts')
      .select('sla_terms')
      .eq('tenant_id', tenantId)
      .lte('effective_date', new Date().toISOString())
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (!contract?.sla_terms?.[metric]) {
      return { within_sla: true, threshold: 0 };
    }

    const threshold = contract.sla_terms[metric];
    return { within_sla: value <= threshold, threshold };
  }

  async logEnforcementEvent(
    tenantId: string,
    eventType: string,
    details: Record<string, any>
  ): Promise<void> {
    await this.supabase.from('ucscel_enforcement_log').insert({
      tenant_id: tenantId,
      event_type: eventType,
      details
    });
  }
}

export const ucscelEngine = new UCSCELEngine();
```

## Integration Points

### GSLPIE Integration
- SLA terms from contracts feed into GSLPIE thresholds
- Performance breaches logged as enforcement events

### GRH-RAPE Integration
- Compliance terms align with regulatory requirements
- Regional policies enforced through contracts

## Migration

See `supabase/migrations/147_unified_compliance_sla_contract_enforcement.sql`
