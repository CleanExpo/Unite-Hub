-- Migration 517: Agent Army foundation tables
-- Covers UNI-1443: army_runs, army_opportunities, army_competitor_updates, army_content_queue, army_leads
-- NOTE: Prefixed with army_ to avoid collision with existing agent_runs, opportunities, leads,
--       content_queue, competitor_updates tables from migrations 103/108/222/293/303.

-- =============================================================================
-- army_runs: track every Agent Army execution
-- =============================================================================
CREATE TABLE IF NOT EXISTS army_runs (
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

CREATE INDEX IF NOT EXISTS idx_army_runs_workspace    ON army_runs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_army_runs_created_at   ON army_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_army_runs_commander    ON army_runs(commander);
CREATE INDEX IF NOT EXISTS idx_army_runs_status       ON army_runs(status);

ALTER TABLE army_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY army_runs_service ON army_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- army_opportunities: agent-discovered revenue/growth opportunities
-- =============================================================================
CREATE TABLE IF NOT EXISTS army_opportunities (
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

CREATE INDEX IF NOT EXISTS idx_army_opportunities_workspace   ON army_opportunities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_army_opportunities_created_at  ON army_opportunities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_army_opportunities_status      ON army_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_army_opportunities_priority    ON army_opportunities(priority);

ALTER TABLE army_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY army_opportunities_service ON army_opportunities
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- army_competitor_updates: intel from competitive monitoring agents
-- =============================================================================
CREATE TABLE IF NOT EXISTS army_competitor_updates (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid,
  competitor   text        NOT NULL,
  change_type  text        NOT NULL,
  details      text,
  source_url   text,
  detected_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_army_competitor_updates_workspace   ON army_competitor_updates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_army_competitor_updates_detected_at ON army_competitor_updates(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_army_competitor_updates_competitor  ON army_competitor_updates(competitor);

ALTER TABLE army_competitor_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY army_competitor_updates_service ON army_competitor_updates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- army_content_queue: content drafted by agents, pending review/publish
-- =============================================================================
CREATE TABLE IF NOT EXISTS army_content_queue (
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

CREATE INDEX IF NOT EXISTS idx_army_content_queue_workspace   ON army_content_queue(workspace_id);
CREATE INDEX IF NOT EXISTS idx_army_content_queue_created_at  ON army_content_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_army_content_queue_status      ON army_content_queue(status);
CREATE INDEX IF NOT EXISTS idx_army_content_queue_platform    ON army_content_queue(platform);

ALTER TABLE army_content_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY army_content_queue_service ON army_content_queue
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- army_leads: agent-sourced leads
-- =============================================================================
CREATE TABLE IF NOT EXISTS army_leads (
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

CREATE INDEX IF NOT EXISTS idx_army_leads_workspace   ON army_leads(workspace_id);
CREATE INDEX IF NOT EXISTS idx_army_leads_created_at  ON army_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_army_leads_status      ON army_leads(status);
CREATE INDEX IF NOT EXISTS idx_army_leads_industry    ON army_leads(industry);

ALTER TABLE army_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY army_leads_service ON army_leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);
