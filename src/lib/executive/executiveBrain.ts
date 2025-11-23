/**
 * Executive Brain
 * Phase 62: Central orchestration logic for all agents
 */

import { AgentRegistry, AgentId, AgentCapability, AGENTS } from './agentRegistry';

// Decision triggers
export type DecisionTrigger =
  | 'client_risk_detected'
  | 'opportunity_created'
  | 'deadline_missed'
  | 'visual_quality_drop'
  | 'seo_decline'
  | 'engagement_stall'
  | 'billing_issue'
  | 'founder_voice_command';

// Mission types
export type MissionType =
  | 'client_health_recovery'
  | 'growth_push'
  | 'brand_overhaul'
  | 'seo_visual_alignment'
  | 'content_special_campaign'
  | 'activation_acceleration';

export interface ExecutiveDecision {
  id: string;
  trigger: DecisionTrigger;
  client_id?: string;
  selected_agents: AgentId[];
  mission_type: MissionType;
  priority: 'critical' | 'high' | 'medium' | 'low';
  rationale: string;
  created_at: string;
  status: 'pending' | 'approved' | 'executing' | 'completed' | 'failed';
  requires_approval: boolean;
}

export interface ExecutiveBriefing {
  generated_at: string;
  system_health: {
    total_agents: number;
    active: number;
    busy: number;
    error: number;
    overall_status: 'healthy' | 'degraded' | 'critical';
  };
  active_missions: number;
  pending_decisions: number;
  client_summary: {
    total: number;
    at_risk: number;
    opportunities: number;
  };
  top_priorities: string[];
  action_items: string[];
}

// Executive constraints
const EXECUTIVE_CONSTRAINTS = {
  truth_layer_only: true,
  factual_intelligence_only: true,
  no_hallucinated_capabilities: true,
  founder_approval_required_for_major_decisions: true,
};

/**
 * Executive Brain
 * Coordinates all agents and makes strategic decisions
 */
export class ExecutiveBrain {
  private registry: AgentRegistry;
  private decisions: Map<string, ExecutiveDecision> = new Map();

  constructor() {
    this.registry = new AgentRegistry();
  }

  /**
   * Process a trigger and generate decision
   */
  async processTrigger(
    trigger: DecisionTrigger,
    context: {
      client_id?: string;
      data?: Record<string, any>;
    }
  ): Promise<ExecutiveDecision> {
    const decision = await this.generateDecision(trigger, context);
    this.decisions.set(decision.id, decision);
    return decision;
  }

  /**
   * Generate a decision based on trigger
   */
  private async generateDecision(
    trigger: DecisionTrigger,
    context: { client_id?: string; data?: Record<string, any> }
  ): Promise<ExecutiveDecision> {
    const id = `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Map trigger to mission type and required capabilities
    const { missionType, capabilities, priority, rationale } =
      this.mapTriggerToMission(trigger, context);

    // Select agents with required capabilities
    const selectedAgents = this.selectAgentsForMission(capabilities);

    // Determine if founder approval is required
    const requiresApproval =
      priority === 'critical' ||
      missionType === 'brand_overhaul' ||
      (context.data?.major_change === true);

    return {
      id,
      trigger,
      client_id: context.client_id,
      selected_agents: selectedAgents,
      mission_type: missionType,
      priority,
      rationale,
      created_at: new Date().toISOString(),
      status: requiresApproval ? 'pending' : 'approved',
      requires_approval: requiresApproval,
    };
  }

  /**
   * Map trigger to mission configuration
   */
  private mapTriggerToMission(
    trigger: DecisionTrigger,
    context: { data?: Record<string, any> }
  ): {
    missionType: MissionType;
    capabilities: AgentCapability[];
    priority: ExecutiveDecision['priority'];
    rationale: string;
  } {
    switch (trigger) {
      case 'client_risk_detected':
        return {
          missionType: 'client_health_recovery',
          capabilities: ['risk_detection', 'client_health', 'engagement_tracking'],
          priority: 'high',
          rationale: 'Client at risk requires immediate intervention to prevent churn.',
        };

      case 'opportunity_created':
        return {
          missionType: 'growth_push',
          capabilities: ['opportunity_detection', 'content_generation', 'engagement_tracking'],
          priority: 'medium',
          rationale: 'Growth opportunity identified for client expansion.',
        };

      case 'visual_quality_drop':
        return {
          missionType: 'brand_overhaul',
          capabilities: ['quality_scoring', 'brand_management', 'visual_generation'],
          priority: 'high',
          rationale: 'Visual quality below standards requires creative review.',
        };

      case 'seo_decline':
        return {
          missionType: 'seo_visual_alignment',
          capabilities: ['seo_optimization', 'content_generation', 'reporting'],
          priority: 'medium',
          rationale: 'SEO performance declining, requires optimization.',
        };

      case 'engagement_stall':
        return {
          missionType: 'activation_acceleration',
          capabilities: ['engagement_tracking', 'client_health', 'content_generation'],
          priority: 'high',
          rationale: 'Client engagement stalled, needs re-activation.',
        };

      case 'billing_issue':
        return {
          missionType: 'client_health_recovery',
          capabilities: ['billing', 'cost_management', 'client_health'],
          priority: 'critical',
          rationale: 'Billing issue detected, requires immediate resolution.',
        };

      case 'deadline_missed':
        return {
          missionType: 'content_special_campaign',
          capabilities: ['scheduling', 'content_generation', 'reporting'],
          priority: 'high',
          rationale: 'Deadline missed, requires expedited delivery.',
        };

      case 'founder_voice_command':
        return {
          missionType: context.data?.mission_type || 'content_special_campaign',
          capabilities: ['briefing_generation', 'scheduling'],
          priority: 'high',
          rationale: 'Direct founder request for action.',
        };

      default:
        return {
          missionType: 'client_health_recovery',
          capabilities: ['client_health'],
          priority: 'medium',
          rationale: 'General intervention required.',
        };
    }
  }

  /**
   * Select agents for mission based on capabilities
   */
  private selectAgentsForMission(capabilities: AgentCapability[]): AgentId[] {
    const selected: Set<AgentId> = new Set();

    for (const capability of capabilities) {
      const agentId = this.registry.selectAgent(capability);
      if (agentId) {
        selected.add(agentId);

        // Add dependencies
        const agent = this.registry.getAgent(agentId);
        if (agent) {
          for (const dep of agent.dependencies) {
            selected.add(dep);
          }
        }
      }
    }

    return Array.from(selected);
  }

  /**
   * Approve a pending decision
   */
  approveDecision(decisionId: string): boolean {
    const decision = this.decisions.get(decisionId);
    if (decision && decision.status === 'pending') {
      decision.status = 'approved';
      return true;
    }
    return false;
  }

  /**
   * Get all pending decisions
   */
  getPendingDecisions(): ExecutiveDecision[] {
    return Array.from(this.decisions.values()).filter(
      (d) => d.status === 'pending'
    );
  }

  /**
   * Get active missions
   */
  getActiveMissions(): ExecutiveDecision[] {
    return Array.from(this.decisions.values()).filter(
      (d) => d.status === 'approved' || d.status === 'executing'
    );
  }

  /**
   * Generate executive briefing
   */
  async generateBriefing(): Promise<ExecutiveBriefing> {
    const systemHealth = this.registry.getSystemHealth();
    const pendingDecisions = this.getPendingDecisions();
    const activeMissions = this.getActiveMissions();

    // Determine overall status
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (systemHealth.error > 0) {
      overallStatus = systemHealth.error >= 2 ? 'critical' : 'degraded';
    } else if (systemHealth.avg_error_rate > 0.1) {
      overallStatus = 'degraded';
    }

    // Generate priorities
    const topPriorities: string[] = [];
    if (pendingDecisions.length > 0) {
      topPriorities.push(`${pendingDecisions.length} decision(s) awaiting approval`);
    }
    if (activeMissions.filter((m) => m.priority === 'critical').length > 0) {
      topPriorities.push('Critical missions in progress');
    }
    topPriorities.push('Review agent health metrics');
    topPriorities.push('Check client risk alerts');

    // Generate action items
    const actionItems: string[] = [];
    if (pendingDecisions.length > 0) {
      actionItems.push('⏳ Review and approve pending decisions');
    }
    if (overallStatus !== 'healthy') {
      actionItems.push('🔧 Investigate agent errors');
    }
    actionItems.push('📊 Review system performance');
    actionItems.push('🎯 Check mission progress');

    return {
      generated_at: new Date().toISOString(),
      system_health: {
        ...systemHealth,
        overall_status: overallStatus,
      },
      active_missions: activeMissions.length,
      pending_decisions: pendingDecisions.length,
      client_summary: {
        total: 5, // Would fetch from database
        at_risk: 1,
        opportunities: 3,
      },
      top_priorities: topPriorities,
      action_items: actionItems,
    };
  }

  /**
   * Get agent registry
   */
  getRegistry(): AgentRegistry {
    return this.registry;
  }
}

export default ExecutiveBrain;
