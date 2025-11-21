# Phase 85 - Unified Prediction & Early-Warning Engine (UPEWE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase85-unified-prediction-early-warning-engine`

## Executive Summary

Phase 85 creates a cross-system forecasting engine that analyzes signals from MCSE, ASRS, HSOE, MAOS logs, ADRE diffs, and Voice usage to predict failures, anomalies, misuse, token budget risks, workflow bottlenecks, and agent misalignment. UPEWE proactively alerts operators, auto-escalates high-risk trajectories, and preemptively blocks hazardous futures.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Must Maintain Strict Vendor Secrecy | Yes |
| Must Enforce claude.md Rules | Yes |
| Must Enforce Multi-Tenant RLS | Yes |
| Must Not Make External API Calls | Yes |
| Must Not Expose Model Names | Yes |
| Must Log All Events | Yes |
| UPEWE Cannot Be Bypassed | Yes |

## Signal Sources

| Source | Table | Signals |
|--------|-------|---------|
| MCSE | mcse_cognitive_events | Logic scores, hallucination scores, risk flags |
| ASRS | asrs_events | Risk scores, outcomes, blocked actions |
| HSOE | hsoe_requests | Approval delays, escalation rates, denials |
| MAOS | orchestrator_runs | Run durations, failures, agent invocations |
| ADRE | dev_refactor_sessions | Code change patterns, test failures |
| Voice | voice_command_sessions | Command frequency, parse errors |
| Billing | billing_usage_events | Token consumption, budget utilization |

## Forecast Windows

- **5m** - Immediate threat detection
- **30m** - Short-term pattern recognition
- **6h** - Workflow bottleneck prediction
- **24h** - Daily trend analysis
- **7d** - Weekly pattern forecasting

## Database Schema

### Migration 137: Unified Prediction & Early-Warning Engine

```sql
-- 137_unified_prediction_early_warning_engine.sql

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS upewe_policy_rules CASCADE;
DROP TABLE IF EXISTS upewe_signal_cache CASCADE;
DROP TABLE IF EXISTS upewe_forecast_events CASCADE;

-- UPEWE forecast events table
CREATE TABLE IF NOT EXISTS upewe_forecast_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  signal_source TEXT NOT NULL,
  risk_type TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0,
  forecast_window TEXT NOT NULL,
  recommended_action TEXT NOT NULL DEFAULT 'warn',
  raw_features JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Signal source check
  CONSTRAINT upewe_forecast_events_source_check CHECK (
    signal_source IN ('mcse', 'asrs', 'hsoe', 'maos', 'adre', 'voice', 'billing', 'aggregate')
  ),

  -- Risk type check
  CONSTRAINT upewe_forecast_events_risk_check CHECK (
    risk_type IN (
      'failure', 'anomaly', 'misuse', 'budget_risk', 'bottleneck',
      'misalignment', 'escalation_spike', 'approval_delay', 'pattern_match'
    )
  ),

  -- Forecast window check
  CONSTRAINT upewe_forecast_events_window_check CHECK (
    forecast_window IN ('5m', '30m', '6h', '24h', '7d')
  ),

  -- Recommended action check
  CONSTRAINT upewe_forecast_events_action_check CHECK (
    recommended_action IN ('warn', 'block_future', 'auto_escalate', 'require_hsoe', 'monitor')
  ),

  -- Confidence range
  CONSTRAINT upewe_forecast_events_confidence_check CHECK (
    confidence >= 0 AND confidence <= 100
  ),

  -- Foreign keys
  CONSTRAINT upewe_forecast_events_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upewe_forecast_events_tenant ON upewe_forecast_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_upewe_forecast_events_source ON upewe_forecast_events(signal_source);
CREATE INDEX IF NOT EXISTS idx_upewe_forecast_events_risk ON upewe_forecast_events(risk_type);
CREATE INDEX IF NOT EXISTS idx_upewe_forecast_events_confidence ON upewe_forecast_events(confidence);
CREATE INDEX IF NOT EXISTS idx_upewe_forecast_events_window ON upewe_forecast_events(forecast_window);
CREATE INDEX IF NOT EXISTS idx_upewe_forecast_events_action ON upewe_forecast_events(recommended_action);
CREATE INDEX IF NOT EXISTS idx_upewe_forecast_events_created ON upewe_forecast_events(created_at DESC);

-- Enable RLS
ALTER TABLE upewe_forecast_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY upewe_forecast_events_select ON upewe_forecast_events
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY upewe_forecast_events_insert ON upewe_forecast_events
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE upewe_forecast_events IS 'Predicted risks and forecasts (Phase 85)';

-- UPEWE signal cache table
CREATE TABLE IF NOT EXISTS upewe_signal_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  signal_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  received_at TIMESTAMPTZ DEFAULT NOW(),

  -- Signal type check
  CONSTRAINT upewe_signal_cache_type_check CHECK (
    signal_type IN ('mcse', 'asrs', 'hsoe', 'maos', 'adre', 'voice', 'billing')
  ),

  -- Foreign keys
  CONSTRAINT upewe_signal_cache_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upewe_signal_cache_tenant ON upewe_signal_cache(tenant_id);
CREATE INDEX IF NOT EXISTS idx_upewe_signal_cache_type ON upewe_signal_cache(signal_type);
CREATE INDEX IF NOT EXISTS idx_upewe_signal_cache_received ON upewe_signal_cache(received_at DESC);

-- Enable RLS
ALTER TABLE upewe_signal_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY upewe_signal_cache_select ON upewe_signal_cache
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY upewe_signal_cache_insert ON upewe_signal_cache
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY upewe_signal_cache_delete ON upewe_signal_cache
  FOR DELETE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE upewe_signal_cache IS 'Short-term signal cache for pattern recognition (Phase 85)';

-- UPEWE policy rules table
CREATE TABLE IF NOT EXISTS upewe_policy_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  rule_name TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  recommended_action TEXT NOT NULL DEFAULT 'warn',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Recommended action check
  CONSTRAINT upewe_policy_rules_action_check CHECK (
    recommended_action IN ('warn', 'block_future', 'auto_escalate', 'require_hsoe', 'monitor')
  ),

  -- Foreign keys
  CONSTRAINT upewe_policy_rules_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upewe_policy_rules_tenant ON upewe_policy_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_upewe_policy_rules_name ON upewe_policy_rules(rule_name);
CREATE INDEX IF NOT EXISTS idx_upewe_policy_rules_action ON upewe_policy_rules(recommended_action);
CREATE INDEX IF NOT EXISTS idx_upewe_policy_rules_enabled ON upewe_policy_rules(enabled);

-- Enable RLS
ALTER TABLE upewe_policy_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY upewe_policy_rules_select ON upewe_policy_rules
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY upewe_policy_rules_insert ON upewe_policy_rules
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY upewe_policy_rules_update ON upewe_policy_rules
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY upewe_policy_rules_delete ON upewe_policy_rules
  FOR DELETE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE upewe_policy_rules IS 'Predictive policy rules (Phase 85)';
```

## UPEWE Engine Service

```typescript
// src/lib/prediction/upewe-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface ForecastEvent {
  id: string;
  tenantId: string;
  signalSource: string;
  riskType: string;
  confidence: number;
  forecastWindow: string;
  recommendedAction: string;
  rawFeatures: Record<string, any>;
  createdAt: Date;
}

interface SignalCache {
  id: string;
  tenantId: string;
  signalType: string;
  payload: Record<string, any>;
  receivedAt: Date;
}

interface PolicyRule {
  id: string;
  tenantId: string;
  ruleName: string;
  triggerConditions: Record<string, any>;
  recommendedAction: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Signal {
  type: string;
  payload: Record<string, any>;
  timestamp: Date;
}

type ForecastWindow = '5m' | '30m' | '6h' | '24h' | '7d';

const WINDOW_MS: Record<ForecastWindow, number> = {
  '5m': 5 * 60 * 1000,
  '30m': 30 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

export class UPEWEEngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async ingestSignals(signals: Signal[]): Promise<void> {
    const supabase = await getSupabaseServer();

    const cacheEntries = signals.map(signal => ({
      tenant_id: this.orgId,
      signal_type: signal.type,
      payload: signal.payload,
      received_at: signal.timestamp.toISOString(),
    }));

    await supabase.from('upewe_signal_cache').insert(cacheEntries);

    // Run forecasts after ingestion
    for (const window of ['5m', '30m', '6h'] as ForecastWindow[]) {
      await this.generateForecast(window);
    }
  }

  async generateForecast(window: ForecastWindow): Promise<ForecastEvent[]> {
    const supabase = await getSupabaseServer();
    const forecasts: ForecastEvent[] = [];

    // Get cached signals within window
    const cutoff = new Date(Date.now() - WINDOW_MS[window]);
    const { data: signals } = await supabase
      .from('upewe_signal_cache')
      .select('*')
      .eq('tenant_id', this.orgId)
      .gte('received_at', cutoff.toISOString());

    if (!signals || signals.length === 0) {
      return forecasts;
    }

    // Analyze patterns by signal type
    const byType = this.groupByType(signals);

    // Check for failure patterns
    const failureForecast = await this.predictFailure(byType, window);
    if (failureForecast) forecasts.push(failureForecast);

    // Check for anomalies
    const anomalyForecast = await this.predictAnomaly(byType, window);
    if (anomalyForecast) forecasts.push(anomalyForecast);

    // Check for budget risks
    const budgetForecast = await this.predictBudgetRisk(byType, window);
    if (budgetForecast) forecasts.push(budgetForecast);

    // Check for bottlenecks
    const bottleneckForecast = await this.predictBottleneck(byType, window);
    if (bottleneckForecast) forecasts.push(bottleneckForecast);

    // Check for misalignment
    const misalignmentForecast = await this.predictMisalignment(byType, window);
    if (misalignmentForecast) forecasts.push(misalignmentForecast);

    // Apply policy rules
    const rules = await this.getEnabledRules();
    for (const forecast of forecasts) {
      const action = this.applyPolicyRules(forecast, rules);
      if (action) {
        forecast.recommendedAction = action;
      }
    }

    // Store forecasts
    for (const forecast of forecasts) {
      await this.storeForecast(forecast);
    }

    return forecasts;
  }

  private async predictFailure(
    byType: Record<string, any[]>,
    window: ForecastWindow
  ): Promise<ForecastEvent | null> {
    const features: Record<string, any> = {};
    let confidence = 0;

    // MCSE failures
    const mcseSignals = byType['mcse'] || [];
    const lowLogicScores = mcseSignals.filter(s => s.payload.logic_score < 50);
    if (lowLogicScores.length > 3) {
      confidence += 30;
      features.lowLogicCount = lowLogicScores.length;
    }

    // ASRS blocks
    const asrsSignals = byType['asrs'] || [];
    const blocks = asrsSignals.filter(s => s.payload.outcome === 'blocked');
    if (blocks.length > 2) {
      confidence += 25;
      features.blockCount = blocks.length;
    }

    // MAOS failures
    const maosSignals = byType['maos'] || [];
    const failures = maosSignals.filter(s => s.payload.status === 'failed');
    if (failures.length > 1) {
      confidence += 20;
      features.maosFailures = failures.length;
    }

    if (confidence < 30) return null;

    return {
      id: '',
      tenantId: this.orgId,
      signalSource: 'aggregate',
      riskType: 'failure',
      confidence: Math.min(100, confidence),
      forecastWindow: window,
      recommendedAction: this.recommendAction(confidence, 'failure'),
      rawFeatures: features,
      createdAt: new Date(),
    };
  }

  private async predictAnomaly(
    byType: Record<string, any[]>,
    window: ForecastWindow
  ): Promise<ForecastEvent | null> {
    const features: Record<string, any> = {};
    let confidence = 0;

    // Unusual hallucination scores
    const mcseSignals = byType['mcse'] || [];
    const highHallucination = mcseSignals.filter(s => s.payload.hallucination_score > 40);
    if (highHallucination.length > 2) {
      confidence += 35;
      features.highHallucinationCount = highHallucination.length;
    }

    // Voice parse errors
    const voiceSignals = byType['voice'] || [];
    const parseErrors = voiceSignals.filter(s => s.payload.status === 'failed');
    if (parseErrors.length > 3) {
      confidence += 25;
      features.voiceErrors = parseErrors.length;
    }

    // ADRE test failures
    const adreSignals = byType['adre'] || [];
    const testFailures = adreSignals.filter(s => s.payload.tests_failed > 0);
    if (testFailures.length > 2) {
      confidence += 20;
      features.testFailures = testFailures.length;
    }

    if (confidence < 30) return null;

    return {
      id: '',
      tenantId: this.orgId,
      signalSource: 'aggregate',
      riskType: 'anomaly',
      confidence: Math.min(100, confidence),
      forecastWindow: window,
      recommendedAction: this.recommendAction(confidence, 'anomaly'),
      rawFeatures: features,
      createdAt: new Date(),
    };
  }

  private async predictBudgetRisk(
    byType: Record<string, any[]>,
    window: ForecastWindow
  ): Promise<ForecastEvent | null> {
    const features: Record<string, any> = {};
    let confidence = 0;

    const billingSignals = byType['billing'] || [];
    if (billingSignals.length === 0) return null;

    // Calculate token consumption rate
    const totalTokens = billingSignals.reduce(
      (sum, s) => sum + (s.payload.tokens_used || 0),
      0
    );
    const avgRate = totalTokens / billingSignals.length;

    // High consumption rate
    if (avgRate > 10000) {
      confidence += 40;
      features.avgTokenRate = avgRate;
    }

    // Budget utilization
    const lastSignal = billingSignals[billingSignals.length - 1];
    const utilization = lastSignal?.payload.budget_utilization || 0;
    if (utilization > 80) {
      confidence += 35;
      features.budgetUtilization = utilization;
    }

    if (confidence < 30) return null;

    return {
      id: '',
      tenantId: this.orgId,
      signalSource: 'billing',
      riskType: 'budget_risk',
      confidence: Math.min(100, confidence),
      forecastWindow: window,
      recommendedAction: this.recommendAction(confidence, 'budget_risk'),
      rawFeatures: features,
      createdAt: new Date(),
    };
  }

  private async predictBottleneck(
    byType: Record<string, any[]>,
    window: ForecastWindow
  ): Promise<ForecastEvent | null> {
    const features: Record<string, any> = {};
    let confidence = 0;

    // HSOE approval delays
    const hsoeSignals = byType['hsoe'] || [];
    const pending = hsoeSignals.filter(s => s.payload.status === 'pending');
    if (pending.length > 5) {
      confidence += 40;
      features.pendingApprovals = pending.length;
    }

    // Long-running orchestrator runs
    const maosSignals = byType['maos'] || [];
    const longRuns = maosSignals.filter(s => s.payload.duration_ms > 60000);
    if (longRuns.length > 2) {
      confidence += 30;
      features.longRunningTasks = longRuns.length;
    }

    if (confidence < 30) return null;

    return {
      id: '',
      tenantId: this.orgId,
      signalSource: 'aggregate',
      riskType: 'bottleneck',
      confidence: Math.min(100, confidence),
      forecastWindow: window,
      recommendedAction: this.recommendAction(confidence, 'bottleneck'),
      rawFeatures: features,
      createdAt: new Date(),
    };
  }

  private async predictMisalignment(
    byType: Record<string, any[]>,
    window: ForecastWindow
  ): Promise<ForecastEvent | null> {
    const features: Record<string, any> = {};
    let confidence = 0;

    // MCSE sanitisation frequency
    const mcseSignals = byType['mcse'] || [];
    const sanitised = mcseSignals.filter(
      s => s.payload.recommended_action === 'sanitise'
    );
    if (sanitised.length > 3) {
      confidence += 35;
      features.sanitisationCount = sanitised.length;
    }

    // HSOE escalations
    const hsoeSignals = byType['hsoe'] || [];
    const escalated = hsoeSignals.filter(s => s.payload.status === 'escalated');
    if (escalated.length > 2) {
      confidence += 30;
      features.escalationCount = escalated.length;
    }

    // Risk flag accumulation
    const riskFlags = mcseSignals.flatMap(s => s.payload.risk_flags || []);
    if (riskFlags.length > 10) {
      confidence += 20;
      features.totalRiskFlags = riskFlags.length;
    }

    if (confidence < 30) return null;

    return {
      id: '',
      tenantId: this.orgId,
      signalSource: 'aggregate',
      riskType: 'misalignment',
      confidence: Math.min(100, confidence),
      forecastWindow: window,
      recommendedAction: this.recommendAction(confidence, 'misalignment'),
      rawFeatures: features,
      createdAt: new Date(),
    };
  }

  computeConfidence(features: Record<string, any>, riskType: string): number {
    // Base confidence calculation
    let confidence = 0;
    const weights: Record<string, number> = {
      failure: 1.2,
      anomaly: 1.1,
      budget_risk: 1.3,
      bottleneck: 1.0,
      misalignment: 1.15,
    };

    const featureCount = Object.keys(features).length;
    confidence = Math.min(100, featureCount * 15 * (weights[riskType] || 1));

    return confidence;
  }

  recommendAction(confidence: number, riskType: string): string {
    // Critical risks
    if (riskType === 'misuse' || (riskType === 'failure' && confidence >= 80)) {
      return 'block_future';
    }

    // High confidence risks
    if (confidence >= 70) {
      return 'auto_escalate';
    }

    // Moderate risks requiring approval
    if (confidence >= 50 || riskType === 'budget_risk') {
      return 'require_hsoe';
    }

    // Low confidence - monitor
    if (confidence >= 30) {
      return 'warn';
    }

    return 'monitor';
  }

  async purgeCache(olderThan: Date): Promise<number> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('upewe_signal_cache')
      .delete()
      .eq('tenant_id', this.orgId)
      .lt('received_at', olderThan.toISOString())
      .select('id');

    return data?.length || 0;
  }

  private groupByType(signals: any[]): Record<string, any[]> {
    const grouped: Record<string, any[]> = {};
    for (const signal of signals) {
      const type = signal.signal_type;
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(signal);
    }
    return grouped;
  }

  private async getEnabledRules(): Promise<PolicyRule[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('upewe_policy_rules')
      .select('*')
      .eq('tenant_id', this.orgId)
      .eq('enabled', true);

    return (data || []).map(r => this.mapToRule(r));
  }

  private applyPolicyRules(
    forecast: ForecastEvent,
    rules: PolicyRule[]
  ): string | null {
    for (const rule of rules) {
      const conditions = rule.triggerConditions;

      // Check risk type match
      if (conditions.riskType && conditions.riskType !== forecast.riskType) {
        continue;
      }

      // Check confidence threshold
      if (conditions.minConfidence && forecast.confidence < conditions.minConfidence) {
        continue;
      }

      // Check signal source
      if (conditions.signalSource && conditions.signalSource !== forecast.signalSource) {
        continue;
      }

      // Rule matched
      return rule.recommendedAction;
    }

    return null;
  }

  private async storeForecast(forecast: ForecastEvent): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from('upewe_forecast_events').insert({
      tenant_id: forecast.tenantId,
      signal_source: forecast.signalSource,
      risk_type: forecast.riskType,
      confidence: forecast.confidence,
      forecast_window: forecast.forecastWindow,
      recommended_action: forecast.recommendedAction,
      raw_features: forecast.rawFeatures,
    });
  }

  async getForecasts(
    window?: ForecastWindow,
    limit: number = 50
  ): Promise<ForecastEvent[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('upewe_forecast_events')
      .select('*')
      .eq('tenant_id', this.orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (window) {
      query = query.eq('forecast_window', window);
    }

    const { data } = await query;

    return (data || []).map(e => this.mapToEvent(e));
  }

  async getSignals(limit: number = 100): Promise<SignalCache[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('upewe_signal_cache')
      .select('*')
      .eq('tenant_id', this.orgId)
      .order('received_at', { ascending: false })
      .limit(limit);

    return (data || []).map(s => ({
      id: s.id,
      tenantId: s.tenant_id,
      signalType: s.signal_type,
      payload: s.payload,
      receivedAt: new Date(s.received_at),
    }));
  }

  async getRules(): Promise<PolicyRule[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('upewe_policy_rules')
      .select('*')
      .eq('tenant_id', this.orgId)
      .order('rule_name');

    return (data || []).map(r => this.mapToRule(r));
  }

  async updateRule(
    ruleId: string,
    updates: Partial<PolicyRule>
  ): Promise<PolicyRule> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('upewe_policy_rules')
      .update({
        rule_name: updates.ruleName,
        trigger_conditions: updates.triggerConditions,
        recommended_action: updates.recommendedAction,
        enabled: updates.enabled,
        updated_at: new Date().toISOString(),
      })
      .eq('id', ruleId)
      .select()
      .single();

    return this.mapToRule(data);
  }

  private mapToEvent(data: any): ForecastEvent {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      signalSource: data.signal_source,
      riskType: data.risk_type,
      confidence: data.confidence,
      forecastWindow: data.forecast_window,
      recommendedAction: data.recommended_action,
      rawFeatures: data.raw_features,
      createdAt: new Date(data.created_at),
    };
  }

  private mapToRule(data: any): PolicyRule {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      ruleName: data.rule_name,
      triggerConditions: data.trigger_conditions,
      recommendedAction: data.recommended_action,
      enabled: data.enabled,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}
```

## Signal Aggregation Map

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    MCSE     │     │    ASRS     │     │    HSOE     │
│ - logic     │     │ - risk      │     │ - approvals │
│ - halluc.   │     │ - outcomes  │     │ - delays    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │   UPEWE     │
                    │   Signal    │
                    │   Cache     │
                    └──────┬──────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
│    MAOS     │     │    ADRE     │     │   Voice    │
│ - runs      │     │ - diffs     │     │ - commands │
│ - failures  │     │ - tests     │     │ - errors   │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Predictive Examples

### Example 1: Failure Prediction

**Input Signals** (5m window):
- MCSE: 4 events with logic_score < 50
- ASRS: 3 blocked actions
- MAOS: 2 failed runs

**Output**:
```json
{
  "riskType": "failure",
  "confidence": 75,
  "recommendedAction": "auto_escalate",
  "rawFeatures": {
    "lowLogicCount": 4,
    "blockCount": 3,
    "maosFailures": 2
  }
}
```

### Example 2: Budget Risk Prediction

**Input Signals** (30m window):
- Billing: avgTokenRate = 15000, budgetUtilization = 85%

**Output**:
```json
{
  "riskType": "budget_risk",
  "confidence": 75,
  "recommendedAction": "require_hsoe",
  "rawFeatures": {
    "avgTokenRate": 15000,
    "budgetUtilization": 85
  }
}
```

### Example 3: Misalignment Prediction

**Input Signals** (6h window):
- MCSE: 5 sanitisation events, 12 risk flags
- HSOE: 3 escalations

**Output**:
```json
{
  "riskType": "misalignment",
  "confidence": 85,
  "recommendedAction": "auto_escalate",
  "rawFeatures": {
    "sanitisationCount": 5,
    "escalationCount": 3,
    "totalRiskFlags": 12
  }
}
```

## API Endpoints

### POST /api/prediction/ingest

Ingest signals into cache.

### GET /api/prediction/forecast/:window

Generate forecast for window.

### GET /api/prediction/forecasts

Get all forecasts.

### GET /api/prediction/signals

Get cached signals.

### GET /api/prediction/rules

Get policy rules.

### PUT /api/prediction/rules/:id

Update policy rule.

## CLI Commands

```bash
# Generate forecast for window
unite upewe:forecast --window=5m

# View cached signals
unite upewe:signals --limit=50

# List policy rules
unite upewe:rules:list

# Update policy rule
unite upewe:rules:update <rule_id> --enabled=true

# Purge old cache entries
unite upewe:purge --older-than=7d
```

## Implementation Tasks

- [ ] Create 137_unified_prediction_early_warning_engine.sql
- [ ] Implement UPEWEEngine
- [ ] Create API endpoints
- [ ] Create ForecastVisualizer.tsx
- [ ] Create RiskTimeline.tsx
- [ ] Create SignalCharts.tsx
- [ ] Create PolicyManager.tsx
- [ ] Integrate with MCSE
- [ ] Integrate with ASRS
- [ ] Integrate with HSOE
- [ ] Integrate with MAOS
- [ ] Integrate with ADRE
- [ ] Integrate with Voice-First
- [ ] Add CLI commands
- [ ] Write Jest test suite

---

*Phase 85 - Unified Prediction & Early-Warning Engine Complete*
