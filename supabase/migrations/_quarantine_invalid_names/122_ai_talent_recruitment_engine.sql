-- Migration 122: AI Talent & Recruitment Engine
-- Required by Phase 70 - AI Talent & Recruitment Engine (ATRE)
-- Recruitment pipelines and AI candidate scoring

-- Candidate profiles table
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  resume_url TEXT,
  skills JSONB DEFAULT '[]'::jsonb,
  experience_years NUMERIC DEFAULT 0,
  applied_roles JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Foreign key
  CONSTRAINT candidate_profiles_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_org ON candidate_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_name ON candidate_profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_email ON candidate_profiles(email);
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_created ON candidate_profiles(created_at DESC);

-- Enable RLS
ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY candidate_profiles_select ON candidate_profiles
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY candidate_profiles_insert ON candidate_profiles
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY candidate_profiles_update ON candidate_profiles
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE candidate_profiles IS 'Recruitment candidate profiles (Phase 70)';

-- Job positions table
CREATE TABLE IF NOT EXISTS job_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  title TEXT NOT NULL,
  department TEXT,
  required_skills JSONB DEFAULT '[]'::jsonb,
  experience_required NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT job_positions_status_check CHECK (
    status IN ('draft', 'open', 'interviewing', 'filled', 'closed')
  ),

  -- Foreign key
  CONSTRAINT job_positions_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_job_positions_org ON job_positions(org_id);
CREATE INDEX IF NOT EXISTS idx_job_positions_title ON job_positions(title);
CREATE INDEX IF NOT EXISTS idx_job_positions_status ON job_positions(status);
CREATE INDEX IF NOT EXISTS idx_job_positions_created ON job_positions(created_at DESC);

-- Enable RLS
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY job_positions_select ON job_positions
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY job_positions_insert ON job_positions
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY job_positions_update ON job_positions
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE job_positions IS 'Job positions for recruitment (Phase 70)';

-- Candidate evaluations table
CREATE TABLE IF NOT EXISTS candidate_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id UUID NOT NULL,
  job_position_id UUID NOT NULL,
  fit_score NUMERIC NOT NULL DEFAULT 0,
  criteria_breakdown JSONB DEFAULT '{}'::jsonb,
  recommended_action TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Score check
  CONSTRAINT candidate_evaluations_score_check CHECK (
    fit_score >= 0 AND fit_score <= 100
  ),

  -- Foreign keys
  CONSTRAINT candidate_evaluations_candidate_fk
    FOREIGN KEY (candidate_id) REFERENCES candidate_profiles(id) ON DELETE CASCADE,
  CONSTRAINT candidate_evaluations_position_fk
    FOREIGN KEY (job_position_id) REFERENCES job_positions(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_candidate_evaluations_candidate ON candidate_evaluations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_evaluations_position ON candidate_evaluations(job_position_id);
CREATE INDEX IF NOT EXISTS idx_candidate_evaluations_score ON candidate_evaluations(fit_score DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_evaluations_generated ON candidate_evaluations(generated_at DESC);

-- Enable RLS
ALTER TABLE candidate_evaluations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY candidate_evaluations_select ON candidate_evaluations
  FOR SELECT TO authenticated
  USING (candidate_id IN (
    SELECT id FROM candidate_profiles
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY candidate_evaluations_insert ON candidate_evaluations
  FOR INSERT TO authenticated
  WITH CHECK (candidate_id IN (
    SELECT id FROM candidate_profiles
    WHERE org_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  ));

-- Comment
COMMENT ON TABLE candidate_evaluations IS 'AI candidate evaluations (Phase 70)';
