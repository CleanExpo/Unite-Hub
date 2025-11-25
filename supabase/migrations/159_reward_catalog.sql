-- Reward Catalog System
-- Founder-managed reward catalog with redemption requests and approval gates
-- Part of v1_1_05: Loyalty & Referral Pivot Engine

-- Reward catalog
CREATE TABLE IF NOT EXISTS reward_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Reward details
  name varchar(255) NOT NULL,
  description text,
  category varchar(100) CHECK (category IN (
    'feature_unlock', 'discount', 'priority_support', 'custom', 'credit_bundle'
  )),

  -- Pricing
  credit_cost bigint NOT NULL CHECK (credit_cost > 0),

  -- Availability
  is_active boolean NOT NULL DEFAULT true,
  daily_redemption_limit bigint DEFAULT NULL, -- NULL = unlimited
  daily_redeemed_count bigint NOT NULL DEFAULT 0,
  total_redeemed_count bigint NOT NULL DEFAULT 0,

  -- Metadata
  metadata jsonb DEFAULT jsonb_build_object(),

  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  UNIQUE(workspace_id, name)
);

-- Redemption requests (submitted by users, approved by founders)
CREATE TABLE IF NOT EXISTS reward_redemption_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES reward_catalog(id) ON DELETE RESTRICT,

  -- Request details
  credit_amount_requested bigint NOT NULL,

  -- Status workflow
  status varchar(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'redeemed', 'rejected', 'cancelled'
  )),

  -- Founder notes
  founder_notes text,
  founder_action_at timestamp with time zone,
  founder_action_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Result
  redemption_id uuid REFERENCES loyalty_credit_ledger(id) ON DELETE SET NULL,

  -- Truth-layer transparency
  transparency_message text, -- What was actually given vs promised

  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Helper function: get available rewards
CREATE OR REPLACE FUNCTION get_available_rewards(
  p_workspace_id uuid,
  p_user_credits bigint DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name varchar,
  description text,
  category varchar,
  credit_cost bigint,
  daily_limit bigint,
  daily_remaining bigint,
  user_can_afford boolean,
  metadata jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.id,
    rc.name,
    rc.description,
    rc.category,
    rc.credit_cost,
    rc.daily_redemption_limit,
    CASE
      WHEN rc.daily_redemption_limit IS NULL THEN -1
      ELSE GREATEST(0, rc.daily_redemption_limit - rc.daily_redeemed_count)
    END,
    CASE
      WHEN p_user_credits IS NULL THEN false
      ELSE p_user_credits >= rc.credit_cost
    END,
    rc.metadata
  FROM reward_catalog rc
  WHERE rc.workspace_id = p_workspace_id
    AND rc.is_active = true
    AND (rc.daily_redemption_limit IS NULL OR rc.daily_redeemed_count < rc.daily_redemption_limit)
  ORDER BY rc.created_at DESC;
END;
$$;

-- Helper function: submit redemption request
CREATE OR REPLACE FUNCTION submit_redemption_request(
  p_workspace_id uuid,
  p_user_id uuid,
  p_reward_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reward reward_catalog;
  v_user_credits loyalty_credits;
  v_request reward_redemption_requests;
BEGIN
  -- Get reward
  SELECT * INTO v_reward
  FROM reward_catalog
  WHERE id = p_reward_id
    AND workspace_id = p_workspace_id;

  IF v_reward IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'reward_not_found',
      'message', 'Reward not found'
    );
  END IF;

  -- Check daily limit
  IF v_reward.daily_redemption_limit IS NOT NULL
    AND v_reward.daily_redeemed_count >= v_reward.daily_redemption_limit THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'daily_limit_reached',
      'message', 'Daily redemption limit reached for this reward'
    );
  END IF;

  -- Check user credits
  SELECT * INTO v_user_credits
  FROM loyalty_credits
  WHERE workspace_id = p_workspace_id
    AND user_id = p_user_id;

  IF v_user_credits IS NULL OR v_user_credits.balance < v_reward.credit_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'insufficient_credits',
      'message', 'Insufficient credits for this reward',
      'current_balance', COALESCE(v_user_credits.balance, 0),
      'required_amount', v_reward.credit_cost
    );
  END IF;

  -- Create redemption request
  INSERT INTO reward_redemption_requests (
    workspace_id, user_id, reward_id,
    credit_amount_requested, status
  ) VALUES (
    p_workspace_id, p_user_id, p_reward_id,
    v_reward.credit_cost, 'pending'
  ) RETURNING * INTO v_request;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request.id,
    'status', 'pending',
    'message', 'Redemption request submitted. Founder approval required.',
    'submitted_at', v_request.created_at
  );
END;
$$;

-- Helper function: approve/reject redemption (founder only)
CREATE OR REPLACE FUNCTION handle_redemption_request(
  p_request_id uuid,
  p_workspace_id uuid,
  p_approved boolean,
  p_founder_notes text DEFAULT NULL,
  p_transparency_message text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request reward_redemption_requests;
  v_reward reward_catalog;
  v_user_credits loyalty_credits;
  v_redeem_result jsonb;
BEGIN
  -- Get request
  SELECT * INTO v_request
  FROM reward_redemption_requests
  WHERE id = p_request_id
    AND workspace_id = p_workspace_id
  FOR UPDATE;

  IF v_request IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'request_not_found',
      'message', 'Redemption request not found'
    );
  END IF;

  IF v_request.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'invalid_status',
      'message', 'Request already processed',
      'current_status', v_request.status
    );
  END IF;

  -- Get reward
  SELECT * INTO v_reward
  FROM reward_catalog
  WHERE id = v_request.reward_id;

  IF p_approved THEN
    -- Try to redeem credits
    v_redeem_result := redeem_loyalty_credits(
      p_workspace_id,
      v_request.user_id,
      v_request.credit_amount_requested,
      v_request.reward_id
    );

    IF (v_redeem_result ->> 'success')::boolean THEN
      -- Update request
      UPDATE reward_redemption_requests
      SET
        status = 'redeemed',
        founder_notes = p_founder_notes,
        founder_action_by = auth.uid(),
        founder_action_at = now(),
        transparency_message = p_transparency_message,
        updated_at = now()
      WHERE id = p_request_id;

      -- Update reward counts
      UPDATE reward_catalog
      SET
        daily_redeemed_count = daily_redeemed_count + 1,
        total_redeemed_count = total_redeemed_count + 1,
        updated_at = now()
      WHERE id = v_request.reward_id;

      RETURN jsonb_build_object(
        'success', true,
        'status', 'redeemed',
        'message', 'Redemption approved and credits issued',
        'processed_at', now()
      );
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'redemption_failed',
        'message', v_redeem_result ->> 'message'
      );
    END IF;
  ELSE
    -- Reject request
    UPDATE reward_redemption_requests
    SET
      status = 'rejected',
      founder_notes = p_founder_notes,
      founder_action_by = auth.uid(),
      founder_action_at = now(),
      updated_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object(
      'success', true,
      'status', 'rejected',
      'message', 'Redemption request rejected',
      'processed_at', now()
    );
  END IF;
END;
$$;

-- RLS policies
ALTER TABLE reward_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemption_requests ENABLE ROW LEVEL SECURITY;

-- Reward catalog: Users can view active rewards, founders can manage
CREATE POLICY reward_catalog_select_user ON reward_catalog
  FOR SELECT USING (is_active = true);

CREATE POLICY reward_catalog_select_founder ON reward_catalog
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
        AND user_organizations.org_id = (
          SELECT org_id FROM workspaces WHERE workspaces.id = reward_catalog.workspace_id
        )
        AND user_organizations.role = 'owner'
    )
  );

CREATE POLICY reward_catalog_update_founder ON reward_catalog
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
        AND user_organizations.org_id = (
          SELECT org_id FROM workspaces WHERE workspaces.id = reward_catalog.workspace_id
        )
        AND user_organizations.role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
        AND user_organizations.org_id = (
          SELECT org_id FROM workspaces WHERE workspaces.id = reward_catalog.workspace_id
        )
        AND user_organizations.role = 'owner'
    )
  );

-- Redemption requests: Users can view own, founders can view all
CREATE POLICY redemption_requests_select_own ON reward_redemption_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY redemption_requests_select_founder ON reward_redemption_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
        AND user_organizations.org_id = (
          SELECT org_id FROM workspaces WHERE workspaces.id = reward_redemption_requests.workspace_id
        )
        AND user_organizations.role = 'owner'
    )
  );

-- Indexes
CREATE INDEX idx_reward_catalog_workspace_active ON reward_catalog(workspace_id, is_active);
CREATE INDEX idx_reward_catalog_workspace_created ON reward_catalog(workspace_id, created_at DESC);
CREATE INDEX idx_redemption_requests_workspace_user ON reward_redemption_requests(workspace_id, user_id);
CREATE INDEX idx_redemption_requests_status ON reward_redemption_requests(status);
CREATE INDEX idx_redemption_requests_created_at ON reward_redemption_requests(created_at DESC);
CREATE INDEX idx_redemption_requests_pending ON reward_redemption_requests(workspace_id, status) WHERE status = 'pending';
