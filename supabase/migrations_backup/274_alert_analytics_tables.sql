-- Migration 274: Alert Analytics & Predictive Intelligence System
-- Purpose: Create tables for analytics aggregation, pattern detection, and predictive alerting
-- Version: 1.0.0
-- Date: 2025-11-27

-- ============================================================================
-- TABLE 1: convex_alert_analytics
-- Purpose: Store aggregated alert statistics and performance metrics
-- ============================================================================

CREATE TABLE IF NOT EXISTS convex_alert_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL,
  workspace_id UUID NOT NULL,

  -- Time period
  date DATE NOT NULL,
  period_type TEXT NOT NULL DEFAULT 'daily' CHECK (period_type IN ('hourly', 'daily', 'weekly', 'monthly')),

  -- Alert statistics
  total_triggers INTEGER DEFAULT 0,
  triggered_by_type JSONB DEFAULT '{
    "threshold": 0,
    "anomaly": 0,
    "performance": 0,
    "milestone": 0
  }'::JSONB,

  -- Response metrics
  avg_response_time_minutes INTEGER,
  min_response_time_minutes INTEGER,
  max_response_time_minutes INTEGER,

  -- Resolution metrics
  mttr_minutes NUMERIC(10, 2),
  resolution_rate NUMERIC(5, 2),
  acknowledged_rate NUMERIC(5, 2),

  -- Quality metrics
  false_positive_rate NUMERIC(5, 2),
  suppression_effectiveness NUMERIC(5, 2),
  duplicate_alerts INTEGER DEFAULT 0,

  -- Notification metrics
  notifications_sent INTEGER DEFAULT 0,
  notification_channels JSONB DEFAULT '{
    "email": 0,
    "in-app": 0,
    "slack": 0
  }'::JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT fk_framework_id FOREIGN KEY (framework_id) REFERENCES convex_custom_frameworks(id) ON DELETE CASCADE,
  CONSTRAINT fk_workspace_id FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT unique_daily_analytics UNIQUE (framework_id, workspace_id, date, period_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alert_analytics_framework ON convex_alert_analytics(framework_id);
CREATE INDEX IF NOT EXISTS idx_alert_analytics_workspace ON convex_alert_analytics(workspace_id);
CREATE INDEX IF NOT EXISTS idx_alert_analytics_date ON convex_alert_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_alert_analytics_period ON convex_alert_analytics(period_type);

-- Enable RLS
ALTER TABLE convex_alert_analytics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "alert_analytics_workspace_isolation" ON convex_alert_analytics
      FOR SELECT
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================================
-- TABLE 2: convex_alert_patterns
-- Purpose: Store detected alert patterns and recurring issues
-- ============================================================================

CREATE TABLE IF NOT EXISTS convex_alert_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL,
  workspace_id UUID NOT NULL,

  -- Pattern identification
  pattern_type TEXT NOT NULL CHECK (pattern_type IN ('seasonal', 'cyclical', 'correlated', 'triggered_by', 'escalating')),
  pattern_name TEXT NOT NULL,
  pattern_description TEXT,

  -- Pattern details
  alert_types TEXT[] NOT NULL,
  trigger_conditions JSONB,
  frequency TEXT CHECK (frequency IN ('hourly', 'daily', 'weekly', 'monthly', 'sporadic')),

  -- Metrics
  confidence_score NUMERIC(5, 2) CHECK (confidence_score >= 0 AND confidence_score <= 100),
  occurrence_count INTEGER DEFAULT 1,
  last_occurrence TIMESTAMPTZ,
  first_occurrence TIMESTAMPTZ,

  -- Recommendations
  recommended_action TEXT,
  recommended_rule_changes JSONB,

  -- Metadata
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT fk_framework_id FOREIGN KEY (framework_id) REFERENCES convex_custom_frameworks(id) ON DELETE CASCADE,
  CONSTRAINT fk_workspace_id FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alert_patterns_framework ON convex_alert_patterns(framework_id);
CREATE INDEX IF NOT EXISTS idx_alert_patterns_workspace ON convex_alert_patterns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_alert_patterns_type ON convex_alert_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_alert_patterns_confidence ON convex_alert_patterns(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_alert_patterns_last_occurrence ON convex_alert_patterns(last_occurrence DESC);

-- Enable RLS
ALTER TABLE convex_alert_patterns ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "alert_patterns_workspace_isolation" ON convex_alert_patterns
      FOR SELECT
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "alert_patterns_insert" ON convex_alert_patterns
      FOR INSERT
      WITH CHECK (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================================
-- TABLE 3: convex_alert_predictions
-- Purpose: Store AI-generated predictions and forecast data
-- ============================================================================

CREATE TABLE IF NOT EXISTS convex_alert_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework_id UUID NOT NULL,
  workspace_id UUID NOT NULL,

  -- Prediction metadata
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('next_alert', 'anomaly_risk', 'performance_issue', 'escalation_risk')),
  predicted_at TIMESTAMPTZ DEFAULT now(),
  prediction_horizon TEXT CHECK (prediction_horizon IN ('1h', '4h', '24h', '7d')),

  -- Alert prediction
  predicted_alert_type TEXT,
  predicted_metric TEXT,
  predicted_threshold NUMERIC,

  -- Confidence and scoring
  probability NUMERIC(5, 2) CHECK (probability >= 0 AND probability <= 100),
  confidence_level TEXT NOT NULL CHECK (confidence_level IN ('high', 'medium', 'low')),
  risk_score NUMERIC(5, 2) CHECK (risk_score >= 0 AND risk_score <= 100),

  -- Prediction details
  predicted_timeframe TEXT,
  prediction_reasoning TEXT,
  preventive_actions TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- AI processing
  thinking_tokens INTEGER,
  model_used TEXT DEFAULT 'claude-opus-4-1-20250805',
  cost_estimate NUMERIC(10, 4),

  -- Verification
  was_accurate BOOLEAN,
  actual_alert_triggered_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT fk_framework_id FOREIGN KEY (framework_id) REFERENCES convex_custom_frameworks(id) ON DELETE CASCADE,
  CONSTRAINT fk_workspace_id FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alert_predictions_framework ON convex_alert_predictions(framework_id);
CREATE INDEX IF NOT EXISTS idx_alert_predictions_workspace ON convex_alert_predictions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_alert_predictions_type ON convex_alert_predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_alert_predictions_confidence ON convex_alert_predictions(confidence_level);
CREATE INDEX IF NOT EXISTS idx_alert_predictions_created ON convex_alert_predictions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_predictions_accuracy ON convex_alert_predictions(was_accurate);

-- Enable RLS
ALTER TABLE convex_alert_predictions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "alert_predictions_workspace_isolation" ON convex_alert_predictions
      FOR SELECT
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "alert_predictions_insert" ON convex_alert_predictions
      FOR INSERT
      WITH CHECK (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================================
-- TABLE 4: convex_notification_preferences
-- Purpose: Store user preferences for alert notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS convex_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  workspace_id UUID NOT NULL,

  -- Quiet hours configuration
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  quiet_hours_timezone TEXT DEFAULT 'UTC',

  -- Channel preferences
  notification_channels TEXT[] NOT NULL DEFAULT ARRAY['email', 'in-app'],
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  slack_enabled BOOLEAN DEFAULT false,

  -- Grouping and deduplication
  grouping_enabled BOOLEAN DEFAULT true,
  group_by_type BOOLEAN DEFAULT true,
  deduplication_enabled BOOLEAN DEFAULT true,
  deduplication_window_minutes INTEGER DEFAULT 5,

  -- Severity and filtering
  min_alert_severity TEXT DEFAULT 'info' CHECK (min_alert_severity IN ('info', 'warning', 'critical')),
  suppressed_alert_types TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Notification frequency
  max_notifications_per_hour INTEGER DEFAULT 20,
  digest_enabled BOOLEAN DEFAULT false,
  digest_frequency TEXT DEFAULT 'daily' CHECK (digest_frequency IN ('hourly', 'daily', 'weekly')),

  -- Escalation
  escalation_enabled BOOLEAN DEFAULT true,
  escalation_after_minutes INTEGER DEFAULT 60,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_workspace_id FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_workspace UNIQUE (user_id, workspace_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON convex_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_workspace ON convex_notification_preferences(workspace_id);

-- Enable RLS
ALTER TABLE convex_notification_preferences ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "notification_preferences_user_isolation" ON convex_notification_preferences
      FOR SELECT
      USING (user_id = auth.uid());
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "notification_preferences_insert" ON convex_notification_preferences
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "notification_preferences_update" ON convex_notification_preferences
      FOR UPDATE
      USING (user_id = auth.uid());
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================================
-- HELPER FUNCTIONS
-- Purpose: Analytics and prediction utilities
-- ============================================================================

CREATE OR REPLACE FUNCTION get_alert_trend(
  p_framework_id UUID,
  p_workspace_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  total_triggers INTEGER,
  threshold_alerts INTEGER,
  anomaly_alerts INTEGER,
  performance_alerts INTEGER,
  milestone_alerts INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    caa.date,
    caa.total_triggers,
    (caa.triggered_by_type->>'threshold')::INTEGER,
    (caa.triggered_by_type->>'anomaly')::INTEGER,
    (caa.triggered_by_type->>'performance')::INTEGER,
    (caa.triggered_by_type->>'milestone')::INTEGER
  FROM convex_alert_analytics caa
  WHERE caa.framework_id = p_framework_id
    AND caa.workspace_id = p_workspace_id
    AND caa.date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
  ORDER BY caa.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_alert_health(
  p_framework_id UUID,
  p_workspace_id UUID
)
RETURNS TABLE (
  health_score NUMERIC,
  mttr_status TEXT,
  resolution_rate_status TEXT,
  false_positive_status TEXT,
  overall_trend TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(
      (COALESCE(AVG(CASE WHEN caa.acknowledged_rate > 80 THEN 25 ELSE 0 END), 0) +
       COALESCE(AVG(CASE WHEN caa.resolution_rate > 85 THEN 25 ELSE 0 END), 0) +
       COALESCE(AVG(CASE WHEN caa.false_positive_rate < 10 THEN 25 ELSE 0 END), 0) +
       COALESCE(AVG(CASE WHEN caa.suppression_effectiveness > 70 THEN 25 ELSE 0 END), 0))::NUMERIC, 2),
    CASE
      WHEN AVG(caa.mttr_minutes) < 30 THEN 'Good'
      WHEN AVG(caa.mttr_minutes) < 60 THEN 'Fair'
      ELSE 'Needs Improvement'
    END,
    CASE
      WHEN AVG(caa.resolution_rate) > 85 THEN 'Excellent'
      WHEN AVG(caa.resolution_rate) > 70 THEN 'Good'
      ELSE 'Fair'
    END,
    CASE
      WHEN AVG(caa.false_positive_rate) < 10 THEN 'Low'
      WHEN AVG(caa.false_positive_rate) < 20 THEN 'Moderate'
      ELSE 'High'
    END,
    CASE
      WHEN AVG(caa.total_triggers) > LAG(AVG(caa.total_triggers)) OVER (ORDER BY caa.date) THEN 'Increasing'
      WHEN AVG(caa.total_triggers) < LAG(AVG(caa.total_triggers)) OVER (ORDER BY caa.date) THEN 'Decreasing'
      ELSE 'Stable'
    END
  FROM convex_alert_analytics caa
  WHERE caa.framework_id = p_framework_id
    AND caa.workspace_id = p_workspace_id
    AND caa.date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY caa.date
  ORDER BY caa.date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT LOGGING
-- Purpose: Track all analytics table changes
-- ============================================================================

DROP TRIGGER IF EXISTS alert_analytics_audit ON convex_alert_analytics;
CREATE TRIGGER alert_analytics_audit AFTER INSERT OR UPDATE OR DELETE ON convex_alert_analytics
  FOR EACH ROW EXECUTE FUNCTION log_convex_change();

DROP TRIGGER IF EXISTS alert_patterns_audit ON convex_alert_patterns;
CREATE TRIGGER alert_patterns_audit AFTER INSERT OR UPDATE OR DELETE ON convex_alert_patterns
  FOR EACH ROW EXECUTE FUNCTION log_convex_change();

DROP TRIGGER IF EXISTS alert_predictions_audit ON convex_alert_predictions;
CREATE TRIGGER alert_predictions_audit AFTER INSERT OR UPDATE OR DELETE ON convex_alert_predictions
  FOR EACH ROW EXECUTE FUNCTION log_convex_change();

-- ============================================================================
-- MIGRATION VERIFICATION
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
      'convex_alert_analytics',
      'convex_alert_patterns',
      'convex_alert_predictions',
      'convex_notification_preferences'
    )
  ) THEN
    RAISE NOTICE 'Migration 274: Alert analytics tables created successfully';
  ELSE
    RAISE WARNING 'Migration 274: Some tables may have failed to create';
  END IF;
END $$;

-- End of Migration 274
