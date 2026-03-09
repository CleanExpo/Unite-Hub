-- =============================================================================
-- Migration 320: Deal Pipeline Schema
-- Creates pipeline_stages, deals, and deal_activities tables
-- Enables deal tracking, pipeline management, and activity logging
-- =============================================================================

-- Pipeline stages (customizable per workspace)
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  is_won BOOLEAN DEFAULT FALSE,
  is_lost BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deals (the core entity)
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  value DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'AUD',
  probability INT DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  assigned_to UUID,
  source TEXT,
  lost_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deal activities (interaction log)
CREATE TABLE IF NOT EXISTS deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'note', 'email', 'call', 'meeting', 'task', 'stage_change', 'value_change', 'status_change'
  )),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deals_workspace ON deals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at);
CREATE INDEX IF NOT EXISTS idx_deal_activities_deal ON deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_activities_workspace ON deal_activities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_workspace ON pipeline_stages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_position ON pipeline_stages(workspace_id, position);

-- RLS Policies
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workspace_isolation' AND tablename = 'pipeline_stages') THEN
    CREATE POLICY "workspace_isolation" ON pipeline_stages
      FOR ALL USING (workspace_id = (SELECT workspace_id FROM user_profiles WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workspace_isolation' AND tablename = 'deals') THEN
    CREATE POLICY "workspace_isolation" ON deals
      FOR ALL USING (workspace_id = (SELECT workspace_id FROM user_profiles WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'workspace_isolation' AND tablename = 'deal_activities') THEN
    CREATE POLICY "workspace_isolation" ON deal_activities
      FOR ALL USING (workspace_id = (SELECT workspace_id FROM user_profiles WHERE user_id = auth.uid()));
  END IF;
END $$;

-- Seed default pipeline stages per workspace (trigger for new workspaces)
CREATE OR REPLACE FUNCTION create_default_pipeline_stages()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pipeline_stages (workspace_id, name, position, color, is_won, is_lost) VALUES
    (NEW.id, 'Lead', 0, '#94A3B8', FALSE, FALSE),
    (NEW.id, 'Qualified', 1, '#3B82F6', FALSE, FALSE),
    (NEW.id, 'Proposal', 2, '#8B5CF6', FALSE, FALSE),
    (NEW.id, 'Negotiation', 3, '#F59E0B', FALSE, FALSE),
    (NEW.id, 'Won', 4, '#10B981', TRUE, FALSE),
    (NEW.id, 'Lost', 5, '#EF4444', FALSE, TRUE);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'auto_create_pipeline_stages') THEN
    CREATE TRIGGER auto_create_pipeline_stages
      AFTER INSERT ON organizations
      FOR EACH ROW EXECUTE FUNCTION create_default_pipeline_stages();
  END IF;
END $$;

-- Seed existing workspaces with default stages (if they don't already have any)
INSERT INTO pipeline_stages (workspace_id, name, position, color, is_won, is_lost)
SELECT o.id, stage.name, stage.position, stage.color, stage.is_won, stage.is_lost
FROM organizations o
CROSS JOIN (VALUES
  ('Lead', 0, '#94A3B8', FALSE, FALSE),
  ('Qualified', 1, '#3B82F6', FALSE, FALSE),
  ('Proposal', 2, '#8B5CF6', FALSE, FALSE),
  ('Negotiation', 3, '#F59E0B', FALSE, FALSE),
  ('Won', 4, '#10B981', TRUE, FALSE),
  ('Lost', 5, '#EF4444', FALSE, TRUE)
) AS stage(name, position, color, is_won, is_lost)
WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages ps WHERE ps.workspace_id = o.id);
