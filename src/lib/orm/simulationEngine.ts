/**
 * Simulation Engine
 * Phase 67: Simulate impact of adding new clients based on current system health
 */

import { WorkloadIndex } from './workloadEngine';

export interface SimulationScenario {
  id: string;
  name: string;
  new_clients: number;
  assumptions: {
    avg_monthly_revenue_per_client: number;
    avg_monthly_cost_per_client: number;
    avg_ai_tokens_per_client: number;
    avg_staff_hours_per_client: number;
    avg_queue_jobs_per_client: number;
  };
}

export interface SimulationResult {
  scenario_id: string;
  scenario_name: string;
  new_clients: number;
  current_state: SimulationState;
  projected_state: SimulationState;
  impact: SimulationImpact;
  feasibility: 'safe' | 'caution' | 'risky' | 'not_recommended';
  confidence: number;
  recommendations: string[];
  required_upgrades: string[];
}

export interface SimulationState {
  total_clients: number;
  monthly_revenue: number;
  monthly_cost: number;
  monthly_margin: number;
  staff_utilization: number;
  ai_capacity_percent: number;
  queue_depth: number;
  workload_index: number;
}

export interface SimulationImpact {
  revenue_change: number;
  revenue_change_percent: number;
  cost_change: number;
  cost_change_percent: number;
  margin_change: number;
  staff_utilization_change: number;
  ai_capacity_change: number;
  queue_depth_change: number;
  workload_index_change: number;
}

// Default scenarios
const DEFAULT_SCENARIOS: SimulationScenario[] = [
  {
    id: 'add-1',
    name: 'Add 1 Client',
    new_clients: 1,
    assumptions: {
      avg_monthly_revenue_per_client: 2500,
      avg_monthly_cost_per_client: 1500,
      avg_ai_tokens_per_client: 30000,
      avg_staff_hours_per_client: 20,
      avg_queue_jobs_per_client: 200,
    },
  },
  {
    id: 'add-5',
    name: 'Add 5 Clients',
    new_clients: 5,
    assumptions: {
      avg_monthly_revenue_per_client: 2500,
      avg_monthly_cost_per_client: 1500,
      avg_ai_tokens_per_client: 30000,
      avg_staff_hours_per_client: 20,
      avg_queue_jobs_per_client: 200,
    },
  },
  {
    id: 'add-10',
    name: 'Add 10 Clients',
    new_clients: 10,
    assumptions: {
      avg_monthly_revenue_per_client: 2500,
      avg_monthly_cost_per_client: 1500,
      avg_ai_tokens_per_client: 30000,
      avg_staff_hours_per_client: 20,
      avg_queue_jobs_per_client: 200,
    },
  },
];

export class SimulationEngine {
  /**
   * Run simulation for a scenario
   */
  runSimulation(
    scenario: SimulationScenario,
    currentClients: number,
    currentRevenue: number,
    currentCost: number,
    workloadIndex: WorkloadIndex,
    monthlyTokenBudget: number = 1000000,
    totalStaffHours: number = 160
  ): SimulationResult {
    // Current state
    const currentState: SimulationState = {
      total_clients: currentClients,
      monthly_revenue: currentRevenue,
      monthly_cost: currentCost,
      monthly_margin: currentRevenue - currentCost,
      staff_utilization: workloadIndex.staff_load.avg_utilization,
      ai_capacity_percent: workloadIndex.ai_load.capacity_percent,
      queue_depth: workloadIndex.queue_load.total_pending,
      workload_index: workloadIndex.combined_index,
    };

    // Calculate projected state
    const projectedRevenue = currentRevenue + (scenario.new_clients * scenario.assumptions.avg_monthly_revenue_per_client);
    const projectedCost = currentCost + (scenario.new_clients * scenario.assumptions.avg_monthly_cost_per_client);
    const projectedTokens = workloadIndex.ai_load.total_tokens + (scenario.new_clients * scenario.assumptions.avg_ai_tokens_per_client);
    const additionalStaffHours = scenario.new_clients * scenario.assumptions.avg_staff_hours_per_client;
    const projectedStaffUtil = Math.min(100, currentState.staff_utilization + (additionalStaffHours / totalStaffHours) * 100);
    const projectedAICapacity = (projectedTokens / monthlyTokenBudget) * 100;
    const projectedQueueDepth = currentState.queue_depth + (scenario.new_clients * scenario.assumptions.avg_queue_jobs_per_client / 30); // Daily average

    // Estimate new workload index
    const projectedWorkloadIndex = Math.min(100, Math.round(
      (projectedStaffUtil * 0.4) + (projectedAICapacity * 0.35) + ((projectedQueueDepth / 100) * 50 * 0.25)
    ));

    const projectedState: SimulationState = {
      total_clients: currentClients + scenario.new_clients,
      monthly_revenue: Math.round(projectedRevenue),
      monthly_cost: Math.round(projectedCost),
      monthly_margin: Math.round(projectedRevenue - projectedCost),
      staff_utilization: Math.round(projectedStaffUtil),
      ai_capacity_percent: Math.round(projectedAICapacity * 10) / 10,
      queue_depth: Math.round(projectedQueueDepth),
      workload_index: projectedWorkloadIndex,
    };

    // Calculate impact
    const impact: SimulationImpact = {
      revenue_change: projectedState.monthly_revenue - currentState.monthly_revenue,
      revenue_change_percent: currentState.monthly_revenue > 0
        ? ((projectedState.monthly_revenue - currentState.monthly_revenue) / currentState.monthly_revenue) * 100
        : 0,
      cost_change: projectedState.monthly_cost - currentState.monthly_cost,
      cost_change_percent: currentState.monthly_cost > 0
        ? ((projectedState.monthly_cost - currentState.monthly_cost) / currentState.monthly_cost) * 100
        : 0,
      margin_change: projectedState.monthly_margin - currentState.monthly_margin,
      staff_utilization_change: projectedState.staff_utilization - currentState.staff_utilization,
      ai_capacity_change: projectedState.ai_capacity_percent - currentState.ai_capacity_percent,
      queue_depth_change: projectedState.queue_depth - currentState.queue_depth,
      workload_index_change: projectedState.workload_index - currentState.workload_index,
    };

    // Round impact values
    impact.revenue_change_percent = Math.round(impact.revenue_change_percent * 10) / 10;
    impact.cost_change_percent = Math.round(impact.cost_change_percent * 10) / 10;

    // Determine feasibility
    let feasibility: 'safe' | 'caution' | 'risky' | 'not_recommended';
    if (projectedWorkloadIndex < 60 && projectedStaffUtil < 80 && projectedAICapacity < 70) {
      feasibility = 'safe';
    } else if (projectedWorkloadIndex < 75 && projectedStaffUtil < 90 && projectedAICapacity < 85) {
      feasibility = 'caution';
    } else if (projectedWorkloadIndex < 85) {
      feasibility = 'risky';
    } else {
      feasibility = 'not_recommended';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    const requiredUpgrades: string[] = [];

    if (projectedStaffUtil > 90) {
      recommendations.push('Hire additional staff before onboarding');
      requiredUpgrades.push('Expand team capacity');
    } else if (projectedStaffUtil > 80) {
      recommendations.push('Monitor staff workload closely after onboarding');
    }

    if (projectedAICapacity > 85) {
      recommendations.push('Increase AI token budget before onboarding');
      requiredUpgrades.push('Upgrade AI tier budget');
    } else if (projectedAICapacity > 70) {
      recommendations.push('Review AI usage optimization opportunities');
    }

    if (projectedQueueDepth > 100) {
      recommendations.push('Increase worker concurrency to handle job volume');
      requiredUpgrades.push('Scale queue workers');
    }

    if (feasibility === 'safe') {
      recommendations.push('System health supports this growth safely');
    } else if (feasibility === 'not_recommended') {
      recommendations.push('Address capacity constraints before onboarding');
    }

    // Calculate confidence
    const confidence = 80 - (scenario.new_clients * 2); // Lower confidence for larger projections

    return {
      scenario_id: scenario.id,
      scenario_name: scenario.name,
      new_clients: scenario.new_clients,
      current_state: currentState,
      projected_state: projectedState,
      impact,
      feasibility,
      confidence: Math.max(50, confidence),
      recommendations,
      required_upgrades: requiredUpgrades,
    };
  }

  /**
   * Run all default scenarios
   */
  runAllScenarios(
    currentClients: number,
    currentRevenue: number,
    currentCost: number,
    workloadIndex: WorkloadIndex
  ): SimulationResult[] {
    return DEFAULT_SCENARIOS.map(scenario =>
      this.runSimulation(scenario, currentClients, currentRevenue, currentCost, workloadIndex)
    );
  }

  /**
   * Get default scenarios
   */
  getDefaultScenarios(): SimulationScenario[] {
    return [...DEFAULT_SCENARIOS];
  }

  /**
   * Create custom scenario
   */
  createCustomScenario(
    newClients: number,
    assumptions?: Partial<SimulationScenario['assumptions']>
  ): SimulationScenario {
    const defaultAssumptions = DEFAULT_SCENARIOS[0].assumptions;
    return {
      id: `custom-${newClients}`,
      name: `Add ${newClients} Client${newClients !== 1 ? 's' : ''} (Custom)`,
      new_clients: newClients,
      assumptions: { ...defaultAssumptions, ...assumptions },
    };
  }

  /**
   * Find maximum safe client capacity
   */
  findMaxCapacity(
    currentClients: number,
    currentRevenue: number,
    currentCost: number,
    workloadIndex: WorkloadIndex,
    maxToTest: number = 20
  ): { max_clients: number; feasibility: string } {
    let maxSafe = 0;

    for (let i = 1; i <= maxToTest; i++) {
      const scenario = this.createCustomScenario(i);
      const result = this.runSimulation(scenario, currentClients, currentRevenue, currentCost, workloadIndex);

      if (result.feasibility === 'safe' || result.feasibility === 'caution') {
        maxSafe = i;
      } else {
        break;
      }
    }

    return {
      max_clients: maxSafe,
      feasibility: maxSafe >= maxToTest ? 'excellent' : maxSafe > 5 ? 'good' : maxSafe > 0 ? 'limited' : 'none',
    };
  }
}

export default SimulationEngine;
