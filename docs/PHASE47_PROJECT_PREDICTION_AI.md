# Phase 47 - Project Prediction AI (PPA)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase47-project-prediction-ai`

## Executive Summary

Phase 47 implements a prediction engine that learns from past work to forecast project timelines, risk factors, staffing needs, and budget overruns. It integrates into the Concierge and Project Management modules.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Timeline Prediction | Yes |
| Risk Detection | Yes |
| Staffing Recommendations | Yes |
| Budget Forecasting | Yes |
| Concierge Integration | Yes |

## Database Schema

### Migration 099: Project Predictions

```sql
-- 099_project_predictions.sql

-- Project predictions table
CREATE TABLE IF NOT EXISTS project_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  org_id UUID NOT NULL,
  predicted_completion TIMESTAMPTZ,
  risk_level TEXT NOT NULL DEFAULT 'LOW',
  risk_factors JSONB DEFAULT '[]'::jsonb,
  staffing_recommendations JSONB DEFAULT '{}'::jsonb,
  budget_forecast JSONB DEFAULT '{}'::jsonb,
  confidence_score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Risk level check
  CONSTRAINT project_predictions_risk_check CHECK (
    risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  ),

  -- Foreign keys
  CONSTRAINT project_predictions_project_fk
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  CONSTRAINT project_predictions_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_predictions_project ON project_predictions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_predictions_org ON project_predictions(org_id);
CREATE INDEX IF NOT EXISTS idx_project_predictions_risk ON project_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_project_predictions_created ON project_predictions(created_at DESC);

-- Enable RLS
ALTER TABLE project_predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY project_predictions_select ON project_predictions
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY project_predictions_insert ON project_predictions
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE project_predictions IS 'AI predictions for project timelines and risks (Phase 47)';
```

## Project Prediction Service

```typescript
// src/lib/projects/project-prediction-service.ts

import { getSupabaseServer } from '@/lib/supabase';

interface ProjectPrediction {
  predictedCompletion: Date | null;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: RiskFactor[];
  staffingRecommendations: StaffingRec;
  budgetForecast: BudgetForecast;
  confidenceScore: number;
}

interface RiskFactor {
  type: string;
  description: string;
  severity: number;
}

interface StaffingRec {
  currentUtilization: number;
  recommended: number;
  roles?: string[];
}

interface BudgetForecast {
  currentSpend: number;
  projectedSpend: number;
  overrunRisk: boolean;
  overrunPercent?: number;
}

export class ProjectPredictionService {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async predictTimeline(projectId: string): Promise<ProjectPrediction> {
    const supabase = await getSupabaseServer();

    // Get project data
    const { data: project } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('org_id', this.orgId)
      .single();

    if (!project) {
      throw new Error('Project not found');
    }

    // Get task completion data
    const { data: tasks } = await supabase
      .from('tasks')
      .select('status, estimated_hours, actual_hours, due_date')
      .eq('project_id', projectId);

    // Calculate velocity
    const completedTasks = (tasks || []).filter(t => t.status === 'completed');
    const pendingTasks = (tasks || []).filter(t => t.status !== 'completed');

    const avgCompletionRate = this.calculateVelocity(completedTasks);
    const remainingHours = pendingTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);

    // Predict completion
    const daysToComplete = avgCompletionRate > 0 ? remainingHours / (avgCompletionRate * 8) : 30;
    const predictedCompletion = new Date(Date.now() + daysToComplete * 24 * 60 * 60 * 1000);

    // Identify risks
    const riskFactors = await this.identifyRisks(projectId, tasks || []);
    const riskLevel = this.calculateRiskLevel(riskFactors);

    // Staffing recommendations
    const staffingRecommendations = this.recommendStaffing(tasks || [], daysToComplete);

    // Budget forecast
    const budgetForecast = await this.predictBudgetOverrun(projectId);

    // Calculate confidence
    const confidenceScore = this.calculateConfidence(completedTasks.length, riskFactors.length);

    const prediction: ProjectPrediction = {
      predictedCompletion,
      riskLevel,
      riskFactors,
      staffingRecommendations,
      budgetForecast,
      confidenceScore,
    };

    // Persist prediction
    await supabase.from('project_predictions').insert({
      project_id: projectId,
      org_id: this.orgId,
      predicted_completion: predictedCompletion.toISOString(),
      risk_level: riskLevel,
      risk_factors: riskFactors,
      staffing_recommendations: staffingRecommendations,
      budget_forecast: budgetForecast,
      confidence_score: confidenceScore,
    });

    return prediction;
  }

  private calculateVelocity(completedTasks: any[]): number {
    if (completedTasks.length === 0) return 1;

    const totalActual = completedTasks.reduce((sum, t) => sum + (t.actual_hours || t.estimated_hours || 0), 0);
    const totalEstimated = completedTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);

    return totalEstimated > 0 ? totalActual / totalEstimated : 1;
  }

  async identifyRisks(projectId: string, tasks: any[]): Promise<RiskFactor[]> {
    const risks: RiskFactor[] = [];

    // Check for overdue tasks
    const overdueTasks = tasks.filter(t =>
      t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completed'
    );

    if (overdueTasks.length > 0) {
      risks.push({
        type: 'overdue_tasks',
        description: `${overdueTasks.length} tasks are overdue`,
        severity: Math.min(overdueTasks.length * 0.2, 1),
      });
    }

    // Check for underestimation
    const underestimated = tasks.filter(t =>
      t.actual_hours && t.estimated_hours && t.actual_hours > t.estimated_hours * 1.5
    );

    if (underestimated.length > tasks.length * 0.3) {
      risks.push({
        type: 'estimation_issues',
        description: 'Many tasks taking longer than estimated',
        severity: 0.6,
      });
    }

    // Check for blocked tasks
    const blocked = tasks.filter(t => t.status === 'blocked');
    if (blocked.length > 0) {
      risks.push({
        type: 'blocked_tasks',
        description: `${blocked.length} tasks are blocked`,
        severity: Math.min(blocked.length * 0.3, 1),
      });
    }

    return risks;
  }

  private calculateRiskLevel(risks: RiskFactor[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const totalSeverity = risks.reduce((sum, r) => sum + r.severity, 0);

    if (totalSeverity >= 1.5) return 'CRITICAL';
    if (totalSeverity >= 1.0) return 'HIGH';
    if (totalSeverity >= 0.5) return 'MEDIUM';
    return 'LOW';
  }

  private recommendStaffing(tasks: any[], daysToComplete: number): StaffingRec {
    const pendingHours = tasks
      .filter(t => t.status !== 'completed')
      .reduce((sum, t) => sum + (t.estimated_hours || 0), 0);

    const requiredDaily = pendingHours / daysToComplete;
    const currentUtilization = requiredDaily / 8;

    return {
      currentUtilization: Math.round(currentUtilization * 100),
      recommended: currentUtilization > 1.2 ? Math.ceil(currentUtilization) : 1,
      roles: currentUtilization > 1.5 ? ['Additional developer needed'] : undefined,
    };
  }

  async predictBudgetOverrun(projectId: string): Promise<BudgetForecast> {
    const supabase = await getSupabaseServer();

    // Get project budget and time entries
    const { data: project } = await supabase
      .from('projects')
      .select('budget')
      .eq('id', projectId)
      .single();

    const { data: timeEntries } = await supabase
      .from('time_entries')
      .select('hours, hourly_rate')
      .eq('project_id', projectId);

    const currentSpend = (timeEntries || []).reduce(
      (sum, e) => sum + (e.hours * (e.hourly_rate || 0)),
      0
    );

    const budget = project?.budget || 0;
    const projectedSpend = currentSpend * 1.2; // Simple projection

    return {
      currentSpend,
      projectedSpend,
      overrunRisk: projectedSpend > budget,
      overrunPercent: budget > 0 ? Math.round(((projectedSpend - budget) / budget) * 100) : 0,
    };
  }

  private calculateConfidence(completedCount: number, riskCount: number): number {
    // More data = higher confidence, more risks = lower confidence
    const dataFactor = Math.min(completedCount / 10, 1);
    const riskFactor = Math.max(1 - riskCount * 0.1, 0.3);

    return Math.round(dataFactor * riskFactor * 100) / 100;
  }

  async pushToConcierge(projectId: string): Promise<void> {
    const prediction = await this.predictTimeline(projectId);

    const supabase = await getSupabaseServer();

    // Log for concierge consumption
    await supabase.from('auditLogs').insert({
      action: 'project_prediction_generated',
      entity_type: 'project',
      entity_id: projectId,
      metadata: {
        org_id: this.orgId,
        risk_level: prediction.riskLevel,
        confidence: prediction.confidenceScore,
      },
    });
  }
}
```

## API Endpoints

### GET /api/projects/:id/prediction

Get prediction for project.

```typescript
// Response
{
  "success": true,
  "prediction": {
    "predictedCompletion": "2025-12-15",
    "riskLevel": "MEDIUM",
    "riskFactors": [...],
    "confidenceScore": 0.75
  }
}
```

## Implementation Tasks

- [ ] Create 099_project_predictions.sql
- [ ] Implement ProjectPredictionService
- [ ] Create API endpoints
- [ ] Create ProjectRiskPanel.tsx
- [ ] Create TimelineForecastChart.tsx
- [ ] Wire into Concierge

---

*Phase 47 - Project Prediction AI Complete*
