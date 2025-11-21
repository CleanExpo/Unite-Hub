# Phase 84 - MAOS Cognitive Supervisor Engine (MCSE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase84-maos-cognitive-supervisor-engine`

## Executive Summary

Phase 84 establishes a reasoning validation and hallucination detection layer that evaluates MAOS agent plans, ADRE proposals, and Voice-First instructions. MCSE ensures logical coherence, eliminates invalid assumptions, sanitises reasoning, and prevents improper implicit actions before they reach ASRS or HSOE.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Must Enforce claude.md Rules | Yes |
| Must Maintain Strict Vendor Secrecy | Yes |
| Must Not Expose Model Names | Yes |
| Must Not Expose Token Costs | Yes |
| Must Not Make External API Calls | Yes |
| Must Enforce Multi-Tenant RLS | Yes |
| MCSE Must Always Be On | Yes |
| Must Log All Cognitive Events | Yes |

## Database Schema

### Migration 136: MAOS Cognitive Supervisor Engine

```sql
-- 136_mcse_cognitive_supervisor.sql

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS mcse_policy_rules CASCADE;
DROP TABLE IF EXISTS mcse_cognitive_events CASCADE;

-- MCSE cognitive events table
CREATE TABLE IF NOT EXISTS mcse_cognitive_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  source TEXT NOT NULL,
  risk_flags JSONB DEFAULT '[]'::jsonb,
  logic_score NUMERIC NOT NULL DEFAULT 100,
  hallucination_score NUMERIC NOT NULL DEFAULT 0,
  recommended_action TEXT NOT NULL DEFAULT 'allow',
  original_plan JSONB DEFAULT '{}'::jsonb,
  sanitised_plan JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Source check
  CONSTRAINT mcse_cognitive_events_source_check CHECK (
    source IN ('maos', 'adre', 'voice', 'deep_agent', 'manual', 'system')
  ),

  -- Recommended action check
  CONSTRAINT mcse_cognitive_events_action_check CHECK (
    recommended_action IN ('allow', 'sanitise', 'block', 'escalate', 'defer')
  ),

  -- Score ranges
  CONSTRAINT mcse_cognitive_events_logic_score_check CHECK (
    logic_score >= 0 AND logic_score <= 100
  ),

  CONSTRAINT mcse_cognitive_events_hallucination_score_check CHECK (
    hallucination_score >= 0 AND hallucination_score <= 100
  ),

  -- Foreign keys
  CONSTRAINT mcse_cognitive_events_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mcse_cognitive_events_tenant ON mcse_cognitive_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mcse_cognitive_events_source ON mcse_cognitive_events(source);
CREATE INDEX IF NOT EXISTS idx_mcse_cognitive_events_action ON mcse_cognitive_events(recommended_action);
CREATE INDEX IF NOT EXISTS idx_mcse_cognitive_events_logic ON mcse_cognitive_events(logic_score);
CREATE INDEX IF NOT EXISTS idx_mcse_cognitive_events_hallucination ON mcse_cognitive_events(hallucination_score);
CREATE INDEX IF NOT EXISTS idx_mcse_cognitive_events_created ON mcse_cognitive_events(created_at DESC);

-- Enable RLS
ALTER TABLE mcse_cognitive_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY mcse_cognitive_events_select ON mcse_cognitive_events
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY mcse_cognitive_events_insert ON mcse_cognitive_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY mcse_cognitive_events_update ON mcse_cognitive_events
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE mcse_cognitive_events IS 'Cognitive reasoning analysis events (Phase 84)';

-- MCSE policy rules table
CREATE TABLE IF NOT EXISTS mcse_policy_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT mcse_policy_rules_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mcse_policy_rules_tenant ON mcse_policy_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mcse_policy_rules_name ON mcse_policy_rules(rule_name);
CREATE INDEX IF NOT EXISTS idx_mcse_policy_rules_enabled ON mcse_policy_rules(enabled);

-- Enable RLS
ALTER TABLE mcse_policy_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY mcse_policy_rules_select ON mcse_policy_rules
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY mcse_policy_rules_insert ON mcse_policy_rules
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY mcse_policy_rules_update ON mcse_policy_rules
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY mcse_policy_rules_delete ON mcse_policy_rules
  FOR DELETE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE mcse_policy_rules IS 'Cognitive validation policy rules (Phase 84)';
```

## MAOS Cognitive Supervisor Engine Service

```typescript
// src/lib/cognitive/mcse-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface CognitiveEvent {
  id: string;
  tenantId: string;
  source: string;
  riskFlags: string[];
  logicScore: number;
  hallucinationScore: number;
  recommendedAction: string;
  originalPlan: Record<string, any>;
  sanitisedPlan: Record<string, any>;
  createdAt: Date;
}

interface PolicyRule {
  id: string;
  tenantId: string;
  ruleName: string;
  parameters: Record<string, any>;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AnalysisResult {
  logicScore: number;
  hallucinationScore: number;
  riskFlags: string[];
  recommendedAction: string;
  sanitisedPlan: Record<string, any>;
}

// Forbidden reasoning patterns
const FORBIDDEN_PATTERNS = [
  'assume_permission',
  'bypass_approval',
  'skip_validation',
  'ignore_rls',
  'expose_internal',
  'direct_api_call',
  'reveal_model',
  'show_token_cost',
];

// Allowed reasoning patterns
const ALLOWED_PATTERNS = [
  'request_approval',
  'validate_input',
  'check_permission',
  'enforce_rls',
  'sanitise_output',
  'log_action',
];

export class MCSEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async analysePlan(
    source: string,
    plan: Record<string, any>
  ): Promise<CognitiveEvent> {
    const supabase = await getSupabaseServer();

    // Run all analysis
    const logicScore = await this.verifyLogic(plan);
    const hallucinationScore = await this.detectHallucination(plan);
    const riskFlags = this.identifyRiskFlags(plan);
    const recommendedAction = this.recommendAction(logicScore, hallucinationScore, riskFlags);
    const sanitisedPlan = await this.sanitisePlan(plan, riskFlags);

    // Store event
    const { data } = await supabase
      .from('mcse_cognitive_events')
      .insert({
        tenant_id: this.orgId,
        source,
        risk_flags: riskFlags,
        logic_score: logicScore,
        hallucination_score: hallucinationScore,
        recommended_action: recommendedAction,
        original_plan: plan,
        sanitised_plan: sanitisedPlan,
      })
      .select()
      .single();

    return this.mapToEvent(data);
  }

  async verifyLogic(plan: Record<string, any>): Promise<number> {
    let score = 100;
    const issues: string[] = [];

    // Check for logical consistency
    if (plan.steps && Array.isArray(plan.steps)) {
      // Check step dependencies
      const stepIds = new Set(plan.steps.map((s: any) => s.id));
      for (const step of plan.steps) {
        if (step.dependsOn) {
          for (const dep of step.dependsOn) {
            if (!stepIds.has(dep)) {
              score -= 10;
              issues.push(`Missing dependency: ${dep}`);
            }
          }
        }

        // Check for circular dependencies
        if (step.dependsOn?.includes(step.id)) {
          score -= 20;
          issues.push(`Circular dependency in step: ${step.id}`);
        }
      }
    }

    // Check for contradictions
    if (plan.actions) {
      const actions = plan.actions as string[];
      if (actions.includes('create') && actions.includes('delete')) {
        if (plan.target && plan.actions.indexOf('create') > plan.actions.indexOf('delete')) {
          // Create after delete is fine
        } else {
          score -= 15;
          issues.push('Contradictory actions: create and delete on same target');
        }
      }
    }

    // Check for undefined references
    if (plan.variables) {
      const definedVars = new Set(Object.keys(plan.variables));
      const usedVars = this.extractVariableReferences(plan);
      for (const varName of usedVars) {
        if (!definedVars.has(varName)) {
          score -= 5;
          issues.push(`Undefined variable: ${varName}`);
        }
      }
    }

    return Math.max(0, score);
  }

  async detectHallucination(plan: Record<string, any>): Promise<number> {
    let score = 0;

    // Check for fabricated entities
    if (plan.entities) {
      for (const entity of plan.entities) {
        // Check for implausible IDs
        if (entity.id && !this.isValidUUID(entity.id)) {
          score += 10;
        }

        // Check for fabricated timestamps
        if (entity.createdAt) {
          const date = new Date(entity.createdAt);
          if (date > new Date()) {
            score += 15; // Future dates are hallucinations
          }
        }
      }
    }

    // Check for non-existent API endpoints
    if (plan.apiCalls) {
      for (const call of plan.apiCalls) {
        if (!this.isKnownEndpoint(call.endpoint)) {
          score += 20;
        }
      }
    }

    // Check for impossible operations
    if (plan.operations) {
      for (const op of plan.operations) {
        if (this.isImpossibleOperation(op)) {
          score += 25;
        }
      }
    }

    // Check for fabricated permissions
    if (plan.assumedPermissions) {
      score += plan.assumedPermissions.length * 10;
    }

    return Math.min(100, score);
  }

  async sanitisePlan(
    plan: Record<string, any>,
    riskFlags: string[]
  ): Promise<Record<string, any>> {
    const sanitised = JSON.parse(JSON.stringify(plan));

    // Remove forbidden patterns
    for (const flag of riskFlags) {
      if (FORBIDDEN_PATTERNS.includes(flag)) {
        this.removeForbiddenPattern(sanitised, flag);
      }
    }

    // Redact sensitive information
    this.redactSensitiveData(sanitised);

    // Ensure required safety checks
    if (!sanitised.safetyChecks) {
      sanitised.safetyChecks = [];
    }
    sanitised.safetyChecks.push('mcse_validated');

    // Add audit trail requirement
    sanitised.requiresAudit = true;

    return sanitised;
  }

  recommendAction(
    logicScore: number,
    hallucinationScore: number,
    riskFlags: string[]
  ): string {
    // Critical flags always block
    const criticalFlags = riskFlags.filter(f =>
      ['bypass_approval', 'ignore_rls', 'expose_internal'].includes(f)
    );
    if (criticalFlags.length > 0) {
      return 'block';
    }

    // High hallucination score blocks
    if (hallucinationScore >= 50) {
      return 'block';
    }

    // Low logic score escalates
    if (logicScore < 50) {
      return 'escalate';
    }

    // Moderate issues require sanitisation
    if (hallucinationScore >= 20 || logicScore < 80 || riskFlags.length > 0) {
      return 'sanitise';
    }

    // All checks passed
    return 'allow';
  }

  private identifyRiskFlags(plan: Record<string, any>): string[] {
    const flags: string[] = [];
    const planStr = JSON.stringify(plan).toLowerCase();

    // Check for forbidden patterns
    for (const pattern of FORBIDDEN_PATTERNS) {
      if (planStr.includes(pattern.replace(/_/g, ''))) {
        flags.push(pattern);
      }
    }

    // Check for permission assumptions
    if (plan.assumeAdmin || plan.skipAuth) {
      flags.push('assume_permission');
    }

    // Check for RLS bypass attempts
    if (plan.directQuery || plan.serviceRole) {
      flags.push('ignore_rls');
    }

    // Check for external calls
    if (plan.externalUrls || plan.webhooks) {
      flags.push('direct_api_call');
    }

    // Check for model/cost exposure
    if (plan.modelName || plan.tokenCost) {
      flags.push('reveal_model');
      flags.push('show_token_cost');
    }

    return [...new Set(flags)];
  }

  private extractVariableReferences(obj: any): Set<string> {
    const refs = new Set<string>();
    const str = JSON.stringify(obj);
    const matches = str.match(/\$\{(\w+)\}/g) || [];
    for (const match of matches) {
      refs.add(match.replace(/\$\{|\}/g, ''));
    }
    return refs;
  }

  private isValidUUID(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  private isKnownEndpoint(endpoint: string): boolean {
    const knownPrefixes = [
      '/api/agents/',
      '/api/auth/',
      '/api/contacts/',
      '/api/campaigns/',
      '/api/integrations/',
      '/api/staff/',
      '/api/client/',
    ];
    return knownPrefixes.some(prefix => endpoint.startsWith(prefix));
  }

  private isImpossibleOperation(op: any): boolean {
    // Check for operations that violate physics/logic
    const impossibleOps = [
      'time_travel',
      'infinite_loop',
      'divide_by_zero',
      'negative_count',
    ];
    return impossibleOps.includes(op.type);
  }

  private removeForbiddenPattern(obj: any, pattern: string): void {
    const key = pattern.replace(/_/g, '');
    for (const prop in obj) {
      if (prop.toLowerCase().includes(key)) {
        delete obj[prop];
      } else if (typeof obj[prop] === 'object' && obj[prop] !== null) {
        this.removeForbiddenPattern(obj[prop], pattern);
      }
    }
  }

  private redactSensitiveData(obj: any): void {
    const sensitiveKeys = [
      'apiKey',
      'secret',
      'password',
      'token',
      'credential',
      'modelName',
      'tokenCost',
    ];

    for (const prop in obj) {
      if (sensitiveKeys.some(k => prop.toLowerCase().includes(k.toLowerCase()))) {
        obj[prop] = '[REDACTED]';
      } else if (typeof obj[prop] === 'object' && obj[prop] !== null) {
        this.redactSensitiveData(obj[prop]);
      }
    }
  }

  async getEvents(limit: number = 50): Promise<CognitiveEvent[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('mcse_cognitive_events')
      .select('*')
      .eq('tenant_id', this.orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).map(e => this.mapToEvent(e));
  }

  async getEvent(eventId: string): Promise<CognitiveEvent | null> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('mcse_cognitive_events')
      .select('*')
      .eq('id', eventId)
      .single();

    return data ? this.mapToEvent(data) : null;
  }

  async getRules(): Promise<PolicyRule[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('mcse_policy_rules')
      .select('*')
      .eq('tenant_id', this.orgId)
      .order('rule_name');

    return (data || []).map(r => this.mapToRule(r));
  }

  async updateRule(
    ruleId: string,
    updates: Partial<PolicyRule>
  ): Promise<PolicyRule> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('mcse_policy_rules')
      .update({
        rule_name: updates.ruleName,
        parameters: updates.parameters,
        enabled: updates.enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .select()
      .single();

    return this.mapToRule(data);
  }

  async createRule(rule: Omit<PolicyRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<PolicyRule> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('mcse_policy_rules')
      .insert({
        tenant_id: this.orgId,
        rule_name: rule.ruleName,
        parameters: rule.parameters,
        enabled: rule.enabled,
      })
      .select()
      .single();

    return this.mapToRule(data);
  }

  private mapToEvent(data: any): CognitiveEvent {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      source: data.source,
      riskFlags: data.risk_flags,
      logicScore: data.logic_score,
      hallucinationScore: data.hallucination_score,
      recommendedAction: data.recommended_action,
      originalPlan: data.original_plan,
      sanitisedPlan: data.sanitised_plan,
      createdAt: new Date(data.created_at),
    };
  }

  private mapToRule(data: any): PolicyRule {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      ruleName: data.rule_name,
      parameters: data.parameters,
      enabled: data.enabled,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
```

## Allowed vs Forbidden Reasoning Patterns

### Allowed Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| `request_approval` | Explicitly requests human approval | "This action requires manager approval" |
| `validate_input` | Validates all inputs before processing | "Checking input against schema..." |
| `check_permission` | Verifies user has permission | "User has role: editor, checking access..." |
| `enforce_rls` | Ensures RLS policies apply | "Filtering by tenant_id..." |
| `sanitise_output` | Removes sensitive data from output | "Redacting API keys from response..." |
| `log_action` | Logs all actions for audit | "Recording action to audit log..." |

### Forbidden Patterns

| Pattern | Description | Penalty |
|---------|-------------|---------|
| `assume_permission` | Assumes user has permission without checking | Block |
| `bypass_approval` | Skips required approval workflows | Block |
| `skip_validation` | Proceeds without validating inputs | Escalate |
| `ignore_rls` | Attempts to bypass RLS policies | Block |
| `expose_internal` | Exposes internal system details | Block |
| `direct_api_call` | Makes external API calls without approval | Block |
| `reveal_model` | Exposes AI model names | Sanitise |
| `show_token_cost` | Exposes token costs to users | Sanitise |

## API Endpoints

### POST /api/cognitive/analyse

Analyse a plan for cognitive validation.

### GET /api/cognitive/events

Get cognitive events for tenant.

### GET /api/cognitive/events/:id

Get specific cognitive event.

### GET /api/cognitive/rules

Get policy rules for tenant.

### PUT /api/cognitive/rules/:id

Update a policy rule.

### POST /api/cognitive/rules

Create a new policy rule.

## CLI Commands

```bash
# Inspect a specific run
unite mcse:inspect <run_id>

# List all policy rules
unite mcse:rules:list

# Update a policy rule
unite mcse:rules:update <rule_id> --enabled=true

# View recent cognitive events
unite mcse:events --limit=20
```

## Integration Points

### MAOS Orchestrator Integration

```typescript
// Pre-ASRS validation in orchestrator
const mcse = new MCSEngine(orgId);
const event = await mcse.analysePlan('maos', orchestratorPlan);

if (event.recommendedAction === 'block') {
  throw new Error(`Plan blocked by MCSE: ${event.riskFlags.join(', ')}`);
}

// Use sanitised plan for execution
const safePlan = event.sanitisedPlan;
```

### ADRE Integration

```typescript
// Validate code diff reasoning
const mcse = new MCSEngine(orgId);
const event = await mcse.analysePlan('adre', {
  diff: codeDiff,
  reasoning: diffReasoning,
  operations: proposedOperations,
});

if (event.hallucinationScore > 30) {
  // Require human review for hallucinated diffs
  await escalateToHSOE(event);
}
```

### Voice-First Integration

```typescript
// Validate voice command interpretation
const mcse = new MCSEngine(orgId);
const event = await mcse.analysePlan('voice', {
  transcript: voiceTranscript,
  parsedIntent: parsedIntent,
  proposedAction: proposedAction,
});

if (event.logicScore < 70) {
  // Request clarification for low-confidence interpretations
  await requestVoiceClarification(event);
}
```

## Implementation Tasks

- [ ] Create 136_mcse_cognitive_supervisor.sql
- [ ] Implement MCSEngine
- [ ] Create API endpoints
- [ ] Create CognitiveEventViewer.tsx
- [ ] Create RiskFlagVisualizer.tsx
- [ ] Create SanitisedPlanDiff.tsx
- [ ] Integrate with MAOS orchestrator
- [ ] Integrate with ADRE
- [ ] Integrate with Voice-First
- [ ] Add CLI commands
- [ ] Write Jest test suite

---

*Phase 84 - MAOS Cognitive Supervisor Engine Complete*
