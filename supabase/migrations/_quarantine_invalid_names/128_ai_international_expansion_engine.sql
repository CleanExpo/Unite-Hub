-- Migration 128: AI International Expansion Engine
-- Required by Phase 76 - AI International Expansion Engine (AIEE)
-- Region-specific business models and expansion roadmaps

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS international_expansion_tasks CASCADE;
DROP TABLE IF EXISTS international_expansion_profiles CASCADE;

-- International expansion profiles table
CREATE TABLE international_expansion_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  region_code TEXT NOT NULL,
  market_summary JSONB DEFAULT '{}'::jsonb,
  competition_profile JSONB DEFAULT '{}'::jsonb,
  regulation_factors JSONB DEFAULT '{}'::jsonb,
  recommended_services JSONB DEFAULT '[]'::jsonb,
  pricing_model JSONB DEFAULT '{}'::jsonb,
  localisation_instructions JSONB DEFAULT '{}'::jsonb,
  expansion_score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Expansion score check
  CONSTRAINT international_expansion_profiles_score_check CHECK (
    expansion_score >= 0 AND expansion_score <= 100
  ),

  -- Foreign key
  CONSTRAINT international_expansion_profiles_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_international_expansion_profiles_org ON international_expansion_profiles(org_id);
CREATE INDEX IF NOT EXISTS idx_international_expansion_profiles_region ON international_expansion_profiles(region_code);
CREATE INDEX IF NOT EXISTS idx_international_expansion_profiles_score ON international_expansion_profiles(expansion_score DESC);
CREATE INDEX IF NOT EXISTS idx_international_expansion_profiles_created ON international_expansion_profiles(created_at DESC);

-- Enable RLS
ALTER TABLE international_expansion_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY international_expansion_profiles_select ON international_expansion_profiles
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY international_expansion_profiles_insert ON international_expansion_profiles
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY international_expansion_profiles_update ON international_expansion_profiles
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE international_expansion_profiles IS 'International expansion profiles (Phase 76)';

-- International expansion tasks table
CREATE TABLE international_expansion_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  profile_id UUID NOT NULL,
  task_title TEXT NOT NULL,
  task_description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to UUID,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT international_expansion_tasks_status_check CHECK (
    status IN ('pending', 'in_progress', 'completed', 'blocked')
  ),

  -- Foreign keys
  CONSTRAINT international_expansion_tasks_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CONSTRAINT international_expansion_tasks_profile_fk
    FOREIGN KEY (profile_id) REFERENCES international_expansion_profiles(id) ON DELETE CASCADE,
  CONSTRAINT international_expansion_tasks_assigned_fk
    FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_international_expansion_tasks_org ON international_expansion_tasks(org_id);
CREATE INDEX IF NOT EXISTS idx_international_expansion_tasks_profile ON international_expansion_tasks(profile_id);
CREATE INDEX IF NOT EXISTS idx_international_expansion_tasks_status ON international_expansion_tasks(status);
CREATE INDEX IF NOT EXISTS idx_international_expansion_tasks_due ON international_expansion_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_international_expansion_tasks_created ON international_expansion_tasks(created_at DESC);

-- Enable RLS
ALTER TABLE international_expansion_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY international_expansion_tasks_select ON international_expansion_tasks
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY international_expansion_tasks_insert ON international_expansion_tasks
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY international_expansion_tasks_update ON international_expansion_tasks
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE international_expansion_tasks IS 'International expansion tasks (Phase 76)';
