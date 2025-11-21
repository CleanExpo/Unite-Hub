# Phase 50 - Client Journey Intelligence (CJI)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase50-client-journey-intelligence`

## Executive Summary

Phase 50 implements a full-funnel client intelligence engine that maps every client's lifecycle: leads → onboarding → project delivery → billing → retention → upsell. Generates predictions, risks, and next-action recommendations.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Stage Tracking | Yes |
| Risk Detection | Yes |
| Next Best Action | Yes |
| Multi-Stage Model | Yes |
| RLS Isolation | Yes |

## Database Schema

### Migration 102: Client Journey Intelligence

```sql
-- 102_client_journey_intelligence.sql

-- Client journey events table
CREATE TABLE IF NOT EXISTS client_journey_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL,
  org_id UUID NOT NULL,
  stage TEXT NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),

  -- Stage check
  CONSTRAINT client_journey_events_stage_check CHECK (
    stage IN (
      'lead', 'qualified_lead', 'onboarding', 'active_project',
      'awaiting_feedback', 'billing', 'retention', 'upsell_candidate', 'churn_risk'
    )
  ),

  -- Foreign keys
  CONSTRAINT client_journey_events_client_fk
    FOREIGN KEY (client_id) REFERENCES contacts(id) ON DELETE CASCADE,
  CONSTRAINT client_journey_events_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_journey_events_client ON client_journey_events(client_id);
CREATE INDEX IF NOT EXISTS idx_client_journey_events_org ON client_journey_events(org_id);
CREATE INDEX IF NOT EXISTS idx_client_journey_events_stage ON client_journey_events(stage);
CREATE INDEX IF NOT EXISTS idx_client_journey_events_occurred ON client_journey_events(occurred_at DESC);

-- Enable RLS
ALTER TABLE client_journey_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY client_journey_events_select ON client_journey_events
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY client_journey_events_insert ON client_journey_events
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE client_journey_events IS 'Client lifecycle events tracking (Phase 50)';

-- Client journey scores table
CREATE TABLE IF NOT EXISTS client_journey_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL,
  org_id UUID NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'LOW',
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Risk level check
  CONSTRAINT client_journey_scores_risk_check CHECK (
    risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
  ),

  -- Foreign keys
  CONSTRAINT client_journey_scores_client_fk
    FOREIGN KEY (client_id) REFERENCES contacts(id) ON DELETE CASCADE,
  CONSTRAINT client_journey_scores_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_journey_scores_client ON client_journey_scores(client_id);
CREATE INDEX IF NOT EXISTS idx_client_journey_scores_org ON client_journey_scores(org_id);
CREATE INDEX IF NOT EXISTS idx_client_journey_scores_risk ON client_journey_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_client_journey_scores_generated ON client_journey_scores(generated_at DESC);

-- Enable RLS
ALTER TABLE client_journey_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY client_journey_scores_select ON client_journey_scores
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY client_journey_scores_insert ON client_journey_scores
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY client_journey_scores_update ON client_journey_scores
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE client_journey_scores IS 'Client journey scores with risk and actions (Phase 50)';
```

## Client Journey Service

```typescript
// src/lib/journey/client-journey-service.ts

import { getSupabaseServer } from '@/lib/supabase';

interface JourneyEvent {
  clientId: string;
  stage: string;
  eventType: string;
  metadata?: Record<string, any>;
}

interface JourneyScore {
  clientId: string;
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedActions: string[];
}

const STAGES = [
  'lead',
  'qualified_lead',
  'onboarding',
  'active_project',
  'awaiting_feedback',
  'billing',
  'retention',
  'upsell_candidate',
  'churn_risk',
];

const RISK_FACTORS = [
  'low_engagement',
  'late_invoices',
  'slow_project_progress',
  'negative_sentiment',
  'low_feature_usage',
  'high_support_tickets',
];

const ACTIONS = [
  'email_outreach',
  'schedule_meeting',
  'send_voice_message',
  'concierge_personal_intervention',
  'offer_credit_pack',
  'trigger_satisfaction_survey',
];

export class ClientJourneyService {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async trackEvent(event: JourneyEvent): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from('client_journey_events').insert({
      client_id: event.clientId,
      org_id: this.orgId,
      stage: event.stage,
      event_type: event.eventType,
      metadata: event.metadata || {},
    });
  }

  async getClientJourney(clientId: string): Promise<any[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('client_journey_events')
      .select('*')
      .eq('client_id', clientId)
      .eq('org_id', this.orgId)
      .order('occurred_at', { ascending: true });

    return data || [];
  }

  async getCurrentStage(clientId: string): Promise<string> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('client_journey_events')
      .select('stage')
      .eq('client_id', clientId)
      .eq('org_id', this.orgId)
      .order('occurred_at', { ascending: false })
      .limit(1)
      .single();

    return data?.stage || 'lead';
  }

  async calculateJourneyScore(clientId: string): Promise<JourneyScore> {
    const supabase = await getSupabaseServer();

    // Get client events
    const events = await this.getClientJourney(clientId);

    // Get engagement metrics
    const { data: contact } = await supabase
      .from('contacts')
      .select('ai_score, status')
      .eq('id', clientId)
      .single();

    // Calculate base score
    let score = contact?.ai_score || 50;

    // Adjust based on journey stage
    const currentStage = await this.getCurrentStage(clientId);
    const stageIndex = STAGES.indexOf(currentStage);
    score += stageIndex * 5;

    // Detect risks
    const risks = await this.detectRisks(clientId);
    const riskPenalty = risks.length * 10;
    score = Math.max(0, score - riskPenalty);

    // Determine risk level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    if (risks.length >= 4) riskLevel = 'CRITICAL';
    else if (risks.length >= 3) riskLevel = 'HIGH';
    else if (risks.length >= 2) riskLevel = 'MEDIUM';

    // Generate recommended actions
    const recommendedActions = this.generateActions(currentStage, risks);

    // Persist score
    await supabase.from('client_journey_scores').insert({
      client_id: clientId,
      org_id: this.orgId,
      score,
      risk_level: riskLevel,
      recommended_actions: recommendedActions,
    });

    return {
      clientId,
      score,
      riskLevel,
      recommendedActions,
    };
  }

  async detectRisks(clientId: string): Promise<string[]> {
    const supabase = await getSupabaseServer();
    const risks: string[] = [];

    // Check engagement
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const { count: eventCount } = await supabase
      .from('client_journey_events')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .gte('occurred_at', thirtyDaysAgo.toISOString());

    if ((eventCount || 0) < 3) {
      risks.push('low_engagement');
    }

    // Check for billing issues
    const { data: billingEvents } = await supabase
      .from('client_journey_events')
      .select('metadata')
      .eq('client_id', clientId)
      .eq('stage', 'billing')
      .eq('event_type', 'invoice_overdue');

    if (billingEvents && billingEvents.length > 0) {
      risks.push('late_invoices');
    }

    // Check for negative sentiment in recent events
    const { data: recentEvents } = await supabase
      .from('client_journey_events')
      .select('metadata')
      .eq('client_id', clientId)
      .order('occurred_at', { ascending: false })
      .limit(10);

    const negativeEvents = (recentEvents || []).filter(
      e => e.metadata?.sentiment === 'negative'
    );

    if (negativeEvents.length >= 2) {
      risks.push('negative_sentiment');
    }

    return risks;
  }

  generateActions(stage: string, risks: string[]): string[] {
    const actions: string[] = [];

    // Stage-based actions
    switch (stage) {
      case 'lead':
      case 'qualified_lead':
        actions.push('email_outreach');
        break;
      case 'onboarding':
        actions.push('schedule_meeting');
        break;
      case 'awaiting_feedback':
        actions.push('trigger_satisfaction_survey');
        break;
      case 'churn_risk':
        actions.push('concierge_personal_intervention');
        break;
      case 'upsell_candidate':
        actions.push('offer_credit_pack');
        break;
    }

    // Risk-based actions
    if (risks.includes('low_engagement')) {
      actions.push('send_voice_message');
    }
    if (risks.includes('late_invoices')) {
      actions.push('email_outreach');
    }
    if (risks.includes('negative_sentiment')) {
      actions.push('concierge_personal_intervention');
    }

    // Deduplicate
    return [...new Set(actions)];
  }

  async getNextBestAction(clientId: string): Promise<string | null> {
    const score = await this.calculateJourneyScore(clientId);
    return score.recommendedActions[0] || null;
  }

  async getHighRiskClients(): Promise<any[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('client_journey_scores')
      .select(`
        *,
        contacts:client_id (
          id, name, email
        )
      `)
      .eq('org_id', this.orgId)
      .in('risk_level', ['HIGH', 'CRITICAL'])
      .order('generated_at', { ascending: false });

    return data || [];
  }

  async getUpsellCandidates(): Promise<any[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('client_journey_events')
      .select(`
        client_id,
        contacts:client_id (
          id, name, email
        )
      `)
      .eq('org_id', this.orgId)
      .eq('stage', 'upsell_candidate')
      .order('occurred_at', { ascending: false });

    // Deduplicate by client
    const seen = new Set();
    return (data || []).filter(item => {
      if (seen.has(item.client_id)) return false;
      seen.add(item.client_id);
      return true;
    });
  }
}
```

## Next Best Action Engine

```typescript
// src/lib/journey/next-best-action-engine.ts

import { ClientJourneyService } from './client-journey-service';

export class NextBestActionEngine {
  private journeyService: ClientJourneyService;

  constructor(orgId: string) {
    this.journeyService = new ClientJourneyService(orgId);
  }

  async getActionForClient(clientId: string): Promise<{
    action: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    reason: string;
  } | null> {
    const score = await this.journeyService.calculateJourneyScore(clientId);

    if (score.recommendedActions.length === 0) {
      return null;
    }

    const action = score.recommendedActions[0];

    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'low';
    if (score.riskLevel === 'CRITICAL') priority = 'urgent';
    else if (score.riskLevel === 'HIGH') priority = 'high';
    else if (score.riskLevel === 'MEDIUM') priority = 'medium';

    const reason = this.getActionReason(action, score.riskLevel);

    return { action, priority, reason };
  }

  private getActionReason(action: string, riskLevel: string): string {
    const reasons: Record<string, string> = {
      email_outreach: 'Client needs re-engagement via email',
      schedule_meeting: 'Personal meeting recommended for onboarding',
      send_voice_message: 'Voice message can improve engagement',
      concierge_personal_intervention: `${riskLevel} risk detected - personal intervention needed`,
      offer_credit_pack: 'Good candidate for additional services',
      trigger_satisfaction_survey: 'Collect feedback on recent work',
    };

    return reasons[action] || 'Action recommended based on journey analysis';
  }
}
```

## API Endpoints

### POST /api/journey/event

Track a journey event.

```typescript
// Request
{
  "clientId": "uuid",
  "stage": "onboarding",
  "eventType": "meeting_scheduled",
  "metadata": { "meetingDate": "2025-11-25" }
}
```

### GET /api/journey/client/:id

Get client journey and score.

### GET /api/journey/high-risk

Get high-risk clients.

### GET /api/journey/next-action/:clientId

Get next best action for client.

## Implementation Tasks

- [ ] Create 102_client_journey_intelligence.sql
- [ ] Implement ClientJourneyService
- [ ] Implement NextBestActionEngine
- [ ] Create API endpoints
- [ ] Create ClientJourneyMap.tsx

---

*Phase 50 - Client Journey Intelligence Complete*
