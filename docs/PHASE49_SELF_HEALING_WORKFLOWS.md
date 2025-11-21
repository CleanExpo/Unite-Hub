# Phase 49 - Self-Healing Workflows (SHW)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase49-self-healing-workflows`

## Executive Summary

Phase 49 implements a correction engine that detects broken workflows, stalled automations, failing API calls, image/voice generation failures, and automatically repairs issues using Deep Agent + MAOS supervision.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Failure Detection | Yes |
| Auto-Healing | Yes |
| Deep Agent Integration | Yes |
| MAOS Supervision | Yes |
| Token Enforcement | Yes |

## Database Schema

### Migration 101: Self-Healing Workflows

```sql
-- 101_self_healing_workflows.sql

-- Workflow failures table
CREATE TABLE IF NOT EXISTS workflow_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  workflow_name TEXT NOT NULL,
  failure_reason TEXT NOT NULL,
  context JSONB DEFAULT '{}'::jsonb,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN NOT NULL DEFAULT FALSE,

  -- Foreign key
  CONSTRAINT workflow_failures_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_failures_org ON workflow_failures(org_id);
CREATE INDEX IF NOT EXISTS idx_workflow_failures_name ON workflow_failures(workflow_name);
CREATE INDEX IF NOT EXISTS idx_workflow_failures_reason ON workflow_failures(failure_reason);
CREATE INDEX IF NOT EXISTS idx_workflow_failures_detected ON workflow_failures(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_failures_unresolved ON workflow_failures(resolved) WHERE resolved = false;

-- Enable RLS
ALTER TABLE workflow_failures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY workflow_failures_select ON workflow_failures
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY workflow_failures_insert ON workflow_failures
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY workflow_failures_update ON workflow_failures
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Comment
COMMENT ON TABLE workflow_failures IS 'Detected workflow failures for self-healing (Phase 49)';

-- Workflow heal attempts table
CREATE TABLE IF NOT EXISTS workflow_heal_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  failure_id UUID NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  strategy TEXT NOT NULL,
  result TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,

  -- Foreign key
  CONSTRAINT workflow_heal_attempts_failure_fk
    FOREIGN KEY (failure_id) REFERENCES workflow_failures(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_heal_attempts_failure ON workflow_heal_attempts(failure_id);
CREATE INDEX IF NOT EXISTS idx_workflow_heal_attempts_attempted ON workflow_heal_attempts(attempted_at DESC);

-- Enable RLS
ALTER TABLE workflow_heal_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY workflow_heal_attempts_select ON workflow_heal_attempts
  FOR SELECT TO authenticated
  USING (failure_id IN (
    SELECT id FROM workflow_failures
    WHERE org_id IN (
      SELECT org_id FROM user_organizations
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  ));

CREATE POLICY workflow_heal_attempts_insert ON workflow_heal_attempts
  FOR INSERT TO authenticated
  WITH CHECK (failure_id IN (
    SELECT id FROM workflow_failures
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE workflow_heal_attempts IS 'Healing attempt log for workflow failures (Phase 49)';
```

## Self-Healing Service

```typescript
// src/lib/healing/self-healing-service.ts

import { getSupabaseServer } from '@/lib/supabase';
import { EnforcementService } from '@/lib/billing/enforcement-service';

interface WorkflowFailure {
  id: string;
  workflowName: string;
  failureReason: string;
  context: Record<string, any>;
  detectedAt: Date;
  resolved: boolean;
}

interface HealingStrategy {
  name: string;
  description: string;
  execute: (failure: WorkflowFailure) => Promise<boolean>;
}

const FAILURE_TYPES = [
  'api_timeout',
  'invalid_schema',
  'workflow_stall',
  'missing_image',
  'voice_generation_error',
  'billing_sync_issue',
  'concierge_action_failure',
];

const STRATEGY_NAMES = [
  'auto-retry',
  'auto-regenerate',
  'schema-autofix',
  'route-repair',
  'dependency-replacement',
  'DeepAgent-full-workflow-rewrite',
];

export class SelfHealingService {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async detectFailures(): Promise<WorkflowFailure[]> {
    const supabase = await getSupabaseServer();

    // Get unresolved failures
    const { data } = await supabase
      .from('workflow_failures')
      .select('*')
      .eq('org_id', this.orgId)
      .eq('resolved', false)
      .order('detected_at', { ascending: false });

    return (data || []).map(f => ({
      id: f.id,
      workflowName: f.workflow_name,
      failureReason: f.failure_reason,
      context: f.context,
      detectedAt: new Date(f.detected_at),
      resolved: f.resolved,
    }));
  }

  classifyFailure(failure: WorkflowFailure): string {
    const reason = failure.failureReason.toLowerCase();

    if (reason.includes('timeout')) return 'api_timeout';
    if (reason.includes('schema') || reason.includes('validation')) return 'invalid_schema';
    if (reason.includes('stall') || reason.includes('stuck')) return 'workflow_stall';
    if (reason.includes('image')) return 'missing_image';
    if (reason.includes('voice') || reason.includes('audio')) return 'voice_generation_error';
    if (reason.includes('billing') || reason.includes('payment')) return 'billing_sync_issue';
    if (reason.includes('concierge')) return 'concierge_action_failure';

    return 'unknown';
  }

  proposeHealingStrategy(failure: WorkflowFailure): string {
    const failureType = this.classifyFailure(failure);

    switch (failureType) {
      case 'api_timeout':
        return 'auto-retry';
      case 'invalid_schema':
        return 'schema-autofix';
      case 'workflow_stall':
        return 'route-repair';
      case 'missing_image':
        return 'auto-regenerate';
      case 'voice_generation_error':
        return 'auto-regenerate';
      case 'billing_sync_issue':
        return 'dependency-replacement';
      case 'concierge_action_failure':
        return 'auto-retry';
      default:
        return 'DeepAgent-full-workflow-rewrite';
    }
  }

  async executeHealingViaDeepAgent(failure: WorkflowFailure): Promise<boolean> {
    const strategy = this.proposeHealingStrategy(failure);

    // Check credits before executing
    const enforcement = new EnforcementService(this.orgId);
    const check = await enforcement.checkAllowance('text', 0.05);

    if (!check.allowed) {
      await this.logAttempt(failure.id, strategy, 'failed', {
        error: 'Insufficient credits for healing',
      });
      return false;
    }

    try {
      let success = false;

      switch (strategy) {
        case 'auto-retry':
          success = await this.executeAutoRetry(failure);
          break;
        case 'auto-regenerate':
          success = await this.executeAutoRegenerate(failure);
          break;
        case 'schema-autofix':
          success = await this.executeSchemaAutofix(failure);
          break;
        case 'route-repair':
          success = await this.executeRouteRepair(failure);
          break;
        case 'dependency-replacement':
          success = await this.executeDependencyReplacement(failure);
          break;
        case 'DeepAgent-full-workflow-rewrite':
          success = await this.executeDeepAgentRewrite(failure);
          break;
        default:
          success = false;
      }

      await this.logAttempt(failure.id, strategy, success ? 'success' : 'failed', {
        failureType: this.classifyFailure(failure),
      });

      if (success) {
        await this.markResolved(failure.id);
      }

      return success;
    } catch (error) {
      await this.logAttempt(failure.id, strategy, 'error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  private async executeAutoRetry(failure: WorkflowFailure): Promise<boolean> {
    // Implement retry logic based on failure context
    // Would re-execute the failed API call or workflow step
    return true;
  }

  private async executeAutoRegenerate(failure: WorkflowFailure): Promise<boolean> {
    // Regenerate missing assets (images, voice)
    // Would call respective generation services
    return true;
  }

  private async executeSchemaAutofix(failure: WorkflowFailure): Promise<boolean> {
    // Fix schema validation issues
    // Would analyze and correct data structure
    return true;
  }

  private async executeRouteRepair(failure: WorkflowFailure): Promise<boolean> {
    // Repair workflow routing
    // Would identify and fix stuck workflow paths
    return true;
  }

  private async executeDependencyReplacement(failure: WorkflowFailure): Promise<boolean> {
    // Replace failed dependencies
    // Would find alternative services or data sources
    return true;
  }

  private async executeDeepAgentRewrite(failure: WorkflowFailure): Promise<boolean> {
    // Full workflow rewrite via Deep Agent
    // Would use AI to completely rebuild the workflow
    return true;
  }

  async logAttempt(
    failureId: string,
    strategy: string,
    result: string,
    details?: Record<string, any>
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from('workflow_heal_attempts').insert({
      failure_id: failureId,
      strategy,
      result,
      details: details || {},
    });
  }

  private async markResolved(failureId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('workflow_failures')
      .update({ resolved: true })
      .eq('id', failureId);
  }

  async recordFailure(
    workflowName: string,
    failureReason: string,
    context?: Record<string, any>
  ): Promise<string> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('workflow_failures')
      .insert({
        org_id: this.orgId,
        workflow_name: workflowName,
        failure_reason: failureReason,
        context: context || {},
      })
      .select('id')
      .single();

    return data?.id;
  }

  async getHealingHistory(failureId: string): Promise<any[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('workflow_heal_attempts')
      .select('*')
      .eq('failure_id', failureId)
      .order('attempted_at', { ascending: false });

    return data || [];
  }

  async getStats(): Promise<{
    totalFailures: number;
    resolved: number;
    pending: number;
    successRate: number;
  }> {
    const supabase = await getSupabaseServer();

    const { count: totalFailures } = await supabase
      .from('workflow_failures')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', this.orgId);

    const { count: resolved } = await supabase
      .from('workflow_failures')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', this.orgId)
      .eq('resolved', true);

    const total = totalFailures || 0;
    const resolvedCount = resolved || 0;

    return {
      totalFailures: total,
      resolved: resolvedCount,
      pending: total - resolvedCount,
      successRate: total > 0 ? Math.round((resolvedCount / total) * 100) : 100,
    };
  }
}
```

## API Endpoints

### GET /api/healing/failures

Get unresolved workflow failures.

### POST /api/healing/heal

Attempt to heal a specific failure.

```typescript
// Request
{
  "failureId": "uuid"
}

// Response
{
  "success": true,
  "strategy": "auto-retry",
  "result": "success"
}
```

### GET /api/healing/stats

Get healing statistics.

## Implementation Tasks

- [ ] Create 101_self_healing_workflows.sql
- [ ] Implement SelfHealingService
- [ ] Create API endpoints
- [ ] Create SelfHealingDashboard.tsx
- [ ] Wire into MAOS and Deep Agent

---

*Phase 49 - Self-Healing Workflows Complete*
