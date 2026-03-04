-- Migration 517: Agent Army foundation tables
-- Covers UNI-1443: agent_runs, opportunities, competitor_updates, content_queue, leads

-- =============================================================================
-- agent_runs: track every agent execution
-- =============================================================================
CREATE TABLE IF NOT EXISTS agent_runs (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid,
  agent_id     text        NOT NULL,
  commander    text,
  task         text        NOT NULL,
  result       jsonb       DEFAULT '{}',
  status       text        DEFAULT 'pending',
  cost_tokens  integer     DEFAULT 0,
  cost_usd     numeric(10,4) DEFAULT 0,
  started_at   timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_workspace    ON agent_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_runs_created_at   ON agent_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_commander    ON agent_runs(commander);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status       ON agent_runs(status);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY agent_runs_service ON agent_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- opportunities: agent-discovered revenue/growth opportunities
-- =============================================================================
CREATE TABLE IF NOT EXISTS opportunities (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      uuid,
  source_agent      text        NOT NULL,
  type              text        NOT NULL,
  title             text        NOT NULL,
  description       text,
  priority          text        DEFAULT 'medium',
  status            text        DEFAULT 'new',
  revenue_potential numeric(12,2),
  metadata          jsonb       DEFAULT '{}',
  created_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opportunities_workspace   ON opportunities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at  ON opportunities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opportunities_status      ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_opportunities_priority    ON opportunities(priority);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY opportunities_service ON opportunities
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- competitor_updates: intel from competitive monitoring agents
-- =============================================================================
CREATE TABLE IF NOT EXISTS competitor_updates (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid,
  competitor   text        NOT NULL,
  change_type  text        NOT NULL,
  details      text,
  source_url   text,
  detected_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competitor_updates_workspace   ON competitor_updates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_competitor_updates_detected_at ON competitor_updates(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_updates_competitor  ON competitor_updates(competitor);

ALTER TABLE competitor_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY competitor_updates_service ON competitor_updates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- content_queue: content drafted by agents, pending review/publish
-- =============================================================================
CREATE TABLE IF NOT EXISTS content_queue (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   uuid,
  platform       text        NOT NULL,
  draft_content  text        NOT NULL,
  status         text        DEFAULT 'draft',
  scheduled_for  timestamptz,
  published_at   timestamptz,
  source_agent   text,
  created_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_queue_workspace   ON content_queue(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_queue_created_at  ON content_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_queue_status      ON content_queue(status);
CREATE INDEX IF NOT EXISTS idx_content_queue_platform    ON content_queue(platform);

ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY content_queue_service ON content_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- leads: agent-sourced leads
-- =============================================================================
CREATE TABLE IF NOT EXISTS leads (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid,
  source_agent  text        NOT NULL,
  company       text,
  contact_name  text,
  contact_email text,
  industry      text,
  score         integer     DEFAULT 50,
  status        text        DEFAULT 'new',
  notes         text,
  metadata      jsonb       DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_workspace   ON leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at  ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status      ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_industry    ON leads(industry);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY leads_service ON leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);
