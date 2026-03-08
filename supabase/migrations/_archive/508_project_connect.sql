-- Migration 508: Project Connect
-- Cross-project gateway tables for external product integration

-- connected_projects: external products that connect to Unite-Hub
CREATE TABLE IF NOT EXISTS connected_projects (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name           text NOT NULL,
  slug           text NOT NULL UNIQUE,
  api_key_hash   text,
  api_key_prefix text,
  webhook_url    text,
  last_seen_at   timestamptz,
  health_status  text DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'degraded', 'down', 'unknown')),
  health_data    jsonb DEFAULT '{}',
  owner_id       uuid NOT NULL,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

-- project_events: cross-project event stream
CREATE TABLE IF NOT EXISTS project_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid REFERENCES connected_projects(id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_events_project_id ON project_events(project_id);
CREATE INDEX IF NOT EXISTS idx_project_events_event_type ON project_events(event_type);
CREATE INDEX IF NOT EXISTS idx_project_events_created_at ON project_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connected_projects_owner ON connected_projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_connected_projects_slug ON connected_projects(slug);

-- RLS
ALTER TABLE connected_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_events ENABLE ROW LEVEL SECURITY;

-- Owner can manage their connected projects
CREATE POLICY "owner_manage_connected_projects" ON connected_projects
  FOR ALL USING (owner_id = auth.uid());

-- Service role bypasses RLS (for API key auth gateway)
-- Events visible to project owner
CREATE POLICY "owner_view_project_events" ON project_events
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM connected_projects WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owner_insert_project_events" ON project_events
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM connected_projects WHERE owner_id = auth.uid()
    )
  );
