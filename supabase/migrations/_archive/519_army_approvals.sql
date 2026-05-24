-- 519: Human-in-the-loop approval queue for high-value agent actions
CREATE TABLE IF NOT EXISTS army_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid,
  agent_id text NOT NULL,
  commander text,
  action_type text NOT NULL, -- 'outreach', 'purchase', 'content_post', 'price_change'
  title text NOT NULL,
  description text,
  payload jsonb DEFAULT '{}',
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  priority text DEFAULT 'medium',
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '24 hours')
);

ALTER TABLE army_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_approvals"
  ON army_approvals FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_army_approvals_status ON army_approvals (status);
CREATE INDEX IF NOT EXISTS idx_army_approvals_created ON army_approvals (created_at DESC);
