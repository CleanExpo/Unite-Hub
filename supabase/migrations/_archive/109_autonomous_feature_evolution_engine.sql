-- Migration 109: Autonomous Feature Evolution Engine
-- Required by Phase 57 - Autonomous Feature Evolution Engine (AFEE)
-- Autonomous feature proposals and evolution tracking

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
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true);

CREATE POLICY evolution_proposals_insert ON evolution_proposals
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY evolution_proposals_update ON evolution_proposals
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND true);

-- Comment
COMMENT ON TABLE evolution_proposals IS 'Autonomous feature evolution proposals (Phase 57)';
