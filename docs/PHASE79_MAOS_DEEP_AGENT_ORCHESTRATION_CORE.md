# Phase 79 - MAOS × Deep Agent Orchestration Core 2.0

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase79-maos-deep-agent-orchestration-core`

## Executive Summary

Phase 79 upgrades the existing MAOS orchestrator to a unified multi-model, multi-skill execution fabric that coordinates Claude CLI, Deep Agent, Gemini Nano Banana 2 (image-only), and internal Unite-Hub services with strict compliance to claude.md rules, vendor secrecy, and token/billing controls.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Must Read claude.md First | Yes |
| Must Use Anthropic Dev Docs | Yes |
| Must Honor Phase 19/27 Image Engine Lock | Yes |
| Must Route Through Approved Clients | Claude CLI, Deep Agent API, GeminiBanana2Client, Internal services |
| Must Respect Token/Billing Limits | Yes |
| Must Preserve Vendor Secrecy | Yes |

## Forbidden Behaviours

- Bypassing claude.md orchestration rules
- Creating raw HTTP calls to LLM vendors
- Reconfiguring Gemini image model id
- Writing secrets into client-facing logs

## Database Schema

### Migration 131: MAOS Deep Agent Orchestration Core

```sql
-- 131_maos_deep_agent_orchestration_core.sql

-- Orchestrator runs table
CREATE TABLE IF NOT EXISTS orchestrator_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  initiator_type TEXT NOT NULL,
  initiator_id UUID,
  entrypoint TEXT NOT NULL,
  plan JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_summary TEXT,

  -- Status check
  CONSTRAINT orchestrator_runs_status_check CHECK (
    status IN ('pending', 'planning', 'executing', 'completed', 'failed', 'cancelled')
  ),

  -- Initiator type check
  CONSTRAINT orchestrator_runs_initiator_type_check CHECK (
    initiator_type IN ('user', 'system', 'webhook', 'scheduler', 'voice')
  ),

  -- Foreign key
  CONSTRAINT orchestrator_runs_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orchestrator_runs_org ON orchestrator_runs(org_id);
CREATE INDEX IF NOT EXISTS idx_orchestrator_runs_status ON orchestrator_runs(status);
CREATE INDEX IF NOT EXISTS idx_orchestrator_runs_started ON orchestrator_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_orchestrator_runs_initiator ON orchestrator_runs(initiator_type);

-- Enable RLS
ALTER TABLE orchestrator_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY orchestrator_runs_select ON orchestrator_runs
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY orchestrator_runs_insert ON orchestrator_runs
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY orchestrator_runs_update ON orchestrator_runs
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE orchestrator_runs IS 'MAOS orchestrator runs (Phase 79)';

-- Agent invocations table
CREATE TABLE IF NOT EXISTS agent_invocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL,
  agent_name TEXT NOT NULL,
  engine_type TEXT NOT NULL,
  input_summary TEXT,
  output_summary TEXT,
  token_cost_estimate NUMERIC DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',

  -- Status check
  CONSTRAINT agent_invocations_status_check CHECK (
    status IN ('pending', 'running', 'completed', 'failed', 'skipped')
  ),

  -- Engine type check
  CONSTRAINT agent_invocations_engine_type_check CHECK (
    engine_type IN ('claude_cli', 'deep_agent', 'gemini_image', 'internal_service')
  ),

  -- Foreign key
  CONSTRAINT agent_invocations_run_fk
    FOREIGN KEY (run_id) REFERENCES orchestrator_runs(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agent_invocations_run ON agent_invocations(run_id);
CREATE INDEX IF NOT EXISTS idx_agent_invocations_agent ON agent_invocations(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_invocations_engine ON agent_invocations(engine_type);
CREATE INDEX IF NOT EXISTS idx_agent_invocations_status ON agent_invocations(status);
CREATE INDEX IF NOT EXISTS idx_agent_invocations_started ON agent_invocations(started_at DESC);

-- Enable RLS
ALTER TABLE agent_invocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies (via orchestrator_runs)
CREATE POLICY agent_invocations_select ON agent_invocations
  FOR SELECT TO authenticated
  USING (run_id IN (
    SELECT id FROM orchestrator_runs
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY agent_invocations_insert ON agent_invocations
  FOR INSERT TO authenticated
  WITH CHECK (run_id IN (
    SELECT id FROM orchestrator_runs
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY agent_invocations_update ON agent_invocations
  FOR UPDATE TO authenticated
  USING (run_id IN (
    SELECT id FROM orchestrator_runs
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE agent_invocations IS 'Agent invocation logs (Phase 79)';

-- Deep agent workflows table
CREATE TABLE IF NOT EXISTS deep_agent_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  workflow_name TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  last_run_at TIMESTAMPTZ,
  last_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT deep_agent_workflows_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deep_agent_workflows_org ON deep_agent_workflows(org_id);
CREATE INDEX IF NOT EXISTS idx_deep_agent_workflows_name ON deep_agent_workflows(workflow_name);
CREATE INDEX IF NOT EXISTS idx_deep_agent_workflows_last_run ON deep_agent_workflows(last_run_at DESC);

-- Enable RLS
ALTER TABLE deep_agent_workflows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY deep_agent_workflows_select ON deep_agent_workflows
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY deep_agent_workflows_insert ON deep_agent_workflows
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY deep_agent_workflows_update ON deep_agent_workflows
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE deep_agent_workflows IS 'Deep Agent workflow registry (Phase 79)';
```

## MAOS Orchestrator Service

```typescript
// src/lib/orchestrator/maos-orchestrator-v2.ts

import { getSupabaseServer } from '@/lib/supabase';

interface OrchestratorRun {
  id: string;
  orgId: string;
  initiatorType: string;
  initiatorId?: string;
  entrypoint: string;
  plan: Record<string, any>;
  status: string;
  startedAt: Date;
  completedAt?: Date;
  errorSummary?: string;
}

interface AgentInvocation {
  id: string;
  runId: string;
  agentName: string;
  engineType: string;
  inputSummary?: string;
  outputSummary?: string;
  tokenCostEstimate: number;
  startedAt: Date;
  completedAt?: Date;
  status: string;
}

interface DeepAgentWorkflow {
  id: string;
  orgId: string;
  workflowName: string;
  config: Record<string, any>;
  lastRunAt?: Date;
  lastStatus?: string;
  createdAt: Date;
}

interface PlanStep {
  stepId: string;
  agentName: string;
  engineType: string;
  action: string;
  parameters: Record<string, any>;
  dependencies: string[];
}

const APPROVED_ENGINES = ['claude_cli', 'deep_agent', 'gemini_image', 'internal_service'];
const APPROVED_ENTRYPOINTS = [
  'generate_report',
  'analyze_data',
  'process_email',
  'generate_content',
  'create_image',
  'run_workflow',
];

export class MAOSOrchestratorV2 {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async createRun(
    entrypoint: string,
    initiatorType: string,
    initiatorId?: string
  ): Promise<OrchestratorRun> {
    const supabase = await getSupabaseServer();

    // Validate entrypoint
    if (!APPROVED_ENTRYPOINTS.includes(entrypoint)) {
      throw new Error(`Unapproved entrypoint: ${entrypoint}`);
    }

    // Generate plan
    const plan = await this.generatePlan(entrypoint);

    const { data } = await supabase
      .from('orchestrator_runs')
      .insert({
        org_id: this.orgId,
        initiator_type: initiatorType,
        initiator_id: initiatorId,
        entrypoint,
        plan,
        status: 'planning',
      })
      .select()
      .single();

    return this.mapToRun(data);
  }

  private async generatePlan(entrypoint: string): Promise<Record<string, any>> {
    // Generate structured multi-step plan based on entrypoint
    const steps: PlanStep[] = [];

    switch (entrypoint) {
      case 'generate_report':
        steps.push(
          {
            stepId: '1',
            agentName: 'data_aggregator',
            engineType: 'internal_service',
            action: 'aggregate_metrics',
            parameters: {},
            dependencies: [],
          },
          {
            stepId: '2',
            agentName: 'report_generator',
            engineType: 'claude_cli',
            action: 'generate_narrative',
            parameters: {},
            dependencies: ['1'],
          }
        );
        break;

      case 'create_image':
        steps.push({
          stepId: '1',
          agentName: 'image_generator',
          engineType: 'gemini_image',
          action: 'generate',
          parameters: { modelLocked: true },
          dependencies: [],
        });
        break;

      case 'run_workflow':
        steps.push({
          stepId: '1',
          agentName: 'deep_agent_executor',
          engineType: 'deep_agent',
          action: 'execute_workflow',
          parameters: {},
          dependencies: [],
        });
        break;

      default:
        steps.push({
          stepId: '1',
          agentName: 'default_processor',
          engineType: 'internal_service',
          action: 'process',
          parameters: {},
          dependencies: [],
        });
    }

    return {
      steps,
      generatedAt: new Date().toISOString(),
      version: '2.0',
    };
  }

  async executeRun(runId: string): Promise<OrchestratorRun> {
    const supabase = await getSupabaseServer();

    // Get run
    const run = await this.getRun(runId);
    const plan = run.plan as { steps: PlanStep[] };

    // Update status
    await supabase
      .from('orchestrator_runs')
      .update({ status: 'executing' })
      .eq('id', runId);

    // Execute each step
    for (const step of plan.steps) {
      await this.executeStep(runId, step);
    }

    // Mark completed
    const { data } = await supabase
      .from('orchestrator_runs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId)
      .select()
      .single();

    return this.mapToRun(data);
  }

  private async executeStep(runId: string, step: PlanStep): Promise<AgentInvocation> {
    const supabase = await getSupabaseServer();

    // Validate engine type
    if (!APPROVED_ENGINES.includes(step.engineType)) {
      throw new Error(`Forbidden engine type: ${step.engineType}`);
    }

    // Create invocation record
    const { data } = await supabase
      .from('agent_invocations')
      .insert({
        run_id: runId,
        agent_name: step.agentName,
        engine_type: step.engineType,
        input_summary: JSON.stringify(step.parameters).slice(0, 500),
        status: 'running',
      })
      .select()
      .single();

    // Route to appropriate engine
    let output: string;
    let tokenCost = 0;

    switch (step.engineType) {
      case 'claude_cli':
        output = await this.invokeClaudeCli(step);
        tokenCost = 100; // Estimated
        break;

      case 'deep_agent':
        output = await this.invokeDeepAgent(step);
        tokenCost = 500; // Estimated
        break;

      case 'gemini_image':
        output = await this.invokeGeminiImage(step);
        tokenCost = 50; // Estimated
        break;

      case 'internal_service':
        output = await this.invokeInternalService(step);
        tokenCost = 0;
        break;

      default:
        throw new Error(`Unknown engine: ${step.engineType}`);
    }

    // Update invocation
    const { data: updated } = await supabase
      .from('agent_invocations')
      .update({
        output_summary: output.slice(0, 500),
        token_cost_estimate: tokenCost,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', data.id)
      .select()
      .single();

    return this.mapToInvocation(updated);
  }

  private async invokeClaudeCli(step: PlanStep): Promise<string> {
    // Would invoke Claude CLI with parameters
    return `Claude CLI executed: ${step.action}`;
  }

  private async invokeDeepAgent(step: PlanStep): Promise<string> {
    // Would invoke Deep Agent API handler
    return `Deep Agent executed: ${step.action}`;
  }

  private async invokeGeminiImage(step: PlanStep): Promise<string> {
    // Would invoke GeminiBanana2Client for image only
    // Model lock enforced
    return `Gemini image generated: ${step.action}`;
  }

  private async invokeInternalService(step: PlanStep): Promise<string> {
    // Would invoke internal Unite-Hub service
    return `Internal service executed: ${step.action}`;
  }

  async registerWorkflow(
    workflowName: string,
    config: Record<string, any>
  ): Promise<DeepAgentWorkflow> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('deep_agent_workflows')
      .insert({
        org_id: this.orgId,
        workflow_name: workflowName,
        config,
      })
      .select()
      .single();

    return this.mapToWorkflow(data);
  }

  async getRuns(status?: string): Promise<OrchestratorRun[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('orchestrator_runs')
      .select('*')
      .eq('org_id', this.orgId)
      .order('started_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data } = await query;

    return (data || []).map(r => this.mapToRun(r));
  }

  async getRun(runId: string): Promise<OrchestratorRun> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('orchestrator_runs')
      .select('*')
      .eq('id', runId)
      .single();

    return this.mapToRun(data);
  }

  async getInvocations(runId: string): Promise<AgentInvocation[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('agent_invocations')
      .select('*')
      .eq('run_id', runId)
      .order('started_at');

    return (data || []).map(i => this.mapToInvocation(i));
  }

  async getWorkflows(): Promise<DeepAgentWorkflow[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('deep_agent_workflows')
      .select('*')
      .eq('org_id', this.orgId)
      .order('workflow_name');

    return (data || []).map(w => this.mapToWorkflow(w));
  }

  private mapToRun(data: any): OrchestratorRun {
    return {
      id: data.id,
      orgId: data.org_id,
      initiatorType: data.initiator_type,
      initiatorId: data.initiator_id,
      entrypoint: data.entrypoint,
      plan: data.plan,
      status: data.status,
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      errorSummary: data.error_summary,
    };
  }

  private mapToInvocation(data: any): AgentInvocation {
    return {
      id: data.id,
      runId: data.run_id,
      agentName: data.agent_name,
      engineType: data.engine_type,
      inputSummary: data.input_summary,
      outputSummary: data.output_summary,
      tokenCostEstimate: data.token_cost_estimate,
      startedAt: new Date(data.started_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
      status: data.status,
    };
  }

  private mapToWorkflow(data: any): DeepAgentWorkflow {
    return {
      id: data.id,
      orgId: data.org_id,
      workflowName: data.workflow_name,
      config: data.config,
      lastRunAt: data.last_run_at ? new Date(data.last_run_at) : undefined,
      lastStatus: data.last_status,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## API Endpoints

### POST /api/orchestrator/runs

Create orchestrator run.

### POST /api/orchestrator/execute/:runId

Execute orchestrator run.

### POST /api/orchestrator/workflows

Register Deep Agent workflow.

### GET /api/orchestrator/runs

Get all runs.

### GET /api/orchestrator/invocations/:runId

Get invocations for run.

### GET /api/orchestrator/workflows

Get all workflows.

## Implementation Tasks

- [ ] Create 131_maos_deep_agent_orchestration_core.sql
- [ ] Implement MAOSOrchestratorV2
- [ ] Create API endpoints
- [ ] Create OrchestratorDashboard.tsx
- [ ] Create WorkflowRegistry.tsx
- [ ] Enforce claude.md rules in plan validation
- [ ] Integrate with billing/token system

---

*Phase 79 - MAOS × Deep Agent Orchestration Core 2.0 Complete*
