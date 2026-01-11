-- Synthex Projects Kanban + Approval Gating
-- Phase: Synthex Studio Client-Facing Kanban (approval-required publishing)
-- Idempotent migration (tables, indexes, RLS policies)
--
-- Prerequisites (must already exist in your Supabase schema):
-- - synthex_tenants (tenant root table, includes owner_user_id)
-- - synthex_brands (optional brand linkage)
-- - synthex_tenant_members (team membership + roles)

-- ============================================================================
-- TABLE: synthex_projects
-- High-level client-facing "project card" shown in the Kanban board
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES synthex_brands(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  goal TEXT,
  channels TEXT[] NOT NULL DEFAULT '{}',

  -- Kanban stage (stable UX states; automation progresses left->right)
  stage TEXT NOT NULL DEFAULT 'brief',

  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT synthex_projects_valid_stage CHECK (
    stage IN (
      'brief',
      'strategy',
      'production',
      'client_review',
      'scheduled',
      'live',
      'optimize',
      'archived'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_synthex_projects_tenant ON synthex_projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_projects_brand ON synthex_projects(brand_id);
CREATE INDEX IF NOT EXISTS idx_synthex_projects_stage ON synthex_projects(tenant_id, stage);
CREATE INDEX IF NOT EXISTS idx_synthex_projects_updated ON synthex_projects(tenant_id, updated_at DESC);

COMMENT ON TABLE synthex_projects IS 'Client-facing marketing automation projects shown in the Synthex Kanban board.';
COMMENT ON COLUMN synthex_projects.stage IS 'Kanban stage; transitions are gated by verification + client approval.';

-- ============================================================================
-- TABLE: synthex_project_runs
-- A concrete iteration of work for a project (draft pack, schedule pack, etc.)
-- Stores the exact artifact bundle to be approved by the client.
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_project_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES synthex_projects(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'awaiting_approval', -- awaiting_approval | approved | failed
  current_stage TEXT NOT NULL DEFAULT 'client_review',

  -- The immutable bundle being reviewed/approved
  artifact_bundle_hash TEXT,
  artifact_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  verification_json JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT synthex_project_runs_valid_status CHECK (
    status IN ('awaiting_approval', 'approved', 'failed')
  ),
  CONSTRAINT synthex_project_runs_valid_stage CHECK (
    current_stage IN (
      'brief',
      'strategy',
      'production',
      'client_review',
      'scheduled',
      'live',
      'optimize',
      'archived'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_synthex_project_runs_tenant ON synthex_project_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_project_runs_project ON synthex_project_runs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_synthex_project_runs_status ON synthex_project_runs(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_synthex_project_runs_bundle ON synthex_project_runs(tenant_id, artifact_bundle_hash);

COMMENT ON TABLE synthex_project_runs IS 'Per-project run iterations; stores artifacts and verification results for client approval.';

-- ============================================================================
-- TABLE: synthex_project_approvals
-- Immutable record that a user approved a specific artifact bundle.
-- ============================================================================

CREATE TABLE IF NOT EXISTS synthex_project_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES synthex_projects(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES synthex_project_runs(id) ON DELETE CASCADE,

  approval_type TEXT NOT NULL DEFAULT 'schedule', -- schedule | launch | content | strategy
  artifact_bundle_hash TEXT NOT NULL,

  approved_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT synthex_project_approvals_valid_type CHECK (
    approval_type IN ('schedule', 'launch', 'content', 'strategy')
  )
);

CREATE INDEX IF NOT EXISTS idx_synthex_project_approvals_tenant ON synthex_project_approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_project_approvals_project ON synthex_project_approvals(project_id, approved_at DESC);
CREATE INDEX IF NOT EXISTS idx_synthex_project_approvals_run ON synthex_project_approvals(run_id);
CREATE INDEX IF NOT EXISTS idx_synthex_project_approvals_bundle ON synthex_project_approvals(tenant_id, artifact_bundle_hash);

COMMENT ON TABLE synthex_project_approvals IS 'Client/team approvals for a specific artifact bundle hash (immutable).';

-- ============================================================================
-- RLS
-- Note: This relies on synthex_tenants(owner_user_id) and synthex_tenant_members for membership.
-- ============================================================================

ALTER TABLE synthex_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_project_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_project_approvals ENABLE ROW LEVEL SECURITY;

-- synthex_projects
DROP POLICY IF EXISTS "synthex_projects_select" ON synthex_projects;
CREATE POLICY "synthex_projects_select" ON synthex_projects
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid())
    OR tenant_id IN (
      SELECT tenant_id FROM synthex_tenant_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "synthex_projects_insert" ON synthex_projects;
CREATE POLICY "synthex_projects_insert" ON synthex_projects
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid())
    OR tenant_id IN (
      SELECT tenant_id FROM synthex_tenant_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner','admin','editor')
    )
  );

DROP POLICY IF EXISTS "synthex_projects_update" ON synthex_projects;
CREATE POLICY "synthex_projects_update" ON synthex_projects
  FOR UPDATE USING (
    tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid())
    OR tenant_id IN (
      SELECT tenant_id FROM synthex_tenant_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner','admin','editor')
    )
  )
  WITH CHECK (
    tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid())
    OR tenant_id IN (
      SELECT tenant_id FROM synthex_tenant_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner','admin','editor')
    )
  );

-- synthex_project_runs
DROP POLICY IF EXISTS "synthex_project_runs_select" ON synthex_project_runs;
CREATE POLICY "synthex_project_runs_select" ON synthex_project_runs
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid())
    OR tenant_id IN (
      SELECT tenant_id FROM synthex_tenant_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "synthex_project_runs_insert" ON synthex_project_runs;
CREATE POLICY "synthex_project_runs_insert" ON synthex_project_runs
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid())
    OR tenant_id IN (
      SELECT tenant_id FROM synthex_tenant_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner','admin','editor')
    )
  );

DROP POLICY IF EXISTS "synthex_project_runs_update" ON synthex_project_runs;
CREATE POLICY "synthex_project_runs_update" ON synthex_project_runs
  FOR UPDATE USING (
    tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid())
    OR tenant_id IN (
      SELECT tenant_id FROM synthex_tenant_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner','admin','editor')
    )
  )
  WITH CHECK (
    tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid())
    OR tenant_id IN (
      SELECT tenant_id FROM synthex_tenant_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner','admin','editor')
    )
  );

-- synthex_project_approvals
DROP POLICY IF EXISTS "synthex_project_approvals_select" ON synthex_project_approvals;
CREATE POLICY "synthex_project_approvals_select" ON synthex_project_approvals
  FOR SELECT USING (
    tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid())
    OR tenant_id IN (
      SELECT tenant_id FROM synthex_tenant_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "synthex_project_approvals_insert" ON synthex_project_approvals;
CREATE POLICY "synthex_project_approvals_insert" ON synthex_project_approvals
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT id FROM synthex_tenants WHERE owner_user_id = auth.uid())
    OR tenant_id IN (
      SELECT tenant_id FROM synthex_tenant_members
      WHERE user_id = auth.uid() AND status = 'active' AND role IN ('owner','admin','editor')
    )
  );
