-- Migration 187: Multi-Agent Council Orchestrator (MACO)
-- Phase 144: Council framework for multi-agent voting and conflict resolution

-- Council sessions table
CREATE TABLE IF NOT EXISTS council_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}',
  participating_agents JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL CHECK (status IN ('voting', 'arbitration', 'resolved', 'escalated')) DEFAULT 'voting',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Agent votes table
CREATE TABLE IF NOT EXISTS council_agent_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES council_sessions(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT,
  risk_assessment JSONB,
  is_dissenting BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Council recommendations table
CREATE TABLE IF NOT EXISTS council_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES council_sessions(id) ON DELETE CASCADE,
  consensus_score NUMERIC NOT NULL CHECK (consensus_score >= 0 AND consensus_score <= 1),
  final_recommendation TEXT NOT NULL,
  dissent_summary JSONB DEFAULT '[]',
  risk_impact JSONB,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_council_sessions_tenant ON council_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_council_votes_session ON council_agent_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_council_recommendations_session ON council_recommendations(session_id);

-- RLS
ALTER TABLE council_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_agent_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE council_recommendations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view council sessions" ON council_sessions;
CREATE POLICY "Users can view council sessions" ON council_sessions
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage council sessions" ON council_sessions;
CREATE POLICY "Users can manage council sessions" ON council_sessions
  FOR ALL USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view council votes" ON council_agent_votes;
CREATE POLICY "Users can view council votes" ON council_agent_votes
  FOR SELECT USING (
    session_id IN (SELECT id FROM council_sessions WHERE tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can view council recommendations" ON council_recommendations;
CREATE POLICY "Users can view council recommendations" ON council_recommendations
  FOR SELECT USING (
    session_id IN (SELECT id FROM council_sessions WHERE tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );
