-- Migration 164: Unified Memory Spine (UMS)
-- Phase 121: Connects all memory sources into unified graph

CREATE TABLE IF NOT EXISTS memory_spine_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,
  source_id UUID NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  link_metadata JSONB NOT NULL DEFAULT '{}',
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_memory_spine_source ON memory_spine_links(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_memory_spine_target ON memory_spine_links(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_memory_spine_tenant ON memory_spine_links(tenant_id);

ALTER TABLE memory_spine_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view memory spine" ON memory_spine_links;
CREATE POLICY "Users can view memory spine" ON memory_spine_links FOR SELECT
  USING (tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()) OR tenant_id IS NULL);

COMMENT ON TABLE memory_spine_links IS 'Phase 121: Unified memory spine links';
