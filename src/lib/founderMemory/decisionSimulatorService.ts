/**
 * Decision Simulator Service (Shadow Founder)
 *
 * Implements the Shadow Founder decision simulator: takes proposed
 * strategic moves, runs scenario modelling, writes to founder_decision_scenarios.
 *
 * Part of the Founder Cognitive Twin Engine.
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase';
import { momentumScoringService } from './momentumScoringService';

// Types
export type ScenarioType =
  | 'strategic'
  | 'tactical'
  | 'operational'
  | 'financial'
  | 'hiring'
  | 'product';

export type ScenarioStatus = 'draft' | 'simulated' | 'adopted' | 'rejected' | 'archived';

export interface ScenarioAssumptions {
  action: string;
  affectedAreas: string[];
  timeframeWeeks: number;
  resourceRequirements: string;
  constraints: string[];
  additionalContext?: string;
}

export interface SimulatedOutcome {
  bestCase: OutcomeScenario;
  expectedCase: OutcomeScenario;
  worstCase: OutcomeScenario;
  affectedMomentum: Record<string, { current: number; projected: number; change: number }>;
  risksIntroduced: string[];
  opportunitiesUnlocked: string[];
  confidence: number;
  reasoning: string;
}

export interface OutcomeScenario {
  probability: number;
  description: string;
  keyOutcomes: string[];
  timeToRealization: string;
}

export interface DecisionScenario {
  id: string;
  founderId: string;
  workspaceId: string;
  name: string;
  description?: string;
  scenarioType: ScenarioType;
  inputAssumptionsJson: ScenarioAssumptions;
  simulatedOutcomesJson?: SimulatedOutcome;
  status: ScenarioStatus;
  adoptedAt?: Date;
  adoptionNotes?: string;
  simulationModelVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SimulationRequest {
  founderId: string;
  workspaceId: string;
  name: string;
  description?: string;
  scenarioType?: ScenarioType;
  assumptions: ScenarioAssumptions;
}

class DecisionSimulatorService {
  private anthropic: Anthropic;
  private modelVersion = 'v1.0';

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Create and simulate a decision scenario
   */
  async simulateDecision(request: SimulationRequest): Promise<DecisionScenario> {
    const {
      founderId,
      workspaceId,
      name,
      description,
      scenarioType = 'strategic',
      assumptions,
    } = request;

    // Create scenario record
    const { data: scenario, error } = await supabaseAdmin
      .from('founder_decision_scenarios')
      .insert({
        founder_id: founderId,
        workspace_id: workspaceId,
        name,
        description,
        scenario_type: scenarioType,
        input_assumptions_json: assumptions,
        status: 'draft',
        simulation_model_version: this.modelVersion,
      })
      .select()
      .single();

    if (error || !scenario) {
      throw new Error(`Failed to create scenario: ${error?.message}`);
    }

    // Run simulation
    const outcomes = await this.runSimulation(founderId, workspaceId, assumptions);

    // Update with simulation results
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('founder_decision_scenarios')
      .update({
        simulated_outcomes_json: outcomes,
        status: 'simulated',
        updated_at: new Date().toISOString(),
      })
      .eq('id', scenario.id)
      .select()
      .single();

    if (updateError) {
      console.error('[DecisionSimulator] Failed to update scenario:', updateError);
    }

    return this.mapDbToScenario(updated || scenario);
  }

  /**
   * Run the actual simulation using AI
   */
  private async runSimulation(
    founderId: string,
    workspaceId: string,
    assumptions: ScenarioAssumptions
  ): Promise<SimulatedOutcome> {
    // Get current momentum for comparison
    const currentMomentum = await momentumScoringService.getLatestMomentum(founderId, workspaceId);

    const momentumContext = currentMomentum
      ? `Current momentum scores:
- Marketing: ${currentMomentum.marketingScore}
- Sales: ${currentMomentum.salesScore}
- Delivery: ${currentMomentum.deliveryScore}
- Product: ${currentMomentum.productScore}
- Clients: ${currentMomentum.clientsScore}
- Engineering: ${currentMomentum.engineeringScore}
- Finance: ${currentMomentum.financeScore}
- Overall: ${currentMomentum.overallScore}`
      : 'No current momentum data available';

    const prompt = `You are the Shadow Founder - a decision simulation engine. Analyze this proposed strategic decision and simulate potential outcomes.

PROPOSED ACTION:
${assumptions.action}

AFFECTED AREAS: ${assumptions.affectedAreas.join(', ')}
TIMEFRAME: ${assumptions.timeframeWeeks} weeks
RESOURCE REQUIREMENTS: ${assumptions.resourceRequirements}
CONSTRAINTS: ${assumptions.constraints.join(', ')}
${assumptions.additionalContext ? `ADDITIONAL CONTEXT: ${assumptions.additionalContext}` : ''}

${momentumContext}

Simulate three outcome scenarios (best, expected, worst) considering:
1. Impact on each momentum area
2. New risks this decision might introduce
3. New opportunities this might unlock
4. Realistic probability distributions

Return JSON (IMPORTANT: This is a SIMULATION, not a guarantee):
{
  "best_case": {
    "probability": 0.2,
    "description": "Optimistic outcome description",
    "key_outcomes": ["outcome1", "outcome2"],
    "time_to_realization": "4-6 weeks"
  },
  "expected_case": {
    "probability": 0.6,
    "description": "Most likely outcome description",
    "key_outcomes": ["outcome1", "outcome2"],
    "time_to_realization": "6-8 weeks"
  },
  "worst_case": {
    "probability": 0.2,
    "description": "Pessimistic outcome description",
    "key_outcomes": ["outcome1", "outcome2"],
    "time_to_realization": "8-12 weeks"
  },
  "affected_momentum": {
    "marketing": {"current": 60, "projected": 65, "change": 5},
    "sales": {"current": 55, "projected": 60, "change": 5},
    "delivery": {"current": 70, "projected": 65, "change": -5},
    "product": {"current": 50, "projected": 55, "change": 5},
    "clients": {"current": 65, "projected": 70, "change": 5},
    "engineering": {"current": 60, "projected": 55, "change": -5},
    "finance": {"current": 55, "projected": 60, "change": 5}
  },
  "risks_introduced": ["risk1", "risk2"],
  "opportunities_unlocked": ["opportunity1", "opportunity2"],
  "confidence": 0.7,
  "reasoning": "Brief explanation of simulation logic"
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const textBlock = response.content.find((c) => c.type === 'text');
      if (!textBlock) throw new Error('No response');

      const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');

      const result = JSON.parse(jsonMatch[0]);

      return {
        bestCase: {
          probability: result.best_case.probability,
          description: result.best_case.description,
          keyOutcomes: result.best_case.key_outcomes,
          timeToRealization: result.best_case.time_to_realization,
        },
        expectedCase: {
          probability: result.expected_case.probability,
          description: result.expected_case.description,
          keyOutcomes: result.expected_case.key_outcomes,
          timeToRealization: result.expected_case.time_to_realization,
        },
        worstCase: {
          probability: result.worst_case.probability,
          description: result.worst_case.description,
          keyOutcomes: result.worst_case.key_outcomes,
          timeToRealization: result.worst_case.time_to_realization,
        },
        affectedMomentum: result.affected_momentum,
        risksIntroduced: result.risks_introduced,
        opportunitiesUnlocked: result.opportunities_unlocked,
        confidence: result.confidence,
        reasoning: result.reasoning,
      };
    } catch (error) {
      console.error('[DecisionSimulator] Simulation failed:', error);

      // Return default simulation
      return {
        bestCase: {
          probability: 0.2,
          description: 'Optimistic outcome if execution is flawless',
          keyOutcomes: ['Positive impact on affected areas'],
          timeToRealization: `${assumptions.timeframeWeeks} weeks`,
        },
        expectedCase: {
          probability: 0.6,
          description: 'Most likely outcome with typical execution',
          keyOutcomes: ['Moderate impact on affected areas'],
          timeToRealization: `${Math.round(assumptions.timeframeWeeks * 1.25)} weeks`,
        },
        worstCase: {
          probability: 0.2,
          description: 'Pessimistic outcome with challenges',
          keyOutcomes: ['Limited impact, potential setbacks'],
          timeToRealization: `${Math.round(assumptions.timeframeWeeks * 1.5)} weeks`,
        },
        affectedMomentum: {},
        risksIntroduced: ['Execution risk', 'Resource constraints'],
        opportunitiesUnlocked: ['Potential for improvement in affected areas'],
        confidence: 0.5,
        reasoning: 'Default simulation due to analysis limitations',
      };
    }
  }

  /**
   * Get scenario by ID
   */
  async getScenario(scenarioId: string, workspaceId: string): Promise<DecisionScenario | null> {
    const { data, error } = await supabaseAdmin
      .from('founder_decision_scenarios')
      .select('*')
      .eq('id', scenarioId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error || !data) return null;
    return this.mapDbToScenario(data);
  }

  /**
   * List scenarios for a founder
   */
  async listScenarios(
    founderId: string,
    workspaceId: string,
    options?: {
      status?: ScenarioStatus[];
      scenarioType?: ScenarioType;
      limit?: number;
    }
  ): Promise<DecisionScenario[]> {
    let query = supabaseAdmin
      .from('founder_decision_scenarios')
      .select('*')
      .eq('founder_id', founderId)
      .eq('workspace_id', workspaceId);

    if (options?.status?.length) {
      query = query.in('status', options.status);
    }

    if (options?.scenarioType) {
      query = query.eq('scenario_type', options.scenarioType);
    }

    query = query
      .order('created_at', { ascending: false })
      .limit(options?.limit || 20);

    const { data, error } = await query;

    if (error || !data) return [];
    return data.map(this.mapDbToScenario);
  }

  /**
   * Update scenario status
   */
  async updateScenarioStatus(
    scenarioId: string,
    workspaceId: string,
    status: ScenarioStatus,
    notes?: string
  ): Promise<boolean> {
    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'adopted') {
      updateData.adopted_at = new Date().toISOString();
    }

    if (notes) {
      updateData.adoption_notes = notes;
    }

    const { error } = await supabaseAdmin
      .from('founder_decision_scenarios')
      .update(updateData)
      .eq('id', scenarioId)
      .eq('workspace_id', workspaceId);

    return !error;
  }

  /**
   * Re-run simulation on existing scenario
   */
  async reSimulate(scenarioId: string, workspaceId: string): Promise<DecisionScenario | null> {
    const scenario = await this.getScenario(scenarioId, workspaceId);
    if (!scenario) return null;

    const outcomes = await this.runSimulation(
      scenario.founderId,
      workspaceId,
      scenario.inputAssumptionsJson
    );

    const { data, error } = await supabaseAdmin
      .from('founder_decision_scenarios')
      .update({
        simulated_outcomes_json: outcomes,
        status: 'simulated',
        simulation_model_version: this.modelVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scenarioId)
      .select()
      .single();

    if (error || !data) return null;
    return this.mapDbToScenario(data);
  }

  /**
   * Compare multiple scenarios
   */
  async compareScenarios(
    scenarioIds: string[],
    workspaceId: string
  ): Promise<{
    scenarios: DecisionScenario[];
    comparison: {
      bestOverall: string;
      lowestRisk: string;
      fastestRealization: string;
      summary: string;
    };
  }> {
    const scenarios: DecisionScenario[] = [];

    for (const id of scenarioIds) {
      const scenario = await this.getScenario(id, workspaceId);
      if (scenario && scenario.simulatedOutcomesJson) {
        scenarios.push(scenario);
      }
    }

    if (scenarios.length < 2) {
      return {
        scenarios,
        comparison: {
          bestOverall: scenarios[0]?.id || '',
          lowestRisk: scenarios[0]?.id || '',
          fastestRealization: scenarios[0]?.id || '',
          summary: 'Not enough scenarios to compare',
        },
      };
    }

    // Analyze scenarios
    let bestOverallId = scenarios[0].id;
    let bestOverallScore = 0;
    let lowestRiskId = scenarios[0].id;
    let lowestRiskCount = Infinity;
    let fastestId = scenarios[0].id;
    let fastestWeeks = Infinity;

    scenarios.forEach((s) => {
      const outcomes = s.simulatedOutcomesJson!;

      // Best overall (expected case momentum improvement)
      const momentumChange = Object.values(outcomes.affectedMomentum || {})
        .reduce((sum, m) => sum + (m.change || 0), 0);
      if (momentumChange > bestOverallScore) {
        bestOverallScore = momentumChange;
        bestOverallId = s.id;
      }

      // Lowest risk
      const riskCount = outcomes.risksIntroduced?.length || 0;
      if (riskCount < lowestRiskCount) {
        lowestRiskCount = riskCount;
        lowestRiskId = s.id;
      }

      // Fastest realization
      const weekMatch = outcomes.expectedCase.timeToRealization.match(/(\d+)/);
      const weeks = weekMatch ? parseInt(weekMatch[1]) : Infinity;
      if (weeks < fastestWeeks) {
        fastestWeeks = weeks;
        fastestId = s.id;
      }
    });

    return {
      scenarios,
      comparison: {
        bestOverall: bestOverallId,
        lowestRisk: lowestRiskId,
        fastestRealization: fastestId,
        summary: `Compared ${scenarios.length} scenarios. Best overall momentum impact: "${scenarios.find((s) => s.id === bestOverallId)?.name}". Lowest risk: "${scenarios.find((s) => s.id === lowestRiskId)?.name}".`,
      },
    };
  }

  /**
   * Handle orchestrator intent
   */
  async handleSimulateDecisionScenariosIntent(
    founderId: string,
    workspaceId: string,
    params: {
      name: string;
      action: string;
      affectedAreas?: string[];
      timeframeWeeks?: number;
    }
  ): Promise<{
    success: boolean;
    scenario?: DecisionScenario;
    error?: string;
  }> {
    try {
      const scenario = await this.simulateDecision({
        founderId,
        workspaceId,
        name: params.name,
        assumptions: {
          action: params.action,
          affectedAreas: params.affectedAreas || ['general'],
          timeframeWeeks: params.timeframeWeeks || 8,
          resourceRequirements: 'To be determined',
          constraints: [],
        },
      });

      return { success: true, scenario };
    } catch (error) {
      console.error('[DecisionSimulator] Intent handler error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Map database record to typed object
   */
  private mapDbToScenario(record: Record<string, unknown>): DecisionScenario {
    return {
      id: record.id as string,
      founderId: record.founder_id as string,
      workspaceId: record.workspace_id as string,
      name: record.name as string,
      description: record.description as string | undefined,
      scenarioType: record.scenario_type as ScenarioType,
      inputAssumptionsJson: record.input_assumptions_json as ScenarioAssumptions,
      simulatedOutcomesJson: record.simulated_outcomes_json as SimulatedOutcome | undefined,
      status: record.status as ScenarioStatus,
      adoptedAt: record.adopted_at ? new Date(record.adopted_at as string) : undefined,
      adoptionNotes: record.adoption_notes as string | undefined,
      simulationModelVersion: record.simulation_model_version as string,
      createdAt: new Date(record.created_at as string),
      updatedAt: new Date(record.updated_at as string),
    };
  }
}

export const decisionSimulatorService = new DecisionSimulatorService();
