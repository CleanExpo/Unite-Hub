/**
 * SEO Threats Table
 * Tracks real-time SEO threats detected during monitoring
 *
 * Threat types:
 * - ranking_drop: Significant position loss in SERPs
 * - cwv_degradation: Core Web Vitals regression
 * - security_issue: Security header or SSL problems
 * - competitor_surge: Competitor content/backlink growth
 * - technical_error: Crawlability or indexability issues
 * - content_issue: Duplicate content, thin pages, etc.
 */

-- Create threat severity enum
DO $$ BEGIN
  CREATE TYPE threat_severity AS ENUM (
    'critical', -- Requires immediate action
    'high',     -- Significant impact
    'medium',   -- Notable but not urgent
    'low'       -- Minor or informational
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create threat type enum
DO $$ BEGIN
  CREATE TYPE threat_type AS ENUM (
    'ranking_drop',        -- Position loss in SERPs
    'cwv_degradation',     -- Core Web Vitals regression
    'security_issue',      -- Security/SSL problems
    'competitor_surge',    -- Competitor gaining ground
    'technical_error',     -- Crawlability/indexability
    'content_issue',       -- Duplicate/thin content
    'backlink_loss',       -- Backlink removal
    'traffic_drop'         -- Traffic decline
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create SEO threats table
CREATE TABLE IF NOT EXISTS seo_threats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  health_check_job_id UUID REFERENCES health_check_jobs(id) ON DELETE SET NULL,

  -- Threat identification
  threat_type threat_type NOT NULL,
  severity threat_severity NOT NULL,
  title TEXT NOT NULL,
  description TEXT,

  -- Affected items
  affected_url TEXT,
  affected_domain TEXT,
  affected_keyword TEXT,

  -- Metrics
  metric_name TEXT, -- e.g., "LCP", "Rankings for 'keyword'", "Traffic"
  previous_value NUMERIC(12, 2),
  current_value NUMERIC(12, 2),
  change_percent NUMERIC(6, 2), -- Percentage change
  change_amount NUMERIC(12, 2),

  -- Thresholds that triggered alert
  threshold_value NUMERIC(12, 2),
  threshold_direction TEXT, -- 'above' or 'below'

  -- Threat details
  root_cause TEXT,
  recommendations TEXT, -- Action items to fix
  estimated_impact JSONB DEFAULT '{}'::jsonb, -- {traffic_loss: 500, revenue_loss: 2500}

  -- Status tracking
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,

  -- Resolution
  resolution_notes TEXT,
  resolution_actions JSONB DEFAULT '[]'::jsonb, -- Array of action items taken

  -- Related data
  related_threats UUID[] DEFAULT ARRAY[]::UUID[], -- Links to related threats
  evidence JSONB, -- Supporting data (screenshots, metrics, etc.)

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Indexes for monitoring
CREATE INDEX IF NOT EXISTS idx_seo_threats_workspace ON seo_threats(workspace_id);
CREATE INDEX IF NOT EXISTS idx_seo_threats_type ON seo_threats(threat_type);
CREATE INDEX IF NOT EXISTS idx_seo_threats_severity ON seo_threats(severity);
CREATE INDEX IF NOT EXISTS idx_seo_threats_active ON seo_threats(is_active);
CREATE INDEX IF NOT EXISTS idx_seo_threats_detected ON seo_threats(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_seo_threats_job_id ON seo_threats(health_check_job_id);
CREATE INDEX IF NOT EXISTS idx_seo_threats_workspace_active_severity ON seo_threats(workspace_id, is_active, severity);
CREATE INDEX IF NOT EXISTS idx_seo_threats_domain ON seo_threats(affected_domain);

-- Enable RLS
ALTER TABLE seo_threats ENABLE ROW LEVEL SECURITY;

-- RLS Policy
DROP POLICY IF EXISTS "tenant_isolation" ON seo_threats;
CREATE POLICY "tenant_isolation" ON seo_threats
  FOR ALL USING (workspace_id = get_current_workspace_id());

-- Update trigger
CREATE OR REPLACE FUNCTION update_seo_threats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS seo_threats_updated_at_trigger ON seo_threats;
CREATE TRIGGER seo_threats_updated_at_trigger
  BEFORE UPDATE ON seo_threats
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_threats_updated_at();

-- Function to mark threats as resolved when time-based resolution occurs
CREATE OR REPLACE FUNCTION auto_resolve_seo_threats()
RETURNS void AS $$
BEGIN
  UPDATE seo_threats
  SET
    is_active = false,
    resolved_at = NOW()
  WHERE
    is_active = true
    AND threat_type = 'ranking_drop'
    AND detected_at < NOW() - INTERVAL '7 days' -- Auto-resolve after 7 days
    AND resolved_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON seo_threats TO authenticated;
GRANT SELECT ON seo_threats TO anon;

-- Comments
COMMENT ON TABLE seo_threats IS 'Real-time SEO threat detection and tracking';
COMMENT ON COLUMN seo_threats.threat_type IS 'Type of threat detected';
COMMENT ON COLUMN seo_threats.severity IS 'Impact severity: critical → high → medium → low';
COMMENT ON COLUMN seo_threats.is_active IS 'Whether threat is currently active (unresolved)';
COMMENT ON COLUMN seo_threats.estimated_impact IS 'JSON: {traffic_loss, revenue_loss, ranking_positions}';
COMMENT ON COLUMN seo_threats.recommendations IS 'Actionable steps to resolve threat';
