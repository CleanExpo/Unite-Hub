-- Loyalty Credits System
-- Tracks credit issuance, redemption, caps, and transaction history
-- Part of v1_1_05: Loyalty & Referral Pivot Engine

-- Main loyalty credits table
CREATE TABLE IF NOT EXISTS loyalty_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Credit balance tracking
  balance bigint NOT NULL DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned bigint NOT NULL DEFAULT 0,
  lifetime_redeemed bigint NOT NULL DEFAULT 0,

  -- Monthly cap (25% of production users)
  monthly_cap bigint NOT NULL DEFAULT 5000,
  monthly_earned bigint NOT NULL DEFAULT 0,
  monthly_redeemed bigint NOT NULL DEFAULT 0,

  -- Timestamps
  first_earned_at timestamp with time zone,
  last_earned_at timestamp with time zone,
  last_redeemed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),

  -- For uniqueness
  UNIQUE(workspace_id, user_id)
);

-- Credit ledger for complete transaction history
CREATE TABLE IF NOT EXISTS loyalty_credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  loyalty_credits_id uuid NOT NULL REFERENCES loyalty_credits(id) ON DELETE CASCADE,

  -- Transaction details
  transaction_type varchar(50) NOT NULL CHECK (transaction_type IN (
    'referral_invite', 'referral_accepted', 'task_completed',
    'reward_redeemed', 'admin_adjustment', 'monthly_reset'
  )),
  amount bigint NOT NULL,

  -- Details
  related_entity_type varchar(50), -- 'referral_code', 'reward', 'task', 'referral_event'
  related_entity_id uuid,
  details jsonb,

  -- Status tracking
  is_pending boolean NOT NULL DEFAULT false,
  pending_expires_at timestamp with time zone,

  created_at timestamp with time zone NOT NULL DEFAULT now(),

  -- Audit
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Helper function: get current monthly cap progress
CREATE OR REPLACE FUNCTION get_loyalty_monthly_progress(
  p_workspace_id uuid,
  p_user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
  v_credits loyalty_credits;
BEGIN
  SELECT * INTO v_credits
  FROM loyalty_credits
  WHERE workspace_id = p_workspace_id
    AND user_id = p_user_id;

  IF v_credits IS NULL THEN
    RETURN jsonb_build_object(
      'monthly_cap', 5000,
      'monthly_earned', 0,
      'monthly_remaining', 5000,
      'can_earn_more', true
    );
  END IF;

  RETURN jsonb_build_object(
    'monthly_cap', v_credits.monthly_cap,
    'monthly_earned', v_credits.monthly_earned,
    'monthly_remaining', GREATEST(0, v_credits.monthly_cap - v_credits.monthly_earned),
    'can_earn_more', v_credits.monthly_earned < v_credits.monthly_cap
  );
END;
$$;

-- Helper function: issue credits (service role only)
CREATE OR REPLACE FUNCTION issue_loyalty_credits(
  p_workspace_id uuid,
  p_user_id uuid,
  p_amount bigint,
  p_transaction_type varchar,
  p_related_entity_type varchar DEFAULT NULL,
  p_related_entity_id uuid DEFAULT NULL,
  p_details jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits loyalty_credits;
  v_monthly_remaining bigint;
  v_ledger_id uuid;
BEGIN
  -- Get or create credits record
  INSERT INTO loyalty_credits (workspace_id, user_id)
  VALUES (p_workspace_id, p_user_id)
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  -- Lock and fetch
  SELECT * INTO v_credits
  FROM loyalty_credits
  WHERE workspace_id = p_workspace_id
    AND user_id = p_user_id
  FOR UPDATE;

  -- Check monthly cap
  v_monthly_remaining := v_credits.monthly_cap - v_credits.monthly_earned;

  IF v_monthly_remaining <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'monthly_cap_reached',
      'message', 'Monthly credit cap has been reached'
    );
  END IF;

  -- Cap amount to remaining monthly
  DECLARE
    v_actual_amount bigint := LEAST(p_amount, v_monthly_remaining);
  BEGIN
    -- Update loyalty_credits
    UPDATE loyalty_credits
    SET
      balance = balance + v_actual_amount,
      lifetime_earned = lifetime_earned + v_actual_amount,
      monthly_earned = monthly_earned + v_actual_amount,
      last_earned_at = now(),
      updated_at = now()
    WHERE workspace_id = p_workspace_id
      AND user_id = p_user_id
    RETURNING id INTO v_ledger_id;

    -- Insert ledger entry
    INSERT INTO loyalty_credit_ledger (
      workspace_id, user_id, loyalty_credits_id,
      transaction_type, amount,
      related_entity_type, related_entity_id,
      details, is_pending
    ) VALUES (
      p_workspace_id, p_user_id, v_credits.id,
      p_transaction_type, v_actual_amount,
      p_related_entity_type, p_related_entity_id,
      COALESCE(p_details, jsonb_build_object()),
      false
    );

    RETURN jsonb_build_object(
      'success', true,
      'amount_issued', v_actual_amount,
      'new_balance', v_credits.balance + v_actual_amount,
      'monthly_remaining', v_monthly_remaining - v_actual_amount,
      'capped', v_actual_amount < p_amount
    );
  END;
END;
$$;

-- Helper function: redeem credits
CREATE OR REPLACE FUNCTION redeem_loyalty_credits(
  p_workspace_id uuid,
  p_user_id uuid,
  p_amount bigint,
  p_reward_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits loyalty_credits;
BEGIN
  SELECT * INTO v_credits
  FROM loyalty_credits
  WHERE workspace_id = p_workspace_id
    AND user_id = p_user_id
  FOR UPDATE;

  IF v_credits IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'no_credits',
      'message', 'No credit account found'
    );
  END IF;

  IF v_credits.balance < p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'insufficient_balance',
      'message', 'Insufficient credit balance',
      'current_balance', v_credits.balance,
      'requested_amount', p_amount
    );
  END IF;

  -- Update balance
  UPDATE loyalty_credits
  SET
    balance = balance - p_amount,
    lifetime_redeemed = lifetime_redeemed + p_amount,
    monthly_redeemed = monthly_redeemed + p_amount,
    last_redeemed_at = now(),
    updated_at = now()
  WHERE workspace_id = p_workspace_id
    AND user_id = p_user_id;

  -- Log redemption
  INSERT INTO loyalty_credit_ledger (
    workspace_id, user_id, loyalty_credits_id,
    transaction_type, amount,
    related_entity_type, related_entity_id
  ) VALUES (
    p_workspace_id, p_user_id, v_credits.id,
    'reward_redeemed', p_amount,
    'reward', p_reward_id
  );

  RETURN jsonb_build_object(
    'success', true,
    'amount_redeemed', p_amount,
    'new_balance', v_credits.balance - p_amount,
    'lifetime_redeemed', v_credits.lifetime_redeemed + p_amount
  );
END;
$$;

-- RLS policies
ALTER TABLE loyalty_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_credit_ledger ENABLE ROW LEVEL SECURITY;

-- Users can view their own credits
CREATE POLICY loyalty_credits_select_own ON loyalty_credits
  FOR SELECT USING (auth.uid() = user_id);

-- Founders can view workspace credits
CREATE POLICY loyalty_credits_select_founder ON loyalty_credits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
        AND user_organizations.org_id = (
          SELECT org_id FROM workspaces WHERE workspaces.id = loyalty_credits.workspace_id
        )
        AND user_organizations.role = 'owner'
    )
  );

-- Ledger: Users can view their own
CREATE POLICY loyalty_credit_ledger_select_own ON loyalty_credit_ledger
  FOR SELECT USING (auth.uid() = user_id);

-- Ledger: Founders can view workspace
CREATE POLICY loyalty_credit_ledger_select_founder ON loyalty_credit_ledger
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
        AND user_organizations.org_id = (
          SELECT org_id FROM workspaces WHERE workspaces.id = loyalty_credit_ledger.workspace_id
        )
        AND user_organizations.role = 'owner'
    )
  );

-- Indexes for common queries
CREATE INDEX idx_loyalty_credits_workspace_user ON loyalty_credits(workspace_id, user_id);
CREATE INDEX idx_loyalty_credits_user ON loyalty_credits(user_id);
CREATE INDEX idx_loyalty_credit_ledger_workspace_user ON loyalty_credit_ledger(workspace_id, user_id);
CREATE INDEX idx_loyalty_credit_ledger_transaction_type ON loyalty_credit_ledger(transaction_type);
CREATE INDEX idx_loyalty_credit_ledger_created_at ON loyalty_credit_ledger(created_at DESC);
