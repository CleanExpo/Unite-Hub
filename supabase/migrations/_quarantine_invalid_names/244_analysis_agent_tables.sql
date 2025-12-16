-- Phase 5 Agent 5: Analysis Agent Tables
-- Stores business intelligence reports, KPI analysis, anomalies, forecasts, and insights

CREATE TABLE IF NOT EXISTS analysis_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  brand_id TEXT NOT NULL,
  timeframe TEXT NOT NULL,

  -- KPI snapshot
  kpi_results JSONB NOT NULL,

  -- Analysis results
  anomalies JSONB NOT NULL DEFAULT '[]',
  forecast JSONB NOT NULL,
  insights JSONB NOT NULL DEFAULT '[]',

  -- Risk & approval
  risk_score INTEGER NOT NULL DEFAULT 0,
  risk_level TEXT NOT NULL DEFAULT 'low',
  approval_status TEXT NOT NULL DEFAULT 'pending_review',
  requires_founder_review BOOLEAN NOT NULL DEFAULT FALSE,
  founder_reviewed_at TIMESTAMP WITH TIME ZONE,
  founder_decision TEXT,
  founder_notes TEXT,

  -- Metadata
  total_data_points INTEGER NOT NULL DEFAULT 0,
  forecast_confidence INTEGER NOT NULL DEFAULT 75,
  metadata JSONB,

  CONSTRAINT valid_brand FOREIGN KEY (brand_id) REFERENCES brand_metadata(brand_id) ON DELETE RESTRICT,
  CONSTRAINT valid_timeframe CHECK (timeframe IN ('24h', '7d', '30d', 'quarter', 'year')),
  CONSTRAINT valid_risk CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_status CHECK (approval_status IN ('auto_approved', 'pending_review', 'pending_approval', 'rejected'))
);

-- KPI history for trend tracking
CREATE TABLE IF NOT EXISTS kpi_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  report_id UUID NOT NULL REFERENCES analysis_reports(id) ON DELETE CASCADE,

  -- Email metrics
  email_engagement DECIMAL(5,2) NOT NULL,
  email_open_rate DECIMAL(5,2) NOT NULL,
  email_click_rate DECIMAL(5,2) NOT NULL,
  email_bounce_rate DECIMAL(5,2) NOT NULL,

  -- Research metrics
  research_insights INTEGER NOT NULL,
  high_threat_insights INTEGER NOT NULL,

  -- Content metrics
  content_generated INTEGER NOT NULL,
  auto_approved_percentage DECIMAL(5,2) NOT NULL,

  -- Scheduling metrics
  scheduling_efficiency DECIMAL(5,2) NOT NULL,
  scheduling_conflicts INTEGER NOT NULL,

  -- Staff metrics
  staff_utilization DECIMAL(5,2) NOT NULL,
  staff_overload_count INTEGER NOT NULL,

  -- Financial metrics
  profit_margin DECIMAL(8,2) NOT NULL
);

-- Anomaly detection log
CREATE TABLE IF NOT EXISTS anomaly_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  report_id UUID NOT NULL REFERENCES analysis_reports(id) ON DELETE CASCADE,

  anomaly_type TEXT NOT NULL,
  source TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  value DECIMAL(15,2),
  threshold DECIMAL(15,2),
  impact TEXT,

  -- Resolution tracking
  investigated_at TIMESTAMP WITH TIME ZONE,
  resolution_status TEXT DEFAULT 'open',
  resolution_notes TEXT,

  CONSTRAINT valid_type CHECK (anomaly_type IN ('spike', 'drop', 'pattern_break', 'threshold_violation', 'outlier')),
  CONSTRAINT valid_source CHECK (source IN ('email', 'research', 'content', 'scheduling', 'staff', 'financials')),
  CONSTRAINT valid_severity CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_resolution_status CHECK (resolution_status IN ('open', 'investigating', 'resolved', 'dismissed'))
);

-- Insight tracking
CREATE TABLE IF NOT EXISTS insights_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  report_id UUID NOT NULL REFERENCES analysis_reports(id) ON DELETE CASCADE,

  insight_title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  evidence JSONB NOT NULL,
  action_items JSONB NOT NULL,

  -- Action tracking
  assigned_to TEXT,
  target_completion_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_category CHECK (category IN ('opportunity', 'risk', 'trend', 'recommendation')),
  CONSTRAINT valid_priority CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed'))
);

-- Forecast comparison (actual vs predicted)
CREATE TABLE IF NOT EXISTS forecast_accuracy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  forecast_report_id UUID NOT NULL REFERENCES analysis_reports(id) ON DELETE CASCADE,
  actual_report_id UUID REFERENCES analysis_reports(id) ON DELETE SET NULL,

  metric_name TEXT NOT NULL,
  forecast_value DECIMAL(15,2) NOT NULL,
  actual_value DECIMAL(15,2),
  variance_percentage DECIMAL(5,2),

  accuracy_status TEXT,

  CONSTRAINT valid_accuracy CHECK (accuracy_status IN ('accurate', 'overestimate', 'underestimate', 'pending'))
);

-- Enable RLS
ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_accuracy ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY analysis_reports_authenticated_read ON analysis_reports
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY kpi_history_authenticated_read ON kpi_history
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY anomaly_log_authenticated_read ON anomaly_log
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY insights_log_authenticated_read ON insights_log
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY forecast_accuracy_authenticated_read ON forecast_accuracy
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analysis_reports_brand ON analysis_reports(brand_id);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_timeframe ON analysis_reports(timeframe);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_risk ON analysis_reports(risk_level);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_status ON analysis_reports(approval_status);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_requires_review ON analysis_reports(requires_founder_review);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_created ON analysis_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kpi_history_report ON kpi_history(report_id);
CREATE INDEX IF NOT EXISTS idx_kpi_history_created ON kpi_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_history_email ON kpi_history(email_engagement DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_history_staff ON kpi_history(staff_utilization DESC);

CREATE INDEX IF NOT EXISTS idx_anomaly_log_report ON anomaly_log(report_id);
CREATE INDEX IF NOT EXISTS idx_anomaly_log_severity ON anomaly_log(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_log_source ON anomaly_log(source);
CREATE INDEX IF NOT EXISTS idx_anomaly_log_status ON anomaly_log(resolution_status);
CREATE INDEX IF NOT EXISTS idx_anomaly_log_created ON anomaly_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_insights_log_report ON insights_log(report_id);
CREATE INDEX IF NOT EXISTS idx_insights_log_category ON insights_log(category);
CREATE INDEX IF NOT EXISTS idx_insights_log_priority ON insights_log(priority);
CREATE INDEX IF NOT EXISTS idx_insights_log_status ON insights_log(status);
CREATE INDEX IF NOT EXISTS idx_insights_log_created ON insights_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forecast_accuracy_report ON forecast_accuracy(forecast_report_id);
CREATE INDEX IF NOT EXISTS idx_forecast_accuracy_actual ON forecast_accuracy(actual_report_id);
CREATE INDEX IF NOT EXISTS idx_forecast_accuracy_metric ON forecast_accuracy(metric_name);

-- Conditional index creation (handles schema variations)
DO $$
BEGIN
  -- Try to create index on variance percentage
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'forecast_accuracy' AND column_name = 'variance_percentage') THEN
    CREATE INDEX IF NOT EXISTS idx_forecast_accuracy_variance ON forecast_accuracy(variance_percentage DESC);
  END IF;

  -- Try to create index on insight assignments
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'insights_log' AND column_name = 'assigned_to') THEN
    CREATE INDEX IF NOT EXISTS idx_insights_log_assigned ON insights_log(assigned_to);
  END IF;
END $$;

-- Comments (with error handling for schema variations)
DO $$
BEGIN
  -- Table comments
  COMMENT ON TABLE analysis_reports IS 'Stores comprehensive analysis reports with KPI snapshots, anomalies, forecasts, and insights for founder review and decision-making.';
  COMMENT ON TABLE kpi_history IS 'Historical KPI snapshots for trend analysis and performance tracking across time periods.';
  COMMENT ON TABLE anomaly_log IS 'Log of detected anomalies with severity, impact assessment, and resolution tracking.';
  COMMENT ON TABLE insights_log IS 'Business insights generated from analysis with action items and completion tracking.';
  COMMENT ON TABLE forecast_accuracy IS 'Tracks forecast accuracy by comparing predicted vs actual metrics for model improvement.';

  -- Column comments
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_reports' AND column_name = 'forecast_confidence') THEN
    COMMENT ON COLUMN analysis_reports.forecast_confidence IS 'Confidence score for forecast (0-100) based on data quality and completeness.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'anomaly_log' AND column_name = 'resolution_status') THEN
    COMMENT ON COLUMN anomaly_log.resolution_status IS 'Current status: open (new), investigating (under review), resolved (action taken), dismissed (false positive).';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'insights_log' AND column_name = 'priority') THEN
    COMMENT ON COLUMN insights_log.priority IS 'Insight priority for action: critical (immediate), high (this week), medium (this month), low (when capacity available).';
  END IF;

EXCEPTION WHEN OTHERS THEN
  -- Silently ignore comment errors (they're non-critical)
  NULL;
END $$;
