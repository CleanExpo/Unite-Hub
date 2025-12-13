/**
 * Guardian GTM-05: Pricing + Packaging (DISPLAY-ONLY)
 *
 * IMPORTANT:
 * - No billing
 * - No runtime enforcement
 * - No feature gating
 *
 * This schema exists purely for UX, GTM, and sales visibility.
 *
 * Tenancy:
 * - workspace_id maps to workspaces.id
 * - RLS enforced via get_current_workspace_id() on workspace-scoped tables
 *
 * Global catalog:
 * - guardian_feature_catalog is GLOBAL and intentionally has NO RLS.
 */

-- ============================================================
-- Enum Types (idempotent)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'guardian_plan_tier_enum') THEN
    CREATE TYPE guardian_plan_tier_enum AS ENUM ('internal', 'starter', 'pro', 'enterprise');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'guardian_feature_module_enum') THEN
    CREATE TYPE guardian_feature_module_enum AS ENUM ('G', 'H', 'I', 'Z', 'GTM');
  END IF;
END $$;

-- ============================================================
-- 1) guardian_plan_tiers (workspace-scoped, display-only)
-- ============================================================

CREATE TABLE IF NOT EXISTS guardian_plan_tiers (
  workspace_id UUID PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  tier guardian_plan_tier_enum NOT NULL DEFAULT 'internal',
  effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  set_by TEXT NULL,
  notes TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardian_plan_tiers_tier
  ON guardian_plan_tiers(tier);

ALTER TABLE guardian_plan_tiers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_guardian_plan_tiers" ON guardian_plan_tiers;
CREATE POLICY "tenant_isolation_guardian_plan_tiers" ON guardian_plan_tiers
FOR ALL USING (workspace_id = get_current_workspace_id());

COMMENT ON TABLE guardian_plan_tiers IS
  'DISPLAY-ONLY: Workspace plan tier selection for Guardian pricing/packaging visibility. No billing and no runtime enforcement.';

-- ============================================================
-- 2) guardian_feature_catalog (GLOBAL, NO RLS, display-only)
-- ============================================================

CREATE TABLE IF NOT EXISTS guardian_feature_catalog (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  module guardian_feature_module_enum NOT NULL,
  route TEXT NULL,
  docs_ref TEXT NULL,
  requires_keys JSONB[] NOT NULL DEFAULT ARRAY[]::jsonb[],
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guardian_feature_catalog_module
  ON guardian_feature_catalog(module);
CREATE INDEX IF NOT EXISTS idx_guardian_feature_catalog_available
  ON guardian_feature_catalog(is_available);

COMMENT ON TABLE guardian_feature_catalog IS
  'DISPLAY-ONLY: Global catalog of Guardian features/modules for sales and UX visibility. This table intentionally has NO RLS and does not enforce access.';

-- ============================================================
-- 3) guardian_tier_feature_map (workspace-scoped, display-only)
-- ============================================================

CREATE TABLE IF NOT EXISTS guardian_tier_feature_map (
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tier guardian_plan_tier_enum NOT NULL,
  feature_key TEXT NOT NULL REFERENCES guardian_feature_catalog(key) ON DELETE CASCADE,
  included BOOLEAN NOT NULL DEFAULT false,
  notes TEXT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_guardian_tier_feature_map UNIQUE (workspace_id, tier, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_guardian_tier_feature_map_workspace_tier
  ON guardian_tier_feature_map(workspace_id, tier);
CREATE INDEX IF NOT EXISTS idx_guardian_tier_feature_map_workspace_included
  ON guardian_tier_feature_map(workspace_id, included);
CREATE INDEX IF NOT EXISTS idx_guardian_tier_feature_map_feature_key
  ON guardian_tier_feature_map(feature_key);

ALTER TABLE guardian_tier_feature_map ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tenant_isolation_guardian_tier_feature_map" ON guardian_tier_feature_map;
CREATE POLICY "tenant_isolation_guardian_tier_feature_map" ON guardian_tier_feature_map
FOR ALL USING (workspace_id = get_current_workspace_id());

COMMENT ON TABLE guardian_tier_feature_map IS
  'DISPLAY-ONLY: Workspace-specific inclusion mapping of feature catalog entries per plan tier. No enforcement; used for feature matrix visibility only.';

