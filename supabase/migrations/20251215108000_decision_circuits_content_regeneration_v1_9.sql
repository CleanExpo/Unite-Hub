/**
 * Decision Circuits v1.9.0 - Content Regeneration Engine
 * Schema for tracking variant regeneration attempts, outcomes, and lineage
 */

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum for regeneration outcomes
DO $$ BEGIN
  CREATE TYPE content_regeneration_status AS ENUM (
    'initiated',
    'cx08_approved',
    'cx08_rejected',
    'cx06_generated',
    'cx05_passed',
    'cx05_failed',
    'registered',
    'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enum for regeneration failure reasons
DO $$ BEGIN
  CREATE TYPE regeneration_failure_reason AS ENUM (
    'not_eligible',
    'guardrail_violation',
    'cx08_rejection',
    'cx06_generation_failed',
    'cx05_validation_failed',
    'variant_not_found',
    'test_not_found',
    'max_regenerations_exceeded',
    'cooldown_active',
    'unknown'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

/**
 * content_regeneration_events
 * Audit trail for every content regeneration attempt and outcome
 */
CREATE TABLE IF NOT EXISTS content_regeneration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Reference to the A/B test and losing variant
  ab_test_id UUID NOT NULL,
  parent_variant_id TEXT NOT NULL,

  -- Circuit execution context
  circuit_execution_id TEXT NOT NULL,

  -- Regeneration context
  regeneration_reason TEXT NOT NULL,         -- Why regeneration was triggered
  performance_delta FLOAT,                   -- The performance gap (should be negative)
  confidence_score FLOAT,                    -- Confidence of the terminate decision

  -- Status and outcomes
  status content_regeneration_status NOT NULL DEFAULT 'initiated',
  failure_reason regeneration_failure_reason,
  failure_details TEXT,                      -- Additional error info

  -- New variant (if successfully generated)
  new_variant_id TEXT,                       -- Generated variant ID
  new_variant_content JSONB,                 -- The generated content payload

  -- CX08 Self-Correction signal
  cx08_approval_signal JSONB,                -- Self-correction recommendation
  cx08_approved_at TIMESTAMPTZ,

  -- CX06 Generation result
  cx06_generation_result JSONB,              -- Full generation output
  cx06_generated_at TIMESTAMPTZ,

  -- CX05 Brand Validation result
  cx05_validation_result JSONB,              -- Brand guard validation output
  cx05_validated_at TIMESTAMPTZ,
  cx05_validation_score FLOAT,               -- 0-1 brand alignment score

  -- Timing
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INT,                           -- Total regeneration time

  -- Metadata
  user_id UUID,                              -- Who triggered this (if manual)
  triggered_by TEXT,                         -- 'automated' | 'manual' | 'cron'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT regeneration_event_fk_test
    FOREIGN KEY (workspace_id, ab_test_id) REFERENCES circuit_ab_tests(workspace_id, id),
  CONSTRAINT regeneration_status_not_null
    CHECK (status IS NOT NULL),
  CONSTRAINT new_variant_only_on_success
    CHECK (status != 'registered' OR new_variant_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_content_regeneration_workspace
  ON content_regeneration_events(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_regeneration_ab_test
  ON content_regeneration_events(ab_test_id);
CREATE INDEX IF NOT EXISTS idx_content_regeneration_parent_variant
  ON content_regeneration_events(parent_variant_id);
CREATE INDEX IF NOT EXISTS idx_content_regeneration_new_variant
  ON content_regeneration_events(new_variant_id);
CREATE INDEX IF NOT EXISTS idx_content_regeneration_status
  ON content_regeneration_events(status);
CREATE INDEX IF NOT EXISTS idx_content_regeneration_created_at
  ON content_regeneration_events(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_regeneration_circuit_exec
  ON content_regeneration_events(circuit_execution_id);

/**
 * content_variant_lineage
 * Parent->child mapping for variant replacement history
 * Enables tracing which variants were replaced and by what
 */
CREATE TABLE IF NOT EXISTS content_variant_lineage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- A/B test reference
  ab_test_id UUID NOT NULL,

  -- Parent variant (the underperformer)
  parent_variant_id TEXT NOT NULL,

  -- Child variant (the replacement)
  child_variant_id TEXT NOT NULL,

  -- Regeneration event that created this relationship
  regeneration_event_id UUID NOT NULL REFERENCES content_regeneration_events(id),

  -- Lineage depth (how many generations deep)
  depth INT NOT NULL DEFAULT 1,

  -- Status of this relationship
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_parent_child
    UNIQUE (workspace_id, ab_test_id, parent_variant_id, child_variant_id),
  CONSTRAINT lineage_depth_valid
    CHECK (depth > 0 AND depth <= 10)
);

CREATE INDEX IF NOT EXISTS idx_content_lineage_workspace
  ON content_variant_lineage(workspace_id);
CREATE INDEX IF NOT EXISTS idx_content_lineage_ab_test
  ON content_variant_lineage(ab_test_id);
CREATE INDEX IF NOT EXISTS idx_content_lineage_parent
  ON content_variant_lineage(parent_variant_id);
CREATE INDEX IF NOT EXISTS idx_content_lineage_child
  ON content_variant_lineage(child_variant_id);
CREATE INDEX IF NOT EXISTS idx_content_lineage_event
  ON content_variant_lineage(regeneration_event_id);

/**
 * Enable Row-Level Security
 */
ALTER TABLE content_regeneration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_variant_lineage ENABLE ROW LEVEL SECURITY;

/**
 * RLS Policy: Workspace tenant isolation for content_regeneration_events
 */
DROP POLICY IF EXISTS "content_regeneration_tenant_isolation" ON content_regeneration_events;
CREATE POLICY "content_regeneration_tenant_isolation" ON content_regeneration_events
  FOR ALL
  USING (workspace_id = get_current_workspace_id());

/**
 * RLS Policy: Workspace tenant isolation for content_variant_lineage
 */
DROP POLICY IF EXISTS "content_lineage_tenant_isolation" ON content_variant_lineage;
CREATE POLICY "content_lineage_tenant_isolation" ON content_variant_lineage
  FOR ALL
  USING (workspace_id = get_current_workspace_id());

/**
 * View: content_regeneration_summary
 * Aggregated regeneration stats per A/B test
 */
CREATE OR REPLACE VIEW content_regeneration_summary AS
SELECT
  workspace_id,
  ab_test_id,
  COUNT(*) as total_regenerations,
  SUM(CASE WHEN status = 'registered' THEN 1 ELSE 0 END) as successful_regenerations,
  SUM(CASE WHEN status != 'registered' THEN 1 ELSE 0 END) as failed_regenerations,
  MAX(completed_at) as last_regeneration_at,
  AVG(CASE WHEN duration_ms IS NOT NULL THEN duration_ms ELSE NULL END) as avg_duration_ms
FROM content_regeneration_events
GROUP BY workspace_id, ab_test_id;

COMMENT ON TABLE content_regeneration_events IS 'Audit trail for content variant regeneration attempts';
COMMENT ON TABLE content_variant_lineage IS 'Parent->child variant replacement history';
COMMENT ON VIEW content_regeneration_summary IS 'Aggregated regeneration statistics per A/B test';
