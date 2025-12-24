-- Migration 112: Autonomous Support & Ops Engine
-- Required by Phase 60 - Autonomous Support & Ops Engine (ASOE)
-- AI-powered customer support and operations automation

-- Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  user_id UUID,
  category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  resolution JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Category check
  CONSTRAINT support_tickets_category_check CHECK (
    category IN (
      'billing', 'technical', 'feature_request', 'bug_report',
      'account', 'integration', 'performance', 'general'
    )
  ),

  -- Severity check
  CONSTRAINT support_tickets_severity_check CHECK (
    severity IN ('low', 'medium', 'high', 'critical')
  ),

  -- Status check
  CONSTRAINT support_tickets_status_check CHECK (
    status IN ('open', 'triaging', 'in_progress', 'resolved', 'escalated', 'closed')
  ),

  -- Foreign keys
  CONSTRAINT support_tickets_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT support_tickets_user_fk
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_org ON support_tickets(org_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON support_tickets(category);
CREATE INDEX IF NOT EXISTS idx_support_tickets_severity ON support_tickets(severity);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);

-- Enable RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY support_tickets_select ON support_tickets
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY support_tickets_insert ON support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY support_tickets_update ON support_tickets
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE support_tickets IS 'Support tickets with AI triage (Phase 60)';

-- Support sessions table
CREATE TABLE IF NOT EXISTS support_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL,
  assistant_type TEXT NOT NULL DEFAULT 'ai',
  messages JSONB DEFAULT '[]'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Assistant type check
  CONSTRAINT support_sessions_assistant_check CHECK (
    assistant_type IN ('ai', 'human', 'hybrid')
  ),

  -- Foreign key
  CONSTRAINT support_sessions_ticket_fk
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_sessions_ticket ON support_sessions(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_sessions_assistant ON support_sessions(assistant_type);
CREATE INDEX IF NOT EXISTS idx_support_sessions_resolved ON support_sessions(resolved);
CREATE INDEX IF NOT EXISTS idx_support_sessions_created ON support_sessions(created_at DESC);

-- Enable RLS
ALTER TABLE support_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY support_sessions_select ON support_sessions
  FOR SELECT TO authenticated
  USING (ticket_id IN (
    SELECT id FROM support_tickets
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY support_sessions_insert ON support_sessions
  FOR INSERT TO authenticated
  WITH CHECK (ticket_id IN (
    SELECT id FROM support_tickets
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY support_sessions_update ON support_sessions
  FOR UPDATE TO authenticated
  USING (ticket_id IN (
    SELECT id FROM support_tickets
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE support_sessions IS 'Support session conversations (Phase 60)';
