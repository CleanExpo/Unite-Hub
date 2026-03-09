-- Migration 310: Business Identity Vault for Founder OS (AI Phill)
-- Date: 2025-11-28
-- Description: Per-business data vault, multi-channel mapping, AI snapshots using Google Leak doctrine

BEGIN;

-- BUSINESS IDENTITY VAULT CORE TABLE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'business_identity_profiles'
  ) THEN
    CREATE TABLE business_identity_profiles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      owner_profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      business_key text NOT NULL UNIQUE,
      display_name text NOT NULL,
      legal_name text,
      primary_domain text,
      primary_gmb_location text,
      primary_region text,
      industry text,
      notes text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

COMMENT ON TABLE business_identity_profiles IS 'Per-business identity vault for Founder OS (AI Phill)';

-- CHANNEL / PLATFORM MAPPING
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'business_identity_channels'
  ) THEN
    CREATE TABLE business_identity_channels (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id uuid NOT NULL REFERENCES business_identity_profiles(id) ON DELETE CASCADE,
      channel_type text NOT NULL,
      provider text NOT NULL,
      account_label text,
      external_id text,
      meta jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

COMMENT ON TABLE business_identity_channels IS 'Per-business channel + platform mapping (search, social, ads, email, etc.)';

-- AI SNAPSHOTS (SEO LEAK DOCTRINE + PORTFOLIO INSIGHTS)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_name = 'business_identity_ai_snapshots'
  ) THEN
    CREATE TABLE business_identity_ai_snapshots (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      business_id uuid NOT NULL REFERENCES business_identity_profiles(id) ON DELETE CASCADE,
      snapshot_type text NOT NULL,
      summary_markdown text NOT NULL,
      navboost_risk_score numeric,
      q_star_proxy_score numeric,
      eeat_strength_score numeric,
      sandbox_risk_score numeric,
      behaviour_signal_opportunity_score numeric,
      gap_opportunities jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END $$;

COMMENT ON TABLE business_identity_ai_snapshots IS 'AI Phill portfolio snapshots using Google leak doctrine (NavBoost, Q*, E-E-A-T, sandbox, etc.).';

-- RLS
ALTER TABLE business_identity_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_identity_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_identity_ai_snapshots ENABLE ROW LEVEL SECURITY;

-- POLICIES (FOUNDER-ONLY + OWNER-ONLY)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'business_identity_profiles' AND policyname = 'business_identity_profiles_owner_access'
  ) THEN
    CREATE POLICY business_identity_profiles_owner_access ON business_identity_profiles
      FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        auth.uid() = owner_profile_id
      ) WITH CHECK (
        auth.uid() = owner_profile_id
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'business_identity_channels' AND policyname = 'business_identity_channels_owner_access'
  ) THEN
    CREATE POLICY business_identity_channels_owner_access ON business_identity_channels
      FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
          SELECT 1 FROM business_identity_profiles bip
          WHERE bip.id = business_identity_channels.business_id
          AND bip.owner_profile_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM business_identity_profiles bip
          WHERE bip.id = business_identity_channels.business_id
          AND bip.owner_profile_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'business_identity_ai_snapshots' AND policyname = 'business_identity_ai_snapshots_owner_access'
  ) THEN
    CREATE POLICY business_identity_ai_snapshots_owner_access ON business_identity_ai_snapshots
      FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND 
        EXISTS (
          SELECT 1 FROM business_identity_profiles bip
          WHERE bip.id = business_identity_ai_snapshots.business_id
          AND bip.owner_profile_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_identity_profiles_owner ON business_identity_profiles(owner_profile_id);
CREATE INDEX IF NOT EXISTS idx_business_identity_channels_business ON business_identity_channels(business_id);
CREATE INDEX IF NOT EXISTS idx_business_identity_ai_snapshots_business ON business_identity_ai_snapshots(business_id);
CREATE INDEX IF NOT EXISTS idx_business_identity_ai_snapshots_created ON business_identity_ai_snapshots(created_at DESC);

COMMIT;
