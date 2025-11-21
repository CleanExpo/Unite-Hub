# Phase 86 - Autonomous Incident Response & Remediation Engine (AIRE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase86-autonomous-incident-response-remediation`

## Executive Summary

Phase 86 builds a closed-loop incident response engine that ingests forecasts from UPEWE, safety events from ASRS, cognitive flags from MCSE, and governance signals from HSOE, then creates structured incidents, attaches runbooks, executes safe remediation steps, and coordinates human involvement where required.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Must Enforce claude.md Rules | Yes |
| Must Maintain Strict Vendor Secrecy | Yes |
| Must Not Expose Model Names | Yes |
| Must Not Expose Costs | Yes |
| Must Not Make External API Calls | Yes |
| Must Enforce Multi-Tenant RLS | Yes |
| Must Log All Incident Actions | Yes |
| AIRE Cannot Be Bypassed for Severe Incidents | Yes |

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   UPEWE     │     │    ASRS     │     │    MCSE     │
│ Forecasts   │     │   Events    │     │   Flags     │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │    AIRE     │
                    │   Engine    │
                    └──────┬──────┘
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
│  Incidents  │     │  Runbooks   │     │   HSOE     │
│  Creation   │     │  Execution  │     │  Approval  │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Database Schema

### Migration 138: Autonomous Incident Response & Remediation Engine

```sql
-- 138_autonomous_incident_response_remediation_engine.sql

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS aire_actions_log CASCADE;
DROP TABLE IF EXISTS aire_runbooks CASCADE;
DROP TABLE IF EXISTS aire_incidents CASCADE;

-- AIRE incidents table
CREATE TABLE IF NOT EXISTS aire_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  source TEXT NOT NULL,
  linked_forecast_id UUID,
  linked_event_id UUID,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  title TEXT NOT NULL,
  summary TEXT,
  root_cause_hypothesis TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,

  -- Source check
  CONSTRAINT aire_incidents_source_check CHECK (
    source IN ('upewe', 'asrs', 'mcse', 'hsoe', 'manual', 'system')
  ),

  -- Severity check
  CONSTRAINT aire_incidents_severity_check CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),

  -- Status check
  CONSTRAINT aire_incidents_status_check CHECK (
    status IN ('open', 'investigating', 'remediating', 'awaiting_approval', 'resolved', 'closed')
  ),

  -- Foreign keys
  CONSTRAINT aire_incidents_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT aire_incidents_created_by_fk
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_aire_incidents_tenant ON aire_incidents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_aire_incidents_source ON aire_incidents(source);
CREATE INDEX IF NOT EXISTS idx_aire_incidents_severity ON aire_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_aire_incidents_status ON aire_incidents(status);
CREATE INDEX IF NOT EXISTS idx_aire_incidents_forecast ON aire_incidents(linked_forecast_id);
CREATE INDEX IF NOT EXISTS idx_aire_incidents_event ON aire_incidents(linked_event_id);
CREATE INDEX IF NOT EXISTS idx_aire_incidents_created ON aire_incidents(created_at DESC);

-- Enable RLS
ALTER TABLE aire_incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY aire_incidents_select ON aire_incidents
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aire_incidents_insert ON aire_incidents
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aire_incidents_update ON aire_incidents
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE aire_incidents IS 'Autonomous and manual incidents (Phase 86)';

-- AIRE runbooks table
CREATE TABLE IF NOT EXISTS aire_runbooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  severity_scope TEXT NOT NULL DEFAULT 'all',
  trigger_conditions JSONB DEFAULT '{}'::jsonb,
  actions JSONB DEFAULT '[]'::jsonb,
  requires_hsoe_approval BOOLEAN NOT NULL DEFAULT false,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Severity scope check
  CONSTRAINT aire_runbooks_severity_scope_check CHECK (
    severity_scope IN ('all', 'low', 'medium', 'high', 'critical')
  ),

  -- Foreign keys
  CONSTRAINT aire_runbooks_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_aire_runbooks_tenant ON aire_runbooks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_aire_runbooks_name ON aire_runbooks(name);
CREATE INDEX IF NOT EXISTS idx_aire_runbooks_severity ON aire_runbooks(severity_scope);
CREATE INDEX IF NOT EXISTS idx_aire_runbooks_enabled ON aire_runbooks(enabled);

-- Enable RLS
ALTER TABLE aire_runbooks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY aire_runbooks_select ON aire_runbooks
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aire_runbooks_insert ON aire_runbooks
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aire_runbooks_update ON aire_runbooks
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aire_runbooks_delete ON aire_runbooks
  FOR DELETE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE aire_runbooks IS 'Incident runbooks with triggers and actions (Phase 86)';

-- AIRE actions log table
CREATE TABLE IF NOT EXISTS aire_actions_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  incident_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_payload JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  initiated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Action type check
  CONSTRAINT aire_actions_log_type_check CHECK (
    action_type IN (
      'notify', 'block', 'rollback', 'restart', 'scale_down',
      'disable_feature', 'escalate', 'auto_remediate', 'manual_action'
    )
  ),

  -- Status check
  CONSTRAINT aire_actions_log_status_check CHECK (
    status IN ('pending', 'running', 'success', 'failed', 'skipped', 'rolled_back')
  ),

  -- Foreign keys
  CONSTRAINT aire_actions_log_tenant_fk
    FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT aire_actions_log_incident_fk
    FOREIGN KEY (incident_id) REFERENCES aire_incidents(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_aire_actions_log_tenant ON aire_actions_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_aire_actions_log_incident ON aire_actions_log(incident_id);
CREATE INDEX IF NOT EXISTS idx_aire_actions_log_type ON aire_actions_log(action_type);
CREATE INDEX IF NOT EXISTS idx_aire_actions_log_status ON aire_actions_log(status);
CREATE INDEX IF NOT EXISTS idx_aire_actions_log_created ON aire_actions_log(created_at DESC);

-- Enable RLS
ALTER TABLE aire_actions_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY aire_actions_log_select ON aire_actions_log
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aire_actions_log_insert ON aire_actions_log
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY aire_actions_log_update ON aire_actions_log
  FOR UPDATE TO authenticated
  USING (tenant_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE aire_actions_log IS 'Incident remediation and rollback actions (Phase 86)';
```

## AIRE Engine Service

```typescript
// src/lib/incident/aire-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface Incident {
  id: string;
  tenantId: string;
  source: string;
  linkedForecastId?: string;
  linkedEventId?: string;
  severity: string;
  status: string;
  title: string;
  summary?: string;
  rootCauseHypothesis?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

interface Runbook {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  severityScope: string;
  triggerConditions: Record<string, any>;
  actions: RunbookAction[];
  requiresHsoeApproval: boolean;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RunbookAction {
  type: string;
  payload: Record<string, any>;
  order: number;
  requiresApproval?: boolean;
}

interface ActionLog {
  id: string;
  tenantId: string;
  incidentId: string;
  actionType: string;
  actionPayload: Record<string, any>;
  status: string;
  errorMessage?: string;
  initiatedBy: string;
  createdAt: Date;
}

interface ForecastEvent {
  id: string;
  riskType: string;
  confidence: number;
  recommendedAction: string;
  rawFeatures: Record<string, any>;
}

interface SafetyEvent {
  id: string;
  riskScore: number;
  outcome: string;
  actionType: string;
}

export class AIREngine {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async createIncidentFromForecast(
    forecast: ForecastEvent,
    userId?: string
  ): Promise<Incident> {
    const severity = this.mapConfidenceToSeverity(forecast.confidence);
    const title = `Predicted ${forecast.riskType}: ${forecast.recommendedAction}`;
    const summary = `UPEWE forecast with ${forecast.confidence}% confidence predicting ${forecast.riskType}`;

    const incident = await this.createIncident({
      source: 'upewe',
      linkedForecastId: forecast.id,
      severity,
      title,
      summary,
      rootCauseHypothesis: this.generateHypothesis(forecast.rawFeatures),
      createdBy: userId,
    });

    // Auto-select and attach runbook
    const runbook = await this.selectRunbook(incident);
    if (runbook) {
      await this.executeRunbookActions(incident.id, runbook);
    }

    return incident;
  }

  async createIncidentFromEvent(
    event: SafetyEvent,
    source: 'asrs' | 'mcse',
    userId?: string
  ): Promise<Incident> {
    const severity = this.mapRiskScoreToSeverity(event.riskScore);
    const title = `${source.toUpperCase()} ${event.outcome}: ${event.actionType}`;
    const summary = `Safety event from ${source} with risk score ${event.riskScore}`;

    const incident = await this.createIncident({
      source,
      linkedEventId: event.id,
      severity,
      title,
      summary,
      createdBy: userId,
    });

    // Auto-select and attach runbook
    const runbook = await this.selectRunbook(incident);
    if (runbook) {
      await this.executeRunbookActions(incident.id, runbook);
    }

    return incident;
  }

  private async createIncident(data: {
    source: string;
    linkedForecastId?: string;
    linkedEventId?: string;
    severity: string;
    title: string;
    summary?: string;
    rootCauseHypothesis?: string;
    createdBy?: string;
  }): Promise<Incident> {
    const supabase = await getSupabaseServer();

    const { data: incident } = await supabase
      .from('aire_incidents')
      .insert({
        tenant_id: this.orgId,
        source: data.source,
        linked_forecast_id: data.linkedForecastId,
        linked_event_id: data.linkedEventId,
        severity: data.severity,
        title: data.title,
        summary: data.summary,
        root_cause_hypothesis: data.rootCauseHypothesis,
        created_by: data.createdBy,
        status: 'open',
      })
      .select()
      .single();

    return this.mapToIncident(incident);
  }

  async selectRunbook(incident: Incident): Promise<Runbook | null> {
    const supabase = await getSupabaseServer();

    // Find matching runbooks
    const { data: runbooks } = await supabase
      .from('aire_runbooks')
      .select('*')
      .eq('tenant_id', this.orgId)
      .eq('enabled', true)
      .or(`severity_scope.eq.all,severity_scope.eq.${incident.severity}`);

    if (!runbooks || runbooks.length === 0) {
      return null;
    }

    // Find best match based on trigger conditions
    for (const rb of runbooks) {
      const conditions = rb.trigger_conditions;

      // Check source match
      if (conditions.source && conditions.source !== incident.source) {
        continue;
      }

      // Check severity match
      if (conditions.minSeverity) {
        const severityOrder = ['low', 'medium', 'high', 'critical'];
        const incidentIdx = severityOrder.indexOf(incident.severity);
        const minIdx = severityOrder.indexOf(conditions.minSeverity);
        if (incidentIdx < minIdx) continue;
      }

      // Check title pattern
      if (conditions.titlePattern) {
        const regex = new RegExp(conditions.titlePattern, 'i');
        if (!regex.test(incident.title)) continue;
      }

      // Match found
      return this.mapToRunbook(rb);
    }

    return null;
  }

  async executeRunbookActions(
    incidentId: string,
    runbook: Runbook
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Update incident status
    await supabase
      .from('aire_incidents')
      .update({ status: 'remediating', updated_at: new Date().toISOString() })
      .eq('id', incidentId);

    // Check if HSOE approval required
    if (runbook.requiresHsoeApproval) {
      await this.escalateToHSOE(incidentId, runbook);
      return;
    }

    // Execute actions in order
    const sortedActions = runbook.actions.sort((a, b) => a.order - b.order);

    for (const action of sortedActions) {
      if (action.requiresApproval) {
        await this.escalateToHSOE(incidentId, runbook, action);
        continue;
      }

      const logEntry = await this.logAction(incidentId, {
        actionType: action.type,
        actionPayload: action.payload,
        status: 'running',
        initiatedBy: 'aire_engine',
      });

      try {
        await this.performAction(action);

        await supabase
          .from('aire_actions_log')
          .update({ status: 'success' })
          .eq('id', logEntry.id);
      } catch (error) {
        await supabase
          .from('aire_actions_log')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', logEntry.id);

        // Stop execution on failure
        break;
      }
    }
  }

  private async performAction(action: RunbookAction): Promise<void> {
    switch (action.type) {
      case 'notify':
        // Send notification
        console.log(`[AIRE] Notify: ${JSON.stringify(action.payload)}`);
        break;

      case 'block':
        // Block resource
        console.log(`[AIRE] Block: ${JSON.stringify(action.payload)}`);
        break;

      case 'scale_down':
        // Reduce capacity
        console.log(`[AIRE] Scale down: ${JSON.stringify(action.payload)}`);
        break;

      case 'disable_feature':
        // Disable feature flag
        console.log(`[AIRE] Disable feature: ${JSON.stringify(action.payload)}`);
        break;

      case 'restart':
        // Restart service
        console.log(`[AIRE] Restart: ${JSON.stringify(action.payload)}`);
        break;

      default:
        console.log(`[AIRE] Unknown action: ${action.type}`);
    }
  }

  async performRollback(incidentId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get all successful actions for this incident in reverse order
    const { data: actions } = await supabase
      .from('aire_actions_log')
      .select('*')
      .eq('incident_id', incidentId)
      .eq('status', 'success')
      .order('created_at', { ascending: false });

    if (!actions || actions.length === 0) {
      return;
    }

    // Rollback each action
    for (const action of actions) {
      const rollbackLogEntry = await this.logAction(incidentId, {
        actionType: 'rollback',
        actionPayload: {
          originalAction: action.action_type,
          originalPayload: action.action_payload,
        },
        status: 'running',
        initiatedBy: 'aire_engine',
      });

      try {
        await this.performRollbackAction(action);

        await supabase
          .from('aire_actions_log')
          .update({ status: 'rolled_back' })
          .eq('id', action.id);

        await supabase
          .from('aire_actions_log')
          .update({ status: 'success' })
          .eq('id', rollbackLogEntry.id);
      } catch (error) {
        await supabase
          .from('aire_actions_log')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Rollback failed',
          })
          .eq('id', rollbackLogEntry.id);
      }
    }
  }

  private async performRollbackAction(action: any): Promise<void> {
    const type = action.action_type;

    switch (type) {
      case 'block':
        // Unblock resource
        console.log(`[AIRE] Rollback block: unblocking`);
        break;

      case 'scale_down':
        // Scale back up
        console.log(`[AIRE] Rollback scale_down: scaling up`);
        break;

      case 'disable_feature':
        // Re-enable feature
        console.log(`[AIRE] Rollback disable_feature: re-enabling`);
        break;

      default:
        console.log(`[AIRE] No rollback for action: ${type}`);
    }
  }

  async escalateToHSOE(
    incidentId: string,
    runbook: Runbook,
    action?: RunbookAction
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Update incident status
    await supabase
      .from('aire_incidents')
      .update({ status: 'awaiting_approval', updated_at: new Date().toISOString() })
      .eq('id', incidentId);

    // Log escalation action
    await this.logAction(incidentId, {
      actionType: 'escalate',
      actionPayload: {
        runbookId: runbook.id,
        runbookName: runbook.name,
        pendingAction: action,
      },
      status: 'pending',
      initiatedBy: 'aire_engine',
    });

    // Create HSOE request (would integrate with Phase 82)
    console.log(`[AIRE] Escalated to HSOE for incident ${incidentId}`);
  }

  private async logAction(
    incidentId: string,
    data: {
      actionType: string;
      actionPayload: Record<string, any>;
      status: string;
      initiatedBy: string;
    }
  ): Promise<ActionLog> {
    const supabase = await getSupabaseServer();

    const { data: log } = await supabase
      .from('aire_actions_log')
      .insert({
        tenant_id: this.orgId,
        incident_id: incidentId,
        action_type: data.actionType,
        action_payload: data.actionPayload,
        status: data.status,
        initiated_by: data.initiatedBy,
      })
      .select()
      .single();

    return this.mapToActionLog(log);
  }

  private mapConfidenceToSeverity(confidence: number): string {
    if (confidence >= 80) return 'critical';
    if (confidence >= 60) return 'high';
    if (confidence >= 40) return 'medium';
    return 'low';
  }

  private mapRiskScoreToSeverity(riskScore: number): string {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  private generateHypothesis(features: Record<string, any>): string {
    const parts: string[] = [];

    if (features.lowLogicCount) {
      parts.push(`${features.lowLogicCount} low logic score events detected`);
    }
    if (features.blockCount) {
      parts.push(`${features.blockCount} actions blocked by safety system`);
    }
    if (features.maosFailures) {
      parts.push(`${features.maosFailures} orchestrator run failures`);
    }
    if (features.budgetUtilization) {
      parts.push(`budget utilization at ${features.budgetUtilization}%`);
    }

    return parts.length > 0
      ? `Root cause hypothesis: ${parts.join('; ')}`
      : 'Insufficient data for hypothesis';
  }

  async getIncidents(
    status?: string,
    limit: number = 50
  ): Promise<Incident[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('aire_incidents')
      .select('*')
      .eq('tenant_id', this.orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }

    const { data } = await query;

    return (data || []).map(i => this.mapToIncident(i));
  }

  async getIncident(incidentId: string): Promise<Incident | null> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('aire_incidents')
      .select('*')
      .eq('id', incidentId)
      .single();

    return data ? this.mapToIncident(data) : null;
  }

  async getRunbooks(): Promise<Runbook[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('aire_runbooks')
      .select('*')
      .eq('tenant_id', this.orgId)
      .order('name');

    return (data || []).map(r => this.mapToRunbook(r));
  }

  async getActionsLog(incidentId: string): Promise<ActionLog[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('aire_actions_log')
      .select('*')
      .eq('incident_id', incidentId)
      .order('created_at');

    return (data || []).map(a => this.mapToActionLog(a));
  }

  private mapToIncident(data: any): Incident {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      source: data.source,
      linkedForecastId: data.linked_forecast_id,
      linkedEventId: data.linked_event_id,
      severity: data.severity,
      status: data.status,
      title: data.title,
      summary: data.summary,
      rootCauseHypothesis: data.root_cause_hypothesis,
      createdBy: data.created_by,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : undefined,
    };
  }

  private mapToRunbook(data: any): Runbook {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      name: data.name,
      description: data.description,
      severityScope: data.severity_scope,
      triggerConditions: data.trigger_conditions,
      actions: data.actions,
      requiresHsoeApproval: data.requires_hsoe_approval,
      enabled: data.enabled,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapToActionLog(data: any): ActionLog {
    return {
      id: data.id,
      tenantId: data.tenant_id,
      incidentId: data.incident_id,
      actionType: data.action_type,
      actionPayload: data.action_payload,
      status: data.status,
      errorMessage: data.error_message,
      initiatedBy: data.initiated_by,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## Example Runbooks

### Budget Overrun Runbook

```json
{
  "name": "Budget Overrun Response",
  "description": "Auto-remediate budget risk incidents",
  "severityScope": "high",
  "triggerConditions": {
    "source": "upewe",
    "titlePattern": "budget_risk"
  },
  "actions": [
    {
      "type": "notify",
      "payload": { "channel": "slack", "message": "Budget overrun detected" },
      "order": 1
    },
    {
      "type": "scale_down",
      "payload": { "service": "ai_workers", "percentage": 50 },
      "order": 2
    },
    {
      "type": "disable_feature",
      "payload": { "feature": "extended_thinking" },
      "order": 3,
      "requiresApproval": true
    }
  ],
  "requiresHsoeApproval": false
}
```

### Critical Failure Runbook

```json
{
  "name": "Critical Failure Response",
  "description": "Handle critical system failures",
  "severityScope": "critical",
  "triggerConditions": {
    "minSeverity": "critical"
  },
  "actions": [
    {
      "type": "notify",
      "payload": { "channel": "pagerduty", "priority": "P1" },
      "order": 1
    },
    {
      "type": "block",
      "payload": { "scope": "all_workflows" },
      "order": 2
    }
  ],
  "requiresHsoeApproval": true
}
```

## Severity Model

| Severity | UPEWE Confidence | ASRS Risk Score | Response Time | HSOE Required |
|----------|------------------|-----------------|---------------|---------------|
| Low | 0-39% | 0-39 | 24h | No |
| Medium | 40-59% | 40-59 | 4h | No |
| High | 60-79% | 60-79 | 1h | Optional |
| Critical | 80-100% | 80-100 | 15m | Yes |

## API Endpoints

### POST /api/incident/from-forecast

Create incident from UPEWE forecast.

### POST /api/incident/from-event

Create incident from ASRS/MCSE event.

### GET /api/incidents

Get all incidents.

### GET /api/incidents/:id

Get incident details with actions.

### POST /api/incidents/:id/rollback

Rollback incident actions.

### GET /api/runbooks

Get all runbooks.

### POST /api/runbooks

Create new runbook.

### PUT /api/runbooks/:id

Update runbook.

### POST /api/runbooks/:id/test

Test runbook against sample incident.

## CLI Commands

```bash
# List incidents
unite aire:incidents:list --status=open

# Show incident details
unite aire:incident:show <incident_id>

# List runbooks
unite aire:runbooks:list

# Test runbook
unite aire:runbook:test <runbook_id>

# Trigger rollback
unite aire:incident:rollback <incident_id>
```

## Implementation Tasks

- [ ] Create 138_autonomous_incident_response_remediation_engine.sql
- [ ] Implement AIREngine
- [ ] Create API endpoints
- [ ] Create IncidentList.tsx
- [ ] Create IncidentDetail.tsx
- [ ] Create ActionTimeline.tsx
- [ ] Create RunbookManager.tsx
- [ ] Integrate with UPEWE
- [ ] Integrate with ASRS
- [ ] Integrate with MCSE
- [ ] Integrate with HSOE
- [ ] Add CLI commands
- [ ] Write Jest test suite

---

*Phase 86 - Autonomous Incident Response & Remediation Engine Complete*
