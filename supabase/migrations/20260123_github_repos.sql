-- GitHub Repository Management Tables
-- Part of Unite-Hub Evolution Spec v2.0
-- @see .claude/plans/SPEC-2026-01-23.md

-- ============================================================================
-- GitHub Repositories Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS founder_github_repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Repository identifiers
  github_repo_id BIGINT UNIQUE, -- GitHub's internal repo ID
  repo_url TEXT NOT NULL,
  repo_name TEXT NOT NULL,
  repo_owner TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (repo_owner || '/' || repo_name) STORED,

  -- Authentication (encrypted)
  installation_id BIGINT, -- GitHub App installation ID
  access_token_encrypted TEXT, -- Encrypted access token

  -- Repository metadata
  description TEXT,
  language TEXT,
  is_private BOOLEAN DEFAULT false,
  is_fork BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  default_branch TEXT DEFAULT 'main',

  -- Stats (cached, updated on sync)
  stars_count INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  open_issues_count INTEGER DEFAULT 0,
  watchers_count INTEGER DEFAULT 0,
  size_kb INTEGER DEFAULT 0,

  -- Sync state
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'error')),
  last_sync_at TIMESTAMPTZ,
  last_sync_error TEXT,

  -- Tracking
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for workspace queries
CREATE INDEX IF NOT EXISTS idx_founder_github_repos_workspace
  ON founder_github_repos(workspace_id);

-- Index for sync status
CREATE INDEX IF NOT EXISTS idx_founder_github_repos_sync_status
  ON founder_github_repos(sync_status);

-- ============================================================================
-- Repository Metrics Table (Daily snapshots)
-- ============================================================================

CREATE TABLE IF NOT EXISTS founder_repo_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID NOT NULL REFERENCES founder_github_repos(id) ON DELETE CASCADE,

  -- Date of metrics
  metric_date DATE NOT NULL,

  -- Activity metrics
  commits_count INTEGER DEFAULT 0,
  prs_open INTEGER DEFAULT 0,
  prs_merged INTEGER DEFAULT 0,
  prs_closed INTEGER DEFAULT 0,
  issues_open INTEGER DEFAULT 0,
  issues_closed INTEGER DEFAULT 0,

  -- Contributor metrics
  contributors_active INTEGER DEFAULT 0,
  new_contributors INTEGER DEFAULT 0,

  -- Code metrics
  lines_added INTEGER DEFAULT 0,
  lines_removed INTEGER DEFAULT 0,
  files_changed INTEGER DEFAULT 0,

  -- Engagement metrics
  stars_gained INTEGER DEFAULT 0,
  forks_gained INTEGER DEFAULT 0,

  -- Deployment metrics
  deployments_count INTEGER DEFAULT 0,
  deployments_success INTEGER DEFAULT 0,
  deployments_failed INTEGER DEFAULT 0,

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one record per repo per day
  UNIQUE(repo_id, metric_date)
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_founder_repo_metrics_date
  ON founder_repo_metrics(repo_id, metric_date DESC);

-- ============================================================================
-- Repository Issues/PRs Cache Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS founder_repo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID NOT NULL REFERENCES founder_github_repos(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- GitHub identifiers
  github_item_id BIGINT NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('issue', 'pull_request')),
  item_number INTEGER NOT NULL,

  -- Item details
  title TEXT NOT NULL,
  body TEXT,
  state TEXT NOT NULL CHECK (state IN ('open', 'closed', 'merged')),

  -- Labels and assignees (JSONB arrays)
  labels JSONB DEFAULT '[]',
  assignees JSONB DEFAULT '[]',

  -- Author info
  author_login TEXT,
  author_avatar_url TEXT,

  -- Timestamps
  github_created_at TIMESTAMPTZ,
  github_updated_at TIMESTAMPTZ,
  github_closed_at TIMESTAMPTZ,
  github_merged_at TIMESTAMPTZ,

  -- PR-specific fields
  head_branch TEXT,
  base_branch TEXT,
  is_draft BOOLEAN DEFAULT false,
  mergeable BOOLEAN,

  -- AI analysis
  ai_summary TEXT,
  ai_priority TEXT CHECK (ai_priority IN ('critical', 'high', 'medium', 'low')),
  ai_category TEXT,
  ai_analyzed_at TIMESTAMPTZ,

  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique items per repo
  UNIQUE(repo_id, github_item_id)
);

-- Indexes for querying
CREATE INDEX IF NOT EXISTS idx_founder_repo_items_workspace
  ON founder_repo_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_founder_repo_items_type_state
  ON founder_repo_items(repo_id, item_type, state);
CREATE INDEX IF NOT EXISTS idx_founder_repo_items_priority
  ON founder_repo_items(ai_priority) WHERE ai_priority IS NOT NULL;

-- ============================================================================
-- GitHub Webhooks Log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS founder_github_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_id UUID REFERENCES founder_github_repos(id) ON DELETE SET NULL,

  -- Webhook details
  event_type TEXT NOT NULL,
  action TEXT,
  delivery_id TEXT,

  -- Payload (stored as JSONB for querying)
  payload JSONB NOT NULL,

  -- Processing status
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,

  -- Tracking
  received_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for processing queue
CREATE INDEX IF NOT EXISTS idx_founder_github_webhooks_unprocessed
  ON founder_github_webhooks(processed, received_at) WHERE processed = false;

-- ============================================================================
-- Row Level Security
-- ============================================================================

-- Enable RLS
ALTER TABLE founder_github_repos ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_repo_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_repo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_github_webhooks ENABLE ROW LEVEL SECURITY;

-- Policies for founder_github_repos
DROP POLICY IF EXISTS "founder_github_repos_tenant_isolation" ON founder_github_repos;
CREATE POLICY "founder_github_repos_tenant_isolation" ON founder_github_repos
  FOR ALL USING (workspace_id = get_current_workspace_id());

-- Policies for founder_repo_metrics
DROP POLICY IF EXISTS "founder_repo_metrics_tenant_isolation" ON founder_repo_metrics;
CREATE POLICY "founder_repo_metrics_tenant_isolation" ON founder_repo_metrics
  FOR ALL USING (
    repo_id IN (
      SELECT id FROM founder_github_repos
      WHERE workspace_id = get_current_workspace_id()
    )
  );

-- Policies for founder_repo_items
DROP POLICY IF EXISTS "founder_repo_items_tenant_isolation" ON founder_repo_items;
CREATE POLICY "founder_repo_items_tenant_isolation" ON founder_repo_items
  FOR ALL USING (workspace_id = get_current_workspace_id());

-- Webhooks - admin only (no RLS, processed server-side)
DROP POLICY IF EXISTS "founder_github_webhooks_admin" ON founder_github_webhooks;
CREATE POLICY "founder_github_webhooks_admin" ON founder_github_webhooks
  FOR ALL USING (true); -- Processed by server, not user-facing

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to update repo stats from metrics
CREATE OR REPLACE FUNCTION update_repo_stats_from_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- This could be used to update cached stats on the repo
  -- For now, just update the updated_at timestamp
  UPDATE founder_github_repos
  SET updated_at = NOW()
  WHERE id = NEW.repo_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for metrics updates
DROP TRIGGER IF EXISTS trigger_update_repo_stats ON founder_repo_metrics;
CREATE TRIGGER trigger_update_repo_stats
  AFTER INSERT OR UPDATE ON founder_repo_metrics
  FOR EACH ROW
  EXECUTE FUNCTION update_repo_stats_from_metrics();

-- Function to auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_github_repos_updated_at ON founder_github_repos;
CREATE TRIGGER trigger_github_repos_updated_at
  BEFORE UPDATE ON founder_github_repos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_repo_items_updated_at ON founder_repo_items;
CREATE TRIGGER trigger_repo_items_updated_at
  BEFORE UPDATE ON founder_repo_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE founder_github_repos IS 'GitHub repositories connected to Unite-Hub for unified management';
COMMENT ON TABLE founder_repo_metrics IS 'Daily metrics snapshots for GitHub repositories';
COMMENT ON TABLE founder_repo_items IS 'Cached issues and pull requests from GitHub repositories';
COMMENT ON TABLE founder_github_webhooks IS 'Incoming GitHub webhook events for processing';
