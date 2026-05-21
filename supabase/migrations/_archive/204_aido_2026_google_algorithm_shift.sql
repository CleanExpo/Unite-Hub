-- =====================================================
-- AIDO 2026 GOOGLE ALGORITHM SHIFT IMPLEMENTATION
-- AI Discovery Optimization Database Schema
-- =====================================================

-- 1. CLIENT PROFILES
CREATE TABLE IF NOT EXISTS client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  primary_domain TEXT NOT NULL,
  niches TEXT[] DEFAULT '{}',
  locations TEXT[] DEFAULT '{}',
  brand_tone TEXT,
  expertise_tags TEXT[] DEFAULT '{}',
  value_props TEXT[] DEFAULT '{}',
  gmb_listing_ids TEXT[] DEFAULT '{}',
  social_channels JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_profiles_workspace ON client_profiles(workspace_id);
CREATE INDEX idx_client_profiles_niches ON client_profiles USING GIN(niches);

-- 2. TOPICS
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  pillar_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  problem_statement TEXT,
  audience_segment TEXT,
  priority_level INTEGER DEFAULT 5,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, slug)
);

CREATE INDEX idx_topics_client ON topics(client_id);
CREATE INDEX idx_topics_pillar ON topics(pillar_id);

-- 3. INTENT CLUSTERS
CREATE TABLE IF NOT EXISTS intent_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  primary_intent TEXT NOT NULL,
  secondary_intents TEXT[] DEFAULT '{}',
  searcher_mindset TEXT,
  pain_points TEXT[] DEFAULT '{}',
  desired_outcomes TEXT[] DEFAULT '{}',
  risk_concerns TEXT[] DEFAULT '{}',
  purchase_stage TEXT,
  example_queries TEXT[] DEFAULT '{}',
  follow_up_questions TEXT[] DEFAULT '{}',
  local_modifiers TEXT[] DEFAULT '{}',
  business_impact_score FLOAT DEFAULT 0.5,
  difficulty_score FLOAT DEFAULT 0.5,
  alignment_score FLOAT DEFAULT 0.5,
  last_refreshed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_intent_clusters_topic ON intent_clusters(topic_id);
CREATE INDEX idx_intent_clusters_business_impact ON intent_clusters(business_impact_score DESC);

-- 4. CONTENT ASSETS
CREATE TABLE IF NOT EXISTS content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  intent_cluster_id UUID REFERENCES intent_clusters(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  format TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT,
  body_markdown TEXT,
  qa_blocks JSONB DEFAULT '[]',
  schema_types TEXT[] DEFAULT '{}',
  media_assets JSONB DEFAULT '[]',
  localisation_tags TEXT[] DEFAULT '{}',
  authority_score FLOAT DEFAULT 0.5,
  evergreen_score FLOAT DEFAULT 0.5,
  ai_source_score FLOAT DEFAULT 0.5,
  status TEXT DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, slug)
);

CREATE INDEX idx_content_assets_client ON content_assets(client_id);
CREATE INDEX idx_content_assets_ai_source_score ON content_assets(ai_source_score DESC);

-- 5. REALITY EVENTS
CREATE TABLE IF NOT EXISTS reality_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  source_system TEXT,
  source_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL,
  location TEXT,
  raw_payload JSONB,
  normalized_payload JSONB,
  linked_content_asset_ids UUID[] DEFAULT '{}',
  processing_status TEXT DEFAULT 'pending',
  processing_log TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reality_events_client ON reality_events(client_id);
CREATE INDEX idx_reality_events_timestamp ON reality_events(timestamp DESC);

-- 6. SERP OBSERVATIONS
CREATE TABLE IF NOT EXISTS serp_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  search_engine TEXT DEFAULT 'google',
  location TEXT,
  device_type TEXT,
  result_type TEXT,
  position INTEGER,
  features_present TEXT[] DEFAULT '{}',
  ai_answer_present BOOLEAN DEFAULT FALSE,
  ai_answer_summary TEXT,
  source_domains_used TEXT[] DEFAULT '{}',
  observed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_serp_observations_keyword ON serp_observations(keyword);
CREATE INDEX idx_serp_observations_ai_answer ON serp_observations(ai_answer_present);

-- 7. CHANGE SIGNALS
CREATE TABLE IF NOT EXISTS change_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES client_profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  pillar_id TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  description TEXT NOT NULL,
  raw_evidence JSONB,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_change_signals_severity ON change_signals(severity);
CREATE INDEX idx_change_signals_detected_at ON change_signals(detected_at DESC);

-- 8. STRATEGY RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS strategy_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES client_profiles(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  pillar_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL,
  actions JSONB DEFAULT '[]',
  estimated_impact TEXT,
  assigned_to_user_id UUID,
  due_date DATE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  implemented_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_strategy_recommendations_priority ON strategy_recommendations(priority);
CREATE INDEX idx_strategy_recommendations_status ON strategy_recommendations(status);

-- RLS POLICIES
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reality_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE serp_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_recommendations ENABLE ROW LEVEL SECURITY;

