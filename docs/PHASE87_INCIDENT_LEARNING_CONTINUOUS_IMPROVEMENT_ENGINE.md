# Phase 87 - Incident Learning & Continuous Improvement Engine (ILCIE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase87-incident-learning-continuous-improvement`

## Executive Summary

Phase 87 establishes a continuous learning engine that analyzes resolved incidents, runbook outcomes, forecast accuracy, cognitive/safety violations, and human approvals to automatically generate improvements to policies, thresholds, runbooks, and agent behaviour. The system evolves autonomously based on real-world outcomes.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Must Maintain Strict Vendor Secrecy | Yes |
| Must Enforce claude.md Rules | Yes |
| Must Not Expose Model Names | Yes |
| Must Not Make External API Calls | Yes |
| Must Enforce Multi-Tenant RLS | Yes |
| ILCIE Cannot Modify Protected Rules | Yes |
| Human Approval Required for High-Impact Changes | Yes |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    AIRE     │     │   UPEWE     │     │ ASRS/MCSE  │
│  Incidents  │     │  Forecasts  │     │   Events   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │   ILCIE     │
                    │   Engine    │
                    └──────┬──────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
│  Learning   │     │  Recommend  │     │   Apply    │
│   Events    │     │   Changes   │     │   & Log    │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Database Schema

### Migration 139: Incident Learning & Continuous Improvement Engine

```sql
-- 139_incident_learning_continuous_improvement_engine.sql

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS ilcie_improvement_log CASCADE;
DROP TABLE IF EXISTS ilcie_recommendations CASCADE;
DROP TABLE IF EXISTS ilcie_learning_events CASCADE;

-- ILCIE learning events table
CREATE TABLE IF NOT EXISTS ilcie_learning_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  source TEXT NOT NULL,
  incident_id UUID,
  linked_event_id UUID,
  pattern JSONB DEFAULT '{}'::jsonb,
  impact_assessment TEXT,
  improvement_suggestion JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Source check
  CONSTRAINT ilcie_learning_events_source_check CHECK (
    source IN ('aire', 'upewe', 'asrs', 'mcse', 'hsoe', 'runbook', 'manual')
  ),

  -- Foreign keys
  CONSTRAINT ilcie_learning_events_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ilcie_learning_events_tenant ON ilcie_learning_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ilcie_learning_events_source ON ilcie_learning_events(source);
CREATE INDEX IF NOT EXISTS idx_ilcie_learning_events_incident ON ilcie_learning_events(incident_id);
CREATE INDEX IF NOT EXISTS idx_ilcie_learning_events_event ON ilcie_learning_events(linked_event_id);
CREATE INDEX IF NOT EXISTS idx_ilcie_learning_events_created ON ilcie_learning_events(created_at DESC);

-- Enable RLS
ALTER TABLE ilcie_learning_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ilcie_learning_events_select ON ilcie_learning_events
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY ilcie_learning_events_insert ON ilcie_learning_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE ilcie_learning_events IS 'Learning observations from incidents and events (Phase 87)';

-- ILCIE recommendations table
CREATE TABLE IF NOT EXISTS ilcie_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  recommendation TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  requires_hsoe BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Target type check
  CONSTRAINT ilcie_recommendations_target_check CHECK (
    target_type IN ('runbook', 'policy', 'threshold', 'agent_config', 'forecast_model')
  ),

  -- Severity check
  CONSTRAINT ilcie_recommendations_severity_check CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),

  -- Status check
  CONSTRAINT ilcie_recommendations_status_check CHECK (
    status IN ('pending', 'approved', 'rejected', 'applied', 'reverted')
  ),

  -- Foreign keys
  CONSTRAINT ilcie_recommendations_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ilcie_recommendations_tenant ON ilcie_recommendations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ilcie_recommendations_target_type ON ilcie_recommendations(target_type);
CREATE INDEX IF NOT EXISTS idx_ilcie_recommendations_target_id ON ilcie_recommendations(target_id);
CREATE INDEX IF NOT EXISTS idx_ilcie_recommendations_severity ON ilcie_recommendations(severity);
CREATE INDEX IF NOT EXISTS idx_ilcie_recommendations_status ON ilcie_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_ilcie_recommendations_created ON ilcie_recommendations(created_at DESC);

-- Enable RLS
ALTER TABLE ilcie_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ilcie_recommendations_select ON ilcie_recommendations
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY ilcie_recommendations_insert ON ilcie_recommendations
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY ilcie_recommendations_update ON ilcie_recommendations
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE ilcie_recommendations IS 'Improvement recommendations (Phase 87)';

-- ILCIE improvement log table
CREATE TABLE IF NOT EXISTS ilcie_improvement_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  recommendation_id UUID NOT NULL,
  change_summary JSONB DEFAULT '{}'::jsonb,
  applied_by TEXT NOT NULL,
  result JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign keys
  CONSTRAINT ilcie_improvement_log_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT ilcie_improvement_log_recommendation_fk
    FOREIGN KEY (recommendation_id) REFERENCES ilcie_recommendations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ilcie_improvement_log_tenant ON ilcie_improvement_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ilcie_improvement_log_recommendation ON ilcie_improvement_log(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_ilcie_improvement_log_applied_by ON ilcie_improvement_log(applied_by);
CREATE INDEX IF NOT EXISTS idx_ilcie_improvement_log_created ON ilcie_improvement_log(created_at DESC);

-- Enable RLS
ALTER TABLE ilcie_improvement_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ilcie_improvement_log_select ON ilcie_improvement_log
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY ilcie_improvement_log_insert ON ilcie_improvement_log
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE ilcie_improvement_log IS 'Applied improvements audit log (Phase 87)';
```

## ILCIE Engine Service

```typescript
// src/lib/learning/ilcie-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface LearningEvent {
  id: string;
  tenantId: string;
  source: string;
  incidentId?: string;
  linkedEventId?: string;
  pattern: Record<string, any>;
  impactAssessment?: string;
  improvementSuggestion: Record<string, any>;
  createdAt: Date;
}

interface Recommendation {
  id: string;
  tenantId: string;
  targetType: string;
  targetId?: string;
  recommendation: string;
  severity: string;
  requiresHsoe: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ImprovementLog {
  id: string;
  tenantId: string;
  recommendationId: string;
  changeSummary: Record<string, any>;
  appliedBy: string;
  result: Record<string, any>;
  createdAt: Date;
}

interface Incident {
  id: string;
  severity: string;
  status: string;
  source: string;
  rootCauseHypothesis?: string;
  resolvedAt?: Date;
}

interface ForecastAccuracy {
  forecastId: string;
  predictedRisk: string;
  actualOutcome: string;
  confidenceDelta: number;
}

export class ILCIEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async learnFromIncident(incident: Incident): Promise<LearningEvent> {
    const pattern = await this.extractPatterns({
      type: 'incident',
      severity: incident.severity,
      source: incident.source,
      resolution: incident.status === 'resolved',
      hypothesis: incident.rootCauseHypothesis,
    });

    const impact = this.assessImpact(pattern);
    const suggestion = this.generateSuggestion(pattern, 'incident');

    const event = await this.createLearningEvent({
      source: 'aire',
      incidentId: incident.id,
      pattern,
      impactAssessment: impact,
      improvementSuggestion: suggestion,
    });

    // Generate recommendations if significant
    if (this.isSignificantPattern(pattern)) {
      await this.generateRecommendations(event);
    }

    return event;
  }

  async learnFromRunbook(
    runbookId: string,
    outcome: {
      success: boolean;
      actionsExecuted: number;
      actionsFailed: number;
      timeToResolve: number;
    }
  ): Promise<LearningEvent> {
    const pattern = await this.extractPatterns({
      type: 'runbook',
      runbookId,
      success: outcome.success,
      successRate: outcome.actionsExecuted > 0
        ? (outcome.actionsExecuted - outcome.actionsFailed) / outcome.actionsExecuted
        : 0,
      timeToResolve: outcome.timeToResolve,
    });

    const impact = this.assessImpact(pattern);
    const suggestion = this.generateSuggestion(pattern, 'runbook');

    const event = await this.createLearningEvent({
      source: 'runbook',
      pattern,
      impactAssessment: impact,
      improvementSuggestion: suggestion,
    });

    if (this.isSignificantPattern(pattern)) {
      await this.generateRecommendations(event);
    }

    return event;
  }

  async learnFromForecastAccuracy(
    accuracy: ForecastAccuracy
  ): Promise<LearningEvent> {
    const pattern = await this.extractPatterns({
      type: 'forecast',
      forecastId: accuracy.forecastId,
      predicted: accuracy.predictedRisk,
      actual: accuracy.actualOutcome,
      delta: accuracy.confidenceDelta,
      overPredicted: accuracy.confidenceDelta > 20,
      underPredicted: accuracy.confidenceDelta < -20,
    });

    const impact = this.assessImpact(pattern);
    const suggestion = this.generateSuggestion(pattern, 'forecast');

    const event = await this.createLearningEvent({
      source: 'upewe',
      linkedEventId: accuracy.forecastId,
      pattern,
      impactAssessment: impact,
      improvementSuggestion: suggestion,
    });

    if (this.isSignificantPattern(pattern)) {
      await this.generateRecommendations(event);
    }

    return event;
  }

  async extractPatterns(data: Record<string, any>): Promise<Record<string, any>> {
    const patterns: Record<string, any> = {
      ...data,
      extractedAt: new Date().toISOString(),
    };

    // Add derived patterns
    if (data.type === 'incident') {
      patterns.severityTrend = await this.calculateSeverityTrend(data.severity);
      patterns.resolutionRate = await this.calculateResolutionRate();
    }

    if (data.type === 'runbook') {
      patterns.avgSuccessRate = await this.calculateRunbookSuccessRate(data.runbookId);
      patterns.avgTimeToResolve = await this.calculateAvgTimeToResolve(data.runbookId);
    }

    if (data.type === 'forecast') {
      patterns.accuracyTrend = await this.calculateForecastAccuracyTrend();
    }

    return patterns;
  }

  async generateRecommendations(event: LearningEvent): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];
    const pattern = event.pattern;
    const suggestion = event.improvementSuggestion;

    // Runbook optimization recommendations
    if (pattern.type === 'runbook' && pattern.successRate < 0.8) {
      const rec = await this.createRecommendation({
        targetType: 'runbook',
        targetId: pattern.runbookId,
        recommendation: `Runbook success rate is ${(pattern.successRate * 100).toFixed(0)}%. Consider ${suggestion.action || 'reviewing action sequence'}`,
        severity: pattern.successRate < 0.5 ? 'high' : 'medium',
        requiresHsoe: pattern.successRate < 0.5,
      });
      recommendations.push(rec);
    }

    // Threshold adjustment recommendations
    if (pattern.type === 'forecast') {
      if (pattern.overPredicted) {
        const rec = await this.createRecommendation({
          targetType: 'threshold',
          recommendation: `Forecast over-predicted by ${pattern.delta}%. Consider raising confidence threshold`,
          severity: 'low',
          requiresHsoe: false,
        });
        recommendations.push(rec);
      } else if (pattern.underPredicted) {
        const rec = await this.createRecommendation({
          targetType: 'threshold',
          recommendation: `Forecast under-predicted by ${Math.abs(pattern.delta)}%. Consider lowering confidence threshold`,
          severity: 'medium',
          requiresHsoe: true,
        });
        recommendations.push(rec);
      }
    }

    // Policy refinement recommendations
    if (pattern.type === 'incident' && pattern.severityTrend === 'increasing') {
      const rec = await this.createRecommendation({
        targetType: 'policy',
        recommendation: 'Incident severity trend is increasing. Review and tighten safety policies',
        severity: 'high',
        requiresHsoe: true,
      });
      recommendations.push(rec);
    }

    return recommendations;
  }

  async applyApprovedImprovement(
    recommendationId: string,
    appliedBy: string
  ): Promise<ImprovementLog> {
    const supabase = await getSupabaseServer();

    // Get recommendation
    const { data: rec } = await supabase
      .from('ilcie_recommendations')
      .select('*')
      .eq('id', recommendationId)
      .single();

    if (!rec || rec.status !== 'approved') {
      throw new Error('Recommendation not found or not approved');
    }

    // Apply the improvement based on target type
    const changeSummary = await this.applyChange(rec);

    // Log the improvement
    const { data: log } = await supabase
      .from('ilcie_improvement_log')
      .insert({
        tenant_id: this.orgId,
        recommendation_id: recommendationId,
        change_summary: changeSummary,
        applied_by: appliedBy,
        result: { status: 'success', appliedAt: new Date().toISOString() },
      })
      .select()
      .single();

    // Update recommendation status
    await supabase
      .from('ilcie_recommendations')
      .update({ status: 'applied', updated_at: new Date().toISOString() })
      .eq('id', recommendationId);

    return this.mapToImprovementLog(log);
  }

  private async applyChange(rec: any): Promise<Record<string, any>> {
    const changes: Record<string, any> = {
      targetType: rec.target_type,
      targetId: rec.target_id,
      recommendation: rec.recommendation,
      appliedAt: new Date().toISOString(),
    };

    switch (rec.target_type) {
      case 'runbook':
        // Would update runbook configuration
        changes.action = 'Updated runbook actions';
        break;

      case 'policy':
        // Would update policy rules
        changes.action = 'Refined policy rules';
        break;

      case 'threshold':
        // Would adjust thresholds
        changes.action = 'Adjusted confidence thresholds';
        break;

      case 'agent_config':
        // Would update agent configuration
        changes.action = 'Modified agent behaviour';
        break;

      case 'forecast_model':
        // Would update forecast parameters
        changes.action = 'Tuned forecast model';
        break;
    }

    return changes;
  }

  private async createLearningEvent(data: {
    source: string;
    incidentId?: string;
    linkedEventId?: string;
    pattern: Record<string, any>;
    impactAssessment?: string;
    improvementSuggestion: Record<string, any>;
  }): Promise<LearningEvent> {
    const supabase = await getSupabaseServer();

    const { data: event } = await supabase
      .from('ilcie_learning_events')
      .insert({
        tenant_id: this.orgId,
        source: data.source,
        incident_id: data.incidentId,
        linked_event_id: data.linkedEventId,
        pattern: data.pattern,
        impact_assessment: data.impactAssessment,
        improvement_suggestion: data.improvementSuggestion,
      })
      .select()
      .single();

    return this.mapToLearningEvent(event);
  }

  private async createRecommendation(data: {
    targetType: string;
    targetId?: string;
    recommendation: string;
    severity: string;
    requiresHsoe: boolean;
  }): Promise<Recommendation> {
    const supabase = await getSupabaseServer();

    const { data: rec } = await supabase
      .from('ilcie_recommendations')
      .insert({
        tenant_id: this.orgId,
        target_type: data.targetType,
        target_id: data.targetId,
        recommendation: data.recommendation,
        severity: data.severity,
        requires_hsoe: data.requiresHsoe,
        status: 'pending',
      })
      .select()
      .single();

    return this.mapToRecommendation(rec);
  }

  private assessImpact(pattern: Record<string, any>): string {
    if (pattern.type === 'incident') {
      if (pattern.severity === 'critical') return 'Critical impact - immediate attention required';
      if (pattern.severity === 'high') return 'High impact - review within 24h';
      return 'Moderate impact - monitor trends';
    }

    if (pattern.type === 'runbook') {
      if (pattern.successRate < 0.5) return 'High impact - runbook effectiveness compromised';
      if (pattern.successRate < 0.8) return 'Moderate impact - room for optimization';
      return 'Low impact - performing within expectations';
    }

    if (pattern.type === 'forecast') {
      if (Math.abs(pattern.delta) > 30) return 'High impact - significant prediction drift';
      if (Math.abs(pattern.delta) > 15) return 'Moderate impact - calibration needed';
      return 'Low impact - within acceptable variance';
    }

    return 'Impact assessment pending';
  }

  private generateSuggestion(
    pattern: Record<string, any>,
    type: string
  ): Record<string, any> {
    const suggestions: Record<string, any> = { type };

    if (type === 'incident') {
      if (pattern.severity === 'critical') {
        suggestions.action = 'Add pre-emptive blocking rule';
        suggestions.priority = 'immediate';
      } else {
        suggestions.action = 'Monitor for recurrence';
        suggestions.priority = 'standard';
      }
    }

    if (type === 'runbook') {
      if (pattern.successRate < 0.5) {
        suggestions.action = 'Reorder or remove failing actions';
        suggestions.priority = 'high';
      } else if (pattern.timeToResolve > 300000) {
        suggestions.action = 'Optimize action sequence for speed';
        suggestions.priority = 'medium';
      }
    }

    if (type === 'forecast') {
      suggestions.action = pattern.overPredicted
        ? 'Increase confidence threshold'
        : 'Decrease confidence threshold';
      suggestions.delta = Math.abs(pattern.delta) * 0.5;
    }

    return suggestions;
  }

  private isSignificantPattern(pattern: Record<string, any>): boolean {
    if (pattern.severity === 'critical' || pattern.severity === 'high') return true;
    if (pattern.successRate !== undefined && pattern.successRate < 0.7) return true;
    if (pattern.delta !== undefined && Math.abs(pattern.delta) > 20) return true;
    return false;
  }

  private async calculateSeverityTrend(currentSeverity: string): Promise<string> {
    // Would analyze historical severity data
    return 'stable';
  }

  private async calculateResolutionRate(): Promise<number> {
    // Would calculate from historical data
    return 0.85;
  }

  private async calculateRunbookSuccessRate(runbookId: string): Promise<number> {
    // Would calculate from historical data
    return 0.75;
  }

  private async calculateAvgTimeToResolve(runbookId: string): Promise<number> {
    // Would calculate from historical data
    return 180000; // 3 minutes
  }

  private async calculateForecastAccuracyTrend(): Promise<string> {
    // Would analyze historical accuracy
    return 'improving';
  }

  async getLearningEvents(limit: number = 50): Promise<LearningEvent[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('ilcie_learning_events')
      .select('*')
      .eq('tenant_id', this.orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).map(e => this.mapToLearningEvent(e));
  }

  async getRecommendations(status?: string): Promise<Recommendation[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('ilcie_recommendations')
      .select('*')
      .eq('tenant_id', this.orgId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data } = await query;

    return (data || []).map(r => this.mapToRecommendation(r));
  }

  async getImprovementLog(): Promise<ImprovementLog[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('ilcie_improvement_log')
      .select('*')
      .eq('tenant_id', this.orgId)
      .order('created_at', { ascending: false });

    return (data || []).map(l => this.mapToImprovementLog(l));
  }

  private mapToLearningEvent(data: any): LearningEvent {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      source: data.source,
      incidentId: data.incident_id,
      linkedEventId: data.linked_event_id,
      pattern: data.pattern,
      impactAssessment: data.impact_assessment,
      improvementSuggestion: data.improvement_suggestion,
      createdAt: new Date(data.created_at),
    };
  }

  private mapToRecommendation(data: any): Recommendation {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      targetType: data.target_type,
      targetId: data.target_id,
      recommendation: data.recommendation,
      severity: data.severity,
      requiresHsoe: data.requires_hsoe,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapToImprovementLog(data: any): ImprovementLog {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      recommendationId: data.recommendation_id,
      changeSummary: data.change_summary,
      appliedBy: data.applied_by,
      result: data.result,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## Improvement Cycle Example

### Cycle 1: Runbook Optimization

```
1. Incident Created → AIRE
2. Runbook Executed → 60% success rate
3. ILCIE learns from runbook outcome
4. Pattern extracted: { successRate: 0.6, failingActions: ['scale_down'] }
5. Recommendation generated: "Remove failing scale_down action"
6. HSOE approval obtained
7. Improvement applied
8. Result logged
```

### Cycle 2: Forecast Calibration

```
1. UPEWE predicts failure at 85% confidence
2. Actual outcome: no failure
3. ILCIE learns from forecast accuracy
4. Pattern: { overPredicted: true, delta: 35 }
5. Recommendation: "Raise confidence threshold by 17%"
6. Auto-applied (low severity)
7. Result logged
```

## Governance Model

| Change Type | Severity | HSOE Required | Auto-Apply |
|-------------|----------|---------------|------------|
| Threshold adjustment | Low | No | Yes |
| Runbook action reorder | Medium | No | No |
| Policy tightening | High | Yes | No |
| Agent config change | High | Yes | No |
| Protected rule change | Critical | Always | Never |

## API Endpoints

### POST /api/learning/incident

Learn from resolved incident.

### POST /api/learning/runbook

Learn from runbook outcome.

### POST /api/learning/forecast

Learn from forecast accuracy.

### GET /api/learning/events

Get learning events.

### GET /api/learning/recommendations

Get recommendations.

### POST /api/learning/apply/:id

Apply approved improvement.

### GET /api/learning/audit

Get improvement log.

## CLI Commands

```bash
# Trigger learning cycle
unite ilcie:learn --source=aire

# List recommendations
unite ilcie:recommendations --status=pending

# Apply improvement
unite ilcie:apply <recommendation_id>

# View audit log
unite ilcie:audit --limit=50
```

## Implementation Tasks

- [ ] Create 139_incident_learning_continuous_improvement_engine.sql
- [ ] Implement ILCIEngine
- [ ] Create API endpoints
- [ ] Create RecommendationList.tsx
- [ ] Create PatternVisualizer.tsx
- [ ] Create BeforeAfterAnalytics.tsx
- [ ] Integrate with AIRE
- [ ] Integrate with UPEWE
- [ ] Integrate with ASRS/MCSE
- [ ] Integrate with HSOE
- [ ] Add CLI commands
- [ ] Write Jest test suite

---

*Phase 87 - Incident Learning & Continuous Improvement Engine Complete*
