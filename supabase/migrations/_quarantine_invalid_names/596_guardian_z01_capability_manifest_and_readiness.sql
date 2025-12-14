/**
 * Guardian Z01: Capability Manifest & Tenant Readiness Scoring
 *
 * Adds meta-level observation of Guardian capabilities and per-tenant readiness scores.
 * Advisory-only: readiness scores do not affect runtime behavior.
 * No PII; only tenant-scoped, aggregated metrics.
 */

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- guardian_capability_manifest
-- ============================================================================
-- Global catalog of Guardian capabilities across all phases (G, H, I, X, Z)
-- Read-only for tenants; updated via service layer or admin endpoints

CREATE TABLE IF NOT EXISTS guardian_capability_manifest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  phase_codes TEXT[] NOT NULL,
  weight NUMERIC NOT NULL DEFAULT 1.0,
  is_tenant_scoped BOOLEAN NOT NULL DEFAULT true,
  is_experimental BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_capability_manifest_key
  ON guardian_capability_manifest(key);
CREATE INDEX IF NOT EXISTS idx_capability_manifest_category
  ON guardian_capability_manifest(category);

-- RLS: All tenants can READ capability manifest (non-sensitive global config)
-- Writes controlled via service layer (no direct tenant write access)
ALTER TABLE guardian_capability_manifest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "capability_manifest_read_all" ON guardian_capability_manifest
FOR SELECT USING (true);

CREATE POLICY "capability_manifest_insert_disabled" ON guardian_capability_manifest
FOR INSERT WITH CHECK (false);

CREATE POLICY "capability_manifest_update_disabled" ON guardian_capability_manifest
FOR UPDATE USING (false) WITH CHECK (false);

CREATE POLICY "capability_manifest_delete_disabled" ON guardian_capability_manifest
FOR DELETE USING (false);

-- ============================================================================
-- guardian_tenant_readiness_scores
-- ============================================================================
-- Per-tenant readiness snapshots for each capability
-- Tenant-scoped via RLS; only aggregated, non-PII metrics

CREATE TABLE IF NOT EXISTS guardian_tenant_readiness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  capability_key TEXT NOT NULL REFERENCES guardian_capability_manifest(key)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  score NUMERIC NOT NULL CHECK (score >= 0 AND score <= 100),
  status TEXT NOT NULL CHECK (status IN ('not_configured', 'partial', 'ready', 'advanced')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  overall_guardian_score NUMERIC CHECK (overall_guardian_score IS NULL OR (overall_guardian_score >= 0 AND overall_guardian_score <= 100)),
  overall_status TEXT CHECK (overall_status IS NULL OR overall_status IN ('baseline', 'operational', 'mature', 'network_intelligent')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_readiness_scores_tenant_computed
  ON guardian_tenant_readiness_scores(tenant_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_readiness_scores_tenant_capability
  ON guardian_tenant_readiness_scores(tenant_id, capability_key, computed_at DESC);

-- RLS: Tenants see only their own readiness scores
ALTER TABLE guardian_tenant_readiness_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "readiness_scores_tenant_isolation" ON guardian_tenant_readiness_scores
FOR ALL USING (tenant_id = get_current_workspace_id());

-- ============================================================================
-- Comment and documentation
-- ============================================================================

COMMENT ON TABLE guardian_capability_manifest IS
  'Global catalog of Guardian capabilities (G, H, I, X, Z phases). Non-sensitive, read-only for tenants. Updated via service layer.';

COMMENT ON TABLE guardian_tenant_readiness_scores IS
  'Per-tenant readiness snapshots for each capability. Advisory-only; contains aggregated metrics only, no PII. Scoped to tenant via RLS.';

COMMENT ON COLUMN guardian_tenant_readiness_scores.score IS
  'Readiness score 0-100: 0 = not configured, 25 = partial, 75 = ready, 100 = advanced. Advisory indicator only.';

COMMENT ON COLUMN guardian_tenant_readiness_scores.status IS
  'Human-readable status: not_configured, partial, ready, advanced.';

COMMENT ON COLUMN guardian_tenant_readiness_scores.details IS
  'Non-PII aggregated details: counts, flags, recent timestamps, example keys like rulesActive, simRunsLast30d, networkFlagsEnabled.';

COMMENT ON COLUMN guardian_tenant_readiness_scores.overall_guardian_score IS
  'Weighted average of all capability scores for this tenant at computed_at time. NULL if only partial snapshot.';

COMMENT ON COLUMN guardian_tenant_readiness_scores.overall_status IS
  'Tenant-wide Guardian status: baseline (only core rules), operational (core + risk), mature (core + risk + QA), network_intelligent (all of above + X-series).';
