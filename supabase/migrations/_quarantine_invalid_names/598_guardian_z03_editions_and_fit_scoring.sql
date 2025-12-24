-- Guardian Z03: Editions & Fit Scoring
-- Global edition profiles (Core, Pro, Network-Intelligent) + per-tenant edition fit snapshots
-- Both advisory-only; no impact on runtime Guardian configuration

-- ============================================================================
-- GLOBAL EDITION PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_edition_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,                          -- e.g., 'guardian_core', 'guardian_pro', 'guardian_network_intelligent'
  label TEXT NOT NULL,                               -- Human-readable name
  description TEXT NOT NULL,                         -- Long-form description of the edition
  tier TEXT NOT NULL CHECK (tier IN ('core', 'pro', 'elite', 'custom')),
  category TEXT NOT NULL DEFAULT 'packaging',        -- Classification (always 'packaging' for now)
  capabilities_required TEXT[] NOT NULL DEFAULT '{}'::TEXT[],  -- Capability keys that define this edition
  capabilities_nice_to_have TEXT[] NOT NULL DEFAULT '{}'::TEXT[],  -- Optional enhancements
  min_overall_score NUMERIC NOT NULL DEFAULT 0,     -- Minimum readiness score to start this edition (0..100)
  recommended_overall_score NUMERIC NOT NULL DEFAULT 0,  -- Target readiness score for this edition (0..100)
  is_default BOOLEAN NOT NULL DEFAULT false,        -- Only one per system should be true
  is_active BOOLEAN NOT NULL DEFAULT true,          -- Can be soft-deleted by setting false
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,      -- Custom edition metadata (not PII)

  CONSTRAINT min_score_gte_zero CHECK (min_overall_score >= 0 AND min_overall_score <= 100),
  CONSTRAINT rec_score_gte_zero CHECK (recommended_overall_score >= 0 AND recommended_overall_score <= 100),
  CONSTRAINT rec_gte_min CHECK (recommended_overall_score >= min_overall_score)
);

-- Indexes for efficient lookups
CREATE UNIQUE INDEX idx_edition_profiles_key ON guardian_edition_profiles(key) WHERE is_active = true;
CREATE INDEX idx_edition_profiles_default ON guardian_edition_profiles(is_default) WHERE is_default = true;
CREATE INDEX idx_edition_profiles_tier ON guardian_edition_profiles(tier) WHERE is_active = true;

-- ============================================================================
-- PER-TENANT EDITION FIT SNAPSHOTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_tenant_edition_fit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  edition_key TEXT NOT NULL REFERENCES guardian_edition_profiles(key) ON UPDATE CASCADE,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  overall_fit_score NUMERIC NOT NULL CHECK (overall_fit_score >= 0 AND overall_fit_score <= 100),
  status TEXT NOT NULL CHECK (status IN ('not_started', 'emerging', 'aligned', 'exceeds')),

  -- Detailed capability scores for this edition fit
  capability_scores JSONB NOT NULL DEFAULT '{}'::JSONB,  -- Map of { [capabilityKey]: { score: 0..100, status: string, weight: number } }

  -- Identified gaps (missing or low-scoring capabilities)
  gaps JSONB NOT NULL DEFAULT '[]'::JSONB,  -- Array of { capabilityKey, gapType: 'missing'|'low_score', currentScore?, targetScore? }

  -- Summary of linked recommendations (high-level references only, no PII)
  recommendations_summary JSONB NOT NULL DEFAULT '{}'::JSONB,  -- { uplift_plan_count, pending_recommendation_count, focus_areas: [...] }

  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,      -- Custom data

  CONSTRAINT positive_fit_score CHECK (overall_fit_score >= 0)
);

-- Indexes for efficient tenant-scoped queries
CREATE INDEX idx_edition_fit_tenant_computed
ON guardian_tenant_edition_fit(tenant_id, computed_at DESC);

CREATE INDEX idx_edition_fit_tenant_edition
ON guardian_tenant_edition_fit(tenant_id, edition_key, computed_at DESC);

CREATE INDEX idx_edition_fit_tenant_status
ON guardian_tenant_edition_fit(tenant_id, status);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- guardian_edition_profiles: readable by all authenticated users (global reference data)
-- Writes restricted to privileged app contexts only
ALTER TABLE guardian_edition_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edition_profiles_select_all"
ON guardian_edition_profiles
FOR SELECT
USING (is_active = true);

-- Writes blocked at RLS layer; editions only updated via app code/admin context
CREATE POLICY "edition_profiles_insert_denied"
ON guardian_edition_profiles
FOR INSERT
WITH CHECK (false);

CREATE POLICY "edition_profiles_update_denied"
ON guardian_edition_profiles
FOR UPDATE
USING (false)
WITH CHECK (false);

CREATE POLICY "edition_profiles_delete_denied"
ON guardian_edition_profiles
FOR DELETE
USING (false);

-- guardian_tenant_edition_fit: strict tenant-scoped RLS enforcement
ALTER TABLE guardian_tenant_edition_fit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "edition_fit_select"
ON guardian_tenant_edition_fit
FOR SELECT
USING (tenant_id = get_current_workspace_id());

CREATE POLICY "edition_fit_insert"
ON guardian_tenant_edition_fit
FOR INSERT
WITH CHECK (tenant_id = get_current_workspace_id());

CREATE POLICY "edition_fit_update"
ON guardian_tenant_edition_fit
FOR UPDATE
USING (tenant_id = get_current_workspace_id())
WITH CHECK (tenant_id = get_current_workspace_id());

CREATE POLICY "edition_fit_delete"
ON guardian_tenant_edition_fit
FOR DELETE
USING (tenant_id = get_current_workspace_id());

-- ============================================================================
-- DOCUMENTATION COMMENTS
-- ============================================================================

COMMENT ON TABLE guardian_edition_profiles IS
'Global Guardian edition profiles (Core, Pro, Network-Intelligent).
Editions are descriptive packaging of capabilities, NOT a licensing or enforcement system.
All tenants can read active editions; fit is computed per-tenant advisory guidance only.';

COMMENT ON TABLE guardian_tenant_edition_fit IS
'Per-tenant edition fit snapshots computed from Z01 readiness scores.
Fit is advisory only and reflects how close a tenant is to a target edition profile.
No runtime configuration or feature enforcement is applied based on these scores.';

COMMENT ON COLUMN guardian_tenant_edition_fit.capability_scores IS
'JSON map: { [capabilityKey]: { score: 0..100, status: string, weight: number } }
Enables breakdown analysis of how each capability contributes to overall fit.';

COMMENT ON COLUMN guardian_tenant_edition_fit.gaps IS
'JSON array: [{ capabilityKey: string, gapType: ''missing''|''low_score'', currentScore?: number, targetScore?: number }, ...]
Helps identify which capabilities need work to reach this edition.';

COMMENT ON COLUMN guardian_tenant_edition_fit.recommendations_summary IS
'High-level summary of related uplift plans and recommendations (no PII, no raw data).
Example: { uplift_plan_count: 2, pending_recommendation_count: 3, focus_areas: ["enable-telemetry", "configure-risk-engine"] }';
