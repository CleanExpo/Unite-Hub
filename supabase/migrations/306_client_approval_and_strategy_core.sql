-- Migration 306: Client Approval and Strategy Core Tables
-- Adds Client-In-The-Loop Approval Engine and Blue Ocean Strategy tables

-- Client Approval Requests Table
CREATE TABLE IF NOT EXISTS client_approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES founder_businesses(id) ON DELETE CASCADE,
  client_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB NOT NULL,
  source TEXT NOT NULL,
  strategy_options JSONB,
  status TEXT NOT NULL DEFAULT 'pending_review',
  reviewer_notes TEXT,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  requested_changes_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client Approval History Table (audit trail)
CREATE TABLE IF NOT EXISTS client_approval_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id uuid REFERENCES client_approval_requests(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blue Ocean Strategies Table
CREATE TABLE IF NOT EXISTS blue_ocean_strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES founder_businesses(id) ON DELETE CASCADE,
  client_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  eliminate TEXT[],
  reduce TEXT[],
  raise TEXT[],
  create_items TEXT[], -- 'create' is reserved keyword
  strategic_canvas JSONB,
  opportunities JSONB,
  competitive_factors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_approval_requests_business ON client_approval_requests(business_id);
CREATE INDEX IF NOT EXISTS idx_approval_requests_status ON client_approval_requests(status);
CREATE INDEX IF NOT EXISTS idx_approval_requests_client ON client_approval_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_approval ON client_approval_history(approval_id);
CREATE INDEX IF NOT EXISTS idx_blue_ocean_business ON blue_ocean_strategies(business_id);

-- RLS Policies
ALTER TABLE client_approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_approval_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE blue_ocean_strategies ENABLE ROW LEVEL SECURITY;

-- Approval requests: users can see their own business approvals
CREATE POLICY "Users can view their business approvals"
  ON client_approval_requests FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create approvals for their business"
  ON client_approval_requests FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their business approvals"
  ON client_approval_requests FOR UPDATE
  USING (
    business_id IN (
      SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid()
    )
  );

-- Approval history: linked to approval requests
CREATE POLICY "Users can view their approval history"
  ON client_approval_history FOR SELECT
  USING (
    approval_id IN (
      SELECT id FROM client_approval_requests WHERE business_id IN (
        SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert approval history"
  ON client_approval_history FOR INSERT
  WITH CHECK (
    approval_id IN (
      SELECT id FROM client_approval_requests WHERE business_id IN (
        SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid()
      )
    )
  );

-- Blue ocean strategies: users can manage their own
CREATE POLICY "Users can view their blue ocean strategies"
  ON blue_ocean_strategies FOR SELECT
  USING (
    business_id IN (
      SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create blue ocean strategies"
  ON blue_ocean_strategies FOR INSERT
  WITH CHECK (
    business_id IN (
      SELECT id FROM founder_businesses WHERE owner_user_id = auth.uid()
    )
  );
