/**
 * Global Autonomy Engine
 *
 * Primary brain for cross-agent reasoning and unified workflow execution.
 * Orchestrates memory, reasoning, orchestrator, and all agents into a single
 * autonomous intelligence system with global risk/uncertainty modeling.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { OrchestratorEngine } from '@/lib/orchestrator';
import { MemoryStore } from '@/lib/memory';
import { globalContextBuilder } from './globalContextBuilder';
import { autonomyScoringModel } from './autonomyScoringModel';
import { autonomyArchiveBridge } from './autonomyArchiveBridge';

export interface GlobalAutonomyRun {
  runId: string;
  objective: string;
  globalContext: Record<string, any>;
  riskScore: number;
  uncertaintyScore: number;
  autonomyScore: number;
  readinessScore: number;
  consistencyScore: number;
  confidenceScore: number;
  activeAgents: string[];
  totalSteps: number;
  completedSteps: number;
  failedSteps: number;
  status: 'pending' | 'initializing' | 'running' | 'paused' | 'completed' | 'failed' | 'halted';
  events: AutonomyEvent[];
  startedAt: string;
  completedAt?: string;
}

export interface AutonomyEvent {
  id: string;
  runId: string;
  eventType: string;
  severity: number;
  agent?: string;
  sourceType?: string;
  sourceId?: string;
  payload: Record<string, any>;
  createdAt: string;
}

export interface AutonomyEvaluation {
  readiness: number; // 0-100: all agents ready?
  consistency: number; // 0-100: plan/memory consistency?
  confidence: number; // 0-100: decision confidence?
  riskScore: number; // 0-100: cross-agent risk?
  uncertaintyScore: number; // 0-100: global uncertainty?
  autonomyScore: number; // (readiness + consistency + confidence - risk) / 4
  recommendation: 'proceed' | 'validate' | 'pause' | 'halt';
}

export class GlobalAutonomyEngine {
  private orchestrator: OrchestratorEngine;
  private memoryStore: MemoryStore;
  private supabase = getSupabaseServer();

  constructor() {
    this.orchestrator = new OrchestratorEngine();
    this.memoryStore = new MemoryStore();
  }

  /**
   * Start a global autonomy run - unified multi-agent execution
   */
  async startGlobalAutonomyRun(params: {
    workspaceId: string;
    objective: string;
    description?: string;
    userId?: string;
  }): Promise<GlobalAutonomyRun> {
    const supabase = await this.supabase;
    const startTime = Date.now();

    try {
      // 1. Create autonomy run record
      const { data: run, error: createError } = await supabase
        .from('global_autonomy_runs')
        .insert({
          workspace_id: params.workspaceId,
          objective: params.objective,
          description: params.description,
          created_by: params.userId,
          status: 'initializing',
        })
        .select()
        .single();

      if (createError || !run) {
        throw new Error(`Failed to create autonomy run: ${createError?.message}`);
      }

      // 2. Record initialization event
      await this.recordEvent(run.id, 'context_assembled', 1, undefined, 'autonomy');

      // 3. Build global context
      const globalContext = await globalContextBuilder.buildContext({
        workspaceId: params.workspaceId,
        objective: params.objective,
      });

      // Update run with context
      await supabase
        .from('global_autonomy_runs')
        .update({ global_context: globalContext })
        .eq('id', run.id);

      // 4. Evaluate autonomy
      const evaluation = await this.evaluateAutonomy({
        workspaceId: params.workspaceId,
        objective: params.objective,
        context: globalContext,
      });

      // 5. Safety gates
      if (evaluation.autonomyScore < 40) {
        // Low autonomy - disable multi-agent chaining
        await this.recordEvent(
          run.id,
          'safety_gate_triggered',
          4,
          'orchestrator',
          'autonomy',
          run.id,
          { reason: 'autonomy_score_low', score: evaluation.autonomyScore }
        );

        // Update with evaluation scores
        await supabase
          .from('global_autonomy_runs')
          .update({
            status: 'paused',
            risk_score: evaluation.riskScore,
            uncertainty_score: evaluation.uncertaintyScore,
            autonomy_score: evaluation.autonomyScore,
            readiness_score: evaluation.readiness,
            consistency_score: evaluation.consistency,
            confidence_score: evaluation.confidence,
          })
          .eq('id', run.id);

        return this.getRunDetails(run.id);
      }

      // 6. Execute orchestrator workflow
      await supabase
        .from('global_autonomy_runs')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', run.id);

      const orchestrationPlan = await this.orchestrator.planWorkflow({
        workspaceId: params.workspaceId,
        objective: params.objective,
        description: params.description,
      });

      // Record agent activation
      const agents = orchestrationPlan.agentChain || [];
      for (const agent of agents) {
        await this.recordEvent(
          run.id,
          'agent_activated',
          1,
          agent,
          'orchestrator',
          undefined,
          { agentName: agent }
        );
      }

      // Set active agents
      await supabase.rpc('set_autonomy_active_agents', {
        p_run_id: run.id,
        p_agents: agents,
      });

      // 7. Execute workflow
      const trace = await this.orchestrator.executeWorkflow(
        orchestrationPlan.taskId,
        params.workspaceId
      );

      // Record execution events
      for (const step of trace.steps) {
        if (step.status === 'completed') {
          await this.recordEvent(
            run.id,
            'agent_completed',
            1,
            step.assignedAgent,
            'orchestrator',
            undefined,
            { stepIndex: step.stepIndex, agent: step.assignedAgent }
          );
        } else if (step.status === 'failed') {
          await this.recordEvent(
            run.id,
            'agent_failed',
            3,
            step.assignedAgent,
            'orchestrator',
            undefined,
            { stepIndex: step.stepIndex, agent: step.assignedAgent }
          );
        }
      }

      // 8. Final autonomy evaluation
      const finalEvaluation = await this.evaluateAutonomy({
        workspaceId: params.workspaceId,
        objective: params.objective,
        context: { ...globalContext, executionTrace: trace },
      });

      // 9. Archive to memory system
      await autonomyArchiveBridge.archiveRun({
        runId: run.id,
        objective: params.objective,
        globalContext,
        autonomyScore: finalEvaluation.autonomyScore,
        riskScore: finalEvaluation.riskScore,
        uncertaintyScore: finalEvaluation.uncertaintyScore,
        agents,
        completedSteps: trace.steps.filter((s) => s.status === 'completed').length,
        totalSteps: trace.steps.length,
      });

      // 10. Update final status
      const totalTime = Date.now() - startTime;
      await supabase
        .from('global_autonomy_runs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          risk_score: finalEvaluation.riskScore,
          uncertainty_score: finalEvaluation.uncertaintyScore,
          autonomy_score: finalEvaluation.autonomyScore,
          readiness_score: finalEvaluation.readiness,
          consistency_score: finalEvaluation.consistency,
          confidence_score: finalEvaluation.confidence,
          total_steps: trace.steps.length,
          completed_steps: trace.steps.filter((s) => s.status === 'completed').length,
          failed_steps: trace.steps.filter((s) => s.status === 'failed').length,
        })
        .eq('id', run.id);

      return this.getRunDetails(run.id);
    } catch (error) {
      console.error('Error in global autonomy run:', error);

      // Record failure
      if (params.workspaceId) {
        const { data: run } = await supabase
          .from('global_autonomy_runs')
          .select('id')
          .eq('workspace_id', params.workspaceId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (run) {
          await this.recordEvent(
            run.id,
            'anomaly_detected',
            5,
            'autonomy',
            'autonomy',
            run.id,
            { error: error instanceof Error ? error.message : 'Unknown error' }
          );

          await supabase
            .from('global_autonomy_runs')
            .update({ status: 'failed' })
            .eq('id', run.id);
        }
      }

      throw error;
    }
  }

  /**
   * Evaluate global autonomy readiness
   */
  async evaluateAutonomy(params: {
    workspaceId: string;
    objective: string;
    context: Record<string, any>;
  }): Promise<AutonomyEvaluation> {
    // Get readiness from context
    const readiness = await this.assessReadiness(params.context);
    const consistency = await this.assessConsistency(params.context);
    const confidence = await this.assessConfidence(params.context);

    // Extract risk/uncertainty from context
    const riskScore = params.context.aggregatedRisk || 45;
    const uncertaintyScore = params.context.aggregatedUncertainty || 55;

    // Calculate autonomy score
    const autonomyScore = autonomyScoringModel.calculateAutonomyScore({
      readiness,
      consistency,
      confidence,
      riskScore,
      uncertaintyScore,
    });

    // Determine recommendation
    let recommendation: 'proceed' | 'validate' | 'pause' | 'halt' = 'proceed';
    if (riskScore >= 80) recommendation = 'halt';
    else if (uncertaintyScore >= 75) recommendation = 'pause';
    else if (autonomyScore < 50) recommendation = 'validate';

    return {
      readiness,
      consistency,
      confidence,
      riskScore,
      uncertaintyScore,
      autonomyScore,
      recommendation,
    };
  }

  /**
   * Get complete run details
   */
  async getRunDetails(runId: string): Promise<GlobalAutonomyRun> {
    const supabase = await this.supabase;

    const { data: run } = await supabase
      .from('global_autonomy_runs')
      .select('*')
      .eq('id', runId)
      .single();

    const { data: events } = await supabase
      .from('global_autonomy_events')
      .select('*')
      .eq('run_id', runId)
      .order('created_at', { ascending: true });

    return {
      runId: run.id,
      objective: run.objective,
      globalContext: run.global_context,
      riskScore: run.risk_score,
      uncertaintyScore: run.uncertainty_score,
      autonomyScore: run.autonomy_score,
      readinessScore: run.readiness_score,
      consistencyScore: run.consistency_score,
      confidenceScore: run.confidence_score,
      activeAgents: run.active_agents,
      totalSteps: run.total_steps,
      completedSteps: run.completed_steps,
      failedSteps: run.failed_steps,
      status: run.status,
      events: events?.map((e) => ({
        id: e.id,
        runId: e.run_id,
        eventType: e.event_type,
        severity: e.severity,
        agent: e.agent,
        sourceType: e.source_type,
        sourceId: e.source_id,
        payload: e.payload,
        createdAt: e.created_at,
      })) || [],
      startedAt: run.started_at,
      completedAt: run.completed_at,
    };
  }

  /**
   * Record autonomy event
   */
  private async recordEvent(
    runId: string,
    eventType: string,
    severity: number = 0,
    agent?: string,
    sourceType?: string,
    sourceId?: string,
    payload?: Record<string, any>
  ): Promise<void> {
    const supabase = await this.supabase;

    await supabase
      .from('global_autonomy_events')
      .insert({
        run_id: runId,
        event_type: eventType,
        severity,
        agent,
        source_type: sourceType,
        source_id: sourceId,
        payload: payload || {},
      });
  }

  /**
   * Assess readiness: are all agents available and prepared?
   */
  private async assessReadiness(context: Record<string, any>): Promise<number> {
    const agents = context.activeAgents || [];
    if (agents.length === 0) return 0;

    // Check agent health from context
    const healthyAgents = agents.filter(
      (a: string) => context.agentHealth?.[a] === 'healthy'
    ).length;

    return Math.round((healthyAgents / agents.length) * 100);
  }

  /**
   * Assess consistency: do memories align with current plan?
   */
  private async assessConsistency(context: Record<string, any>): Promise<number> {
    const memories = context.relevantMemories || [];
    const planSteps = context.planSteps || [];

    if (memories.length === 0 || planSteps.length === 0) return 50;

    // Simple consistency: how many memories support plan steps?
    const supportedSteps = planSteps.filter((step: any) =>
      memories.some((m: any) =>
        m.content?.toLowerCase().includes(step.toLowerCase())
      )
    ).length;

    return Math.round((supportedSteps / planSteps.length) * 100);
  }

  /**
   * Assess confidence: how confident are we in the decision?
   */
  private async assessConfidence(context: Record<string, any>): Promise<number> {
    const memoryConfidence = context.memoryConfidence || 70;
    const reasoningConfidence = context.reasoningConfidence || 75;
    const orchestratorConfidence = context.orchestratorConfidence || 80;

    // Weighted average
    return Math.round((memoryConfidence * 0.3 + reasoningConfidence * 0.3 + orchestratorConfidence * 0.4));
  }
}

export const globalAutonomyEngine = new GlobalAutonomyEngine();
