-- Phase 33: Honest Visual Playground
-- Create tables for visual concept packs

-- Visual Concept Packs table
CREATE TABLE IF NOT EXISTS visual_concept_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  pillar_id TEXT NOT NULL,
  sub_pillar_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'reviewed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for concept packs
CREATE INDEX IF NOT EXISTS idx_concept_packs_workspace ON visual_concept_packs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_concept_packs_pillar ON visual_concept_packs(pillar_id);
CREATE INDEX IF NOT EXISTS idx_concept_packs_status ON visual_concept_packs(status);

-- Visual Concept Items table
CREATE TABLE IF NOT EXISTS visual_concept_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES visual_concept_packs(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('wireframe', 'layout', 'copy', 'voice', 'video')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  disclaimer TEXT NOT NULL,
  generated_by TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generated' CHECK (status IN ('draft', 'generated', 'reviewed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for concept items
CREATE INDEX IF NOT EXISTS idx_concept_items_pack ON visual_concept_items(pack_id);
CREATE INDEX IF NOT EXISTS idx_concept_items_type ON visual_concept_items(type);
CREATE INDEX IF NOT EXISTS idx_concept_items_status ON visual_concept_items(status);

-- Enable RLS
ALTER TABLE visual_concept_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_concept_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for concept packs (workspace isolation)
CREATE POLICY "users_view_workspace_packs" ON visual_concept_packs
FOR SELECT USING (
  workspace_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "users_insert_workspace_packs" ON visual_concept_packs
FOR INSERT WITH CHECK (
  workspace_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "users_update_workspace_packs" ON visual_concept_packs
FOR UPDATE USING (
  workspace_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  )
);

CREATE POLICY "users_delete_workspace_packs" ON visual_concept_packs
FOR DELETE USING (
  workspace_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  )
);

-- RLS policies for concept items (through pack)
CREATE POLICY "users_view_pack_items" ON visual_concept_items
FOR SELECT USING (
  pack_id IN (
    SELECT id FROM visual_concept_packs WHERE workspace_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "users_insert_pack_items" ON visual_concept_items
FOR INSERT WITH CHECK (
  pack_id IN (
    SELECT id FROM visual_concept_packs WHERE workspace_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "users_update_pack_items" ON visual_concept_items
FOR UPDATE USING (
  pack_id IN (
    SELECT id FROM visual_concept_packs WHERE workspace_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "users_delete_pack_items" ON visual_concept_items
FOR DELETE USING (
  pack_id IN (
    SELECT id FROM visual_concept_packs WHERE workspace_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  )
);

-- Service role access
CREATE POLICY "service_role_all_packs" ON visual_concept_packs
FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "service_role_all_items" ON visual_concept_items
FOR ALL USING (workspace_id = current_setting('app.current_workspace_id')::uuid AND auth.jwt() ->> 'role' = 'service_role');

-- Grant permissions
GRANT ALL ON visual_concept_packs TO authenticated;
GRANT ALL ON visual_concept_items TO authenticated;
