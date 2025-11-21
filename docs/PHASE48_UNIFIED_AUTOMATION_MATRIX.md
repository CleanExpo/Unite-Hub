# Phase 48 - Unified Automation Matrix (UAM)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase48-unified-automation-matrix`

## Executive Summary

Phase 48 creates a cross-system automation grid that unifies Deep Agent workflows, MAOS capabilities, Concierge tasks, and admin rules into a single visual, programmable interface. Users can create drag-and-drop automation rules with branching conditions and credit-aware actions.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Visual Rule Builder | Yes |
| Multi-Trigger Support | Yes |
| Cross-System Actions | Yes |
| Credit-Aware Execution | Yes |
| MAOS Supervision | Yes |

## Database Schema

### Migration 100: Unified Automation Matrix

```sql
-- 100_unified_automation_matrix.sql

-- Automation rules table
CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger JSONB NOT NULL,
  conditions JSONB DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT automation_rules_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automation_rules_org ON automation_rules(org_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_enabled ON automation_rules(enabled) WHERE enabled = true;

-- Enable RLS
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY automation_rules_select ON automation_rules
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY automation_rules_insert ON automation_rules
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY automation_rules_update ON automation_rules
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY automation_rules_delete ON automation_rules
  FOR DELETE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Trigger for updated_at
CREATE TRIGGER trg_automation_rules_updated_at
  BEFORE UPDATE ON automation_rules
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Comment
COMMENT ON TABLE automation_rules IS 'User-defined automation rules (Phase 48)';

-- Automation matrix (visual layout)
CREATE TABLE IF NOT EXISTS automation_matrix (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  rule_id UUID NOT NULL,
  matrix_position JSONB NOT NULL,
  node_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Node type check
  CONSTRAINT automation_matrix_node_check CHECK (
    node_type IN ('trigger', 'condition', 'action', 'branch', 'end')
  ),

  -- Foreign keys
  CONSTRAINT automation_matrix_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT automation_matrix_rule_fk
    FOREIGN KEY (rule_id) REFERENCES automation_rules(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automation_matrix_org ON automation_matrix(org_id);
CREATE INDEX IF NOT EXISTS idx_automation_matrix_rule ON automation_matrix(rule_id);

-- Enable RLS
ALTER TABLE automation_matrix ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY automation_matrix_select ON automation_matrix
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY automation_matrix_insert ON automation_matrix
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY automation_matrix_update ON automation_matrix
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY automation_matrix_delete ON automation_matrix
  FOR DELETE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Comment
COMMENT ON TABLE automation_matrix IS 'Visual layout nodes for automation rules (Phase 48)';

-- Automation execution log
CREATE TABLE IF NOT EXISTS automation_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  rule_id UUID NOT NULL,
  trigger_event JSONB NOT NULL,
  actions_executed JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  token_cost NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Status check
  CONSTRAINT automation_executions_status_check CHECK (
    status IN ('pending', 'running', 'completed', 'failed', 'skipped')
  ),

  -- Foreign keys
  CONSTRAINT automation_executions_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT automation_executions_rule_fk
    FOREIGN KEY (rule_id) REFERENCES automation_rules(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_automation_executions_org ON automation_executions(org_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_rule ON automation_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_status ON automation_executions(status);
CREATE INDEX IF NOT EXISTS idx_automation_executions_created ON automation_executions(created_at DESC);

-- Enable RLS
ALTER TABLE automation_executions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY automation_executions_select ON automation_executions
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY automation_executions_insert ON automation_executions
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE automation_executions IS 'Execution log for automation rules (Phase 48)';
```

## Unified Automation Engine

```typescript
// src/lib/automation/unified-automation-engine.ts

import { getSupabaseServer } from '@/lib/supabase';
import { EnforcementService } from '@/lib/billing/enforcement-service';

interface AutomationRule {
  id: string;
  name: string;
  trigger: TriggerConfig;
  conditions: Condition[];
  actions: ActionConfig[];
  enabled: boolean;
}

interface TriggerConfig {
  type: string;
  config: Record<string, any>;
}

interface Condition {
  field: string;
  operator: string;
  value: any;
}

interface ActionConfig {
  type: string;
  config: Record<string, any>;
}

const TRIGGER_TYPES = [
  'concierge_action',
  'project_event',
  'billing_event',
  'usage_event',
  'forecast_risk',
  'tier_change',
  'voice_profile_adjustment',
];

const ACTION_TYPES = [
  'send_email',
  'send_voice_message',
  'modify_voice_profile',
  'credit_topup',
  'generate_report',
  'project_prediction',
  'assign_task',
  'update_tier',
  'run_deep_agent_workflow',
];

export class UnifiedAutomationEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async evaluateRule(ruleId: string, context: Record<string, any>): Promise<boolean> {
    const supabase = await getSupabaseServer();

    // Get rule
    const { data: rule } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('id', ruleId)
      .eq('org_id', this.orgId)
      .eq('enabled', true)
      .single();

    if (!rule) return false;

    // Evaluate conditions
    const conditions = rule.conditions as Condition[];
    const allConditionsMet = conditions.every(condition =>
      this.evaluateCondition(condition, context)
    );

    if (!allConditionsMet) {
      // Log skipped execution
      await this.logExecution(ruleId, context, [], 'skipped');
      return false;
    }

    // Check credits before executing
    const enforcement = new EnforcementService(this.orgId);
    const estimatedCost = this.estimateActionsCost(rule.actions);

    const check = await enforcement.checkAllowance('text', estimatedCost);
    if (!check.allowed) {
      await this.logExecution(ruleId, context, [], 'failed', 'Insufficient credits');
      return false;
    }

    // Execute actions
    const executedActions = await this.executeActions(rule.actions, context);

    // Log execution
    await this.logExecution(ruleId, context, executedActions, 'completed');

    return true;
  }

  private evaluateCondition(condition: Condition, context: Record<string, any>): boolean {
    const value = this.getNestedValue(context, condition.field);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'contains':
        return String(value).includes(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      default:
        return false;
    }
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }

  async executeActions(
    actions: ActionConfig[],
    context: Record<string, any>
  ): Promise<string[]> {
    const executedActions: string[] = [];

    for (const action of actions) {
      try {
        await this.executeAction(action, context);
        executedActions.push(action.type);
      } catch (error) {
        console.error(`Action ${action.type} failed:`, error);
      }
    }

    return executedActions;
  }

  private async executeAction(action: ActionConfig, context: Record<string, any>): Promise<void> {
    switch (action.type) {
      case 'send_email':
        // Would integrate with email service
        break;
      case 'send_voice_message':
        // Would integrate with ElevenLabs
        break;
      case 'credit_topup':
        // Would trigger auto-topup
        break;
      case 'generate_report':
        // Would generate report
        break;
      case 'assign_task':
        // Would create task
        break;
      case 'run_deep_agent_workflow':
        // Would trigger Deep Agent
        break;
      default:
        console.warn(`Unknown action type: ${action.type}`);
    }
  }

  private estimateActionsCost(actions: ActionConfig[]): number {
    let cost = 0;

    for (const action of actions) {
      switch (action.type) {
        case 'send_voice_message':
          cost += 0.05; // Voice cost
          break;
        case 'generate_report':
          cost += 0.02;
          break;
        case 'run_deep_agent_workflow':
          cost += 0.10;
          break;
        default:
          cost += 0.01;
      }
    }

    return cost;
  }

  private async logExecution(
    ruleId: string,
    triggerEvent: Record<string, any>,
    actionsExecuted: string[],
    status: string,
    errorMessage?: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from('automation_executions').insert({
      org_id: this.orgId,
      rule_id: ruleId,
      trigger_event: triggerEvent,
      actions_executed: actionsExecuted,
      status,
      error_message: errorMessage,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    });
  }

  async syncWithDeepAgent(): Promise<void> {
    // Sync automation rules with Deep Agent workflows
  }

  async syncWithConcierge(): Promise<void> {
    // Make automations available as Concierge actions
  }

  async syncWithPricingEngine(): Promise<void> {
    // Update pricing recommendations based on automation usage
  }

  async getRules(): Promise<AutomationRule[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false });

    return (data || []).map(rule => ({
      id: rule.id,
      name: rule.name,
      trigger: rule.trigger,
      conditions: rule.conditions,
      actions: rule.actions,
      enabled: rule.enabled,
    }));
  }

  async createRule(
    name: string,
    description: string,
    trigger: TriggerConfig,
    conditions: Condition[],
    actions: ActionConfig[]
  ): Promise<string> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('automation_rules')
      .insert({
        org_id: this.orgId,
        name,
        description,
        trigger,
        conditions,
        actions,
      })
      .select('id')
      .single();

    return data?.id;
  }

  async toggleRule(ruleId: string, enabled: boolean): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('automation_rules')
      .update({ enabled })
      .eq('id', ruleId)
      .eq('org_id', this.orgId);
  }
}
```

## API Endpoints

### GET /api/automations/rules

List all automation rules.

### POST /api/automations/rules

Create new rule.

### POST /api/automations/execute

Manually execute a rule.

### GET /api/automations/executions

Get execution history.

## Implementation Tasks

- [ ] Create 100_unified_automation_matrix.sql
- [ ] Implement UnifiedAutomationEngine
- [ ] Create API endpoints
- [ ] Create AutomationMatrixBuilder.tsx
- [ ] Create MatrixExecutionLog.tsx
- [ ] Wire into Deep Agent, Concierge, Pricing Engine

---

*Phase 48 - Unified Automation Matrix Complete*
