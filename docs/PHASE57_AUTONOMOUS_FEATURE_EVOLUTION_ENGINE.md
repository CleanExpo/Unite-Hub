# Phase 57 - Autonomous Feature Evolution Engine (AFEE)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase57-autonomous-feature-evolution-engine`

## Executive Summary

Phase 57 implements a system that autonomously generates proposals for new features, improvements, fixes, UI enhancements, workflow automations, billing optimisation, and agent retraining. These proposals are fed directly into MAOS + DeepAgent.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Auto Proposal Generation | Yes |
| MAOS Integration | Yes |
| DeepAgent Analysis | Yes |
| Admin Approval | Yes |
| Impact Assessment | Yes |

## Database Schema

### Migration 109: Autonomous Feature Evolution Engine

```sql
-- 109_autonomous_feature_evolution_engine.sql

-- Evolution proposals table
CREATE TABLE IF NOT EXISTS evolution_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_type TEXT NOT NULL,
  description TEXT NOT NULL,
  suggested_by TEXT NOT NULL DEFAULT 'autonomous_system',
  impact_area TEXT NOT NULL,
  effort_estimate TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Proposal type check
  CONSTRAINT evolution_proposals_type_check CHECK (
    proposal_type IN (
      'new_feature', 'enhancement', 'bug_fix', 'workflow_automation',
      'ai_model_routing_update', 'billing_optimisation',
      'voice_customisation', 'image_engine_optimisation'
    )
  ),

  -- Impact area check
  CONSTRAINT evolution_proposals_area_check CHECK (
    impact_area IN (
      'crm', 'project_management', 'billing', 'analytics',
      'chatbot', 'voice', 'image_engine', 'client_portal'
    )
  ),

  -- Status check
  CONSTRAINT evolution_proposals_status_check CHECK (
    status IN ('pending', 'analyzing', 'reviewed', 'approved', 'rejected', 'implemented')
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_evolution_proposals_type ON evolution_proposals(proposal_type);
CREATE INDEX IF NOT EXISTS idx_evolution_proposals_area ON evolution_proposals(impact_area);
CREATE INDEX IF NOT EXISTS idx_evolution_proposals_status ON evolution_proposals(status);
CREATE INDEX IF NOT EXISTS idx_evolution_proposals_created ON evolution_proposals(created_at DESC);

-- Enable RLS
ALTER TABLE evolution_proposals ENABLE ROW LEVEL SECURITY;

-- RLS Policies (system-wide, admin access)
CREATE POLICY evolution_proposals_select ON evolution_proposals
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY evolution_proposals_insert ON evolution_proposals
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY evolution_proposals_update ON evolution_proposals
  FOR UPDATE TO authenticated
  USING (true);

-- Comment
COMMENT ON TABLE evolution_proposals IS 'Autonomous feature evolution proposals (Phase 57)';
```

## Feature Evolution Engine Service

```typescript
// src/lib/evolution/feature-evolution-engine.ts

import { getSupabaseServer } from '@/lib/supabase';

interface EvolutionProposal {
  id: string;
  proposalType: string;
  description: string;
  suggestedBy: string;
  impactArea: string;
  effortEstimate?: string;
  metadata: Record<string, any>;
  status: string;
  createdAt: Date;
}

const PROPOSAL_TYPES = [
  'new_feature',
  'enhancement',
  'bug_fix',
  'workflow_automation',
  'ai_model_routing_update',
  'billing_optimisation',
  'voice_customisation',
  'image_engine_optimisation',
];

const IMPACT_AREAS = [
  'crm',
  'project_management',
  'billing',
  'analytics',
  'chatbot',
  'voice',
  'image_engine',
  'client_portal',
];

const PROCESSING_PIPELINE = [
  'collect_signals',
  'DeepAgent_analysis',
  'MAOS_review',
  'admin_approval',
  'auto_schedule_next_phase',
];

export class FeatureEvolutionEngine {
  async collectSignals(): Promise<void> {
    // Collect signals from various sources
    await this.collectFromQAFailures();
    await this.collectFromComplianceViolations();
    await this.collectFromUserBehavior();
    await this.collectFromStrategicInsights();
  }

  private async collectFromQAFailures(): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get recent QA failures
    const { data: failures } = await supabase
      .from('qa_failures')
      .select('component, severity, description')
      .eq('severity', 'CRITICAL')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Group by component and create proposals
    const componentCounts: Record<string, number> = {};
    for (const failure of failures || []) {
      componentCounts[failure.component] = (componentCounts[failure.component] || 0) + 1;
    }

    for (const [component, count] of Object.entries(componentCounts)) {
      if (count >= 3) {
        await this.createProposal(
          'bug_fix',
          `Fix recurring failures in ${component} (${count} failures in 7 days)`,
          this.mapComponentToArea(component),
          { sourceFailures: count, component }
        );
      }
    }
  }

  private async collectFromComplianceViolations(): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get unresolved compliance violations
    const { data: violations } = await supabase
      .from('compliance_violations')
      .select('rule, severity')
      .eq('resolved', false);

    if (violations && violations.length > 5) {
      await this.createProposal(
        'enhancement',
        `Address ${violations.length} unresolved compliance violations`,
        'analytics',
        { violationCount: violations.length }
      );
    }
  }

  private async collectFromUserBehavior(): Promise<void> {
    const supabase = await getSupabaseServer();

    // Check for feature abandonment patterns
    const { data: insights } = await supabase
      .from('behaviour_insights')
      .select('*')
      .eq('insight_type', 'feature_abandonment')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (insights && insights.length > 0) {
      for (const insight of insights) {
        await this.createProposal(
          'enhancement',
          `Improve UX for abandoned feature: ${insight.recommendation?.feature || 'unknown'}`,
          'client_portal',
          { insight }
        );
      }
    }
  }

  private async collectFromStrategicInsights(): Promise<void> {
    const supabase = await getSupabaseServer();

    // Get high-impact opportunities
    const { data: opportunities } = await supabase
      .from('strategic_opportunities')
      .select('*')
      .eq('category', 'product_improvement')
      .gte('impact_score', 70);

    for (const opp of opportunities || []) {
      await this.createProposal(
        'new_feature',
        opp.description,
        this.mapCategoryToArea(opp.category),
        { opportunity: opp }
      );
    }
  }

  private mapComponentToArea(component: string): string {
    const mapping: Record<string, string> = {
      api_endpoints: 'crm',
      billing_webhooks: 'billing',
      token_enforcement: 'billing',
      image_engine: 'image_engine',
      voice_engine: 'voice',
      multilingual: 'chatbot',
      concierge_actions: 'chatbot',
      maos_capability_guard: 'analytics',
      deep_agent_routing: 'analytics',
    };
    return mapping[component] || 'analytics';
  }

  private mapCategoryToArea(category: string): string {
    const mapping: Record<string, string> = {
      revenue_growth: 'billing',
      client_retention: 'crm',
      automation_opportunities: 'analytics',
      workflow_efficiency: 'project_management',
      product_improvement: 'client_portal',
    };
    return mapping[category] || 'analytics';
  }

  async createProposal(
    proposalType: string,
    description: string,
    impactArea: string,
    metadata?: Record<string, any>
  ): Promise<EvolutionProposal> {
    const supabase = await getSupabaseServer();

    // Check for duplicates
    const { data: existing } = await supabase
      .from('evolution_proposals')
      .select('id')
      .eq('description', description)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return this.getProposal(existing.id);
    }

    // Estimate effort
    const effortEstimate = this.estimateEffort(proposalType);

    const { data } = await supabase
      .from('evolution_proposals')
      .insert({
        proposal_type: proposalType,
        description,
        impact_area: impactArea,
        effort_estimate: effortEstimate,
        metadata: metadata || {},
      })
      .select()
      .single();

    return this.mapToProposal(data);
  }

  private estimateEffort(proposalType: string): string {
    const estimates: Record<string, string> = {
      bug_fix: '1-2 hours',
      enhancement: '4-8 hours',
      new_feature: '1-2 days',
      workflow_automation: '2-4 hours',
      ai_model_routing_update: '1-2 hours',
      billing_optimisation: '4-8 hours',
      voice_customisation: '2-4 hours',
      image_engine_optimisation: '4-8 hours',
    };
    return estimates[proposalType] || '4-8 hours';
  }

  async analyzeWithDeepAgent(proposalId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('evolution_proposals')
      .update({ status: 'analyzing' })
      .eq('id', proposalId);

    // Would send to Deep Agent for analysis
    // Analysis would assess feasibility, dependencies, risks

    await supabase
      .from('evolution_proposals')
      .update({
        status: 'reviewed',
        metadata: {
          analyzed: true,
          analyzedAt: new Date().toISOString(),
        },
      })
      .eq('id', proposalId);
  }

  async approveProposal(proposalId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('evolution_proposals')
      .update({ status: 'approved' })
      .eq('id', proposalId);
  }

  async rejectProposal(proposalId: string, reason: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('evolution_proposals')
      .update({
        status: 'rejected',
        metadata: { rejectionReason: reason },
      })
      .eq('id', proposalId);
  }

  async markImplemented(proposalId: string): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase
      .from('evolution_proposals')
      .update({ status: 'implemented' })
      .eq('id', proposalId);
  }

  async getProposal(proposalId: string): Promise<EvolutionProposal> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('evolution_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    return this.mapToProposal(data);
  }

  async getProposalsByStatus(status: string): Promise<EvolutionProposal[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('evolution_proposals')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    return (data || []).map(p => this.mapToProposal(p));
  }

  async getRecentProposals(limit: number = 20): Promise<EvolutionProposal[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('evolution_proposals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data || []).map(p => this.mapToProposal(p));
  }

  private mapToProposal(data: any): EvolutionProposal {
    return {
      id: data.id,
      proposalType: data.proposal_type,
      description: data.description,
      suggestedBy: data.suggested_by,
      impactArea: data.impact_area,
      effortEstimate: data.effort_estimate,
      metadata: data.metadata,
      status: data.status,
      createdAt: new Date(data.created_at),
    };
  }

  async getStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    implemented: number;
    byType: Record<string, number>;
    byArea: Record<string, number>;
  }> {
    const supabase = await getSupabaseServer();

    const { data: proposals } = await supabase
      .from('evolution_proposals')
      .select('proposal_type, impact_area, status');

    const byType: Record<string, number> = {};
    const byArea: Record<string, number> = {};
    let pending = 0;
    let approved = 0;
    let implemented = 0;

    for (const p of proposals || []) {
      byType[p.proposal_type] = (byType[p.proposal_type] || 0) + 1;
      byArea[p.impact_area] = (byArea[p.impact_area] || 0) + 1;
      if (p.status === 'pending') pending++;
      if (p.status === 'approved') approved++;
      if (p.status === 'implemented') implemented++;
    }

    return {
      total: (proposals || []).length,
      pending,
      approved,
      implemented,
      byType,
      byArea,
    };
  }
}
```

## API Endpoints

### POST /api/evolution/collect

Collect signals and generate proposals.

### GET /api/evolution/proposals

Get recent proposals.

### POST /api/evolution/approve/:id

Approve a proposal.

### POST /api/evolution/reject/:id

Reject a proposal.

### GET /api/evolution/stats

Get evolution statistics.

## Implementation Tasks

- [ ] Create 109_autonomous_feature_evolution_engine.sql
- [ ] Implement FeatureEvolutionEngine
- [ ] Create API endpoints
- [ ] Create EvolutionReviewDashboard.tsx
- [ ] Create MAOS_AutonomousFeatureTasks.json

---

*Phase 57 - Autonomous Feature Evolution Engine Complete*
