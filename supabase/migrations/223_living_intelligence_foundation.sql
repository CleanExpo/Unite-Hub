-- Migration 223: Living Intelligence Foundation
-- Purpose: Core persistence, memory architecture, metadata schema, and retrieval pipelines
-- for unified cross-system memory engine supporting all agents
-- Created: 2025-11-25
-- Security: Workspace isolation + founder full access

-- ============================================================================
-- 0. Enable Required Extensions
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- 1. AI_MEMORY Table - Core memory storage
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Context & ownership
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  agent TEXT NOT NULL,

  -- Memory classification
  memory_type TEXT NOT NULL CHECK (memory_type IN (
    'plan',                    -- Agent execution plans
    'step',                    -- Individual execution steps
    'reasoning_trace',         -- Agent reasoning traces
    'decision',                -- Decision rationale
    'uncertainty',             -- Uncertainty disclosures
    'outcome',                 -- Actual outcomes
    'lesson',                  -- Learned lessons
    'pattern',                 -- Recognized patterns
    'signal',                  -- System signals (anomalies, risks)
    'contact_insight',         -- Contact intelligence
    'campaign_result',         -- Campaign performance
    'content_performance',     -- Content effectiveness
    'loyalty_transaction',     -- Loyalty events
    'monitoring_event',        -- System monitoring
    'audit_log'                -- Compliance logs
  )),

  -- Content & metadata
  content JSONB NOT NULL,
  keywords TEXT[] DEFAULT '{}',

  -- Importance & confidence
  confidence INTEGER NOT NULL DEFAULT 70 CHECK (confidence >= 0 AND confidence <= 100),
  uncertainty_notes TEXT,
  importance INTEGER NOT NULL DEFAULT 50 CHECK (importance >= 0 AND importance <= 100),

  -- Computed recall priority (importance * confidence / 10)
  recall_priority INTEGER GENERATED ALWAYS AS (
    CASE
      WHEN importance IS NULL OR confidence IS NULL THEN 0
      ELSE LEAST(100, (importance * confidence) / 10)
    END
  ) STORED,

  -- Attribution & lineage
  source TEXT NOT NULL,
  source_agent TEXT,
  parent_memory_id UUID REFERENCES ai_memory(id) ON DELETE SET NULL,

  -- Soft delete support
  is_redacted BOOLEAN DEFAULT FALSE,
  redaction_reason TEXT,
  -- Keep FK reference to auth.users (allowed in migrations)
redacted_by UUID REFERENCES auth.users(id),

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_workspace ON ai_memory(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_agent ON ai_memory(agent);
CREATE INDEX IF NOT EXISTS idx_ai_memory_type ON ai_memory(memory_type);
CREATE INDEX IF NOT EXISTS idx_ai_memory_created ON ai_memory(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_memory_recall_priority ON ai_memory(recall_priority DESC);
CREATE INDEX IF NOT EXISTS idx_ai_memory_keywords ON ai_memory USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_ai_memory_parent ON ai_memory(parent_memory_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_importance ON ai_memory(importance DESC);

COMMENT ON TABLE ai_memory IS 'Core unified memory storage for all agents and systems';

-- ============================================================================
-- 2. AI_MEMORY_LINKS Table - Relationship graph
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_memory_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Memory references
  memory_id UUID NOT NULL REFERENCES ai_memory(id) ON DELETE CASCADE,
  linked_memory_id UUID NOT NULL REFERENCES ai_memory(id) ON DELETE CASCADE,

  -- Relationship type
  relationship TEXT NOT NULL CHECK (relationship IN (
    'caused_by',               -- This memory was caused by another
    'led_to',                  -- This memory led to another outcome
    'contradicts',             -- Conflicts with another memory
    'refines',                 -- Improves upon
    'extends',                 -- Adds to
    'validates',               -- Confirms another memory
    'invalidates',             -- Disproves
    'depends_on',              -- Requires
    'supports',                -- Provides evidence for
    'similar_to',              -- Similar pattern
    'part_of'                  -- Is a component of
  )),

  -- Strength of relationship
  strength INTEGER DEFAULT 50 CHECK (strength >= 0 AND strength <= 100),

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_links_from ON ai_memory_links(memory_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_links_to ON ai_memory_links(linked_memory_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_links_relationship ON ai_memory_links(relationship);

COMMENT ON TABLE ai_memory_links IS 'Relationship graph connecting related memories';

-- ============================================================================
-- 3. AI_MEMORY_SIGNALS Table - System signals and anomalies
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_memory_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Memory & signal context
  memory_id UUID NOT NULL REFERENCES ai_memory(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,

  -- Signal classification
  signal_type TEXT NOT NULL CHECK (signal_type IN (
    'anomaly',                 -- Unusual pattern detected
    'risk_detected',           -- Potential risk identified
    'confidence_low',          -- Low confidence in memory
    'uncertainty_high',        -- High uncertainty disclosed
    'contradiction',           -- Conflicts with other memory
    'pattern_mismatch',        -- Doesn't fit expected pattern
    'outcome_mismatch',        -- Promised vs actual mismatch
    'approval_required',       -- Requires founder approval
    'manual_override',         -- Human intervention needed
    'escalation'               -- Needs escalation
  )),

  -- Signal strength
  signal_value NUMERIC NOT NULL CHECK (signal_value >= 0 AND signal_value <= 100),

  -- Source attribution
  source_agent TEXT NOT NULL,

  -- Resolution
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_signals_memory ON ai_memory_signals(memory_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_signals_workspace ON ai_memory_signals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_signals_type ON ai_memory_signals(signal_type);
CREATE INDEX IF NOT EXISTS idx_ai_memory_signals_created ON ai_memory_signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_memory_signals_unresolved ON ai_memory_signals(workspace_id) WHERE NOT is_resolved;

COMMENT ON TABLE ai_memory_signals IS 'System signals, anomalies, and risk indicators attached to memories';

-- ============================================================================
-- 4. AI_MEMORY_EMBEDDINGS Table - Vector embeddings for semantic search
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_memory_embeddings (
  memory_id UUID PRIMARY KEY REFERENCES ai_memory(id) ON DELETE CASCADE,

  -- Vector embedding (1536-dimensional from OpenAI)
  embedding VECTOR(1536),

  -- Embedding metadata
  embedding_model TEXT DEFAULT 'text-embedding-3-small',
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'::JSONB
);

CREATE INDEX IF NOT EXISTS idx_ai_memory_embeddings_updated ON ai_memory_embeddings(updated_at DESC);

COMMENT ON TABLE ai_memory_embeddings IS 'Vector embeddings for semantic memory retrieval';

-- ============================================================================
-- 5. Enable RLS (Row Level Security)
-- ============================================================================

ALTER TABLE ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memory_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memory_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_memory_embeddings ENABLE ROW LEVEL SECURITY;

-- Service role can manage all memory tables
CREATE POLICY "Service role manages ai_memory"
  ON ai_memory FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages ai_memory_links"
  ON ai_memory_links FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages ai_memory_signals"
  ON ai_memory_signals FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role manages ai_memory_embeddings"
  ON ai_memory_embeddings FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Founders can view all memory in their workspace
CREATE POLICY "Founders can view ai_memory"
  ON ai_memory FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_organizations
      WHERE org_id = (SELECT org_id FROM workspaces WHERE id = workspace_id)
        AND role = 'owner'
    )
  );

CREATE POLICY "Founders can view ai_memory_links"
  ON ai_memory_links FOR SELECT
  USING (
    memory_id IN (
      SELECT id FROM ai_memory
      WHERE auth.uid() IN (
        SELECT user_id FROM user_organizations
        WHERE org_id = (SELECT org_id FROM workspaces WHERE id = ai_memory.workspace_id)
          AND role = 'owner'
      )
    )
  );

CREATE POLICY "Founders can view ai_memory_signals"
  ON ai_memory_signals FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM user_organizations
      WHERE org_id = (SELECT org_id FROM workspaces WHERE id = workspace_id)
        AND role = 'owner'
    )
  );

CREATE POLICY "Founders can view ai_memory_embeddings"
  ON ai_memory_embeddings FOR SELECT
  USING (
    memory_id IN (
      SELECT id FROM ai_memory
      WHERE auth.uid() IN (
        SELECT user_id FROM user_organizations
        WHERE org_id = (SELECT org_id FROM workspaces WHERE id = ai_memory.workspace_id)
          AND role = 'owner'
      )
    )
  );

-- ============================================================================
-- 6. Helper Functions
-- ============================================================================

-- Function to store a memory entry
CREATE OR REPLACE FUNCTION store_agent_memory(
  p_workspace_id UUID,
  p_agent TEXT,
  p_memory_type TEXT,
  p_content JSONB,
  p_importance INTEGER DEFAULT 50,
  p_confidence INTEGER DEFAULT 70,
  p_uncertainty_notes TEXT DEFAULT NULL,
  p_keywords TEXT[] DEFAULT '{}',
  p_source TEXT DEFAULT 'system'
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_memory_id UUID;
BEGIN
  INSERT INTO ai_memory (
    workspace_id,
    agent,
    memory_type,
    content,
    importance,
    confidence,
    uncertainty_notes,
    keywords,
    source,
    source_agent
  ) VALUES (
    p_workspace_id,
    p_agent,
    p_memory_type,
    p_content,
    p_importance,
    p_confidence,
    p_uncertainty_notes,
    p_keywords,
    p_source,
    p_agent
  ) RETURNING id INTO v_memory_id;

  RETURN v_memory_id;
END;
$$;

-- Function to link two memories
CREATE OR REPLACE FUNCTION link_memories(
  p_memory_id UUID,
  p_linked_memory_id UUID,
  p_relationship TEXT,
  p_strength INTEGER DEFAULT 50
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_link_id UUID;
BEGIN
  INSERT INTO ai_memory_links (
    memory_id,
    linked_memory_id,
    relationship,
    strength
  ) VALUES (
    p_memory_id,
    p_linked_memory_id,
    p_relationship,
    p_strength
  ) RETURNING id INTO v_link_id;

  RETURN v_link_id;
END;
$$;

-- Function to add a signal to memory
CREATE OR REPLACE FUNCTION add_memory_signal(
  p_memory_id UUID,
  p_workspace_id UUID,
  p_signal_type TEXT,
  p_signal_value NUMERIC,
  p_source_agent TEXT
) RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_signal_id UUID;
BEGIN
  INSERT INTO ai_memory_signals (
    memory_id,
    workspace_id,
    signal_type,
    signal_value,
    source_agent
  ) VALUES (
    p_memory_id,
    p_workspace_id,
    p_signal_type,
    p_signal_value,
    p_source_agent
  ) RETURNING id INTO v_signal_id;

  RETURN v_signal_id;
END;
$$;

-- Function to redact memory (soft delete)
CREATE OR REPLACE FUNCTION redact_memory(
  p_memory_id UUID,
  p_redaction_reason TEXT,
  p_redacted_by UUID
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE ai_memory
  SET
    is_redacted = TRUE,
    redaction_reason = p_redaction_reason,
    redacted_by = p_redacted_by,
    updated_at = NOW()
  WHERE id = p_memory_id;
END;
$$;

-- Function to get relevant memories (simple keyword search)
CREATE OR REPLACE FUNCTION get_relevant_memory(
  p_workspace_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 10
) RETURNS TABLE (
  id UUID,
  memory_type TEXT,
  content JSONB,
  recall_priority INTEGER,
  importance INTEGER,
  confidence INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    am.id,
    am.memory_type,
    am.content,
    am.recall_priority,
    am.importance,
    am.confidence
  FROM ai_memory am
  WHERE am.workspace_id = p_workspace_id
    AND NOT am.is_redacted
    AND (
      am.keywords @> ARRAY[p_query]
      OR am.content::TEXT ILIKE '%' || p_query || '%'
    )
  ORDER BY am.recall_priority DESC
  LIMIT p_limit;
END;
$$;

-- Function to purge low-priority memories
CREATE OR REPLACE FUNCTION purge_low_priority_memory(
  p_workspace_id UUID,
  p_threshold INTEGER DEFAULT 10
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  DELETE FROM ai_memory
  WHERE workspace_id = p_workspace_id
    AND recall_priority < p_threshold
    AND created_at < NOW() - INTERVAL '30 days'
    AND memory_type NOT IN ('lesson', 'pattern', 'decision');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Living Intelligence Foundation schema installed successfully';
  RAISE NOTICE '   📚 Tables created: ai_memory, links, signals, embeddings';
  RAISE NOTICE '   🔐 RLS policies enabled (service role + founder access)';
  RAISE NOTICE '   🔧 Helper functions created (store, link, signal, redact, retrieve, purge)';
  RAISE NOTICE '   🧠 Vector embedding support ready for semantic retrieval';
END $$;
