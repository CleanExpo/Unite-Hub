/**
 * Agent Registry
 * Phase 62: Registry of all active agents with capabilities
 */

export type AgentId =
  | 'agency_director'
  | 'creative_director'
  | 'success_engine'
  | 'production_engine'
  | 'performance_intelligence'
  | 'financial_director'
  | 'founder_assistant';

export type AgentCapability =
  | 'risk_detection'
  | 'opportunity_detection'
  | 'content_generation'
  | 'visual_generation'
  | 'quality_scoring'
  | 'brand_management'
  | 'client_health'
  | 'engagement_tracking'
  | 'cost_management'
  | 'billing'
  | 'seo_optimization'
  | 'scheduling'
  | 'briefing_generation'
  | 'reporting';

export type AgentStatus = 'active' | 'idle' | 'busy' | 'error' | 'maintenance';

export interface AgentDefinition {
  id: AgentId;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  dependencies: AgentId[];
  priority: number; // 1-10, higher = more important
  load_weight: number; // Resource weight 1-10
  status: AgentStatus;
  last_active: string;
  metrics: {
    tasks_completed_24h: number;
    avg_response_ms: number;
    error_rate: number;
  };
}

// Agent definitions
export const AGENTS: Record<AgentId, Omit<AgentDefinition, 'status' | 'last_active' | 'metrics'>> = {
  agency_director: {
    id: 'agency_director',
    name: 'Agency Director',
    description: 'Central oversight for all clients, risk detection, opportunity identification',
    capabilities: ['risk_detection', 'opportunity_detection', 'client_health', 'briefing_generation'],
    dependencies: [],
    priority: 10,
    load_weight: 8,
  },
  creative_director: {
    id: 'creative_director',
    name: 'Creative Director',
    description: 'Brand consistency, visual quality, creative standards',
    capabilities: ['quality_scoring', 'brand_management', 'visual_generation'],
    dependencies: ['agency_director'],
    priority: 8,
    load_weight: 7,
  },
  success_engine: {
    id: 'success_engine',
    name: 'Success Engine',
    description: 'Client success metrics, activation tracking, health scores',
    capabilities: ['client_health', 'engagement_tracking', 'reporting'],
    dependencies: ['agency_director'],
    priority: 9,
    load_weight: 6,
  },
  production_engine: {
    id: 'production_engine',
    name: 'Production Engine',
    description: 'Content and visual generation pipeline',
    capabilities: ['content_generation', 'visual_generation', 'scheduling'],
    dependencies: ['creative_director'],
    priority: 7,
    load_weight: 9,
  },
  performance_intelligence: {
    id: 'performance_intelligence',
    name: 'Performance Intelligence',
    description: 'SEO, analytics, performance optimization',
    capabilities: ['seo_optimization', 'engagement_tracking', 'reporting'],
    dependencies: ['agency_director'],
    priority: 6,
    load_weight: 5,
  },
  financial_director: {
    id: 'financial_director',
    name: 'Financial Director',
    description: 'Cost management, billing, budget tracking',
    capabilities: ['cost_management', 'billing', 'reporting'],
    dependencies: [],
    priority: 8,
    load_weight: 4,
  },
  founder_assistant: {
    id: 'founder_assistant',
    name: 'Founder Assistant',
    description: 'Executive briefings, scheduling, priority management',
    capabilities: ['briefing_generation', 'scheduling', 'reporting'],
    dependencies: ['agency_director', 'financial_director'],
    priority: 10,
    load_weight: 3,
  },
};

/**
 * Agent Registry
 * Manages agent lifecycle and health
 */
export class AgentRegistry {
  private agentStates: Map<AgentId, AgentDefinition> = new Map();

  constructor() {
    this.initializeAgents();
  }

  private initializeAgents() {
    for (const [id, definition] of Object.entries(AGENTS)) {
      this.agentStates.set(id as AgentId, {
        ...definition,
        status: 'active',
        last_active: new Date().toISOString(),
        metrics: {
          tasks_completed_24h: 0,
          avg_response_ms: 200,
          error_rate: 0,
        },
      });
    }
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): AgentDefinition[] {
    return Array.from(this.agentStates.values());
  }

  /**
   * Get agent by ID
   */
  getAgent(id: AgentId): AgentDefinition | undefined {
    return this.agentStates.get(id);
  }

  /**
   * Get agents with specific capability
   */
  getAgentsWithCapability(capability: AgentCapability): AgentDefinition[] {
    return this.getAllAgents().filter((agent) =>
      agent.capabilities.includes(capability)
    );
  }

  /**
   * Get available agents (not busy or in error)
   */
  getAvailableAgents(): AgentDefinition[] {
    return this.getAllAgents().filter(
      (agent) => agent.status === 'active' || agent.status === 'idle'
    );
  }

  /**
   * Update agent status
   */
  updateStatus(id: AgentId, status: AgentStatus): void {
    const agent = this.agentStates.get(id);
    if (agent) {
      agent.status = status;
      agent.last_active = new Date().toISOString();
    }
  }

  /**
   * Record task completion
   */
  recordTask(id: AgentId, responseMs: number, success: boolean): void {
    const agent = this.agentStates.get(id);
    if (agent) {
      agent.metrics.tasks_completed_24h++;
      agent.metrics.avg_response_ms = Math.round(
        (agent.metrics.avg_response_ms + responseMs) / 2
      );
      if (!success) {
        agent.metrics.error_rate = Math.min(
          1,
          agent.metrics.error_rate + 0.01
        );
      } else {
        agent.metrics.error_rate = Math.max(
          0,
          agent.metrics.error_rate - 0.005
        );
      }
      agent.last_active = new Date().toISOString();
    }
  }

  /**
   * Get system health summary
   */
  getSystemHealth(): {
    total_agents: number;
    active: number;
    busy: number;
    error: number;
    total_load: number;
    avg_error_rate: number;
  } {
    const agents = this.getAllAgents();
    const active = agents.filter((a) => a.status === 'active').length;
    const busy = agents.filter((a) => a.status === 'busy').length;
    const error = agents.filter((a) => a.status === 'error').length;
    const totalLoad = agents.reduce((sum, a) => sum + a.load_weight, 0);
    const avgErrorRate =
      agents.reduce((sum, a) => sum + a.metrics.error_rate, 0) / agents.length;

    return {
      total_agents: agents.length,
      active,
      busy,
      error,
      total_load: totalLoad,
      avg_error_rate: avgErrorRate,
    };
  }

  /**
   * Select best agent for a capability
   */
  selectAgent(capability: AgentCapability): AgentId | null {
    const candidates = this.getAgentsWithCapability(capability)
      .filter((a) => a.status === 'active' || a.status === 'idle')
      .sort((a, b) => {
        // Sort by priority (desc), then by error rate (asc)
        if (b.priority !== a.priority) {
return b.priority - a.priority;
}
        return a.metrics.error_rate - b.metrics.error_rate;
      });

    return candidates.length > 0 ? candidates[0].id : null;
  }
}

export default AgentRegistry;
