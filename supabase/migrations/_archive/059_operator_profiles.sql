-- Phase 10 Week 1-2: Operator Mode Foundation
-- Creates operator profiles with roles and permissions

-- Operator Profiles Table
CREATE TABLE IF NOT EXISTS operator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,

  -- Role (OWNER > MANAGER > ANALYST)
  role TEXT NOT NULL DEFAULT 'ANALYST' CHECK (role IN ('OWNER', 'MANAGER', 'ANALYST')),

  -- Granular permissions
  can_approve_low BOOLEAN NOT NULL DEFAULT false,
  can_approve_medium BOOLEAN NOT NULL DEFAULT false,
  can_approve_high BOOLEAN NOT NULL DEFAULT false,
  can_execute BOOLEAN NOT NULL DEFAULT false,
  can_rollback BOOLEAN NOT NULL DEFAULT false,
  can_configure_scopes BOOLEAN NOT NULL DEFAULT false,
  can_manage_operators BOOLEAN NOT NULL DEFAULT false,

  -- Domain-specific permissions
  allowed_domains TEXT[] DEFAULT ARRAY['SEO', 'CONTENT', 'ADS', 'CRO'],

  -- Notification preferences
  notify_on_proposal BOOLEAN NOT NULL DEFAULT true,
  notify_on_approval_needed BOOLEAN NOT NULL DEFAULT true,
  notify_on_execution BOOLEAN NOT NULL DEFAULT true,
  notify_on_rollback BOOLEAN NOT NULL DEFAULT true,
  notify_email BOOLEAN NOT NULL DEFAULT true,
  notify_in_app BOOLEAN NOT NULL DEFAULT true,

  -- Daily limits
  daily_approval_limit INTEGER DEFAULT 50,
  approvals_today INTEGER DEFAULT 0,
  last_approval_reset TIMESTAMPTZ DEFAULT NOW(),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(user_id, organization_id)
);

-- Approval Queue Table
CREATE TABLE IF NOT EXISTS operator_approval_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES autonomy_proposals(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,

  -- Queue status
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ASSIGNED', 'APPROVED', 'REJECTED', 'ESCALATED', 'EXPIRED')),
  priority INTEGER NOT NULL DEFAULT 5, -- 1-10, higher = more urgent

  -- Assignment
  -- Keep FK reference to auth.users (allowed in migrations)
assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,

  -- Resolution
  -- Keep FK reference to auth.users (allowed in migrations)
resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  -- Escalation
  -- Keep FK reference to auth.users (allowed in migrations)
escalated_to UUID REFERENCES auth.users(id),
  escalation_reason TEXT,

  -- Expiry
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Operator Notifications Table
CREATE TABLE IF NOT EXISTS operator_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,

  -- Notification type
  type TEXT NOT NULL CHECK (type IN (
    'PROPOSAL_CREATED',
    'APPROVAL_NEEDED',
    'PROPOSAL_APPROVED',
    'PROPOSAL_REJECTED',
    'EXECUTION_COMPLETE',
    'EXECUTION_FAILED',
    'ROLLBACK_REQUESTED',
    'QUEUE_ASSIGNED',
    'ESCALATION'
  )),

  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- References
  proposal_id UUID REFERENCES autonomy_proposals(id),
  queue_item_id UUID REFERENCES operator_approval_queue(id),

  -- Status
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Delivery
  email_sent BOOLEAN DEFAULT false,
  email_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_operator_profiles_user ON operator_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_operator_profiles_org ON operator_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_operator_profiles_role ON operator_profiles(role);

CREATE INDEX IF NOT EXISTS idx_approval_queue_status ON operator_approval_queue(status);
CREATE INDEX IF NOT EXISTS idx_approval_queue_org ON operator_approval_queue(organization_id);
CREATE INDEX IF NOT EXISTS idx_approval_queue_assigned ON operator_approval_queue(assigned_to);
CREATE INDEX IF NOT EXISTS idx_approval_queue_expires ON operator_approval_queue(expires_at);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON operator_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON operator_notifications(user_id, read) WHERE read = false;

-- RLS Policies
ALTER TABLE operator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_notifications ENABLE ROW LEVEL SECURITY;

-- Operator profiles: users can see their own, owners/managers can see org
CREATE POLICY "Users can view own operator profile"
  ON operator_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Org admins can manage operator profiles"
  ON operator_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_id = auth.uid()
      AND org_id = operator_profiles.organization_id
      AND role IN ('owner', 'admin')
    )
  );

-- Approval queue: operators in org can view
CREATE POLICY "Operators can view org queue"
  ON operator_approval_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM operator_profiles
      WHERE user_id = auth.uid()
      AND organization_id = operator_approval_queue.organization_id
      AND is_active = true
    )
  );

CREATE POLICY "Operators can update assigned items"
  ON operator_approval_queue FOR UPDATE
  USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM operator_profiles
      WHERE user_id = auth.uid()
      AND organization_id = operator_approval_queue.organization_id
      AND role IN ('OWNER', 'MANAGER')
    )
  );

-- Notifications: users see their own
CREATE POLICY "Users view own notifications"
  ON operator_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON operator_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers
CREATE OR REPLACE FUNCTION update_operator_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_operator_profiles_updated_at
  BEFORE UPDATE ON operator_profiles
  FOR EACH ROW EXECUTE FUNCTION update_operator_updated_at();

CREATE TRIGGER update_approval_queue_updated_at
  BEFORE UPDATE ON operator_approval_queue
  FOR EACH ROW EXECUTE FUNCTION update_operator_updated_at();

-- Function to reset daily approval counts
CREATE OR REPLACE FUNCTION reset_daily_approval_counts()
RETURNS void AS $$
BEGIN
  UPDATE operator_profiles
  SET approvals_today = 0,
      last_approval_reset = NOW()
  WHERE last_approval_reset < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Default role permissions
COMMENT ON TABLE operator_profiles IS 'Operator roles: OWNER (full access), MANAGER (approve all, manage operators), ANALYST (approve LOW only)';
