/**
 * Safety Enforcement Manager
 *
 * Central enforcement controller that intercepts and enforces safety actions
 * across all agent systems (orchestrator, autonomy engine, reasoning engine,
 * desktop agent, synthex agent, etc.).
 *
 * Core Enforcement Rules:
 * - Risk >= 80: HALT_GLOBAL_AUTONOMY
 * - Risk >= 65: PAUSE_ORCHESTRATOR_AND_THROTTLE_AGENTS
 * - Uncertainty >= 75: VALIDATION_MODE_ONLY
 * - Cascade detected: BLOCK_INVOLVED_AGENTS
 * - Memory corruption: HALT_REASONING_ENGINE
 */

import { getSupabaseServer } from '@/lib/supabase';
import { MemoryStore } from '@/lib/memory';
import { safetyInterventionController } from './safetyInterventionController';

export interface EnforcementDecision {
  shouldEnforce: boolean;
  action: string;
  severity: number;
  reason: string;
  affectedSystems: string[];
  metadata: Record<string, any>;
}

export interface EnforcementResult {
  enforcementId: string;
  action: string;
  executed: boolean;
  timestamp: string;
  affectedSystems: string[];
  result: {
    success: boolean;
    message: string;
    details: Record<string, any>;
  };
}

export interface EnforcementState {
  agentBlocked: Record<string, boolean>;
  orchestratorPaused: boolean;
  autonomyHalted: boolean;
  reasoningEngineHalted: boolean;
  validationModeEnabled: boolean;
  throttlingActive: Record<string, boolean>;
}

class SafetyEnforcementManager {
  private enforcementState: EnforcementState = {
    agentBlocked: {},
    orchestratorPaused: false,
    autonomyHalted: false,
    reasoningEngineHalted: false,
    validationModeEnabled: false,
    throttlingActive: {},
  };

  /**
   * Evaluate whether enforcement is needed based on system metrics
   */
  async evaluateEnforcement(params: {
    workspaceId: string;
    riskScore: number;
    uncertaintyScore: number;
    cascadeRiskScore: number;
    memoryCorruptionScore: number;
    activeAgents: string[];
  }): Promise<EnforcementDecision> {
    const {
      workspaceId,
      riskScore,
      uncertaintyScore,
      cascadeRiskScore,
      memoryCorruptionScore,
      activeAgents,
    } = params;

    // Rule 1: Risk >= 80 - HALT global autonomy
    if (riskScore >= 80) {
      return {
        shouldEnforce: true,
        action: 'halt_autonomy',
        severity: 5,
        reason: `Critical risk threshold exceeded: ${riskScore}%`,
        affectedSystems: ['autonomy_engine', 'orchestrator', 'reasoning_engine'],
        metadata: {
          riskScore,
          threshold: 80,
          rule: 'critical_risk_halt',
        },
      };
    }

    // Rule 2: Risk >= 65 - PAUSE orchestrator and throttle agents
    if (riskScore >= 65) {
      return {
        shouldEnforce: true,
        action: 'pause_workflow',
        severity: 4,
        reason: `Elevated risk detected: ${riskScore}%`,
        affectedSystems: ['orchestrator'],
        metadata: {
          riskScore,
          threshold: 65,
          rule: 'elevated_risk_pause',
          throttleAgents: activeAgents,
        },
      };
    }

    // Rule 3: Uncertainty >= 75 - VALIDATION MODE ONLY
    if (uncertaintyScore >= 75) {
      return {
        shouldEnforce: true,
        action: 'require_approval',
        severity: 4,
        reason: `High uncertainty detected: ${uncertaintyScore}%`,
        affectedSystems: ['all'],
        metadata: {
          uncertaintyScore,
          threshold: 75,
          rule: 'high_uncertainty_validation',
          validationModeEnabled: true,
        },
      };
    }

    // Rule 4: Cascade failure detected - BLOCK involved agents
    if (cascadeRiskScore >= 60) {
      return {
        shouldEnforce: true,
        action: 'block_agent',
        severity: 4,
        reason: `Cascade failure risk detected: ${cascadeRiskScore}%`,
        affectedSystems: activeAgents,
        metadata: {
          cascadeRiskScore,
          threshold: 60,
          rule: 'cascade_detected',
          blockedAgents: activeAgents,
        },
      };
    }

    // Rule 5: Memory corruption detected - HALT reasoning engine
    if (memoryCorruptionScore >= 60) {
      return {
        shouldEnforce: true,
        action: 'halt_autonomy',
        severity: 5,
        reason: `Memory corruption detected: ${memoryCorruptionScore}%`,
        affectedSystems: ['reasoning_engine', 'autonomy_engine'],
        metadata: {
          memoryCorruptionScore,
          threshold: 60,
          rule: 'memory_corruption_halt',
        },
      };
    }

    // No enforcement needed
    return {
      shouldEnforce: false,
      action: 'none',
      severity: 0,
      reason: 'All metrics within safe parameters',
      affectedSystems: [],
      metadata: {
        riskScore,
        uncertaintyScore,
        cascadeRiskScore,
        memoryCorruptionScore,
      },
    };
  }

  /**
   * Execute enforcement action immediately
   */
  async enforce(params: {
    workspaceId: string;
    decision: EnforcementDecision;
  }): Promise<EnforcementResult> {
    const { workspaceId, decision } = params;
    const enforcementId = `enforcement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const supabase = await getSupabaseServer();
      const memoryStore = new MemoryStore();

      // Execute intervention through the safety intervention controller
      const interventionResult = await safetyInterventionController.executeIntervention({
        workspaceId,
        action: decision.action as any,
        reason: decision.reason,
      });

      // Update local enforcement state
      this.updateEnforcementState(decision.action, true);

      // Record enforcement event
      await supabase.from('safety_events').insert({
        workspace_id: workspaceId,
        event_type: 'automatic_enforcement_triggered',
        severity: decision.severity,
        risk_level: 80, // High risk for automatic enforcement
        source: 'safety_enforcement_manager',
        details: {
          enforcement_id: enforcementId,
          decision: decision,
          intervention_result: interventionResult,
        },
        intervention: decision.action,
        intervention_executed: true,
        intervention_at: new Date().toISOString(),
      });

      // Archive enforcement to memory
      const { data: { user } } = await supabase.auth.getUser();
      await memoryStore.store({
        workspaceId: user?.id || 'system',
        agent: 'safety-enforcement-manager',
        memoryType: 'enforcement_action',
        content: {
          enforcement_id: enforcementId,
          action: decision.action,
          reason: decision.reason,
          severity: decision.severity,
          affected_systems: decision.affectedSystems,
          timestamp: new Date().toISOString(),
          metadata: decision.metadata,
        },
        importance: Math.min(100, decision.severity * 20),
        confidence: 95,
        keywords: ['enforcement', 'safety', decision.action.toLowerCase(), 'automatic'],
      });

      return {
        enforcementId,
        action: decision.action,
        executed: interventionResult.result.success,
        timestamp: new Date().toISOString(),
        affectedSystems: decision.affectedSystems,
        result: {
          success: interventionResult.result.success,
          message: interventionResult.result.message,
          details: interventionResult.result.details,
        },
      };
    } catch (error) {
      console.error('Enforcement error:', error);
      throw error;
    }
  }

  /**
   * Update internal enforcement state
   */
  private updateEnforcementState(action: string, active: boolean) {
    switch (action) {
      case 'halt_autonomy':
        this.enforcementState.autonomyHalted = active;
        this.enforcementState.orchestratorPaused = active;
        this.enforcementState.reasoningEngineHalted = active;
        break;
      case 'pause_workflow':
        this.enforcementState.orchestratorPaused = active;
        break;
      case 'require_approval':
        this.enforcementState.validationModeEnabled = active;
        break;
      case 'block_agent':
        // Will be updated per agent
        break;
      case 'throttle':
        // Will be updated per agent
        break;
    }
  }

  /**
   * Get current enforcement state
   */
  getEnforcementState(): EnforcementState {
    return { ...this.enforcementState };
  }

  /**
   * Check if specific agent is blocked
   */
  isAgentBlocked(agentName: string): boolean {
    return this.enforcementState.agentBlocked[agentName] || false;
  }

  /**
   * Check if autonomy is halted
   */
  isAutonomyHalted(): boolean {
    return this.enforcementState.autonomyHalted;
  }

  /**
   * Check if orchestrator is paused
   */
  isOrchestratorPaused(): boolean {
    return this.enforcementState.orchestratorPaused;
  }

  /**
   * Check if validation mode is enabled
   */
  isValidationModeEnabled(): boolean {
    return this.enforcementState.validationModeEnabled;
  }

  /**
   * Check if reasoning engine is halted
   */
  isReasoningEngineHalted(): boolean {
    return this.enforcementState.reasoningEngineHalted;
  }

  /**
   * Reset enforcement state (for testing or manual override)
   */
  resetEnforcementState(partial?: Partial<EnforcementState>) {
    if (partial) {
      this.enforcementState = { ...this.enforcementState, ...partial };
    } else {
      this.enforcementState = {
        agentBlocked: {},
        orchestratorPaused: false,
        autonomyHalted: false,
        reasoningEngineHalted: false,
        validationModeEnabled: false,
        throttlingActive: {},
      };
    }
  }

  /**
   * Get enforcement metrics for dashboard
   */
  async getEnforcementMetrics(params: {
    workspaceId: string;
    lookbackMinutes?: number;
  }): Promise<{
    totalEnforcements: number;
    byAction: Record<string, number>;
    currentState: EnforcementState;
    lastEnforcement: { timestamp: string; action: string } | null;
  }> {
    const supabase = await getSupabaseServer();
    const lookbackMinutes = params.lookbackMinutes || 1440; // 24 hours default
    const lookbackDate = new Date(Date.now() - lookbackMinutes * 60 * 1000).toISOString();

    const { data: events } = await supabase
      .from('safety_events')
      .select('*')
      .eq('workspace_id', params.workspaceId)
      .eq('event_type', 'automatic_enforcement_triggered')
      .gte('created_at', lookbackDate)
      .order('created_at', { ascending: false });

    const byAction: Record<string, number> = {};
    for (const event of events || []) {
      const action = event.intervention || 'unknown';
      byAction[action] = (byAction[action] || 0) + 1;
    }

    const lastEvent = events && events.length > 0 ? events[0] : null;

    return {
      totalEnforcements: events?.length || 0,
      byAction,
      currentState: this.getEnforcementState(),
      lastEnforcement: lastEvent
        ? {
            timestamp: lastEvent.created_at,
            action: lastEvent.intervention,
          }
        : null,
    };
  }
}

export const safetyEnforcementManager = new SafetyEnforcementManager();
