# Phase 74 - Industry Simulator (ISIM)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase74-industry-simulator`

## Executive Summary

Phase 74 provides scenario modeling for regional weather events, compliance changes, market shifts, supply chain disruptions, and franchise expansion scenarios. Helps brands stress-test strategies.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Weather Modeling | Yes |
| Compliance Scenarios | Yes |
| Market Shift Analysis | Yes |
| Supply Chain Events | Yes |
| Expansion Modeling | Yes |

## Database Schema

### Migration 126: Industry Simulator

```sql
-- 126_industry_simulator.sql

-- Simulation scenarios table
CREATE TABLE IF NOT EXISTS simulation_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  scenario_type TEXT NOT NULL,
  name TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Scenario type check
  CONSTRAINT simulation_scenarios_type_check CHECK (
    scenario_type IN (
      'weather', 'compliance', 'market_shift',
      'supply_chain', 'expansion', 'economic', 'other'
    )
  ),

  -- Status check
  CONSTRAINT simulation_scenarios_status_check CHECK (
    status IN ('draft', 'running', 'completed', 'failed')
  ),

  -- Foreign key
  CONSTRAINT simulation_scenarios_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_org ON simulation_scenarios(org_id);
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_type ON simulation_scenarios(scenario_type);
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_status ON simulation_scenarios(status);
CREATE INDEX IF NOT EXISTS idx_simulation_scenarios_created ON simulation_scenarios(created_at DESC);

-- Enable RLS
ALTER TABLE simulation_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY simulation_scenarios_select ON simulation_scenarios
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY simulation_scenarios_insert ON simulation_scenarios
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY simulation_scenarios_update ON simulation_scenarios
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE simulation_scenarios IS 'Simulation scenarios (Phase 74)';

-- Simulation results table
CREATE TABLE IF NOT EXISTS simulation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scenario_id UUID NOT NULL,
  projected_impact JSONB DEFAULT '{}'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Confidence check
  CONSTRAINT simulation_results_confidence_check CHECK (
    confidence_score >= 0 AND confidence_score <= 100
  ),

  -- Foreign key
  CONSTRAINT simulation_results_scenario_fk
    FOREIGN KEY (scenario_id) REFERENCES simulation_scenarios(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_simulation_results_scenario ON simulation_results(scenario_id);
CREATE INDEX IF NOT EXISTS idx_simulation_results_confidence ON simulation_results(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_simulation_results_generated ON simulation_results(generated_at DESC);

-- Enable RLS
ALTER TABLE simulation_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY simulation_results_select ON simulation_results
  FOR SELECT TO authenticated
  USING (scenario_id IN (
    SELECT id FROM simulation_scenarios
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY simulation_results_insert ON simulation_results
  FOR INSERT TO authenticated
  WITH CHECK (scenario_id IN (
    SELECT id FROM simulation_scenarios
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE simulation_results IS 'Simulation results and projections (Phase 74)';
```

## Industry Simulator Service

```typescript
// src/lib/simulator/industry-simulator.ts

import { getSupabaseServer } from '@/lib/supabase';

interface SimulationScenario {
  id: string;
  orgId: string;
  scenarioType: string;
  name: string;
  parameters: Record<string, any>;
  status: string;
  createdAt: Date;
}

interface SimulationResult {
  id: string;
  scenarioId: string;
  projectedImpact: Record<string, any>;
  recommendations: string[];
  confidenceScore: number;
  generatedAt: Date;
}

interface ImpactProjection {
  revenue: { change: number; confidence: number };
  operations: { change: number; confidence: number };
  costs: { change: number; confidence: number };
  timeline: string;
}

const SCENARIO_TYPES = [
  'weather',
  'compliance',
  'market_shift',
  'supply_chain',
  'expansion',
  'economic',
  'other',
];

export class IndustrySimulator {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async createScenario(
    scenarioType: string,
    name: string,
    parameters: Record<string, any>
  ): Promise<SimulationScenario> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('simulation_scenarios')
      .insert({
        org_id: this.orgId,
        scenario_type: scenarioType,
        name,
        parameters,
        status: 'draft',
      })
      .select()
      .single();

    return this.mapToScenario(data);
  }

  async runSimulation(scenarioId: string): Promise<SimulationResult> {
    const supabase = await getSupabaseServer();

    // Update status to running
    await supabase
      .from('simulation_scenarios')
      .update({ status: 'running' })
      .eq('id', scenarioId);

    // Get scenario details
    const scenario = await this.getScenario(scenarioId);

    // Run simulation based on type
    const impact = await this.calculateImpact(scenario);
    const recommendations = await this.generateRecommendations(scenario, impact);
    const confidence = this.calculateConfidence(scenario.parameters);

    // Store results
    const { data } = await supabase
      .from('simulation_results')
      .insert({
        scenario_id: scenarioId,
        projected_impact: impact,
        recommendations,
        confidence_score: confidence,
      })
      .select()
      .single();

    // Update status to completed
    await supabase
      .from('simulation_scenarios')
      .update({ status: 'completed' })
      .eq('id', scenarioId);

    return {
      id: data.id,
      scenarioId: data.scenario_id,
      projectedImpact: data.projected_impact,
      recommendations: data.recommendations,
      confidenceScore: data.confidence_score,
      generatedAt: new Date(data.generated_at),
    };
  }

  private async calculateImpact(scenario: SimulationScenario): Promise<ImpactProjection> {
    const { scenarioType, parameters } = scenario;

    // Base impact calculation
    let revenueChange = 0;
    let operationsChange = 0;
    let costsChange = 0;
    let timeline = '3-6 months';

    switch (scenarioType) {
      case 'weather':
        // Weather events impact
        const severity = parameters.severity || 'moderate';
        revenueChange = severity === 'severe' ? -25 : severity === 'moderate' ? -10 : -5;
        operationsChange = severity === 'severe' ? -40 : -15;
        costsChange = severity === 'severe' ? 30 : 10;
        timeline = severity === 'severe' ? '6-12 months' : '1-3 months';
        break;

      case 'compliance':
        // New compliance requirements
        revenueChange = -5;
        operationsChange = -20;
        costsChange = 15;
        timeline = '3-6 months';
        break;

      case 'market_shift':
        // Market changes
        const direction = parameters.direction || 'neutral';
        revenueChange = direction === 'positive' ? 15 : direction === 'negative' ? -20 : 0;
        operationsChange = direction === 'positive' ? 10 : -10;
        costsChange = direction === 'positive' ? 5 : -5;
        timeline = '6-12 months';
        break;

      case 'supply_chain':
        // Supply chain disruption
        revenueChange = -15;
        operationsChange = -30;
        costsChange = 25;
        timeline = '3-9 months';
        break;

      case 'expansion':
        // Franchise/territory expansion
        revenueChange = 25;
        operationsChange = -15;
        costsChange = 40;
        timeline = '12-18 months';
        break;

      case 'economic':
        // Economic conditions
        const outlook = parameters.outlook || 'stable';
        revenueChange = outlook === 'growth' ? 10 : outlook === 'recession' ? -20 : 0;
        operationsChange = outlook === 'recession' ? -15 : 0;
        costsChange = outlook === 'recession' ? -10 : 5;
        timeline = '12-24 months';
        break;
    }

    return {
      revenue: { change: revenueChange, confidence: 70 + Math.random() * 20 },
      operations: { change: operationsChange, confidence: 65 + Math.random() * 25 },
      costs: { change: costsChange, confidence: 75 + Math.random() * 15 },
      timeline,
    };
  }

  private async generateRecommendations(
    scenario: SimulationScenario,
    impact: ImpactProjection
  ): Promise<string[]> {
    const recommendations: string[] = [];

    // Revenue recommendations
    if (impact.revenue.change < -10) {
      recommendations.push('Diversify revenue streams to reduce single-source dependency');
      recommendations.push('Implement dynamic pricing to maintain margins');
    } else if (impact.revenue.change > 10) {
      recommendations.push('Scale operations to capture increased demand');
      recommendations.push('Invest in customer retention to maximize lifetime value');
    }

    // Operations recommendations
    if (impact.operations.change < -15) {
      recommendations.push('Build redundancy in critical processes');
      recommendations.push('Cross-train staff for operational flexibility');
    }

    // Cost recommendations
    if (impact.costs.change > 20) {
      recommendations.push('Review vendor contracts for cost optimization');
      recommendations.push('Implement efficiency improvements to offset cost increases');
    }

    // Scenario-specific recommendations
    switch (scenario.scenarioType) {
      case 'weather':
        recommendations.push('Develop weather contingency plans for affected regions');
        break;
      case 'compliance':
        recommendations.push('Allocate compliance training budget');
        recommendations.push('Engage compliance consultant for smooth transition');
        break;
      case 'supply_chain':
        recommendations.push('Identify alternative suppliers for critical materials');
        break;
      case 'expansion':
        recommendations.push('Develop detailed expansion timeline with milestones');
        break;
    }

    return recommendations;
  }

  private calculateConfidence(parameters: Record<string, any>): number {
    // Base confidence
    let confidence = 70;

    // Adjust based on data quality
    if (parameters.historicalData) confidence += 10;
    if (parameters.marketData) confidence += 5;
    if (parameters.expertInput) confidence += 5;

    // Cap at 95
    return Math.min(confidence, 95);
  }

  async getScenarios(scenarioType?: string): Promise<SimulationScenario[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('simulation_scenarios')
      .select('*')
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false });

    if (scenarioType) {
      query = query.eq('scenario_type', scenarioType);
    }

    const { data } = await query;

    return (data || []).map(s => this.mapToScenario(s));
  }

  async getScenario(scenarioId: string): Promise<SimulationScenario> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('simulation_scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();

    return this.mapToScenario(data);
  }

  async getResults(scenarioId: string): Promise<SimulationResult[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('simulation_results')
      .select('*')
      .eq('scenario_id', scenarioId)
      .order('generated_at', { ascending: false });

    return (data || []).map(r => ({
      id: r.id,
      scenarioId: r.scenario_id,
      projectedImpact: r.projected_impact,
      recommendations: r.recommendations,
      confidenceScore: r.confidence_score,
      generatedAt: new Date(r.generated_at),
    }));
  }

  async compareScenarios(scenarioIds: string[]): Promise<{
    scenarios: SimulationScenario[];
    comparison: Record<string, any>;
  }> {
    const scenarios = await Promise.all(scenarioIds.map(id => this.getScenario(id)));
    const results = await Promise.all(scenarioIds.map(id => this.getResults(id)));

    // Build comparison
    const comparison: Record<string, any> = {
      bestCase: { scenarioId: '', revenueChange: -Infinity },
      worstCase: { scenarioId: '', revenueChange: Infinity },
      avgConfidence: 0,
    };

    results.forEach((resultSet, idx) => {
      if (resultSet.length > 0) {
        const latest = resultSet[0];
        const revenueChange = latest.projectedImpact.revenue?.change || 0;

        if (revenueChange > comparison.bestCase.revenueChange) {
          comparison.bestCase = { scenarioId: scenarioIds[idx], revenueChange };
        }
        if (revenueChange < comparison.worstCase.revenueChange) {
          comparison.worstCase = { scenarioId: scenarioIds[idx], revenueChange };
        }

        comparison.avgConfidence += latest.confidenceScore;
      }
    });

    comparison.avgConfidence = results.length > 0
      ? comparison.avgConfidence / results.length
      : 0;

    return { scenarios, comparison };
  }

  async getScenarioTypes(): Promise<string[]> {
    return SCENARIO_TYPES;
  }

  private mapToScenario(data: any): SimulationScenario {
    return {
      id: data.id,
      orgId: data.org_id,
      scenarioType: data.scenario_type,
      name: data.name,
      parameters: data.parameters,
      status: data.status,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## API Endpoints

### POST /api/simulator/scenarios

Create simulation scenario.

### POST /api/simulator/run/:scenarioId

Run simulation.

### GET /api/simulator/scenarios

Get all scenarios.

### GET /api/simulator/results/:scenarioId

Get simulation results.

### POST /api/simulator/compare

Compare multiple scenarios.

### GET /api/simulator/types

Get available scenario types.

## Implementation Tasks

- [ ] Create 126_industry_simulator.sql
- [ ] Implement IndustrySimulator
- [ ] Create API endpoints
- [ ] Create ScenarioBuilder.tsx
- [ ] Create SimulationViewer.tsx
- [ ] Integrate with Weather (Phase 20)
- [ ] Integrate with Compliance (Phase 71)

---

*Phase 74 - Industry Simulator Complete*
