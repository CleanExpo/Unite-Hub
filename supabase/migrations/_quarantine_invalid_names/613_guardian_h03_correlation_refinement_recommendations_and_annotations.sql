/**
 * H03: AI Correlation Refinement Advisor
 *
 * Adds tenant-scoped tables for:
 * - Correlation refinement recommendations (advisory-only suggestions for cluster tuning)
 * - Cluster annotations (labels and metadata for clusters)
 * - Feedback tracking (admin actions on recommendations)
 *
 * All data is aggregate-only and PII-free (no raw payloads, no destinations).
 * Recommendations are advisory-only: admins must explicitly apply changes via existing tools.
 * H03 does NOT modify core correlation runtime (G-series) behavior.
 */

-- Table 1: guardian_correlation_recommendations
-- Stores refinement suggestions for correlation clusters
CREATE TABLE IF NOT EXISTS guardian_correlation_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'new',
  -- 'new' | 'reviewing' | 'accepted' | 'rejected' | 'applied'

  -- Source of recommendation
  source TEXT NOT NULL DEFAULT 'ai',
  -- 'ai' | 'heuristic'

  -- Recommendation content (PII-free, aggregate-only)
  title TEXT NOT NULL,
  rationale TEXT NOT NULL,
  confidence NUMERIC NULL,
  -- 0..1 if AI, fixed 0.6-0.75 if heuristic

  -- Type of recommendation
  recommendation_type TEXT NOT NULL,
  -- 'merge_split' | 'threshold_tune' | 'link_weight' | 'time_window' | 'noise_filter'

  -- Target scope (redacted cluster keys/ids, safe identifiers only)
  target JSONB NOT NULL,
  -- { cluster_ids: [uuid, ...], scope?: 'single' | 'multiple' | 'global' }

  -- Aggregate signals used in recommendation (counts, rates, no raw data)
  signals JSONB NOT NULL,
  -- { cluster_count, median_size, p95_size, duration_minutes, density, ... }

  -- Proposed parameter changes or guidance
  recommendation JSONB NOT NULL,
  -- { param_name: value_or_delta, ... }
  -- Safe param names: 'time_window_minutes', 'min_links', 'max_cluster_duration',
  --                   'link_weight_rule', 'noise_filter_rules'

  -- Audit fields
  applied_at TIMESTAMPTZ NULL,
  applied_by TEXT NULL,

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT status_valid CHECK (status IN ('new', 'reviewing', 'accepted', 'rejected', 'applied')),
  CONSTRAINT source_valid CHECK (source IN ('ai', 'heuristic')),
  CONSTRAINT recommendation_type_valid CHECK (recommendation_type IN ('merge_split', 'threshold_tune', 'link_weight', 'time_window', 'noise_filter')),
  CONSTRAINT confidence_range CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

-- Indexes for recommendation queries
CREATE INDEX IF NOT EXISTS idx_correlation_recommendations_tenant_status
  ON guardian_correlation_recommendations(tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_correlation_recommendations_tenant_created
  ON guardian_correlation_recommendations(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_correlation_recommendations_tenant_source
  ON guardian_correlation_recommendations(tenant_id, source, created_at DESC);

-- Table 2: guardian_correlation_cluster_annotations
-- Labels and metadata for correlation clusters
CREATE TABLE IF NOT EXISTS guardian_correlation_cluster_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Link to cluster (safe reference, no payload)
  cluster_id UUID NOT NULL REFERENCES guardian_correlation_clusters(id) ON DELETE CASCADE,

  -- Annotation content
  label TEXT NOT NULL,
  -- e.g., 'likely single incident', 'multi-source noise', 'known pattern'

  category TEXT NOT NULL DEFAULT 'general',
  -- e.g., 'general', 'incident', 'noise', 'pattern', 'investigation'

  notes TEXT NULL,
  -- Sensitive free-text; should be scrubbed from exports unless explicitly allowed

  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  -- E.g., ['flaky-rule', 'network-issue', 'requires-investigation']

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT uq_annotation_cluster_label UNIQUE (tenant_id, cluster_id, label)
);

-- Indexes for annotation queries
CREATE INDEX IF NOT EXISTS idx_correlation_annotations_cluster
  ON guardian_correlation_cluster_annotations(tenant_id, cluster_id);
CREATE INDEX IF NOT EXISTS idx_correlation_annotations_created
  ON guardian_correlation_cluster_annotations(tenant_id, created_at DESC);

-- Table 3: guardian_correlation_recommendation_feedback
-- Tracks admin actions on recommendations
CREATE TABLE IF NOT EXISTS guardian_correlation_recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL REFERENCES guardian_correlation_recommendations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Actor and action
  actor TEXT NULL,
  -- email or system id

  action TEXT NOT NULL,
  -- 'viewed' | 'thumbs_up' | 'thumbs_down' | 'accepted' | 'rejected' | 'applied'

  reason TEXT NULL,
  -- Optional explanation for action

  notes TEXT NULL,
  -- Optional admin notes

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT action_valid CHECK (action IN ('viewed', 'thumbs_up', 'thumbs_down', 'accepted', 'rejected', 'applied'))
);

-- Indexes for feedback queries
CREATE INDEX IF NOT EXISTS idx_correlation_feedback_recommendation
  ON guardian_correlation_recommendation_feedback(tenant_id, recommendation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_correlation_feedback_action
  ON guardian_correlation_recommendation_feedback(tenant_id, action, created_at DESC);

-- Enable RLS on all tables
ALTER TABLE guardian_correlation_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_correlation_cluster_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_correlation_recommendation_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Tenant isolation for recommendations
DROP POLICY IF EXISTS "tenant_isolation_correlation_recommendations" ON guardian_correlation_recommendations;
CREATE POLICY "tenant_isolation_correlation_recommendations" ON guardian_correlation_recommendations
FOR ALL USING (tenant_id = get_current_workspace_id());

-- RLS Policies: Tenant isolation for annotations
DROP POLICY IF EXISTS "tenant_isolation_correlation_annotations" ON guardian_correlation_cluster_annotations;
CREATE POLICY "tenant_isolation_correlation_annotations" ON guardian_correlation_cluster_annotations
FOR ALL USING (tenant_id = get_current_workspace_id());

-- RLS Policies: Tenant isolation for feedback
DROP POLICY IF EXISTS "tenant_isolation_correlation_feedback" ON guardian_correlation_recommendation_feedback;
CREATE POLICY "tenant_isolation_correlation_feedback" ON guardian_correlation_recommendation_feedback
FOR ALL USING (tenant_id = get_current_workspace_id());

-- Comments for documentation
COMMENT ON TABLE guardian_correlation_recommendations IS
  'Tenant-scoped refinement recommendations for correlation clusters. Each recommendation is advisory-only; admins must explicitly apply changes via existing correlation configuration tools. All data is aggregate-only and PII-free.';

COMMENT ON COLUMN guardian_correlation_recommendations.signals IS
  'Aggregate cluster features used to generate the recommendation (counts, sizes, durations, densities). No raw payloads, no PII.';

COMMENT ON COLUMN guardian_correlation_recommendations.recommendation IS
  'Proposed parameter changes (e.g., time_window_minutes, min_links, noise_filter_rules). Only safe parameter names are allowed.';

COMMENT ON TABLE guardian_correlation_cluster_annotations IS
  'Labels and metadata for correlation clusters. Annotations help admins understand cluster patterns and investigation status. Notes may contain sensitive free-text and should be scrubbed from exports unless explicitly allowed.';

COMMENT ON TABLE guardian_correlation_recommendation_feedback IS
  'Tracks admin actions (viewed, accepted, rejected, applied) on recommendations for audit and continuous improvement of advisor algorithms.';
