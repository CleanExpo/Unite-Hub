# Phase 88 - Strategic Objective & Roadmap Intelligence Engine (SORIE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase88-strategic-objective-roadmap-intelligence`

## Executive Summary

Phase 88 introduces a high-level strategic intelligence layer that ingests business objectives, KPIs, forecasts, learning events, and operational signals to create, refine, and prioritise long-term roadmaps. SORIE ensures all autonomous systems operate in alignment with organisational, investor, franchise, and product goals.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Must Enforce claude.md Rules | Yes |
| Must Maintain Strict Vendor Secrecy | Yes |
| Must Not Expose Model Names | Yes |
| Must Not Make External API Calls | Yes |
| Must Enforce Multi-Tenant RLS | Yes |
| Strategic Changes Require HSOE | Yes |
| SORIE Cannot Override Safety Engines | Yes |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   UPEWE     │     │   ILCIE     │     │    AIRE    │
│  Forecasts  │     │  Learnings  │     │  Patterns  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │   SORIE     │
                    │   Engine    │
                    └──────┬──────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
│ Objectives  │     │  Roadmaps   │     │   MAOS     │
│   & KPIs    │     │  & Plans    │     │  Priority  │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Database Schema

### Migration 140: Strategic Objective & Roadmap Intelligence Engine

```sql
-- 140_strategic_objective_roadmap_intelligence_engine.sql

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS sorie_recommendations CASCADE;
DROP TABLE IF EXISTS sorie_roadmaps CASCADE;
DROP TABLE IF EXISTS sorie_objectives CASCADE;

-- SORIE objectives table
CREATE TABLE IF NOT EXISTS sorie_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority INTEGER NOT NULL DEFAULT 1,
  kpi_targets JSONB DEFAULT '{}'::jsonb,
  time_horizon TEXT NOT NULL DEFAULT '1y',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Time horizon check
  CONSTRAINT sorie_objectives_horizon_check CHECK (
    time_horizon IN ('1q', '2q', '1y', '2y', '5y')
  ),

  -- Priority range
  CONSTRAINT sorie_objectives_priority_check CHECK (
    priority >= 1 AND priority <= 10
  ),

  -- Foreign keys
  CONSTRAINT sorie_objectives_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- SORIE roadmaps table
CREATE TABLE IF NOT EXISTS sorie_roadmaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  objective_id UUID NOT NULL,
  roadmap_items JSONB DEFAULT '[]'::jsonb,
  confidence NUMERIC NOT NULL DEFAULT 0,
  impact_assessment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Confidence range
  CONSTRAINT sorie_roadmaps_confidence_check CHECK (
    confidence >= 0 AND confidence <= 100
  ),

  -- Foreign keys
  CONSTRAINT sorie_roadmaps_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT sorie_roadmaps_objective_fk
    FOREIGN KEY (objective_id) REFERENCES sorie_objectives(id) ON DELETE CASCADE
);

-- SORIE recommendations table
CREATE TABLE IF NOT EXISTS sorie_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  objective_id UUID,
  recommendation TEXT NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  expected_impact JSONB DEFAULT '{}'::jsonb,
  requires_hsoe BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Risk level check
  CONSTRAINT sorie_recommendations_risk_check CHECK (
    risk_level IN ('low', 'medium', 'high', 'critical')
  ),

  -- Status check
  CONSTRAINT sorie_recommendations_status_check CHECK (
    status IN ('pending', 'approved', 'rejected', 'implemented', 'deferred')
  ),

  -- Foreign keys
  CONSTRAINT sorie_recommendations_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT sorie_recommendations_objective_fk
    FOREIGN KEY (objective_id) REFERENCES sorie_objectives(id) ON DELETE SET NULL
);
```

## SORIE Engine Service

```typescript
// src/lib/strategy/sorie-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface Objective {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  priority: number;
  kpiTargets: Record<string, any>;
  timeHorizon: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Roadmap {
  id: string;
  tenantId: string;
  objectiveId: string;
  roadmapItems: RoadmapItem[];
  confidence: number;
  impactAssessment?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RoadmapItem {
  phase: number;
  title: string;
  milestones: string[];
  dependencies: string[];
  estimatedImpact: number;
  riskFactors: string[];
}

interface StrategicRecommendation {
  id: string;
  tenantId: string;
  objectiveId?: string;
  recommendation: string;
  riskLevel: string;
  expectedImpact: Record<string, any>;
  requiresHsoe: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SimulationResult {
  scenarioName: string;
  probability: number;
  outcomes: Record<string, any>;
  risks: string[];
  opportunities: string[];
}

export class SORIEEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async setObjectives(objectives: Omit<Objective, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>[]): Promise<Objective[]> {
    const supabase = await getSupabaseServer();
    const created: Objective[] = [];

    for (const obj of objectives) {
      const { data } = await supabase
        .from('sorie_objectives')
        .insert({
          tenant_id: this.orgId,
          title: obj.title,
          description: obj.description,
          priority: obj.priority,
          kpi_targets: obj.kpiTargets,
          time_horizon: obj.timeHorizon,
        })
        .select()
        .single();

      if (data) {
        created.push(this.mapToObjective(data));
      }
    }

    return created;
  }

  async generateRoadmap(objectiveId: string): Promise<Roadmap> {
    const supabase = await getSupabaseServer();

    // Get objective
    const { data: objective } = await supabase
      .from('sorie_objectives')
      .select('*')
      .eq('id', objectiveId)
      .single();

    if (!objective) {
      throw new Error('Objective not found');
    }

    // Generate roadmap items based on objective
    const items = this.createRoadmapItems(objective);
    const confidence = this.calculateConfidence(items, objective);
    const impact = this.assessStrategicImpact(items, objective);

    // Store roadmap
    const { data: roadmap } = await supabase
      .from('sorie_roadmaps')
      .insert({
        tenant_id: this.orgId,
        objective_id: objectiveId,
        roadmap_items: items,
        confidence,
        impact_assessment: impact,
      })
      .select()
      .single();

    // Generate recommendations
    await this.recommendAdjustments(roadmap.id, items, objective);

    return this.mapToRoadmap(roadmap);
  }

  private createRoadmapItems(objective: any): RoadmapItem[] {
    const items: RoadmapItem[] = [];
    const kpis = objective.kpi_targets;
    const horizon = objective.time_horizon;

    // Phase 1: Foundation
    items.push({
      phase: 1,
      title: 'Foundation & Assessment',
      milestones: [
        'Current state analysis',
        'Gap identification',
        'Resource planning',
      ],
      dependencies: [],
      estimatedImpact: 10,
      riskFactors: ['Resource availability', 'Data quality'],
    });

    // Phase 2: Implementation
    items.push({
      phase: 2,
      title: 'Core Implementation',
      milestones: this.generateMilestones(kpis),
      dependencies: ['Phase 1'],
      estimatedImpact: 40,
      riskFactors: ['Technical complexity', 'Change resistance'],
    });

    // Phase 3: Optimization
    items.push({
      phase: 3,
      title: 'Optimization & Scale',
      milestones: [
        'Performance tuning',
        'Process automation',
        'Scale preparation',
      ],
      dependencies: ['Phase 2'],
      estimatedImpact: 30,
      riskFactors: ['Market conditions', 'Competition'],
    });

    // Phase 4: Growth
    if (horizon === '2y' || horizon === '5y') {
      items.push({
        phase: 4,
        title: 'Growth & Expansion',
        milestones: [
          'Market expansion',
          'Product diversification',
          'Strategic partnerships',
        ],
        dependencies: ['Phase 3'],
        estimatedImpact: 20,
        riskFactors: ['Economic factors', 'Regulatory changes'],
      });
    }

    return items;
  }

  private generateMilestones(kpis: Record<string, any>): string[] {
    const milestones: string[] = [];

    if (kpis.revenue) {
      milestones.push(`Achieve ${kpis.revenue}% revenue growth`);
    }
    if (kpis.efficiency) {
      milestones.push(`Improve efficiency by ${kpis.efficiency}%`);
    }
    if (kpis.customers) {
      milestones.push(`Acquire ${kpis.customers} new customers`);
    }
    if (kpis.retention) {
      milestones.push(`Reach ${kpis.retention}% retention rate`);
    }

    if (milestones.length === 0) {
      milestones.push('Define and track core KPIs');
    }

    return milestones;
  }

  async evaluateStrategicRisk(objectiveId: string): Promise<{
    overallRisk: string;
    riskFactors: { factor: string; severity: string; mitigation: string }[];
  }> {
    const supabase = await getSupabaseServer();

    // Get roadmaps for objective
    const { data: roadmaps } = await supabase
      .from('sorie_roadmaps')
      .select('*')
      .eq('objective_id', objectiveId);

    const riskFactors: { factor: string; severity: string; mitigation: string }[] = [];

    // Analyze risk factors from all roadmap items
    for (const roadmap of roadmaps || []) {
      for (const item of roadmap.roadmap_items) {
        for (const risk of item.riskFactors || []) {
          riskFactors.push({
            factor: risk,
            severity: this.assessRiskSeverity(risk),
            mitigation: this.suggestMitigation(risk),
          });
        }
      }
    }

    // Calculate overall risk
    const highRisks = riskFactors.filter(r => r.severity === 'high').length;
    const criticalRisks = riskFactors.filter(r => r.severity === 'critical').length;

    let overallRisk = 'low';
    if (criticalRisks > 0) overallRisk = 'critical';
    else if (highRisks > 2) overallRisk = 'high';
    else if (highRisks > 0) overallRisk = 'medium';

    return { overallRisk, riskFactors };
  }

  private assessRiskSeverity(risk: string): string {
    const criticalRisks = ['regulatory changes', 'economic factors'];
    const highRisks = ['market conditions', 'competition', 'technical complexity'];

    if (criticalRisks.some(r => risk.toLowerCase().includes(r))) return 'critical';
    if (highRisks.some(r => risk.toLowerCase().includes(r))) return 'high';
    return 'medium';
  }

  private suggestMitigation(risk: string): string {
    const mitigations: Record<string, string> = {
      'resource availability': 'Build resource buffer and cross-training programs',
      'data quality': 'Implement data validation and cleansing processes',
      'technical complexity': 'Phase implementation and increase testing coverage',
      'change resistance': 'Develop change management and communication plan',
      'market conditions': 'Diversify revenue streams and build reserves',
      'competition': 'Accelerate differentiation and innovation',
      'economic factors': 'Maintain financial flexibility and scenario planning',
      'regulatory changes': 'Engage compliance team and monitor policy changes',
    };

    const key = Object.keys(mitigations).find(k =>
      risk.toLowerCase().includes(k)
    );

    return key ? mitigations[key] : 'Monitor and develop contingency plans';
  }

  async simulateOutcomes(objectiveId: string): Promise<SimulationResult[]> {
    const objective = await this.getObjective(objectiveId);
    if (!objective) return [];

    const simulations: SimulationResult[] = [];

    // Best case scenario
    simulations.push({
      scenarioName: 'Optimistic',
      probability: 25,
      outcomes: {
        kpiAchievement: 120,
        timelineAdherence: 90,
        budgetUtilization: 85,
      },
      risks: ['Over-extension', 'Sustainability challenges'],
      opportunities: ['Market leadership', 'Premium positioning'],
    });

    // Base case scenario
    simulations.push({
      scenarioName: 'Expected',
      probability: 50,
      outcomes: {
        kpiAchievement: 100,
        timelineAdherence: 80,
        budgetUtilization: 100,
      },
      risks: ['Minor delays', 'Resource constraints'],
      opportunities: ['Steady growth', 'Process maturity'],
    });

    // Conservative scenario
    simulations.push({
      scenarioName: 'Conservative',
      probability: 20,
      outcomes: {
        kpiAchievement: 80,
        timelineAdherence: 70,
        budgetUtilization: 110,
      },
      risks: ['Scope reduction', 'Delayed ROI'],
      opportunities: ['Learning opportunity', 'Foundation building'],
    });

    // Pessimistic scenario
    simulations.push({
      scenarioName: 'Pessimistic',
      probability: 5,
      outcomes: {
        kpiAchievement: 50,
        timelineAdherence: 50,
        budgetUtilization: 130,
      },
      risks: ['Strategic pivot required', 'Stakeholder confidence'],
      opportunities: ['Early course correction', 'Resource reallocation'],
    });

    return simulations;
  }

  async recommendAdjustments(
    roadmapId: string,
    items: RoadmapItem[],
    objective: any
  ): Promise<StrategicRecommendation[]> {
    const recommendations: StrategicRecommendation[] = [];

    // Check for timeline compression opportunities
    const totalImpact = items.reduce((sum, item) => sum + item.estimatedImpact, 0);
    if (totalImpact < 90) {
      const rec = await this.createRecommendation({
        objectiveId: objective.id,
        recommendation: 'Consider adding high-impact initiatives to maximize objective achievement',
        riskLevel: 'low',
        expectedImpact: { additionalValue: '10-20%' },
        requiresHsoe: false,
      });
      recommendations.push(rec);
    }

    // Check for risk concentration
    const phase2Risks = items.find(i => i.phase === 2)?.riskFactors || [];
    if (phase2Risks.length > 3) {
      const rec = await this.createRecommendation({
        objectiveId: objective.id,
        recommendation: 'High risk concentration in implementation phase. Consider phased risk mitigation.',
        riskLevel: 'high',
        expectedImpact: { riskReduction: '30-40%' },
        requiresHsoe: true,
      });
      recommendations.push(rec);
    }

    // Check time horizon alignment
    if (objective.priority <= 3 && objective.time_horizon === '5y') {
      const rec = await this.createRecommendation({
        objectiveId: objective.id,
        recommendation: 'High-priority objective with long horizon. Consider accelerating timeline.',
        riskLevel: 'medium',
        expectedImpact: { timeToValue: 'Reduced by 6-12 months' },
        requiresHsoe: true,
      });
      recommendations.push(rec);
    }

    return recommendations;
  }

  private async createRecommendation(data: {
    objectiveId?: string;
    recommendation: string;
    riskLevel: string;
    expectedImpact: Record<string, any>;
    requiresHsoe: boolean;
  }): Promise<StrategicRecommendation> {
    const supabase = await getSupabaseServer();

    const { data: rec } = await supabase
      .from('sorie_recommendations')
      .insert({
        tenant_id: this.orgId,
        objective_id: data.objectiveId,
        recommendation: data.recommendation,
        risk_level: data.riskLevel,
        expected_impact: data.expectedImpact,
        requires_hsoe: data.requiresHsoe,
        status: 'pending',
      })
      .select()
      .single();

    return this.mapToRecommendation(rec);
  }

  private calculateConfidence(items: RoadmapItem[], objective: any): number {
    let confidence = 70; // Base confidence

    // Adjust for objective priority
    if (objective.priority <= 3) confidence += 10;

    // Adjust for time horizon
    if (objective.time_horizon === '1q') confidence += 10;
    else if (objective.time_horizon === '5y') confidence -= 10;

    // Adjust for risk factors
    const totalRisks = items.reduce((sum, item) => sum + (item.riskFactors?.length || 0), 0);
    confidence -= totalRisks * 2;

    return Math.max(30, Math.min(95, confidence));
  }

  private assessStrategicImpact(items: RoadmapItem[], objective: any): string {
    const totalImpact = items.reduce((sum, item) => sum + item.estimatedImpact, 0);

    if (totalImpact >= 100) {
      return 'High strategic impact - comprehensive coverage of objective';
    } else if (totalImpact >= 70) {
      return 'Moderate strategic impact - core objectives addressed';
    } else {
      return 'Limited strategic impact - consider expanding scope';
    }
  }

  async getObjectives(): Promise<Objective[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('sorie_objectives')
      .select('*')
      .eq('tenant_id', this.orgId)
      .order('priority');

    return (data || []).map(o => this.mapToObjective(o));
  }

  async getObjective(objectiveId: string): Promise<Objective | null> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('sorie_objectives')
      .select('*')
      .eq('id', objectiveId)
      .single();

    return data ? this.mapToObjective(data) : null;
  }

  async getRoadmaps(objectiveId?: string): Promise<Roadmap[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('sorie_roadmaps')
      .select('*')
      .eq('tenant_id', this.orgId)
      .order('created_at', { ascending: false });

    if (objectiveId) {
      query = query.eq('objective_id', objectiveId);
    }

    const { data } = await query;

    return (data || []).map(r => this.mapToRoadmap(r));
  }

  async getRecommendations(status?: string): Promise<StrategicRecommendation[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('sorie_recommendations')
      .select('*')
      .eq('tenant_id', this.orgId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data } = await query;

    return (data || []).map(r => this.mapToRecommendation(r));
  }

  private mapToObjective(data: any): Objective {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      title: data.title,
      description: data.description,
      priority: data.priority,
      kpiTargets: data.kpi_targets,
      timeHorizon: data.time_horizon,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapToRoadmap(data: any): Roadmap {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      objectiveId: data.objective_id,
      roadmapItems: data.roadmap_items,
      confidence: data.confidence,
      impactAssessment: data.impact_assessment,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapToRecommendation(data: any): StrategicRecommendation {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      objectiveId: data.objective_id,
      recommendation: data.recommendation,
      riskLevel: data.risk_level,
      expectedImpact: data.expected_impact,
      requiresHsoe: data.requires_hsoe,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
```

## Example Objective

```json
{
  "title": "Expand to APAC Markets",
  "description": "Establish presence in 3 key APAC markets within 2 years",
  "priority": 2,
  "kpiTargets": {
    "revenue": 25,
    "customers": 500,
    "retention": 85
  },
  "timeHorizon": "2y"
}
```

## Example Roadmap Structure

```json
{
  "roadmapItems": [
    {
      "phase": 1,
      "title": "Market Research & Planning",
      "milestones": [
        "Complete market analysis for Japan, Singapore, Australia",
        "Identify local partners",
        "Regulatory compliance assessment"
      ],
      "dependencies": [],
      "estimatedImpact": 15,
      "riskFactors": ["Data availability", "Cultural understanding"]
    },
    {
      "phase": 2,
      "title": "Market Entry",
      "milestones": [
        "Establish legal entities",
        "Launch in Singapore",
        "Achieve 25% revenue growth"
      ],
      "dependencies": ["Phase 1"],
      "estimatedImpact": 45,
      "riskFactors": ["Regulatory changes", "Competition"]
    }
  ],
  "confidence": 72,
  "impactAssessment": "High strategic impact - comprehensive coverage of objective"
}
```

## API Endpoints

### POST /api/strategy/objectives

Create strategic objectives.

### GET /api/strategy/objectives

Get all objectives.

### POST /api/strategy/roadmap/:objectiveId

Generate roadmap for objective.

### GET /api/strategy/roadmaps

Get all roadmaps.

### GET /api/strategy/risk/:objectiveId

Evaluate strategic risk.

### POST /api/strategy/simulate/:objectiveId

Run outcome simulations.

### GET /api/strategy/recommendations

Get strategic recommendations.

## CLI Commands

```bash
# List objectives
unite sorie:objectives --priority=1-3

# Generate roadmap
unite sorie:roadmap <objective_id>

# Run simulations
unite sorie:simulate <objective_id>

# View recommendations
unite sorie:recommendations --status=pending
```

## Implementation Tasks

- [ ] Create 140_strategic_objective_roadmap_intelligence_engine.sql
- [ ] Implement SORIEEngine
- [ ] Create API endpoints
- [ ] Create ObjectivesManager.tsx
- [ ] Create RoadmapBuilder.tsx
- [ ] Create SimulationViewer.tsx
- [ ] Create StrategicRecommendations.tsx
- [ ] Integrate with UPEWE
- [ ] Integrate with ILCIE
- [ ] Integrate with AIRE
- [ ] Integrate with MAOS
- [ ] Add CLI commands
- [ ] Write Jest test suite

---

*Phase 88 - Strategic Objective & Roadmap Intelligence Engine Complete*
