-- Migration 409: Distribution Tracking Tables
-- Created: 2026-01-15
-- Purpose: Support Phase 8 Part 5 - Knowledge Graph Deployment, Social Drip, Real-time Monitoring

-- =====================================================
-- Table: graph_deployments
-- Purpose: Track Knowledge Graph/AEO deployments
-- =====================================================
CREATE TABLE IF NOT EXISTS graph_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Deployment target
  target TEXT NOT NULL CHECK (
    target IN ('Google_Search_AI_Mode', 'Bing_Copilot', 'Perplexity', 'ChatGPT_Search')
  ),

  -- Structured data
  structured_data JSONB NOT NULL,

  -- Validation
  validation_status TEXT NOT NULL CHECK (
    validation_status IN ('passed', 'warning', 'failed')
  ),

  -- Timestamps
  deployed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for deployments
CREATE INDEX IF NOT EXISTS idx_graph_deployments_workspace
  ON graph_deployments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_graph_deployments_target
  ON graph_deployments(workspace_id, target);
CREATE INDEX IF NOT EXISTS idx_graph_deployments_deployed
  ON graph_deployments(workspace_id, deployed_at DESC);

-- Enable RLS
ALTER TABLE graph_deployments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY graph_deployments_workspace_isolation ON graph_deployments
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_workspaces
    WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Table: social_campaigns
-- Purpose: Track social media drip campaigns
-- =====================================================
CREATE TABLE IF NOT EXISTS social_campaigns (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Campaign config
  network TEXT NOT NULL CHECK (
    network IN ('LinkedIn_AU', 'LinkedIn_NZ', 'Reddit_AU', 'Reddit_NZ', 'Twitter_AU', 'Facebook_AU')
  ),
  frequency TEXT NOT NULL CHECK (
    frequency IN ('Daily_1', 'Daily_2', 'Daily_3', 'Weekly_3', 'Weekly_5')
  ),
  content_source TEXT NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (
    status IN ('active', 'paused', 'completed')
  ),

  -- Metrics
  posts_scheduled INTEGER DEFAULT 0,
  posts_published INTEGER DEFAULT 0,

  -- Scheduling
  started_at TIMESTAMPTZ DEFAULT NOW(),
  next_post_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for campaigns
CREATE INDEX IF NOT EXISTS idx_social_campaigns_workspace
  ON social_campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_campaigns_network
  ON social_campaigns(workspace_id, network);
CREATE INDEX IF NOT EXISTS idx_social_campaigns_status
  ON social_campaigns(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_social_campaigns_started
  ON social_campaigns(workspace_id, started_at DESC);

-- Enable RLS
ALTER TABLE social_campaigns ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY social_campaigns_workspace_isolation ON social_campaigns
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_workspaces
    WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Table: social_posts
-- Purpose: Individual social media posts
-- =====================================================
CREATE TABLE IF NOT EXISTS social_posts (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL REFERENCES social_campaigns(id) ON DELETE CASCADE,

  -- Post details
  network TEXT NOT NULL,
  content TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  mentions TEXT[] DEFAULT '{}',
  media_urls TEXT[] DEFAULT '{}',

  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'published', 'failed')
  ),

  -- Engagement metrics
  engagement JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for posts
CREATE INDEX IF NOT EXISTS idx_social_posts_workspace
  ON social_posts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_campaign
  ON social_posts(workspace_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_network
  ON social_posts(workspace_id, network);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled
  ON social_posts(workspace_id, scheduled_for ASC);
CREATE INDEX IF NOT EXISTS idx_social_posts_status
  ON social_posts(workspace_id, status);

-- Enable RLS
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY social_posts_workspace_isolation ON social_posts
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_workspaces
    WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Table: citation_snapshots
-- Purpose: Real-time citation metrics snapshots
-- =====================================================
CREATE TABLE IF NOT EXISTS citation_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Domain tracking
  domain TEXT NOT NULL,

  -- Metrics
  metrics JSONB NOT NULL,

  -- Competitor comparison
  competitors JSONB DEFAULT '[]',

  -- Timestamp
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for snapshots
CREATE INDEX IF NOT EXISTS idx_citation_snapshots_workspace
  ON citation_snapshots(workspace_id);
CREATE INDEX IF NOT EXISTS idx_citation_snapshots_domain
  ON citation_snapshots(workspace_id, domain);
CREATE INDEX IF NOT EXISTS idx_citation_snapshots_timestamp
  ON citation_snapshots(workspace_id, timestamp DESC);

-- Enable RLS
ALTER TABLE citation_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY citation_snapshots_workspace_isolation ON citation_snapshots
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_workspaces
    WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Table: citation_alerts
-- Purpose: Citation change alerts and notifications
-- =====================================================
CREATE TABLE IF NOT EXISTS citation_alerts (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Alert details
  type TEXT NOT NULL CHECK (
    type IN ('spike', 'drop', 'competitor_gain', 'new_citation', 'lost_citation')
  ),
  severity TEXT NOT NULL CHECK (
    severity IN ('info', 'warning', 'critical')
  ),
  message TEXT NOT NULL,

  -- Metrics
  metric TEXT NOT NULL,
  value NUMERIC(10, 2) NOT NULL,
  change NUMERIC(10, 2) NOT NULL,

  -- Notification status
  notified BOOLEAN DEFAULT false,

  -- Timestamps
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for alerts
CREATE INDEX IF NOT EXISTS idx_citation_alerts_workspace
  ON citation_alerts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_citation_alerts_type
  ON citation_alerts(workspace_id, type);
CREATE INDEX IF NOT EXISTS idx_citation_alerts_severity
  ON citation_alerts(workspace_id, severity);
CREATE INDEX IF NOT EXISTS idx_citation_alerts_timestamp
  ON citation_alerts(workspace_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_citation_alerts_notified
  ON citation_alerts(workspace_id, notified);

-- Enable RLS
ALTER TABLE citation_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY citation_alerts_workspace_isolation ON citation_alerts
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_workspaces
    WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Migration Complete
-- =====================================================
-- Summary:
-- - graph_deployments: Knowledge Graph deployment tracking
-- - social_campaigns: Social media drip campaign management
-- - social_posts: Individual post scheduling and engagement
-- - citation_snapshots: Real-time citation metrics history
-- - citation_alerts: Citation change alerts and notifications
-- - Full RLS enforcement for workspace isolation
-- - Optimized indexes for common queries;
