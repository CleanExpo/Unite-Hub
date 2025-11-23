/**
 * Mission Planner
 * Phase 62: Plans multi-step cross-agent workflows
 */

import { AgentId } from './agentRegistry';
import { MissionType } from './executiveBrain';

export interface MissionStep {
  step_number: number;
  agent_id: AgentId;
  action: string;
  description: string;
  inputs: string[];
  outputs: string[];
  estimated_duration_ms: number;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
  result?: Record<string, any>;
}

export interface Mission {
  id: string;
  type: MissionType;
  client_id: string;
  title: string;
  description: string;
  steps: MissionStep[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  created_at: string;
  started_at?: string;
  completed_at?: string;
  status: 'planned' | 'executing' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
}

// Mission templates
const MISSION_TEMPLATES: Record<MissionType, Omit<MissionStep, 'step_number' | 'status'>[]> = {
  client_health_recovery: [
    {
      agent_id: 'agency_director',
      action: 'assess_risk',
      description: 'Analyze all risk factors and health metrics',
      inputs: ['client_id'],
      outputs: ['risk_assessment', 'health_score'],
      estimated_duration_ms: 2000,
    },
    {
      agent_id: 'success_engine',
      action: 'identify_interventions',
      description: 'Determine intervention strategies',
      inputs: ['risk_assessment'],
      outputs: ['intervention_plan'],
      estimated_duration_ms: 1500,
    },
    {
      agent_id: 'founder_assistant',
      action: 'schedule_outreach',
      description: 'Schedule client outreach call',
      inputs: ['intervention_plan'],
      outputs: ['scheduled_action'],
      estimated_duration_ms: 1000,
    },
  ],
  growth_push: [
    {
      agent_id: 'agency_director',
      action: 'analyze_opportunity',
      description: 'Analyze growth opportunity details',
      inputs: ['client_id', 'opportunity_type'],
      outputs: ['opportunity_analysis'],
      estimated_duration_ms: 2000,
    },
    {
      agent_id: 'creative_director',
      action: 'design_campaign',
      description: 'Design growth campaign creative',
      inputs: ['opportunity_analysis'],
      outputs: ['campaign_brief'],
      estimated_duration_ms: 3000,
    },
    {
      agent_id: 'production_engine',
      action: 'generate_assets',
      description: 'Generate campaign assets',
      inputs: ['campaign_brief'],
      outputs: ['generated_assets'],
      estimated_duration_ms: 5000,
    },
  ],
  brand_overhaul: [
    {
      agent_id: 'creative_director',
      action: 'audit_brand',
      description: 'Audit current brand consistency',
      inputs: ['client_id'],
      outputs: ['brand_audit'],
      estimated_duration_ms: 3000,
    },
    {
      agent_id: 'creative_director',
      action: 'propose_updates',
      description: 'Propose brand signature updates',
      inputs: ['brand_audit'],
      outputs: ['brand_proposal'],
      estimated_duration_ms: 2000,
    },
    {
      agent_id: 'founder_assistant',
      action: 'request_approval',
      description: 'Request founder approval for changes',
      inputs: ['brand_proposal'],
      outputs: ['approval_request'],
      estimated_duration_ms: 500,
    },
  ],
  seo_visual_alignment: [
    {
      agent_id: 'performance_intelligence',
      action: 'analyze_seo',
      description: 'Analyze current SEO performance',
      inputs: ['client_id'],
      outputs: ['seo_analysis'],
      estimated_duration_ms: 3000,
    },
    {
      agent_id: 'creative_director',
      action: 'align_visuals',
      description: 'Align visuals with SEO strategy',
      inputs: ['seo_analysis'],
      outputs: ['visual_recommendations'],
      estimated_duration_ms: 2000,
    },
    {
      agent_id: 'production_engine',
      action: 'update_content',
      description: 'Update content with optimizations',
      inputs: ['visual_recommendations'],
      outputs: ['updated_content'],
      estimated_duration_ms: 4000,
    },
  ],
  content_special_campaign: [
    {
      agent_id: 'creative_director',
      action: 'brief_campaign',
      description: 'Create campaign creative brief',
      inputs: ['client_id', 'campaign_goals'],
      outputs: ['creative_brief'],
      estimated_duration_ms: 2000,
    },
    {
      agent_id: 'production_engine',
      action: 'generate_content',
      description: 'Generate all campaign content',
      inputs: ['creative_brief'],
      outputs: ['content_package'],
      estimated_duration_ms: 6000,
    },
    {
      agent_id: 'success_engine',
      action: 'schedule_delivery',
      description: 'Schedule content delivery',
      inputs: ['content_package'],
      outputs: ['delivery_schedule'],
      estimated_duration_ms: 1000,
    },
  ],
  activation_acceleration: [
    {
      agent_id: 'success_engine',
      action: 'analyze_blockers',
      description: 'Analyze activation blockers',
      inputs: ['client_id'],
      outputs: ['blocker_analysis'],
      estimated_duration_ms: 2000,
    },
    {
      agent_id: 'agency_director',
      action: 'plan_acceleration',
      description: 'Create acceleration plan',
      inputs: ['blocker_analysis'],
      outputs: ['acceleration_plan'],
      estimated_duration_ms: 1500,
    },
    {
      agent_id: 'production_engine',
      action: 'generate_resources',
      description: 'Generate supporting resources',
      inputs: ['acceleration_plan'],
      outputs: ['resources'],
      estimated_duration_ms: 3000,
    },
    {
      agent_id: 'founder_assistant',
      action: 'notify_client',
      description: 'Notify client of support',
      inputs: ['resources'],
      outputs: ['notification_sent'],
      estimated_duration_ms: 500,
    },
  ],
};

/**
 * Mission Planner
 * Creates and manages multi-agent missions
 */
export class MissionPlanner {
  private missions: Map<string, Mission> = new Map();

  /**
   * Plan a new mission
   */
  planMission(
    type: MissionType,
    clientId: string,
    priority: Mission['priority']
  ): Mission {
    const id = `mission-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const template = MISSION_TEMPLATES[type];

    const steps: MissionStep[] = template.map((step, index) => ({
      ...step,
      step_number: index + 1,
      status: 'pending',
    }));

    const mission: Mission = {
      id,
      type,
      client_id: clientId,
      title: this.getMissionTitle(type),
      description: this.getMissionDescription(type),
      steps,
      priority,
      created_at: new Date().toISOString(),
      status: 'planned',
      progress: 0,
    };

    this.missions.set(id, mission);
    return mission;
  }

  /**
   * Start executing a mission
   */
  startMission(missionId: string): boolean {
    const mission = this.missions.get(missionId);
    if (mission && mission.status === 'planned') {
      mission.status = 'executing';
      mission.started_at = new Date().toISOString();
      return true;
    }
    return false;
  }

  /**
   * Complete a mission step
   */
  completeStep(
    missionId: string,
    stepNumber: number,
    result: Record<string, any>
  ): boolean {
    const mission = this.missions.get(missionId);
    if (!mission) return false;

    const step = mission.steps.find((s) => s.step_number === stepNumber);
    if (!step || step.status !== 'executing') return false;

    step.status = 'completed';
    step.result = result;

    // Update progress
    const completedSteps = mission.steps.filter(
      (s) => s.status === 'completed'
    ).length;
    mission.progress = Math.round((completedSteps / mission.steps.length) * 100);

    // Check if mission is complete
    if (completedSteps === mission.steps.length) {
      mission.status = 'completed';
      mission.completed_at = new Date().toISOString();
    }

    return true;
  }

  /**
   * Get mission by ID
   */
  getMission(id: string): Mission | undefined {
    return this.missions.get(id);
  }

  /**
   * Get all active missions
   */
  getActiveMissions(): Mission[] {
    return Array.from(this.missions.values()).filter(
      (m) => m.status === 'executing' || m.status === 'planned'
    );
  }

  /**
   * Get missions for a client
   */
  getClientMissions(clientId: string): Mission[] {
    return Array.from(this.missions.values()).filter(
      (m) => m.client_id === clientId
    );
  }

  /**
   * Cancel a mission
   */
  cancelMission(missionId: string): boolean {
    const mission = this.missions.get(missionId);
    if (mission && (mission.status === 'planned' || mission.status === 'executing')) {
      mission.status = 'cancelled';
      return true;
    }
    return false;
  }

  private getMissionTitle(type: MissionType): string {
    const titles: Record<MissionType, string> = {
      client_health_recovery: 'Client Health Recovery',
      growth_push: 'Growth Acceleration',
      brand_overhaul: 'Brand Refresh',
      seo_visual_alignment: 'SEO & Visual Alignment',
      content_special_campaign: 'Special Content Campaign',
      activation_acceleration: 'Activation Boost',
    };
    return titles[type];
  }

  private getMissionDescription(type: MissionType): string {
    const descriptions: Record<MissionType, string> = {
      client_health_recovery: 'Multi-agent intervention to improve client health and prevent churn',
      growth_push: 'Coordinated campaign to capitalize on growth opportunity',
      brand_overhaul: 'Comprehensive brand review and update across all touchpoints',
      seo_visual_alignment: 'Align visual content with SEO optimization goals',
      content_special_campaign: 'Special purpose content generation campaign',
      activation_acceleration: 'Accelerate client through activation blockers',
    };
    return descriptions[type];
  }
}

export default MissionPlanner;
