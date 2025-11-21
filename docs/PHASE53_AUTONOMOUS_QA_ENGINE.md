# Phase 53 - Autonomous QA Engine (A-QAE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase53-autonomous-qa-engine`

## Executive Summary

Phase 53 implements a system that automatically tests, verifies, and stress-checks all core workflows, APIs, billing logic, voice operations, image generation, multilingual features, and concierge actions. It runs daily, hourly, and on every code push.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Automated Testing | Yes |
| Multi-Component Coverage | Yes |
| Failure Reporting | Yes |
| Self-Healing Integration | Yes |
| Scheduled Runs | Yes |

## Database Schema

### Migration 105: Autonomous QA Engine

```sql
-- 105_autonomous_qa_engine.sql

-- QA runs table
CREATE TABLE IF NOT EXISTS qa_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  summary JSONB DEFAULT '{}'::jsonb,

  -- Run type check
  CONSTRAINT qa_runs_type_check CHECK (
    run_type IN ('daily', 'hourly', 'on_push', 'manual', 'stress_test')
  ),

  -- Status check
  CONSTRAINT qa_runs_status_check CHECK (
    status IN ('pending', 'running', 'passed', 'failed', 'partial')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qa_runs_type ON qa_runs(run_type);
CREATE INDEX IF NOT EXISTS idx_qa_runs_status ON qa_runs(status);
CREATE INDEX IF NOT EXISTS idx_qa_runs_started ON qa_runs(started_at DESC);

-- Enable RLS (global system table, admin only)
ALTER TABLE qa_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY qa_runs_select ON qa_runs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY qa_runs_insert ON qa_runs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY qa_runs_update ON qa_runs
  FOR UPDATE TO authenticated
  USING (true);

-- Comment
COMMENT ON TABLE qa_runs IS 'QA test run records (Phase 53)';

-- QA failures table
CREATE TABLE IF NOT EXISTS qa_failures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qa_run_id UUID NOT NULL,
  component TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM',
  description TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Severity check
  CONSTRAINT qa_failures_severity_check CHECK (
    severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  ),

  -- Foreign key
  CONSTRAINT qa_failures_run_fk
    FOREIGN KEY (qa_run_id) REFERENCES qa_runs(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qa_failures_run ON qa_failures(qa_run_id);
CREATE INDEX IF NOT EXISTS idx_qa_failures_severity ON qa_failures(severity);
CREATE INDEX IF NOT EXISTS idx_qa_failures_component ON qa_failures(component);
CREATE INDEX IF NOT EXISTS idx_qa_failures_created ON qa_failures(created_at DESC);

-- Enable RLS
ALTER TABLE qa_failures ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY qa_failures_select ON qa_failures
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY qa_failures_insert ON qa_failures
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE qa_failures IS 'QA test failures with details (Phase 53)';
```

## QA Engine Service

```typescript
// src/lib/qa/qa-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface QARun {
  id: string;
  runType: string;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  summary: Record<string, any>;
}

interface QAFailure {
  component: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  details?: Record<string, any>;
}

const COMPONENTS = [
  'api_endpoints',
  'billing_webhooks',
  'token_enforcement',
  'image_engine',
  'voice_engine',
  'multilingual',
  'concierge_actions',
  'maos_capability_guard',
  'deep_agent_routing',
];

export class QAEngine {
  async startRun(runType: string): Promise<string> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('qa_runs')
      .insert({
        run_type: runType,
        status: 'running',
      })
      .select('id')
      .single();

    return data?.id;
  }

  async runFullSuite(runType: string = 'manual'): Promise<QARun> {
    const runId = await this.startRun(runType);
    const failures: QAFailure[] = [];

    // Test each component
    for (const component of COMPONENTS) {
      const componentFailures = await this.testComponent(component);
      failures.push(...componentFailures);
    }

    // Record failures
    for (const failure of failures) {
      await this.recordFailure(runId, failure);
    }

    // Complete run
    const status = failures.length === 0 ? 'passed' :
      failures.some(f => f.severity === 'CRITICAL') ? 'failed' : 'partial';

    await this.completeRun(runId, status, {
      totalTests: COMPONENTS.length,
      passed: COMPONENTS.length - new Set(failures.map(f => f.component)).size,
      failures: failures.length,
      criticalFailures: failures.filter(f => f.severity === 'CRITICAL').length,
    });

    return this.getRun(runId);
  }

  async testComponent(component: string): Promise<QAFailure[]> {
    const failures: QAFailure[] = [];

    switch (component) {
      case 'api_endpoints':
        failures.push(...await this.testAPIEndpoints());
        break;
      case 'billing_webhooks':
        failures.push(...await this.testBillingWebhooks());
        break;
      case 'token_enforcement':
        failures.push(...await this.testTokenEnforcement());
        break;
      case 'image_engine':
        failures.push(...await this.testImageEngine());
        break;
      case 'voice_engine':
        failures.push(...await this.testVoiceEngine());
        break;
      case 'multilingual':
        failures.push(...await this.testMultilingual());
        break;
      case 'concierge_actions':
        failures.push(...await this.testConciergeActions());
        break;
      case 'maos_capability_guard':
        failures.push(...await this.testMAOSCapabilityGuard());
        break;
      case 'deep_agent_routing':
        failures.push(...await this.testDeepAgentRouting());
        break;
    }

    return failures;
  }

  private async testAPIEndpoints(): Promise<QAFailure[]> {
    // Test core API endpoints
    const failures: QAFailure[] = [];

    // Would test various API endpoints for response and schema
    // Example failure:
    // failures.push({
    //   component: 'api_endpoints',
    //   severity: 'HIGH',
    //   description: '/api/contacts returned 500',
    //   details: { statusCode: 500, endpoint: '/api/contacts' }
    // });

    return failures;
  }

  private async testBillingWebhooks(): Promise<QAFailure[]> {
    // Test Stripe webhook handlers
    return [];
  }

  private async testTokenEnforcement(): Promise<QAFailure[]> {
    // Test token budget enforcement
    return [];
  }

  private async testImageEngine(): Promise<QAFailure[]> {
    // Test image generation pipeline
    return [];
  }

  private async testVoiceEngine(): Promise<QAFailure[]> {
    // Test voice generation (ElevenLabs)
    return [];
  }

  private async testMultilingual(): Promise<QAFailure[]> {
    // Test language detection and translation
    return [];
  }

  private async testConciergeActions(): Promise<QAFailure[]> {
    // Test AI concierge actions
    return [];
  }

  private async testMAOSCapabilityGuard(): Promise<QAFailure[]> {
    // Test MAOS supervision
    return [];
  }

  private async testDeepAgentRouting(): Promise<QAFailure[]> {
    // Test Deep Agent workflow routing
    return [];
  }

  async recordFailure(runId: string, failure: QAFailure): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from('qa_failures').insert({
      qa_run_id: runId,
      component: failure.component,
      severity: failure.severity,
      description: failure.description,
      details: failure.details || {},
    });

    // Report to Self-Healing Workflows if critical
    if (failure.severity === 'CRITICAL' || failure.severity === 'HIGH') {
      await this.reportToSelfHealing(failure);
    }
  }

  private async reportToSelfHealing(failure: QAFailure): Promise<void> {
    // Would integrate with SelfHealingService
    // const healingService = new SelfHealingService(orgId);
    // await healingService.recordFailure(failure.component, failure.description, failure.details);
  }

  async completeRun(
    runId: string,
    status: string,
    summary: Record<string, any>
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('qa_runs')
      .update({
        status,
        completed_at: new Date().toISOString(),
        summary,
      })
      .eq('id', runId);
  }

  async getRun(runId: string): Promise<QARun> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('qa_runs')
      .select('*')
      .eq('id', runId)
      .single();

    return {
      id: data.id,
      runType: data.run_type,
      status: data.status,
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      summary: data.summary,
    };
  }

  async getRecentRuns(limit: number = 10): Promise<QARun[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('qa_runs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(limit);

    return (data || []).map(r => ({
      id: r.id,
      runType: r.run_type,
      status: r.status,
      startedAt: new Date(r.started_at),
      completedAt: r.completed_at ? new Date(r.completed_at) : undefined,
      summary: r.summary,
    }));
  }

  async getFailuresForRun(runId: string): Promise<QAFailure[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('qa_failures')
      .select('*')
      .eq('qa_run_id', runId)
      .order('severity', { ascending: false });

    return (data || []).map(f => ({
      component: f.component,
      severity: f.severity,
      description: f.description,
      details: f.details,
    }));
  }

  async getStats(): Promise<{
    totalRuns: number;
    passRate: number;
    recentFailures: number;
    topFailingComponent: string | null;
  }> {
    const supabase = await getSupabaseServer();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { data: runs } = await supabase
      .from('qa_runs')
      .select('status')
      .gte('started_at', thirtyDaysAgo.toISOString());

    const totalRuns = runs?.length || 0;
    const passedRuns = runs?.filter(r => r.status === 'passed').length || 0;
    const passRate = totalRuns > 0 ? Math.round((passedRuns / totalRuns) * 100) : 100;

    const { data: failures } = await supabase
      .from('qa_failures')
      .select('component')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const recentFailures = failures?.length || 0;

    // Find top failing component
    const componentCounts: Record<string, number> = {};
    for (const f of failures || []) {
      componentCounts[f.component] = (componentCounts[f.component] || 0) + 1;
    }

    let topFailingComponent: string | null = null;
    let maxCount = 0;
    for (const [component, count] of Object.entries(componentCounts)) {
      if (count > maxCount) {
        maxCount = count;
        topFailingComponent = component;
      }
    }

    return {
      totalRuns,
      passRate,
      recentFailures,
      topFailingComponent,
    };
  }
}
```

## API Endpoints

### POST /api/qa/run

Start a new QA run.

```typescript
// Request
{
  "runType": "manual"
}

// Response
{
  "success": true,
  "runId": "uuid",
  "status": "running"
}
```

### GET /api/qa/runs

Get recent QA runs.

### GET /api/qa/run/:id

Get specific run with failures.

### GET /api/qa/stats

Get QA statistics.

## Implementation Tasks

- [ ] Create 105_autonomous_qa_engine.sql
- [ ] Implement QAEngine
- [ ] Create API endpoints
- [ ] Create QADashboard.tsx
- [ ] Set up scheduled runs (cron)
- [ ] Wire into Self-Healing Workflows

---

*Phase 53 - Autonomous QA Engine Complete*
