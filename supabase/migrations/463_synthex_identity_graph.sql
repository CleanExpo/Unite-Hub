-- =====================================================
-- Migration: 463_synthex_identity_graph.sql
-- Phase: D34 - Omni-Channel Identity Graph (OCIG)
-- Description: Cross-channel identity resolution with graph-based relationships
-- =====================================================

-- =====================================================
-- DEPENDENCY CHECK: Create synthex_tenants if missing
-- =====================================================
CREATE TABLE IF NOT EXISTS synthex_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  settings JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ENUMS (with safe creation using DO blocks)
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_idg_channel') THEN
    CREATE TYPE synthex_idg_channel AS ENUM (
      'email',
      'phone',
      'social_facebook',
      'social_instagram',
      'social_linkedin',
      'social_twitter',
      'social_tiktok',
      'website',
      'app_ios',
      'app_android',
      'crm',
      'advertising',
      'offline',
      'partner',
      'custom'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_idg_status') THEN
    CREATE TYPE synthex_idg_status AS ENUM (
      'active',
      'merged',
      'deleted',
      'suspicious',
      'unverified'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_idg_relationship') THEN
    CREATE TYPE synthex_idg_relationship AS ENUM (
      'same_person',
      'household',
      'business',
      'related',
      'similar',
      'duplicate',
      'parent_child',
      'alias',
      'custom'
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'synthex_idg_resolution') THEN
    CREATE TYPE synthex_idg_resolution AS ENUM (
      'deterministic',
      'probabilistic',
      'ai_powered',
      'manual',
      'rule_based',
      'graph_based'
    );
  END IF;
END $$;

-- =====================================================
-- TABLES
-- =====================================================

-- Identity nodes - individual identity touchpoints
CREATE TABLE IF NOT EXISTS synthex_idg_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Identity Information
  external_id TEXT,
  id_channel synthex_idg_channel NOT NULL,
  channel_identifier TEXT NOT NULL,

  -- Profile Data
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  attributes JSONB NOT NULL DEFAULT '{}',

  -- Matching & Confidence
  confidence_score NUMERIC(5,4) DEFAULT 0.80,
  match_signals JSONB NOT NULL DEFAULT '[]',
  verified_at TIMESTAMPTZ,
  verification_method TEXT,

  -- Status
  id_status synthex_idg_status DEFAULT 'active',
  merged_into_id UUID REFERENCES synthex_idg_nodes(id),

  -- Activity Tracking
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  interaction_count INTEGER DEFAULT 1,
  total_value NUMERIC(12,2) DEFAULT 0,

  -- Source Information
  source_system TEXT,
  source_id TEXT,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per tenant/channel/identifier
  CONSTRAINT unique_idg_identity_per_channel UNIQUE (tenant_id, id_channel, channel_identifier)
);

-- Identity edges - relationships between nodes
CREATE TABLE IF NOT EXISTS synthex_idg_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Edge Endpoints
  source_node_id UUID NOT NULL REFERENCES synthex_idg_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES synthex_idg_nodes(id) ON DELETE CASCADE,

  -- Relationship
  edge_relationship synthex_idg_relationship NOT NULL,
  relationship_label TEXT,

  -- Strength & Confidence
  weight NUMERIC(5,4) DEFAULT 1.0,
  confidence NUMERIC(5,4) DEFAULT 0.80,
  strength_factors JSONB NOT NULL DEFAULT '[]',

  -- Directionality
  is_bidirectional BOOLEAN DEFAULT TRUE,

  -- Resolution Information
  resolution_method synthex_idg_resolution DEFAULT 'probabilistic',
  resolution_reasoning TEXT,
  resolution_signals JSONB NOT NULL DEFAULT '[]',

  -- Validation
  validated BOOLEAN DEFAULT FALSE,
  validated_at TIMESTAMPTZ,
  validated_by UUID,

  -- Timestamps
  first_linked_at TIMESTAMPTZ DEFAULT NOW(),
  last_confirmed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate edges
  CONSTRAINT unique_idg_edge UNIQUE (tenant_id, source_node_id, target_node_id, edge_relationship)
);

-- Unified profiles - merged identity view
CREATE TABLE IF NOT EXISTS synthex_idg_unified_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Profile Identity
  profile_name TEXT,
  primary_email TEXT,
  primary_phone TEXT,

  -- Aggregated Data
  channels TEXT[] DEFAULT '{}',
  node_ids UUID[] DEFAULT '{}',
  total_touchpoints INTEGER DEFAULT 0,

  -- Profile Attributes (Merged)
  merged_attributes JSONB NOT NULL DEFAULT '{}',
  attribute_sources JSONB NOT NULL DEFAULT '{}',

  -- Confidence & Quality
  overall_confidence NUMERIC(5,4) DEFAULT 0.80,
  profile_completeness NUMERIC(5,4) DEFAULT 0.50,
  data_quality_score NUMERIC(5,4) DEFAULT 0.70,

  -- Value Metrics
  total_value NUMERIC(12,2) DEFAULT 0,
  predicted_ltv NUMERIC(12,2),
  engagement_score NUMERIC(5,4) DEFAULT 0.50,

  -- Segmentation
  segments TEXT[] DEFAULT '{}',
  personas TEXT[] DEFAULT '{}',

  -- Activity
  first_interaction_at TIMESTAMPTZ,
  last_interaction_at TIMESTAMPTZ,
  interaction_count INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Identity resolution log
CREATE TABLE IF NOT EXISTS synthex_idg_resolution_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Request Information
  request_id TEXT,
  input_payload JSONB NOT NULL,
  input_channels TEXT[],

  -- Resolution Results
  resolution_result JSONB NOT NULL DEFAULT '{}',
  matched_nodes UUID[] DEFAULT '{}',
  created_nodes UUID[] DEFAULT '{}',
  merged_profiles UUID[] DEFAULT '{}',

  -- Resolution Details
  resolution_method synthex_idg_resolution NOT NULL,
  match_count INTEGER DEFAULT 0,
  confidence_threshold NUMERIC(5,4) DEFAULT 0.75,

  -- AI Analysis
  ai_reasoning JSONB,
  ai_confidence NUMERIC(5,4),
  ai_suggestions JSONB,

  -- Performance
  processing_time_ms INTEGER,
  tokens_used INTEGER DEFAULT 0,

  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Identity matching rules
CREATE TABLE IF NOT EXISTS synthex_idg_matching_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES synthex_tenants(id) ON DELETE CASCADE,

  -- Rule Definition
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  rule_type TEXT NOT NULL DEFAULT 'deterministic',

  -- Matching Criteria
  source_channel synthex_idg_channel,
  target_channel synthex_idg_channel,
  match_fields JSONB NOT NULL DEFAULT '[]',
  match_conditions JSONB NOT NULL DEFAULT '{}',

  -- Scoring
  base_confidence NUMERIC(5,4) DEFAULT 0.80,
  confidence_adjustments JSONB NOT NULL DEFAULT '{}',

  -- Activation
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 100,

  -- Performance Tracking
  total_matches INTEGER DEFAULT 0,
  successful_matches INTEGER DEFAULT 0,
  false_positive_count INTEGER DEFAULT 0,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_idg_nodes_tenant ON synthex_idg_nodes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_idg_nodes_channel ON synthex_idg_nodes(id_channel);
CREATE INDEX IF NOT EXISTS idx_idg_nodes_identifier ON synthex_idg_nodes(channel_identifier);
CREATE INDEX IF NOT EXISTS idx_idg_nodes_external_id ON synthex_idg_nodes(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_idg_nodes_status ON synthex_idg_nodes(id_status);
CREATE INDEX IF NOT EXISTS idx_idg_nodes_email ON synthex_idg_nodes(tenant_id, channel_identifier) WHERE id_channel = 'email';

CREATE INDEX IF NOT EXISTS idx_idg_edges_tenant ON synthex_idg_edges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_idg_edges_source ON synthex_idg_edges(source_node_id);
CREATE INDEX IF NOT EXISTS idx_idg_edges_target ON synthex_idg_edges(target_node_id);
CREATE INDEX IF NOT EXISTS idx_idg_edges_relationship ON synthex_idg_edges(edge_relationship);

CREATE INDEX IF NOT EXISTS idx_idg_profiles_tenant ON synthex_idg_unified_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_idg_profiles_email ON synthex_idg_unified_profiles(primary_email) WHERE primary_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_idg_profiles_phone ON synthex_idg_unified_profiles(primary_phone) WHERE primary_phone IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_idg_resolution_log_tenant ON synthex_idg_resolution_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_idg_resolution_log_created ON synthex_idg_resolution_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_idg_matching_rules_tenant ON synthex_idg_matching_rules(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_idg_matching_rules_active ON synthex_idg_matching_rules(is_active, priority) WHERE is_active = TRUE;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE synthex_idg_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_idg_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_idg_unified_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_idg_resolution_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_idg_matching_rules ENABLE ROW LEVEL SECURITY;

-- Safe policy creation with DROP IF EXISTS
DROP POLICY IF EXISTS "idg_nodes_tenant_isolation" ON synthex_idg_nodes;
CREATE POLICY "idg_nodes_tenant_isolation" ON synthex_idg_nodes
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "idg_edges_tenant_isolation" ON synthex_idg_edges;
CREATE POLICY "idg_edges_tenant_isolation" ON synthex_idg_edges
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "idg_profiles_tenant_isolation" ON synthex_idg_unified_profiles;
CREATE POLICY "idg_profiles_tenant_isolation" ON synthex_idg_unified_profiles
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "idg_resolution_log_tenant_isolation" ON synthex_idg_resolution_log;
CREATE POLICY "idg_resolution_log_tenant_isolation" ON synthex_idg_resolution_log
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "idg_matching_rules_access" ON synthex_idg_matching_rules;
CREATE POLICY "idg_matching_rules_access" ON synthex_idg_matching_rules
  FOR ALL USING (
    tenant_id = current_setting('app.tenant_id', true)::uuid
    OR tenant_id IS NULL
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION synthex_idg_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS idg_nodes_updated_at ON synthex_idg_nodes;
CREATE TRIGGER idg_nodes_updated_at
  BEFORE UPDATE ON synthex_idg_nodes
  FOR EACH ROW EXECUTE FUNCTION synthex_idg_update_timestamp();

DROP TRIGGER IF EXISTS idg_edges_updated_at ON synthex_idg_edges;
CREATE TRIGGER idg_edges_updated_at
  BEFORE UPDATE ON synthex_idg_edges
  FOR EACH ROW EXECUTE FUNCTION synthex_idg_update_timestamp();

DROP TRIGGER IF EXISTS idg_profiles_updated_at ON synthex_idg_unified_profiles;
CREATE TRIGGER idg_profiles_updated_at
  BEFORE UPDATE ON synthex_idg_unified_profiles
  FOR EACH ROW EXECUTE FUNCTION synthex_idg_update_timestamp();

DROP TRIGGER IF EXISTS idg_matching_rules_updated_at ON synthex_idg_matching_rules;
CREATE TRIGGER idg_matching_rules_updated_at
  BEFORE UPDATE ON synthex_idg_matching_rules
  FOR EACH ROW EXECUTE FUNCTION synthex_idg_update_timestamp();

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Get identity graph stats
CREATE OR REPLACE FUNCTION synthex_idg_get_stats(p_tenant_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_nodes', COUNT(*),
    'active_nodes', COUNT(*) FILTER (WHERE id_status = 'active'),
    'merged_nodes', COUNT(*) FILTER (WHERE id_status = 'merged'),
    'nodes_by_channel', (
      SELECT jsonb_object_agg(id_channel, cnt)
      FROM (
        SELECT id_channel, COUNT(*) as cnt
        FROM synthex_idg_nodes
        WHERE tenant_id = p_tenant_id
        GROUP BY id_channel
      ) c
    ),
    'total_edges', (
      SELECT COUNT(*)
      FROM synthex_idg_edges
      WHERE tenant_id = p_tenant_id
    ),
    'total_unified_profiles', (
      SELECT COUNT(*)
      FROM synthex_idg_unified_profiles
      WHERE tenant_id = p_tenant_id
    ),
    'avg_confidence', ROUND(AVG(confidence_score)::numeric, 4),
    'resolution_count', (
      SELECT COUNT(*)
      FROM synthex_idg_resolution_log
      WHERE tenant_id = p_tenant_id
    )
  ) INTO result
  FROM synthex_idg_nodes
  WHERE tenant_id = p_tenant_id;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Find connected nodes (graph traversal)
CREATE OR REPLACE FUNCTION synthex_idg_get_connected_nodes(
  p_node_id UUID,
  p_max_depth INTEGER DEFAULT 2
)
RETURNS TABLE (
  node_id UUID,
  depth INTEGER,
  path UUID[],
  relationship synthex_idg_relationship
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE connected AS (
    -- Base case: direct connections
    SELECT
      e.target_node_id as node_id,
      1 as depth,
      ARRAY[e.source_node_id, e.target_node_id] as path,
      e.edge_relationship as relationship
    FROM synthex_idg_edges e
    WHERE e.source_node_id = p_node_id

    UNION

    SELECT
      e.source_node_id as node_id,
      1 as depth,
      ARRAY[e.target_node_id, e.source_node_id] as path,
      e.edge_relationship as relationship
    FROM synthex_idg_edges e
    WHERE e.target_node_id = p_node_id AND e.is_bidirectional

    UNION ALL

    -- Recursive case
    SELECT
      CASE WHEN e.source_node_id = c.node_id THEN e.target_node_id ELSE e.source_node_id END,
      c.depth + 1,
      c.path || CASE WHEN e.source_node_id = c.node_id THEN e.target_node_id ELSE e.source_node_id END,
      e.edge_relationship
    FROM connected c
    JOIN synthex_idg_edges e ON (
      e.source_node_id = c.node_id OR (e.target_node_id = c.node_id AND e.is_bidirectional)
    )
    WHERE c.depth < p_max_depth
      AND NOT (CASE WHEN e.source_node_id = c.node_id THEN e.target_node_id ELSE e.source_node_id END = ANY(c.path))
  )
  SELECT DISTINCT ON (connected.node_id)
    connected.node_id,
    connected.depth,
    connected.path,
    connected.relationship
  FROM connected
  ORDER BY connected.node_id, connected.depth;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Resolve identity (find or create unified profile)
CREATE OR REPLACE FUNCTION synthex_idg_resolve_identity(
  p_tenant_id UUID,
  p_channel synthex_idg_channel,
  p_identifier TEXT,
  p_attributes JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_node_id UUID;
  v_profile_id UUID;
BEGIN
  -- Find or create the identity node
  SELECT id INTO v_node_id
  FROM synthex_idg_nodes
  WHERE tenant_id = p_tenant_id
    AND id_channel = p_channel
    AND channel_identifier = p_identifier;

  IF v_node_id IS NULL THEN
    INSERT INTO synthex_idg_nodes (tenant_id, id_channel, channel_identifier, attributes)
    VALUES (p_tenant_id, p_channel, p_identifier, p_attributes)
    RETURNING id INTO v_node_id;
  ELSE
    -- Update last seen
    UPDATE synthex_idg_nodes
    SET last_seen_at = NOW(),
        interaction_count = interaction_count + 1,
        attributes = attributes || p_attributes,
        updated_at = NOW()
    WHERE id = v_node_id;
  END IF;

  -- Find or create unified profile
  SELECT id INTO v_profile_id
  FROM synthex_idg_unified_profiles
  WHERE tenant_id = p_tenant_id
    AND v_node_id = ANY(node_ids);

  IF v_profile_id IS NULL THEN
    INSERT INTO synthex_idg_unified_profiles (
      tenant_id,
      node_ids,
      channels,
      primary_email,
      primary_phone,
      merged_attributes
    )
    VALUES (
      p_tenant_id,
      ARRAY[v_node_id],
      ARRAY[p_channel::TEXT],
      CASE WHEN p_channel = 'email' THEN p_identifier ELSE NULL END,
      CASE WHEN p_channel = 'phone' THEN p_identifier ELSE NULL END,
      p_attributes
    )
    RETURNING id INTO v_profile_id;
  ELSE
    -- Update unified profile
    UPDATE synthex_idg_unified_profiles
    SET node_ids = array_append(node_ids, v_node_id),
        channels = ARRAY(SELECT DISTINCT unnest(channels || ARRAY[p_channel::TEXT])),
        interaction_count = interaction_count + 1,
        last_interaction_at = NOW(),
        updated_at = NOW()
    WHERE id = v_profile_id
      AND NOT (v_node_id = ANY(node_ids));
  END IF;

  RETURN v_profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE synthex_idg_nodes IS 'Individual identity touchpoints across channels';
COMMENT ON TABLE synthex_idg_edges IS 'Relationships between identity nodes in the graph';
COMMENT ON TABLE synthex_idg_unified_profiles IS 'Merged customer profiles from multiple identity nodes';
COMMENT ON TABLE synthex_idg_resolution_log IS 'Audit log of identity resolution operations';
COMMENT ON TABLE synthex_idg_matching_rules IS 'Configurable rules for identity matching';
