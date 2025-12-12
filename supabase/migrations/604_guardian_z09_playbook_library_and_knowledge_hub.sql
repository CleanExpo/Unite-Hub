-- Guardian Z09: Playbook Library & Knowledge Hub
-- Date: December 12, 2025
-- Pattern: Parent-child CASCADE delete, RLS for global + tenant isolation

-- ===== TABLE 1: guardian_playbooks =====

CREATE TABLE IF NOT EXISTS guardian_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,  -- NULL for global playbooks
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identity
  key TEXT NOT NULL,  -- stable ID (e.g., 'enable_network_intelligence_safely')
  title TEXT NOT NULL,
  summary TEXT NOT NULL,

  -- Classification
  category TEXT NOT NULL,  -- 'readiness', 'uplift', 'editions', 'qa_chaos', 'network_intelligence', 'governance', 'adoption', 'executive', 'goals_okrs'
  complexity TEXT NOT NULL DEFAULT 'medium',  -- 'intro', 'medium', 'advanced'

  -- Global vs Tenant
  is_global BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Optional metadata
  estimated_duration_minutes INTEGER NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT playbook_key_unique UNIQUE (COALESCE(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), key),
  CONSTRAINT category_valid CHECK (category IN ('readiness', 'uplift', 'editions', 'qa_chaos', 'network_intelligence', 'governance', 'adoption', 'executive', 'goals_okrs')),
  CONSTRAINT complexity_valid CHECK (complexity IN ('intro', 'medium', 'advanced')),
  CONSTRAINT global_no_tenant CHECK (NOT (is_global = true AND tenant_id IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_playbooks_tenant_category
  ON guardian_playbooks(tenant_id, category) WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_playbooks_global_active
  ON guardian_playbooks(category, is_active) WHERE tenant_id IS NULL AND is_global = true;

-- ===== TABLE 2: guardian_playbook_sections =====

CREATE TABLE IF NOT EXISTS guardian_playbook_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES guardian_playbooks(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ordering
  order_index INTEGER NOT NULL,

  -- Content
  heading TEXT NOT NULL,
  body TEXT NOT NULL,  -- markdown or rich-text

  -- Section type
  section_type TEXT NOT NULL DEFAULT 'guide',  -- 'guide', 'checklist', 'scenario', 'faq', 'reference'

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT section_type_valid CHECK (section_type IN ('guide', 'checklist', 'scenario', 'faq', 'reference'))
);

CREATE INDEX IF NOT EXISTS idx_playbook_sections_playbook_order
  ON guardian_playbook_sections(playbook_id, order_index);

-- ===== TABLE 3: guardian_playbook_tags =====

CREATE TABLE IF NOT EXISTS guardian_playbook_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id UUID NOT NULL REFERENCES guardian_playbooks(id) ON DELETE CASCADE,

  -- Tag for pattern matching
  tag_key TEXT NOT NULL,  -- e.g., 'low_readiness_core', 'weak_network_fit', 'low_adoption_core'

  -- Source domain
  source_domain TEXT NOT NULL,  -- 'readiness', 'uplift', 'editions', 'adoption', 'executive', 'goals_okrs', 'network_meta'

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT playbook_tag_unique UNIQUE (playbook_id, tag_key),
  CONSTRAINT source_domain_valid CHECK (source_domain IN ('readiness', 'uplift', 'editions', 'adoption', 'executive', 'goals_okrs', 'network_meta'))
);

CREATE INDEX IF NOT EXISTS idx_playbook_tags_domain_key
  ON guardian_playbook_tags(source_domain, tag_key);

-- ===== RLS POLICIES =====

-- guardian_playbooks: global public OR own tenant
ALTER TABLE guardian_playbooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "playbooks_visible_based_on_scope" ON guardian_playbooks;
CREATE POLICY "playbooks_visible_based_on_scope" ON guardian_playbooks
FOR SELECT USING (
  -- Global active playbooks visible to all
  (tenant_id IS NULL AND is_global = true AND is_active = true)
  -- OR own tenant's playbooks
  OR tenant_id = get_current_workspace_id()
);

DROP POLICY IF EXISTS "playbooks_tenant_insert" ON guardian_playbooks;
CREATE POLICY "playbooks_tenant_insert" ON guardian_playbooks
FOR INSERT WITH CHECK (tenant_id = get_current_workspace_id() AND is_global = false);

DROP POLICY IF EXISTS "playbooks_tenant_update" ON guardian_playbooks;
CREATE POLICY "playbooks_tenant_update" ON guardian_playbooks
FOR UPDATE USING (tenant_id = get_current_workspace_id()) WITH CHECK (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "playbooks_tenant_delete" ON guardian_playbooks;
CREATE POLICY "playbooks_tenant_delete" ON guardian_playbooks
FOR DELETE USING (tenant_id = get_current_workspace_id());

-- guardian_playbook_sections: cascade from playbook visibility
ALTER TABLE guardian_playbook_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "playbook_sections_visible_via_playbook" ON guardian_playbook_sections;
CREATE POLICY "playbook_sections_visible_via_playbook" ON guardian_playbook_sections
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM guardian_playbooks p
    WHERE p.id = playbook_id
      AND ((p.tenant_id IS NULL AND p.is_global = true AND p.is_active = true)
           OR p.tenant_id = get_current_workspace_id())
  )
);

DROP POLICY IF EXISTS "playbook_sections_tenant_modify" ON guardian_playbook_sections;
CREATE POLICY "playbook_sections_tenant_modify" ON guardian_playbook_sections
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM guardian_playbooks p
    WHERE p.id = playbook_id AND p.tenant_id = get_current_workspace_id()
  )
);

-- guardian_playbook_tags: cascade from playbook visibility
ALTER TABLE guardian_playbook_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "playbook_tags_visible_via_playbook" ON guardian_playbook_tags;
CREATE POLICY "playbook_tags_visible_via_playbook" ON guardian_playbook_tags
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM guardian_playbooks p
    WHERE p.id = playbook_id
      AND ((p.tenant_id IS NULL AND p.is_global = true AND p.is_active = true)
           OR p.tenant_id = get_current_workspace_id())
  )
);

DROP POLICY IF EXISTS "playbook_tags_tenant_modify" ON guardian_playbook_tags;
CREATE POLICY "playbook_tags_tenant_modify" ON guardian_playbook_tags
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM guardian_playbooks p
    WHERE p.id = playbook_id AND p.tenant_id = get_current_workspace_id()
  )
);

-- ===== COMMENTS =====

COMMENT ON TABLE guardian_playbooks IS
  'Playbook library: global (shared templates) and tenant-specific guides. Advisory-only; does not affect Guardian runtime.';

COMMENT ON TABLE guardian_playbook_sections IS
  'Ordered content sections for playbooks. Supports markdown, checklists, FAQs, references.';

COMMENT ON TABLE guardian_playbook_tags IS
  'Tags linking playbooks to Z-series meta patterns (low readiness, weak edition fit, etc.).';

COMMENT ON COLUMN guardian_playbooks.is_global IS
  'true for shared templates (tenant_id must be NULL). Global playbooks must not contain PII.';

COMMENT ON COLUMN guardian_playbook_tags.tag_key IS
  'Pattern identifier (e.g., "low_readiness_core"). Used to match Z-series patterns to playbooks.';
