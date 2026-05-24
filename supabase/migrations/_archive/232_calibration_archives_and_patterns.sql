/**
 * Migration 232: Calibration Archives & Patterns Storage
 *
 * Enables learning from calibration history:
 * - Archive completed calibrations for compliance and learning
 * - Detect recurring calibration patterns
 * - Track system health improvements over time
 * - Support for pattern-based future recommendations
 */

-- ============================================================================
-- CALIBRATION_ARCHIVES - Complete calibration cycle archives
-- ============================================================================

CREATE TABLE IF NOT EXISTS calibration_archives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Archive tracking
  archive_id UUID NOT NULL UNIQUE,
  calibration_cycle_id UUID NOT NULL REFERENCES autonomy_calibration_cycles(id) ON DELETE CASCADE,
  cycle_number INT NOT NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'archived' CHECK (status IN (
    'pending_archive', 'archived', 'failed', 'rolled_back'
  )),

  -- Analysis data
  metrics_analyzed JSONB NOT NULL DEFAULT '{}'::JSONB,
  proposed_changes JSONB NOT NULL DEFAULT '[]'::JSONB,
  applied_changes JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Results
  overall_confidence INT CHECK (overall_confidence >= 0 AND overall_confidence <= 100),
  system_health_before INT,
  system_health_after INT,
  improvement_percentage NUMERIC,

  -- Findings and recommendations
  findings TEXT,
  recommendations TEXT[] DEFAULT '{}'::TEXT[],
  archive_notes TEXT,

  -- Metadata
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calibration_archives_workspace ON calibration_archives(workspace_id);
CREATE INDEX IF NOT EXISTS idx_calibration_archives_cycle ON calibration_archives(calibration_cycle_id);
CREATE INDEX IF NOT EXISTS idx_calibration_archives_timestamp ON calibration_archives(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_calibration_archives_improvement ON calibration_archives(improvement_percentage DESC);

-- ============================================================================
-- CALIBRATION_PATTERNS - Detected recurring patterns
-- ============================================================================

CREATE TABLE IF NOT EXISTS calibration_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Pattern identification
  pattern_id UUID NOT NULL UNIQUE,
  pattern_name TEXT NOT NULL,
  description TEXT,

  -- Pattern statistics
  occurrences INT DEFAULT 1,
  triggering_metrics TEXT[] DEFAULT '{}'::TEXT[],
  suggested_adjustments JSONB DEFAULT '{}'::JSONB,

  -- Confidence and success
  avg_confidence INT CHECK (avg_confidence >= 0 AND avg_confidence <= 100),
  success_rate NUMERIC CHECK (success_rate >= 0 AND success_rate <= 100),

  -- Metadata
  keywords TEXT[] DEFAULT '{}'::TEXT[],
  first_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calibration_patterns_workspace ON calibration_patterns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_calibration_patterns_name ON calibration_patterns(pattern_name);
CREATE INDEX IF NOT EXISTS idx_calibration_patterns_occurrences ON calibration_patterns(occurrences DESC);
CREATE INDEX IF NOT EXISTS idx_calibration_patterns_confidence ON calibration_patterns(avg_confidence DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE calibration_archives ENABLE ROW LEVEL SECURITY;
ALTER TABLE calibration_patterns ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to calibration_archives"
  ON calibration_archives FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access to calibration_patterns"
  ON calibration_patterns FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Founder has SELECT access (read-only)
CREATE POLICY "Founder can view calibration_archives"
  ON calibration_archives FOR SELECT
  USING (
    workspace_id IN (
      SELECT DISTINCT workspace_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

CREATE POLICY "Founder can view calibration_patterns"
  ON calibration_patterns FOR SELECT
  USING (
    workspace_id IN (
      SELECT DISTINCT workspace_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_calibration_improvement_history(
  p_workspace_id UUID,
  p_lookback_days INT DEFAULT 30
)
RETURNS TABLE (
  cycle_number INT,
  improvement_percentage NUMERIC,
  system_health_before INT,
  system_health_after INT,
  archived_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ca.cycle_number,
    ca.improvement_percentage,
    ca.system_health_before,
    ca.system_health_after,
    ca.archived_at
  FROM calibration_archives ca
  WHERE ca.workspace_id = p_workspace_id
    AND ca.status = 'archived'
    AND ca.archived_at >= now() - (p_lookback_days || ' days')::INTERVAL
  ORDER BY ca.archived_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_top_patterns(
  p_workspace_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  pattern_name TEXT,
  occurrences INT,
  description TEXT,
  avg_confidence INT,
  success_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.pattern_name,
    cp.occurrences,
    cp.description,
    cp.avg_confidence,
    cp.success_rate
  FROM calibration_patterns cp
  WHERE cp.workspace_id = p_workspace_id
  ORDER BY cp.occurrences DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_overall_improvement(
  p_workspace_id UUID,
  p_lookback_days INT DEFAULT 30
)
RETURNS TABLE (
  avg_improvement NUMERIC,
  total_calibrations INT,
  avg_confidence INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    AVG(ca.improvement_percentage)::NUMERIC,
    COUNT(*)::INT,
    ROUND(AVG(ca.overall_confidence))::INT
  FROM calibration_archives ca
  WHERE ca.workspace_id = p_workspace_id
    AND ca.status = 'archived'
    AND ca.archived_at >= now() - (p_lookback_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_calibration_improvement_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_patterns TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_overall_improvement TO authenticated;
