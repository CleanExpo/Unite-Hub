# Phase 81 - Voice-First Agent Execution Layer (VFAEL)

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase81-voice-first-agent-execution-layer`

## Executive Summary

Phase 81 creates a unified voice-first control layer on top of MAOS, Deep Agent, and Unite-Hub services, enabling authenticated users to speak high-level commands (per language, per org) that translate into orchestrated actions—respecting ElevenLabs budgets, tiers, claude.md rules, and safety/approval gates.

## Hard Requirements

| Requirement | Value |
|-------------|-------|
| Must Use ElevenLabs via Existing Voice Engine | Yes |
| Must Respect Voice Token Budgets | Yes |
| Must Respect Language Preferences (Phase 31/44) | Yes |
| Must Only Call Approved Orchestrator Entrypoints | Yes |
| Must Not Expose Internal Model Names | Yes |
| Must Log All Voice Commands and Results | Yes |
| Must Require Auth for All Actions | Yes |
| Must Provide Opt-Out for Recording | Yes |

## Database Schema

### Migration 133: Voice-First Agent Execution Layer

```sql
-- 133_voice_first_agent_execution_layer.sql

-- Voice command sessions table
CREATE TABLE IF NOT EXISTS voice_command_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'en',
  transcript TEXT,
  parsed_intent JSONB DEFAULT '{}'::jsonb,
  orchestrator_run_id UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT voice_command_sessions_status_check CHECK (
    status IN ('pending', 'transcribing', 'parsing', 'executing', 'completed', 'failed', 'cancelled')
  ),

  -- Foreign keys
  CONSTRAINT voice_command_sessions_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT voice_command_sessions_user_fk
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT voice_command_sessions_run_fk
    FOREIGN KEY (orchestrator_run_id) REFERENCES orchestrator_runs(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_command_sessions_org ON voice_command_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_voice_command_sessions_user ON voice_command_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_command_sessions_language ON voice_command_sessions(language_code);
CREATE INDEX IF NOT EXISTS idx_voice_command_sessions_status ON voice_command_sessions(status);
CREATE INDEX IF NOT EXISTS idx_voice_command_sessions_created ON voice_command_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE voice_command_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY voice_command_sessions_select ON voice_command_sessions
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY voice_command_sessions_insert ON voice_command_sessions
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY voice_command_sessions_update ON voice_command_sessions
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE voice_command_sessions IS 'Voice command sessions (Phase 81)';

-- Voice command audit table
CREATE TABLE IF NOT EXISTS voice_command_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL,
  action_name TEXT NOT NULL,
  result_status TEXT NOT NULL,
  token_cost_estimate NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT voice_command_audit_session_fk
    FOREIGN KEY (session_id) REFERENCES voice_command_sessions(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_command_audit_session ON voice_command_audit(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_command_audit_action ON voice_command_audit(action_name);
CREATE INDEX IF NOT EXISTS idx_voice_command_audit_status ON voice_command_audit(result_status);
CREATE INDEX IF NOT EXISTS idx_voice_command_audit_created ON voice_command_audit(created_at DESC);

-- Enable RLS
ALTER TABLE voice_command_audit ENABLE ROW LEVEL SECURITY;

-- RLS Policies (via voice_command_sessions)
CREATE POLICY voice_command_audit_select ON voice_command_audit
  FOR SELECT TO authenticated
  USING (session_id IN (
    SELECT id FROM voice_command_sessions
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY voice_command_audit_insert ON voice_command_audit
  FOR INSERT TO authenticated
  WITH CHECK (session_id IN (
    SELECT id FROM voice_command_sessions
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE voice_command_audit IS 'Voice command audit trail (Phase 81)';
```

## Voice-First Agent Execution Service

```typescript
// src/lib/voice/voice-first-agent-execution.ts

import { getSupabaseServer } from '@/lib/supabase';

interface VoiceCommandSession {
  id: string;
  orgId: string;
  userId: string;
  languageCode: string;
  transcript?: string;
  parsedIntent: Record<string, any>;
  orchestratorRunId?: string;
  status: string;
  createdAt: Date;
}

interface VoiceCommandAudit {
  id: string;
  sessionId: string;
  actionName: string;
  resultStatus: string;
  tokenCostEstimate: number;
  createdAt: Date;
}

interface ParsedIntent {
  action: string;
  parameters: Record<string, any>;
  confidence: number;
  entrypoint?: string;
}

const WHITELISTED_ENTRYPOINTS = [
  'generate_report',
  'analyze_data',
  'get_dashboard_stats',
  'get_forecast',
  'run_workflow',
];

const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ko', 'pt', 'it'];

export class VoiceFirstAgentExecution {
  private orgId: string;

  constructor(orgId: string) {
    this.orgId = orgId;
  }

  async createSession(
    userId: string,
    languageCode: string = 'en'
  ): Promise<VoiceCommandSession> {
    const supabase = await getSupabaseServer();

    if (!SUPPORTED_LANGUAGES.includes(languageCode)) {
      languageCode = 'en';
    }

    const { data } = await supabase
      .from('voice_command_sessions')
      .insert({
        org_id: this.orgId,
        user_id: userId,
        language_code: languageCode,
        status: 'pending',
      })
      .select()
      .single();

    return this.mapToSession(data);
  }

  async processTranscript(
    sessionId: string,
    transcript: string
  ): Promise<VoiceCommandSession> {
    const supabase = await getSupabaseServer();

    // Update with transcript
    await supabase
      .from('voice_command_sessions')
      .update({
        transcript,
        status: 'transcribing',
      })
      .eq('id', sessionId);

    // Parse intent
    const intent = await this.parseIntent(transcript);

    // Update with parsed intent
    await supabase
      .from('voice_command_sessions')
      .update({
        parsed_intent: intent,
        status: 'parsing',
      })
      .eq('id', sessionId);

    // Validate and execute if whitelisted
    if (intent.entrypoint && WHITELISTED_ENTRYPOINTS.includes(intent.entrypoint)) {
      await this.executeIntent(sessionId, intent);
    } else {
      // Mark as completed without execution
      await supabase
        .from('voice_command_sessions')
        .update({ status: 'completed' })
        .eq('id', sessionId);
    }

    return this.getSession(sessionId);
  }

  private async parseIntent(transcript: string): Promise<ParsedIntent> {
    // Intent parsing - would use AI for production
    const lowerTranscript = transcript.toLowerCase();

    if (lowerTranscript.includes('report') || lowerTranscript.includes('generate')) {
      return {
        action: 'generate_report',
        parameters: {},
        confidence: 85,
        entrypoint: 'generate_report',
      };
    }

    if (lowerTranscript.includes('dashboard') || lowerTranscript.includes('stats')) {
      return {
        action: 'get_dashboard_stats',
        parameters: {},
        confidence: 90,
        entrypoint: 'get_dashboard_stats',
      };
    }

    if (lowerTranscript.includes('forecast') || lowerTranscript.includes('predict')) {
      return {
        action: 'get_forecast',
        parameters: {},
        confidence: 80,
        entrypoint: 'get_forecast',
      };
    }

    if (lowerTranscript.includes('analyze') || lowerTranscript.includes('analysis')) {
      return {
        action: 'analyze_data',
        parameters: {},
        confidence: 75,
        entrypoint: 'analyze_data',
      };
    }

    // Default - no actionable intent
    return {
      action: 'unknown',
      parameters: {},
      confidence: 30,
    };
  }

  private async executeIntent(
    sessionId: string,
    intent: ParsedIntent
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Update status
    await supabase
      .from('voice_command_sessions')
      .update({ status: 'executing' })
      .eq('id', sessionId);

    // Would call MAOS orchestrator with the entrypoint
    // For now, simulate execution
    const tokenCost = this.estimateTokenCost(intent.action);

    // Log audit
    await supabase.from('voice_command_audit').insert({
      session_id: sessionId,
      action_name: intent.action,
      result_status: 'success',
      token_cost_estimate: tokenCost,
    });

    // Update status
    await supabase
      .from('voice_command_sessions')
      .update({ status: 'completed' })
      .eq('id', sessionId);
  }

  private estimateTokenCost(action: string): number {
    const costs: Record<string, number> = {
      generate_report: 500,
      get_dashboard_stats: 50,
      get_forecast: 200,
      analyze_data: 300,
      run_workflow: 1000,
    };
    return costs[action] || 100;
  }

  async checkVoiceBudget(userId: string): Promise<{
    remainingSeconds: number;
    tierLimit: number;
    canProceed: boolean;
  }> {
    const supabase = await getSupabaseServer();

    // Get user's voice usage for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('voice_command_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    // Assume 30 seconds per session average
    const usedSeconds = (count || 0) * 30;
    const tierLimit = 3600; // 1 hour per month (tier dependent)
    const remainingSeconds = Math.max(0, tierLimit - usedSeconds);

    return {
      remainingSeconds,
      tierLimit,
      canProceed: remainingSeconds > 0,
    };
  }

  async getSessions(userId?: string): Promise<VoiceCommandSession[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('voice_command_sessions')
      .select('*')
      .eq('org_id', this.orgId)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data } = await query;

    return (data || []).map(s => this.mapToSession(s));
  }

  async getSession(sessionId: string): Promise<VoiceCommandSession> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('voice_command_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    return this.mapToSession(data);
  }

  async getAuditTrail(sessionId: string): Promise<VoiceCommandAudit[]> {
    const supabase = await getSupabaseServer();

    const { data } = await supabase
      .from('voice_command_audit')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at');

    return (data || []).map(a => ({
      id: a.id,
      sessionId: a.session_id,
      actionName: a.action_name,
      resultStatus: a.result_status,
      tokenCostEstimate: a.token_cost_estimate,
      createdAt: new Date(a.created_at),
    }));
  }

  async getUsageStats(userId: string): Promise<{
    totalSessions: number;
    totalTokens: number;
    byLanguage: Record<string, number>;
    byAction: Record<string, number>;
  }> {
    const supabase = await getSupabaseServer();

    const { data: sessions } = await supabase
      .from('voice_command_sessions')
      .select('language_code, parsed_intent')
      .eq('user_id', userId);

    const { data: audits } = await supabase
      .from('voice_command_audit')
      .select('action_name, token_cost_estimate, session_id')
      .in('session_id',
        (sessions || []).map(s => s.id) || []
      );

    const byLanguage: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    let totalTokens = 0;

    for (const session of sessions || []) {
      byLanguage[session.language_code] = (byLanguage[session.language_code] || 0) + 1;
    }

    for (const audit of audits || []) {
      byAction[audit.action_name] = (byAction[audit.action_name] || 0) + 1;
      totalTokens += audit.token_cost_estimate || 0;
    }

    return {
      totalSessions: (sessions || []).length,
      totalTokens,
      byLanguage,
      byAction,
    };
  }

  private mapToSession(data: any): VoiceCommandSession {
    return {
      id: data.id,
      orgId: data.org_id,
      userId: data.user_id,
      languageCode: data.language_code,
      transcript: data.transcript,
      parsedIntent: data.parsed_intent,
      orchestratorRunId: data.orchestrator_run_id,
      status: data.status,
      createdAt: new Date(data.created_at),
    };
  }
}
```

## API Endpoints

### POST /api/voice/sessions

Create voice command session.

### POST /api/voice/process/:sessionId

Process transcript and execute.

### GET /api/voice/budget/:userId

Check voice budget.

### GET /api/voice/sessions

Get all sessions.

### GET /api/voice/audit/:sessionId

Get audit trail for session.

### GET /api/voice/stats/:userId

Get usage statistics.

## Implementation Tasks

- [ ] Create 133_voice_first_agent_execution_layer.sql
- [ ] Implement VoiceFirstAgentExecution
- [ ] Create API endpoints
- [ ] Create VoiceCommandPanel.tsx
- [ ] Create VoiceUsageStats.tsx
- [ ] Integrate with ElevenLabs voice engine
- [ ] Integrate with Phase 31/44 multilingual engine
- [ ] Connect to MAOS orchestrator

---

*Phase 81 - Voice-First Agent Execution Layer Complete*
