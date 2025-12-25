-- =====================================================================
-- AI-Native Authority Data Substrate
-- Migration: 20251226120000_ai_authority_substrate.sql
-- Purpose: Client jobs with embeddings + suburb authority aggregation
-- Dependencies: workspaces table, clients table, get_current_workspace_id()
-- =====================================================================

-- Enable pgvector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- =====================================================================
-- Table: client_jobs
-- Core table for storing client job history with AI authority metadata
-- =====================================================================
CREATE TABLE IF NOT EXISTS client_jobs (
  -- Primary identifiers
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Job core details
  job_title TEXT NOT NULL,
  job_description TEXT,
  job_type TEXT CHECK (job_type IN ('one-off', 'recurring', 'project', 'maintenance')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('quoted', 'in_progress', 'completed', 'cancelled')),

  -- Location & geography (normalized for suburb aggregation)
  suburb TEXT NOT NULL, -- Normalized suburb name (e.g., "Paddington", "Ipswich")
  state TEXT NOT NULL CHECK (state IN ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT')), -- AU state codes
  postcode TEXT, -- Australian postcode (4 digits)
  full_address TEXT, -- Complete address for context
  lat DECIMAL(10, 7), -- Latitude for distance calculations (-43.6 to -10.4 for AU)
  lng DECIMAL(10, 7), -- Longitude for distance calculations (113.3 to 153.6 for AU)

  -- AI Authority metadata (JSONB for flexibility)
  ai_authority_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*
  Expected structure:
  {
    "proof_points": [
      {
        "type": "before_after_photo" | "completion_photo" | "client_review" | "testimonial",
        "photo_url": "https://...",
        "caption": "Bathroom renovation in Paddington",
        "timestamp": "2024-03-15T10:30:00Z",
        "rating": 5,
        "review_text": "Excellent work",
        "reviewer_name": "John D.",
        "verified": true
      }
    ],
    "locality_signals": {
      "first_job_in_suburb": false,
      "suburb_job_count": 12,
      "nearest_suburbs_covered": ["Woollahra", "Double Bay"],
      "avg_suburb_rating": 4.8
    },
    "seo_signals": {
      "featured_in_content": ["blog_post_abc", "case_study_xyz"],
      "keyword_relevance": ["bathroom renovation sydney", "paddington plumber"],
      "schema_markup_generated": true,
      "local_pack_eligible": true
    },
    "content_gap_score": 0.85,
    "geographic_gap_score": 0.62
  }
  */

  -- Semantic embedding (vector(768) for text-embedding-3-small)
  embedding vector(768), -- Job semantic representation for similarity search

  -- Financial & timeline data
  quoted_amount NUMERIC(12, 2),
  actual_amount NUMERIC(12, 2),
  completed_at TIMESTAMPTZ,

  -- Metadata & audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- =====================================================================
-- Indexes for Performance
-- =====================================================================

-- Multi-tenant isolation (required for all queries)
CREATE INDEX IF NOT EXISTS idx_client_jobs_workspace_id
  ON client_jobs(workspace_id);

-- Geographic lookup indexes (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_client_jobs_suburb_state
  ON client_jobs(workspace_id, suburb, state)
  WHERE status = 'completed';

-- Postcode-based queries
CREATE INDEX IF NOT EXISTS idx_client_jobs_postcode
  ON client_jobs(workspace_id, postcode)
  WHERE status = 'completed';

-- Client-scoped queries
CREATE INDEX IF NOT EXISTS idx_client_jobs_client_id
  ON client_jobs(client_id);

-- Status filtering
CREATE INDEX IF NOT EXISTS idx_client_jobs_status
  ON client_jobs(workspace_id, status);

-- Temporal queries (recent jobs)
CREATE INDEX IF NOT EXISTS idx_client_jobs_completed_at
  ON client_jobs(workspace_id, completed_at DESC NULLS LAST)
  WHERE status = 'completed';

-- Vector similarity index (IVFFlat for approximate nearest neighbor)
-- Lists parameter: sqrt(expected_rows) → For 10K rows use lists=100, for 100K use lists=316
CREATE INDEX IF NOT EXISTS idx_client_jobs_embedding_ivfflat
  ON client_jobs
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- For exact similarity search (fallback if IVFFlat not sufficient):
-- CREATE INDEX IF NOT EXISTS idx_client_jobs_embedding_hnsw
--   ON client_jobs
--   USING hnsw (embedding vector_cosine_ops)
--   WITH (m = 16, ef_construction = 64);

-- JSONB indexes for AI metadata queries
CREATE INDEX IF NOT EXISTS idx_client_jobs_proof_points_gin
  ON client_jobs USING gin ((ai_authority_metadata->'proof_points'));

-- Content gap score filtering (for content pathway)
CREATE INDEX IF NOT EXISTS idx_client_jobs_content_gap_score
  ON client_jobs(workspace_id, ((ai_authority_metadata->>'content_gap_score')::numeric))
  WHERE status = 'completed'
    AND (ai_authority_metadata->>'content_gap_score') IS NOT NULL;

-- Geographic gap score filtering (for geographic pathway)
CREATE INDEX IF NOT EXISTS idx_client_jobs_geographic_gap_score
  ON client_jobs(workspace_id, ((ai_authority_metadata->>'geographic_gap_score')::numeric))
  WHERE status = 'completed'
    AND (ai_authority_metadata->>'geographic_gap_score') IS NOT NULL;

-- Compound index for view performance
CREATE INDEX IF NOT EXISTS idx_client_jobs_view_support
  ON client_jobs(workspace_id, suburb, state, status, updated_at DESC);

-- =====================================================================
-- View: suburb_authority_substrate
-- Purpose: Aggregated authority signals per suburb for gap analysis
-- Used by Scout Agent via MCP to identify geographic opportunities
-- =====================================================================

CREATE OR REPLACE VIEW suburb_authority_substrate AS
SELECT
  workspace_id,
  suburb,
  state,

  -- Geographic signals
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_jobs,
  ARRAY_AGG(DISTINCT postcode) FILTER (WHERE postcode IS NOT NULL) as postcodes_covered,

  -- Photo evidence (critical for local authority)
  COUNT(*) FILTER (
    WHERE ai_authority_metadata->'proof_points' @> '[{"type": "before_after_photo"}]'
  ) as before_after_photo_count,

  COUNT(*) FILTER (
    WHERE ai_authority_metadata->'proof_points' @> '[{"type": "completion_photo"}]'
  ) as completion_photo_count,

  (
    COUNT(*) FILTER (
      WHERE ai_authority_metadata->'proof_points' @> '[{"type": "before_after_photo"}]'
    ) +
    COUNT(*) FILTER (
      WHERE ai_authority_metadata->'proof_points' @> '[{"type": "completion_photo"}]'
    )
  ) as total_photo_count,

  -- Review signals (social proof)
  COUNT(*) FILTER (
    WHERE ai_authority_metadata->'proof_points' @> '[{"type": "client_review"}]'
  ) as verified_review_count,

  COALESCE(
    AVG(
      (
        SELECT AVG((proof_point->>'rating')::numeric)
        FROM jsonb_array_elements(ai_authority_metadata->'proof_points') proof_point
        WHERE proof_point->>'type' = 'client_review'
          AND (proof_point->>'rating') IS NOT NULL
      )
    ),
    0
  ) as avg_suburb_rating,

  -- Authority score (composite metric: 0-100 scale)
  (
    -- Jobs completed (max 40 points, 1 point per job)
    LEAST(COUNT(*) FILTER (WHERE status = 'completed'), 40) +

    -- Photos (max 30 points: before/after worth 2pts, completion worth 1pt)
    LEAST(
      (
        COUNT(*) FILTER (
          WHERE ai_authority_metadata->'proof_points' @> '[{"type": "before_after_photo"}]'
        ) * 2
      ) +
      COUNT(*) FILTER (
        WHERE ai_authority_metadata->'proof_points' @> '[{"type": "completion_photo"}]'
      ),
      30
    ) +

    -- Reviews (max 30 points, 3 points per verified review)
    LEAST(
      COUNT(*) FILTER (
        WHERE ai_authority_metadata->'proof_points' @> '[{"type": "client_review"}]'
      ) * 3,
      30
    )
  )::integer as authority_score, -- 0-100 scale (higher = stronger local authority)

  -- Financial signals
  SUM(actual_amount) as total_revenue,
  COALESCE(AVG(actual_amount), 0) as avg_job_value,

  -- Temporal signals
  MIN(completed_at) as first_job_date,
  MAX(completed_at) as latest_job_date,

  -- Content gap indicators
  COALESCE(
    AVG((ai_authority_metadata->>'content_gap_score')::numeric),
    0
  ) as avg_content_gap_score,

  -- Geographic gap indicators
  COALESCE(
    AVG((ai_authority_metadata->>'geographic_gap_score')::numeric),
    0
  ) as avg_geographic_gap_score,

  -- Schema markup readiness (SEO)
  COUNT(*) FILTER (
    WHERE (ai_authority_metadata->'seo_signals'->>'schema_markup_generated')::boolean = true
  ) as schema_ready_jobs,

  -- Last updated timestamp
  MAX(updated_at) as last_updated

FROM client_jobs
WHERE status = 'completed'
GROUP BY workspace_id, suburb, state;

-- =====================================================================
-- RLS Policies (Multi-tenant Security)
-- =====================================================================

ALTER TABLE client_jobs ENABLE ROW LEVEL SECURITY;

-- Tenant isolation (SELECT)
DROP POLICY IF EXISTS "tenant_isolation_select" ON client_jobs;
CREATE POLICY "tenant_isolation_select" ON client_jobs
  FOR SELECT
  USING (workspace_id IN (
    SELECT id FROM workspaces WHERE id = get_current_workspace_id()
  ));

-- Tenant isolation (INSERT)
DROP POLICY IF EXISTS "tenant_isolation_insert" ON client_jobs;
CREATE POLICY "tenant_isolation_insert" ON client_jobs
  FOR INSERT
  WITH CHECK (
    workspace_id = get_current_workspace_id() AND
    created_by = auth.uid()
  );

-- Tenant isolation (UPDATE)
DROP POLICY IF EXISTS "tenant_isolation_update" ON client_jobs;
CREATE POLICY "tenant_isolation_update" ON client_jobs
  FOR UPDATE
  USING (workspace_id = get_current_workspace_id());

-- Tenant isolation (DELETE)
DROP POLICY IF EXISTS "tenant_isolation_delete" ON client_jobs;
CREATE POLICY "tenant_isolation_delete" ON client_jobs
  FOR DELETE
  USING (workspace_id = get_current_workspace_id());

-- =====================================================================
-- Comments & Documentation
-- =====================================================================

COMMENT ON TABLE client_jobs IS 'Client job history with AI-native authority metadata. Stores job details, geographic data, semantic embeddings (vector(768)), and proof points for local market dominance analysis.';

COMMENT ON COLUMN client_jobs.embedding IS 'Semantic embedding (768-dim) for job similarity search using text-embedding-3-small model.';

COMMENT ON COLUMN client_jobs.ai_authority_metadata IS 'AI authority signals: proof_points (photos/reviews), locality_signals (suburb metrics), seo_signals (content features), content_gap_score (0-1), geographic_gap_score (0-1).';

COMMENT ON VIEW suburb_authority_substrate IS 'Aggregates authority signals per suburb for AI-native gap analysis. Authority score formula: Jobs (40pts) + Photos (30pts) + Reviews (30pts) = 0-100. Used by Scout Agent via MCP to identify geographic and content opportunities. Lower authority scores indicate bigger market gaps (opportunities).';

COMMENT ON COLUMN suburb_authority_substrate.authority_score IS 'Composite authority metric (0-100). Higher = stronger local presence. Formula: min(completed_jobs, 40) + min(before_after*2 + completion, 30) + min(reviews*3, 30).';

-- =====================================================================
-- Triggers for updated_at Timestamp
-- =====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_client_jobs_updated_at ON client_jobs;
CREATE TRIGGER update_client_jobs_updated_at
  BEFORE UPDATE ON client_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
