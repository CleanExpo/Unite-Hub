-- =====================================================================
-- Phase D58: Global Search & Knowledge Graph
-- =====================================================================
-- Tables: unite_search_index, unite_knowledge_edges, unite_search_queries
--
-- Purpose:
-- - Global search across all Unite-Hub entities
-- - Knowledge graph for entity relationships
-- - Search analytics and query logging
-- - Postgres full-text + vector embeddings
--
-- Author: Synthex Growth Stack
-- Date: 2025-12-08
-- Migration: 486

-- =====================================================================
-- 1. Tables
-- =====================================================================

-- Search index table
CREATE TABLE IF NOT EXISTS unite_search_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  title text,
  summary text,
  content text,
  tags text[],
  extra jsonb,
  embedding vector(1536),
  search_meta jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Knowledge graph edges - DROP and recreate to ensure clean state
DROP TABLE IF EXISTS unite_knowledge_edges CASCADE;

CREATE TABLE unite_knowledge_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  from_type text NOT NULL,
  from_id uuid NOT NULL,
  to_type text NOT NULL,
  to_id uuid NOT NULL,
  relation text NOT NULL,
  weight numeric(6,3) DEFAULT 1.0,
  metadata jsonb,
  ai_summary jsonb,
  created_at timestamptz DEFAULT now()
);

-- Search queries table
CREATE TABLE IF NOT EXISTS unite_search_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  query text NOT NULL,
  filters jsonb,
  results_count integer,
  latency_ms integer,
  ai_profile jsonb,
  created_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 2. Indexes
-- =====================================================================

DROP INDEX IF EXISTS idx_unite_search_index_tenant;
CREATE INDEX idx_unite_search_index_tenant
  ON unite_search_index(tenant_id, entity_type, entity_id);

DROP INDEX IF EXISTS idx_unite_search_index_fts;
CREATE INDEX idx_unite_search_index_fts
  ON unite_search_index USING gin(
    to_tsvector('simple',
      coalesce(title,'') || ' ' ||
      coalesce(summary,'') || ' ' ||
      coalesce(content,'')
    )
  );

DROP INDEX IF EXISTS idx_unite_search_index_tags;
CREATE INDEX idx_unite_search_index_tags
  ON unite_search_index USING gin(tags);

DROP INDEX IF EXISTS idx_unite_knowledge_edges_from;
CREATE INDEX idx_unite_knowledge_edges_from
  ON unite_knowledge_edges(tenant_id, from_type, from_id);

DROP INDEX IF EXISTS idx_unite_knowledge_edges_to;
CREATE INDEX idx_unite_knowledge_edges_to
  ON unite_knowledge_edges(tenant_id, to_type, to_id);

DROP INDEX IF EXISTS idx_unite_knowledge_edges_relation;
CREATE INDEX idx_unite_knowledge_edges_relation
  ON unite_knowledge_edges(tenant_id, relation);

DROP INDEX IF EXISTS idx_unite_search_queries_tenant;
CREATE INDEX idx_unite_search_queries_tenant
  ON unite_search_queries(tenant_id, created_at DESC);

-- =====================================================================
-- 3. RLS Policies
-- =====================================================================

ALTER TABLE unite_search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_knowledge_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_search_queries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation" ON unite_search_index;
CREATE POLICY "tenant_isolation" ON unite_search_index
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "tenant_isolation" ON unite_knowledge_edges;
CREATE POLICY "tenant_isolation" ON unite_knowledge_edges
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

DROP POLICY IF EXISTS "tenant_isolation" ON unite_search_queries;
CREATE POLICY "tenant_isolation" ON unite_search_queries
  USING (
    tenant_id IS NULL OR
    tenant_id = current_setting('app.tenant_id', true)::uuid
  );

-- =====================================================================
-- 4. Helper Functions
-- =====================================================================

CREATE OR REPLACE FUNCTION unite_search_fulltext(
  p_tenant_id uuid,
  p_query text,
  p_entity_types text[] DEFAULT NULL,
  p_limit integer DEFAULT 20
) RETURNS TABLE(
  entity_type text,
  entity_id uuid,
  title text,
  summary text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.entity_type,
    s.entity_id,
    s.title,
    s.summary,
    ts_rank(
      to_tsvector('simple',
        coalesce(s.title,'') || ' ' ||
        coalesce(s.summary,'') || ' ' ||
        coalesce(s.content,'')
      ),
      plainto_tsquery('simple', p_query)
    ) AS rank
  FROM unite_search_index s
  WHERE s.tenant_id = p_tenant_id
    AND (p_entity_types IS NULL OR s.entity_type = ANY(p_entity_types))
    AND to_tsvector('simple',
          coalesce(s.title,'') || ' ' ||
          coalesce(s.summary,'') || ' ' ||
          coalesce(s.content,'')
        ) @@ plainto_tsquery('simple', p_query)
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION unite_get_knowledge_neighbors(
  p_tenant_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_depth integer DEFAULT 1
) RETURNS TABLE(
  neighbor_type text,
  neighbor_id uuid,
  relation text,
  weight numeric,
  depth integer
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE graph AS (
    SELECT
      e.to_type AS neighbor_type,
      e.to_id AS neighbor_id,
      e.relation,
      e.weight,
      1 AS depth
    FROM unite_knowledge_edges e
    WHERE e.tenant_id = p_tenant_id
      AND e.from_type = p_entity_type
      AND e.from_id = p_entity_id

    UNION ALL

    SELECT
      e.to_type,
      e.to_id,
      e.relation,
      e.weight,
      g.depth + 1
    FROM unite_knowledge_edges e
    INNER JOIN graph g ON
      e.from_type = g.neighbor_type AND
      e.from_id = g.neighbor_id
    WHERE e.tenant_id = p_tenant_id
      AND g.depth < p_depth
  )
  SELECT * FROM graph;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION unite_search_fulltext IS 'Full-text search across all indexed entities with ranking';
COMMENT ON FUNCTION unite_get_knowledge_neighbors IS 'Get knowledge graph neighbors up to N depth';
