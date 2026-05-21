-- Referral Tracking System
-- Tracks referral codes, events, attribution, and fraud signals
-- Part of v1_1_05: Loyalty & Referral Pivot Engine

-- Referral codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- Keep FK reference to auth.users (allowed in migrations)
user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Code details
  code varchar(20) NOT NULL UNIQUE,
  campaign varchar(100), -- e.g., 'twitter', 'email', 'linkedin'

  -- Usage tracking
  times_used bigint NOT NULL DEFAULT 0,
  referrals_accepted bigint NOT NULL DEFAULT 0,
  total_credits_issued bigint NOT NULL DEFAULT 0,

  -- Status
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone,

  -- Metadata
  metadata jsonb DEFAULT jsonb_build_object(),

  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Referral events (every invite, acceptance, etc.)
CREATE TABLE IF NOT EXISTS referral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- Keep FK reference to auth.users (allowed in migrations)
referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code_id uuid NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,

  -- Event details
  event_type varchar(50) NOT NULL CHECK (event_type IN (
    'code_created', 'code_shared', 'invite_sent', 'code_used', 'signup_completed',
    'verified_by_email', 'verified_by_engagement', 'rejected_fraud', 'accepted_manual'
  )),

  -- Referred user (if applicable)
  -- Keep FK reference to auth.users (allowed in migrations)
referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_email varchar(255),

  -- Attribution data
  attribution_confidence varchar(20) CHECK (attribution_confidence IN ('high', 'medium', 'low')),

  -- Fraud signals
  fraud_score float NOT NULL DEFAULT 0 CHECK (fraud_score >= 0 AND fraud_score <= 100),
  fraud_signals jsonb DEFAULT jsonb_build_object(),

  -- Status
  is_valid boolean NOT NULL DEFAULT true,

  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  verified_at timestamp with time zone
);

-- Referral attribution table (final link between referrer and referred user)
CREATE TABLE IF NOT EXISTS referral_attribution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  -- Keep FK reference to auth.users (allowed in migrations)
referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Keep FK reference to auth.users (allowed in migrations)
referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Source
  referral_code_id uuid NOT NULL REFERENCES referral_codes(id) ON DELETE CASCADE,
  referral_event_id uuid REFERENCES referral_events(id) ON DELETE SET NULL,

  -- Reward details
  referrer_credit_amount bigint NOT NULL DEFAULT 100,
  referred_user_credit_amount bigint NOT NULL DEFAULT 50,

  -- Status
  status varchar(50) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'verified', 'credited', 'rejected'
  )),
  rejection_reason varchar(255),

  -- Founder approval (for fraud score >= 70)
  requires_founder_approval boolean NOT NULL DEFAULT false,
  -- Keep FK reference to auth.users (allowed in migrations)
approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamp with time zone,

  -- Timestamps
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  credited_at timestamp with time zone,
  verified_at timestamp with time zone
);

-- Helper function: generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(
  p_workspace_id uuid,
  p_user_id uuid,
  p_campaign varchar DEFAULT 'default'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code varchar;
  v_code_record referral_codes;
  v_attempts int := 0;
  v_max_attempts int := 10;
BEGIN
  -- Try to generate a unique code (format: REF-WORKSPACE-RANDOM)
  LOOP
    v_code := 'REF' || '-' ||
              LEFT(p_workspace_id::text, 4) || '-' ||
              UPPER(substring(md5(random()::text), 1, 8));

    v_attempts := v_attempts + 1;
    IF v_attempts > v_max_attempts THEN
      RETURN jsonb_build_object(
        'success', false,
        'reason', 'code_generation_failed',
        'message', 'Failed to generate unique referral code'
      );
    END IF;

    -- Try to insert
    BEGIN
      INSERT INTO referral_codes (workspace_id, user_id, code, campaign)
      VALUES (p_workspace_id, p_user_id, v_code, p_campaign)
      RETURNING * INTO v_code_record;

      RETURN jsonb_build_object(
        'success', true,
        'code', v_code,
        'campaign', p_campaign,
        'created_at', v_code_record.created_at
      );
    EXCEPTION WHEN unique_violation THEN
      -- Try again
      CONTINUE;
    END;
  END LOOP;
END;
$$;

-- Helper function: record referral event and calculate fraud score
CREATE OR REPLACE FUNCTION record_referral_event(
  p_workspace_id uuid,
  p_referrer_id uuid,
  p_referral_code_id uuid,
  p_event_type varchar,
  p_referred_user_id uuid DEFAULT NULL,
  p_referred_email varchar DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fraud_score float := 0;
  v_fraud_signals jsonb := jsonb_build_object();
  v_event referral_events;
BEGIN
  -- Calculate fraud score
  -- Signal 1: Multiple codes from same referrer (max +20)
  SELECT COUNT(DISTINCT code) INTO v_fraud_score
  FROM referral_codes
  WHERE workspace_id = p_workspace_id
    AND user_id = p_referrer_id
    AND created_at > now() - interval '30 days';

  IF v_fraud_score > 5 THEN
    v_fraud_score := 20;
    v_fraud_signals := jsonb_set(v_fraud_signals, '{multiple_codes}', 'true'::jsonb);
  END IF;

  -- Signal 2: Code used multiple times in short period (max +20)
  IF p_event_type = 'code_used' THEN
    SELECT COUNT(*) INTO v_fraud_score
    FROM referral_events
    WHERE referral_code_id = p_referral_code_id
      AND event_type = 'code_used'
      AND created_at > now() - interval '1 hour';

    IF v_fraud_score > 10 THEN
      v_fraud_signals := jsonb_set(v_fraud_signals, '{rapid_use}', 'true'::jsonb);
      v_fraud_score := 20;
    END IF;
  END IF;

  -- Signal 3: High referrer usage (more than 20 codes/month) (max +30)
  SELECT COUNT(DISTINCT referred_email) INTO v_fraud_score
  FROM referral_events
  WHERE referrer_id = p_referrer_id
    AND event_type = 'invite_sent'
    AND created_at > now() - interval '30 days';

  IF v_fraud_score > 20 THEN
    v_fraud_signals := jsonb_set(v_fraud_signals, '{high_volume}', 'true'::jsonb);
    v_fraud_score := LEAST(100, v_fraud_score + 30);
  END IF;

  -- Insert event
  INSERT INTO referral_events (
    workspace_id, referrer_id, referral_code_id,
    event_type, referred_user_id, referred_email,
    fraud_score, fraud_signals,
    attribution_confidence
  ) VALUES (
    p_workspace_id, p_referrer_id, p_referral_code_id,
    p_event_type, p_referred_user_id, p_referred_email,
    v_fraud_score, v_fraud_signals,
    CASE
      WHEN v_fraud_score < 30 THEN 'high'
      WHEN v_fraud_score < 70 THEN 'medium'
      ELSE 'low'
    END
  ) RETURNING * INTO v_event;

  RETURN jsonb_build_object(
    'success', true,
    'event_id', v_event.id,
    'fraud_score', v_event.fraud_score,
    'requires_review', v_event.fraud_score >= 70,
    'fraud_signals', v_event.fraud_signals
  );
END;
$$;

-- Helper function: validate and create attribution
CREATE OR REPLACE FUNCTION validate_referral_attribution(
  p_workspace_id uuid,
  p_referrer_id uuid,
  p_referred_user_id uuid,
  p_referral_code_id uuid,
  p_referral_event_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event referral_events;
  v_attribution referral_attribution;
BEGIN
  -- Get event for fraud score
  IF p_referral_event_id IS NOT NULL THEN
    SELECT * INTO v_event
    FROM referral_events
    WHERE id = p_referral_event_id;
  END IF;

  -- Create attribution record
  INSERT INTO referral_attribution (
    workspace_id, referrer_id, referred_user_id,
    referral_code_id, referral_event_id,
    requires_founder_approval,
    status
  ) VALUES (
    p_workspace_id, p_referrer_id, p_referred_user_id,
    p_referral_code_id, p_referral_event_id,
    COALESCE(v_event.fraud_score, 0) >= 70,
    CASE
      WHEN COALESCE(v_event.fraud_score, 0) >= 70 THEN 'pending'
      ELSE 'verified'
    END
  ) RETURNING * INTO v_attribution;

  RETURN jsonb_build_object(
    'success', true,
    'attribution_id', v_attribution.id,
    'requires_founder_approval', v_attribution.requires_founder_approval,
    'status', v_attribution.status
  );
END;
$$;

-- RLS policies
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_attribution ENABLE ROW LEVEL SECURITY;

-- Referral codes: Users can view own, founders can view workspace
CREATE POLICY referral_codes_select_own ON referral_codes
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.uid() = user_id);

CREATE POLICY referral_codes_select_founder ON referral_codes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
        AND user_organizations.org_id = (
          SELECT org_id FROM workspaces WHERE workspaces.id = referral_codes.workspace_id
        )
        AND user_organizations.role = 'owner'
    )
  );

-- Referral events: Referrer can view own, founders can view workspace
CREATE POLICY referral_events_select_own ON referral_events
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.uid() = referrer_id);

CREATE POLICY referral_events_select_founder ON referral_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
        AND user_organizations.org_id = (
          SELECT org_id FROM workspaces WHERE workspaces.id = referral_events.workspace_id
        )
        AND user_organizations.role = 'owner'
    )
  );

-- Attribution: Users can view if they're referrer or referred, founders can view workspace
CREATE POLICY referral_attribution_select_own ON referral_attribution
  FOR SELECT USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
    auth.uid() = referrer_id OR auth.uid() = referred_user_id
  );

CREATE POLICY referral_attribution_select_founder ON referral_attribution
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_organizations
      WHERE user_organizations.user_id = auth.uid()
        AND user_organizations.org_id = (
          SELECT org_id FROM workspaces WHERE workspaces.id = referral_attribution.workspace_id
        )
        AND user_organizations.role = 'owner'
    )
  );

-- Indexes
CREATE INDEX idx_referral_codes_workspace_user ON referral_codes(workspace_id, user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_active ON referral_codes(is_active, expires_at);
CREATE INDEX idx_referral_events_referrer ON referral_events(workspace_id, referrer_id);
CREATE INDEX idx_referral_events_fraud_score ON referral_events(fraud_score DESC);
CREATE INDEX idx_referral_events_created_at ON referral_events(created_at DESC);
CREATE INDEX idx_referral_attribution_referrer ON referral_attribution(workspace_id, referrer_id);
CREATE INDEX idx_referral_attribution_referred ON referral_attribution(workspace_id, referred_user_id);
CREATE INDEX idx_referral_attribution_status ON referral_attribution(status);
