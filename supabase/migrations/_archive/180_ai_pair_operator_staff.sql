-- Migration 180: AI Pair-Operator for Staff
-- Phase 137: Constrained AI co-pilot for operators (advisory only)

-- Pair operator sessions table
CREATE TABLE IF NOT EXISTS pair_operator_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  context JSONB NOT NULL DEFAULT '{}',
  messages JSONB NOT NULL DEFAULT '[]',
  suggestions_given INTEGER DEFAULT 0,
  vetoed_suggestions INTEGER DEFAULT 0,
  confidence_avg NUMERIC CHECK (confidence_avg >= 0 AND confidence_avg <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Pair operator suggestions table
CREATE TABLE IF NOT EXISTS pair_operator_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES pair_operator_sessions(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('action', 'insight', 'warning', 'question')),
  content TEXT NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  was_vetoed BOOLEAN DEFAULT false,
  veto_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pair_sessions_tenant ON pair_operator_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pair_sessions_user ON pair_operator_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_pair_suggestions_session ON pair_operator_suggestions(session_id);

-- RLS
ALTER TABLE pair_operator_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pair_operator_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view pair sessions" ON pair_operator_sessions;
CREATE POLICY "Users can view pair sessions" ON pair_operator_sessions
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage pair sessions" ON pair_operator_sessions;
CREATE POLICY "Users can manage pair sessions" ON pair_operator_sessions
  FOR ALL USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can view pair suggestions" ON pair_operator_suggestions;
CREATE POLICY "Users can view pair suggestions" ON pair_operator_suggestions
  FOR SELECT USING (
    session_id IN (SELECT id FROM pair_operator_sessions WHERE tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );

DROP POLICY IF EXISTS "Users can manage pair suggestions" ON pair_operator_suggestions;
CREATE POLICY "Users can manage pair suggestions" ON pair_operator_suggestions
  FOR ALL USING (
    session_id IN (SELECT id FROM pair_operator_sessions WHERE tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()))
  );
