# Phase 83 - Autonomous Safety & Risk Supervisor (ASRS)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase83-autonomous-safety-risk-supervisor`

## Executive Summary

Phase 83 implements a real-time automated safety engine that intercepts all MAOS orchestrator actions, ADRE code diffs, and Voice-First commands. ASRS performs continuous risk scoring, predicts failure/outage likelihood, blocks unsafe operations, and routes flagged actions to HSOE for mandatory review.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Enforce claude.md | Yes |
| Strict Vendor Secrecy | Yes |
| No External API Calls | Yes |
| Multi-Tenant RLS | Yes |
| Mandatory Logging | Yes |
| ASRS Cannot Be Bypassed | Yes |
| No Model Names Exposed | Yes |
| No Cost Exposure | Yes |

## Mode Configuration

- **Type**: Autonomous Firewall
- **Live Intercept**: Yes
- **Risk Scoring**: Yes
- **Predictive Signals**: pattern_violation, rls_violation, sensitive_structure_touch, budget_risk, tenant_mismatch
- **Actions**: block, warn, auto-escalate, auto-require-HSOE

## Database Schema

### Migration 135: Autonomous Safety & Risk Supervisor

```sql
-- 135_autonomous_safety_risk_supervisor.sql

-- ASRS events table
CREATE TABLE IF NOT EXISTS asrs_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  risk_score NUMERIC NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  action_taken TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Source check
  CONSTRAINT asrs_events_source_check CHECK (
    source IN ('maos', 'adre', 'voice', 'api', 'webhook', 'system')
  ),

  -- Event type check
  CONSTRAINT asrs_events_type_check CHECK (
    event_type IN (
      'risk_scored', 'blocked', 'warned', 'escalated',
      'approved', 'policy_triggered', 'anomaly_detected'
    )
  ),

  -- Action taken check
  CONSTRAINT asrs_events_action_check CHECK (
    action_taken IN ('allow', 'block', 'warn', 'escalate', 'require_hsoe')
  ),

  -- Risk score check
  CONSTRAINT asrs_events_risk_check CHECK (
    risk_score >= 0 AND risk_score <= 100
  ),

  -- Foreign key
  CONSTRAINT asrs_events_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_asrs_events_tenant ON asrs_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asrs_events_source ON asrs_events(source);
CREATE INDEX IF NOT EXISTS idx_asrs_events_type ON asrs_events(event_type);
CREATE INDEX IF NOT EXISTS idx_asrs_events_risk ON asrs_events(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_asrs_events_action ON asrs_events(action_taken);
CREATE INDEX IF NOT EXISTS idx_asrs_events_created ON asrs_events(created_at DESC);

-- Enable RLS
ALTER TABLE asrs_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY asrs_events_select ON asrs_events
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY asrs_events_insert ON asrs_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE asrs_events IS 'ASRS safety events (Phase 83)';

-- ASRS policy rules table
CREATE TABLE IF NOT EXISTS asrs_policy_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Rule type check
  CONSTRAINT asrs_policy_rules_type_check CHECK (
    rule_type IN (
      'risk_threshold', 'path_protection', 'action_block',
      'budget_limit', 'rate_limit', 'pattern_match', 'custom'
    )
  ),

  -- Foreign key
  CONSTRAINT asrs_policy_rules_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_asrs_policy_rules_tenant ON asrs_policy_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asrs_policy_rules_type ON asrs_policy_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_asrs_policy_rules_enabled ON asrs_policy_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_asrs_policy_rules_created ON asrs_policy_rules(created_at DESC);

-- Enable RLS
ALTER TABLE asrs_policy_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY asrs_policy_rules_select ON asrs_policy_rules
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY asrs_policy_rules_insert ON asrs_policy_rules
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY asrs_policy_rules_update ON asrs_policy_rules
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE asrs_policy_rules IS 'ASRS policy rules (Phase 83)';

-- ASRS block log table
CREATE TABLE IF NOT EXISTS asrs_block_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  original_action JSONB DEFAULT '{}'::jsonb,
  risk_score NUMERIC NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  escalated_to_hsoe BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT asrs_block_log_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_asrs_block_log_tenant ON asrs_block_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_asrs_block_log_risk ON asrs_block_log(risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_asrs_block_log_escalated ON asrs_block_log(escalated_to_hsoe);
CREATE INDEX IF NOT EXISTS idx_asrs_block_log_created ON asrs_block_log(created_at DESC);

-- Enable RLS
ALTER TABLE asrs_block_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY asrs_block_log_select ON asrs_block_log
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY asrs_block_log_insert ON asrs_block_log
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE asrs_block_log IS 'ASRS blocked actions log (Phase 83)';
```

## ASRS Engine Service

```typescript
// src/lib/safety/asrs-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface ASRSEvent {
  id: string;
  tenantId: string;
  source: string;
  eventType: string;
  riskScore: number;
  metadata: Record<string, any>;
  actionTaken: string;
  createdAt: Date;
}

interface ASRSPolicyRule {
  id: string;
  tenantId: string;
  ruleName: string;
  ruleType: string;
  parameters: Record<string, any>;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ASRSBlockEntry {
  id: string;
  tenantId: string;
  originalAction: Record<string, any>;
  riskScore: number;
  reason: string;
  escalatedToHsoe: boolean;
  createdAt: Date;
}

interface InterceptionResult {
  allowed: boolean;
  riskScore: number;
  actionTaken: string;
  reason?: string;
  hsoeRequestId?: string;
}

const PROTECTED_PATHS = [
  'src/lib/billing/',
  'src/lib/pricing/',
  'src/lib/tokens/',
  'supabase/migrations/',
  '.env',
];

const HIGH_RISK_ACTIONS = [
  'delete_data',
  'modify_billing',
  'apply_migration',
  'override_safety',
  'bulk_operation',
];

export class ASRSEngine {
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  async intercept(
    source: string,
    actionType: string,
    payload: Record<string, any>
  ): Promise<InterceptionResult> {
    // Score the action
    const riskScore = await this.scoreAction(source, actionType, payload);

    // Run policy rules
    const policyResult = await this.runPolicies(actionType, payload, riskScore);

    // Determine action
    let actionTaken = 'allow';
    let reason: string | undefined;
    let hsoeRequestId: string | undefined;

    if (policyResult.blocked) {
      actionTaken = 'block';
      reason = policyResult.reason;
      await this.block(source, actionType, payload, riskScore, reason);
    } else if (riskScore >= 80) {
      actionTaken = 'require_hsoe';
      reason = 'High risk score requires human oversight';
      hsoeRequestId = await this.autoEscalate(source, actionType, payload, riskScore);
    } else if (riskScore >= 60) {
      actionTaken = 'warn';
      reason = 'Elevated risk - proceeding with caution';
    }

    // Log event
    await this.logEvent(source, 'risk_scored', riskScore, {
      actionType,
      actionTaken,
      reason,
    }, actionTaken);

    return {
      allowed: actionTaken !== 'block',
      riskScore,
      actionTaken,
      reason,
      hsoeRequestId,
    };
  }

  async scoreAction(
    source: string,
    actionType: string,
    payload: Record<string, any>
  ): Promise<number> {
    let score = 0;

    // Base risk by source
    const sourceRisk: Record<string, number> = {
      maos: 20,
      adre: 30,
      voice: 25,
      api: 15,
      webhook: 20,
      system: 10,
    };
    score += sourceRisk[source] || 15;

    // High risk actions
    if (HIGH_RISK_ACTIONS.some(a => actionType.includes(a))) {
      score += 40;
    }

    // Protected path access
    if (payload.filePath && PROTECTED_PATHS.some(p => payload.filePath.includes(p))) {
      score += 30;
    }

    // Bulk operations
    if (payload.count && payload.count > 100) {
      score += 15;
    }

    // Budget impact
    if (payload.estimatedCost && payload.estimatedCost > 100) {
      score += 20;
    }

    // Pattern violations
    if (this.detectPatternViolation(payload)) {
      score += 25;
    }

    return Math.min(score, 100);
  }

  private detectPatternViolation(payload: Record<string, any>): boolean {
    const content = JSON.stringify(payload).toLowerCase();

    // Check for sensitive patterns
    const sensitivePatterns = [
      /api_key/i,
      /secret/i,
      /password/i,
      /token.*rate/i,
      /pricing.*internal/i,
    ];

    return sensitivePatterns.some(p => p.test(content));
  }

  async runPolicies(
    actionType: string,
    payload: Record<string, any>,
    riskScore: number
  ): Promise<{ blocked: boolean; reason?: string }> {
    const rules = await this.getRules();

    for (const rule of rules.filter(r => r.enabled)) {
      const result = this.evaluateRule(rule, actionType, payload, riskScore);
      if (result.blocked) {
        return result;
      }
    }

    return { blocked: false };
  }

  private evaluateRule(
    rule: ASRSPolicyRule,
    actionType: string,
    payload: Record<string, any>,
    riskScore: number
  ): { blocked: boolean; reason?: string } {
    switch (rule.ruleType) {
      case 'risk_threshold':
        const threshold = rule.parameters.threshold || 90;
        if (riskScore >= threshold) {
          return {
            blocked: true,
            reason: `Risk score ${riskScore} exceeds threshold ${threshold}`,
          };
        }
        break;

      case 'path_protection':
        const protectedPaths = rule.parameters.paths || [];
        if (payload.filePath && protectedPaths.some((p: string) => payload.filePath.includes(p))) {
          return {
            blocked: true,
            reason: `Access to protected path: ${payload.filePath}`,
          };
        }
        break;

      case 'action_block':
        const blockedActions = rule.parameters.actions || [];
        if (blockedActions.includes(actionType)) {
          return {
            blocked: true,
            reason: `Action type blocked by policy: ${actionType}`,
          };
        }
        break;

      case 'budget_limit':
        const limit = rule.parameters.limit || 1000;
        if (payload.estimatedCost && payload.estimatedCost > limit) {
          return {
            blocked: true,
            reason: `Estimated cost ${payload.estimatedCost} exceeds limit ${limit}`,
          };
        }
        break;

      case 'rate_limit':
        // Would check rate limiting
        break;
    }

    return { blocked: false };
  }

  async autoEscalate(
    source: string,
    actionType: string,
    payload: Record<string, any>,
    riskScore: number
  ): Promise<string> {
    const supabase = await getSupabaseServer();

    // Create HSOE request
    const { data } = await supabase
      .from('hsoe_requests')
      .insert({
        tenant_id: this.tenantId,
        trigger_source: source,
        action_type: actionType,
        payload,
        risk_level: riskScore >= 90 ? 'critical' : 'high',
        status: 'pending',
      })
      .select()
      .single();

    // Log escalation
    await this.logEvent(source, 'escalated', riskScore, {
      actionType,
      hsoeRequestId: data.id,
    }, 'escalate');

    return data.id;
  }

  async block(
    source: string,
    actionType: string,
    payload: Record<string, any>,
    riskScore: number,
    reason: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Log to block log
    await supabase.from('asrs_block_log').insert({
      tenant_id: this.tenantId,
      original_action: { source, actionType, payload },
      risk_score: riskScore,
      reason,
      escalated_to_hsoe: riskScore >= 80,
    });

    // Log event
    await this.logEvent(source, 'blocked', riskScore, {
      actionType,
      reason,
    }, 'block');
  }

  private async logEvent(
    source: string,
    eventType: string,
    riskScore: number,
    metadata: Record<string, any>,
    actionTaken: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from('asrs_events').insert({
      tenant_id: this.tenantId,
      source,
      event_type: eventType,
      risk_score: riskScore,
      metadata,
      action_taken: actionTaken,
    });
  }

  async createRule(
    ruleName: string,
    ruleType: string,
    parameters: Record<string, any>
  ): Promise<ASRSPolicyRule> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('asrs_policy_rules')
      .insert({
        tenant_id: this.tenantId,
        rule_name: ruleName,
        rule_type: ruleType,
        parameters,
        enabled: true,
      })
      .select()
      .single();

    return this.mapToRule(data);
  }

  async updateRule(
    ruleId: string,
    updates: Partial<{ ruleName: string; parameters: Record<string, any>; enabled: boolean }>
  ): Promise<ASRSPolicyRule> {
    const supabase = await getSupabaseServer();

    const updateData: any = { updated_at: new Date().toISOString() };
    if (updates.ruleName) updateData.rule_name = updates.ruleName;
    if (updates.parameters) updateData.parameters = updates.parameters;
    if (updates.enabled !== undefined) updateData.enabled = updates.enabled;

    const { data } = await supabase
      .from('asrs_policy_rules')
      .update(updateData)
      .eq('id', ruleId)
      .select()
      .single();

    return this.mapToRule(data);
  }

  async getRules(): Promise<ASRSPolicyRule[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('asrs_policy_rules')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('rule_name');

    return (data || []).map(r => this.mapToRule(r));
  }

  async getEvents(limit: number = 100): Promise<ASRSEvent[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('asrs_events')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).map(e => ({
      id: e.id,
      tenantId: e.tenant_id,
      source: e.source,
      eventType: e.event_type,
      riskScore: e.risk_score,
      metadata: e.metadata,
      actionTaken: e.action_taken,
      createdAt: new Date(e.created_at),
    }));
  }

  async getBlockLog(limit: number = 50): Promise<ASRSBlockEntry[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('asrs_block_log')
      .select('*')
      .eq('tenant_id', this.tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).map(b => ({
      id: b.id,
      tenantId: b.tenant_id,
      originalAction: b.original_action,
      riskScore: b.risk_score,
      reason: b.reason,
      escalatedToHsoe: b.escalated_to_hsoe,
      createdAt: new Date(b.created_at),
    }));
  }

  async getStats(): Promise<{
    totalEvents: number;
    blocked: number;
    escalated: number;
    avgRiskScore: number;
    bySource: Record<string, number>;
  }> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('asrs_events')
      .select('event_type, source, risk_score')
      .eq('tenant_id', this.tenantId);

    const stats = {
      totalEvents: (data || []).length,
      blocked: 0,
      escalated: 0,
      avgRiskScore: 0,
      bySource: {} as Record<string, number>,
    };

    let totalRisk = 0;
    for (const event of data || []) {
      if (event.event_type === 'blocked') stats.blocked++;
      if (event.event_type === 'escalated') stats.escalated++;
      totalRisk += event.risk_score;
      stats.bySource[event.source] = (stats.bySource[event.source] || 0) + 1;
    }

    stats.avgRiskScore = stats.totalEvents > 0 ? totalRisk / stats.totalEvents : 0;

    return stats;
  }

  private mapToRule(data: any): ASRSPolicyRule {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      ruleName: data.rule_name,
      ruleType: data.rule_type,
      parameters: data.parameters,
      enabled: data.enabled,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
```

## API Endpoints

### POST /api/safety/intercept

Intercept and score action.

### POST /api/safety/rules

Create policy rule.

### PATCH /api/safety/rules/:ruleId

Update policy rule.

### GET /api/safety/rules

Get all rules.

### GET /api/safety/events

Get safety events.

### GET /api/safety/blocks

Get block log.

### GET /api/safety/stats

Get safety statistics.

## CLI Commands

```bash
# List policy rules
unite asrs:rules:list

# Update rule
unite asrs:rules:update <rule-id> --enabled false

# View recent events
unite asrs:events --limit 50

# Test action scoring
unite asrs:test --source maos --action apply_changes --payload '{"filePath": "src/lib/billing/"}'
```

## Integration Points

### MAOS Orchestrator Integration

```typescript
// Before dispatching action in MAOS:
const asrs = new ASRSEngine(this.orgId);
const result = await asrs.intercept('maos', step.action, step.parameters);

if (!result.allowed) {
  throw new Error(`ASRS blocked action: ${result.reason}`);
}

if (result.actionTaken === 'require_hsoe') {
  throw new Error(`Awaiting HSOE approval: ${result.hsoeRequestId}`);
}
```

### ADRE Integration

```typescript
// Before applying changes:
const asrs = new ASRSEngine(this.orgId);
for (const change of changes) {
  const result = await asrs.intercept('adre', 'apply_diff', {
    filePath: change.filePath,
    changeType: change.changeType,
  });

  if (!result.allowed) {
    throw new Error(`ASRS blocked: ${result.reason}`);
  }
}
```

### Voice-First Integration

```typescript
// Before executing voice command:
const asrs = new ASRSEngine(this.orgId);
const result = await asrs.intercept('voice', intent.action, intent.parameters);

if (!result.allowed) {
  return 'This command has been blocked for safety. Please contact a supervisor.';
}
```

## Implementation Tasks

- [ ] Create 135_autonomous_safety_risk_supervisor.sql
- [ ] Implement ASRSEngine
- [ ] Create API endpoints
- [ ] Create ASRS Dashboard (React)
- [ ] Add CLI commands
- [ ] Integrate with MAOS orchestrator
- [ ] Integrate with ADRE
- [ ] Integrate with Voice-First
- [ ] Add full Jest test suite

---

*Phase 83 - Autonomous Safety & Risk Supervisor Complete*
