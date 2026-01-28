-- Migration 096: Voice Profiles
-- Required by Phase 44 - Voice & Language Personalisation Engine
-- Voice personalisation with budget adaptation

-- Voice profiles table
CREATE TABLE IF NOT EXISTS voice_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'en-AU',
  region TEXT,
  accent TEXT,
  tts_voice_id TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'professional',
  speed NUMERIC NOT NULL DEFAULT 1.0,
  cost_modifier NUMERIC NOT NULL DEFAULT 1.0,
  auto_adjust_based_on_budget BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Tone check
  CONSTRAINT voice_profiles_tone_check CHECK (
    tone IN ('professional', 'friendly', 'formal', 'casual', 'energetic')
  ),

  -- Speed check (0.5 to 2.0)
  CONSTRAINT voice_profiles_speed_check CHECK (
    speed >= 0.5 AND speed <= 2.0
  ),

  -- Foreign key
  CONSTRAINT voice_profiles_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,

  -- Unique per org
  CONSTRAINT voice_profiles_org_unique UNIQUE (org_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_profiles_org ON voice_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_voice_profiles_language ON voice_profiles(language_code);

-- Enable RLS
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY voice_profiles_select ON voice_profiles
  FOR SELECT TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY voice_profiles_insert ON voice_profiles
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

CREATE POLICY voice_profiles_update ON voice_profiles
  FOR UPDATE TO authenticated
  USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND org_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- Trigger for updated_at
CREATE TRIGGER trg_voice_profiles_updated_at
  BEFORE UPDATE ON voice_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_timestamp();

-- Comment
COMMENT ON TABLE voice_profiles IS 'Voice personalisation profiles with budget adaptation (Phase 44)';
