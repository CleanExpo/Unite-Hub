-- Migration 179: Operator Coaching Mode
-- Phase 136: Real-time coaching prompts based on live dashboards and risks

-- Coaching prompts table
CREATE TABLE IF NOT EXISTS operator_coaching_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID,
  prompt_type TEXT NOT NULL CHECK (prompt_type IN ('suggestion', 'warning', 'opportunity', 'reminder')),
  message TEXT NOT NULL,
  context_dashboards JSONB NOT NULL DEFAULT '[]',
  action_recommended TEXT,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  is_acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coaching_prompts_tenant ON operator_coaching_prompts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coaching_prompts_user ON operator_coaching_prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_coaching_prompts_ack ON operator_coaching_prompts(is_acknowledged);

-- RLS
ALTER TABLE operator_coaching_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view coaching prompts" ON operator_coaching_prompts;
CREATE POLICY "Users can view coaching prompts" ON operator_coaching_prompts
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage coaching prompts" ON operator_coaching_prompts;
CREATE POLICY "Users can manage coaching prompts" ON operator_coaching_prompts
  FOR ALL USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
