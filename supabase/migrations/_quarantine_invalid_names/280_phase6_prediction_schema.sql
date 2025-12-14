/**
 * Phase 6 Week 3 - Predictive Analytics & Scoring Schema Migration
 * Creates tables for predictions, lead scoring, and accuracy tracking
 */

-- ============================================================================
-- TABLE: alert_predictions
-- PURPOSE: Store lead conversion and churn predictions
-- ============================================================================

CREATE TABLE IF NOT EXISTS alert_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Prediction Info
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  lead_id VARCHAR(255) NOT NULL,
  prediction_type VARCHAR(50) NOT NULL,

  -- Probability Scores
  conversion_probability DECIMAL(3, 2) NOT NULL DEFAULT 0,
  churn_risk DECIMAL(3, 2) NOT NULL DEFAULT 0,
  lead_score INTEGER NOT NULL DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),

  -- Confidence
  confidence DECIMAL(3, 2) NOT NULL DEFAULT 0,
  confidence_lower DECIMAL(3, 2),
  confidence_upper DECIMAL(3, 2),

  -- Recommendations
  recommended_actions TEXT[] DEFAULT ARRAY[]::TEXT[],
  risk_factors TEXT[] DEFAULT ARRAY[]::TEXT[],
  opportunity_factors TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Timeline
  timeline_weeks INTEGER,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_probabilities CHECK (
    conversion_probability >= 0 AND conversion_probability <= 1 AND
    churn_risk >= 0 AND churn_risk <= 1 AND
    confidence >= 0 AND confidence <= 1
  )
);

CREATE INDEX IF NOT EXISTS idx_predictions_workspace
  ON alert_predictions(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_lead
  ON alert_predictions(lead_id);
CREATE INDEX IF NOT EXISTS idx_predictions_score
  ON alert_predictions(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_type
  ON alert_predictions(prediction_type);

-- ============================================================================
-- TABLE: lead_scores
-- PURPOSE: Store multi-factor lead scores with breakdown
-- ============================================================================

CREATE TABLE IF NOT EXISTS lead_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Scoring Info
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  contact_id VARCHAR(255) NOT NULL,

  -- Score Components
  total_score INTEGER NOT NULL DEFAULT 0 CHECK (total_score >= 0 AND total_score <= 100),
  engagement_score INTEGER DEFAULT 0,
  firmographic_score INTEGER DEFAULT 0,
  demographic_score INTEGER DEFAULT 0,
  behavioral_score INTEGER DEFAULT 0,
  temporal_score INTEGER DEFAULT 0,

  -- Tier & Trend
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('hot', 'warm', 'lukewarm', 'cold')),
  trend VARCHAR(50) CHECK (trend IN ('increasing', 'stable', 'decreasing')),

  -- Accuracy Tracking
  historical_accuracy DECIMAL(3, 2),
  model_confidence DECIMAL(3, 2),

  -- Review Schedule
  next_review_date DATE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_scores CHECK (
    engagement_score >= 0 AND engagement_score <= 100 AND
    firmographic_score >= 0 AND firmographic_score <= 100 AND
    demographic_score >= 0 AND demographic_score <= 100 AND
    behavioral_score >= 0 AND behavioral_score <= 100 AND
    temporal_score >= 0 AND temporal_score <= 100
  )
);

CREATE INDEX IF NOT EXISTS idx_lead_scores_workspace
  ON lead_scores(workspace_id, total_score DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scores_contact
  ON lead_scores(contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_scores_tier
  ON lead_scores(tier);
CREATE INDEX IF NOT EXISTS idx_lead_scores_review
  ON lead_scores(next_review_date);

-- ============================================================================
-- TABLE: prediction_feedback
-- PURPOSE: Store actual outcomes against predictions for accuracy tracking
-- ============================================================================

CREATE TABLE IF NOT EXISTS prediction_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Prediction Reference
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  prediction_id UUID REFERENCES alert_predictions(id) ON DELETE SET NULL,
  lead_id VARCHAR(255) NOT NULL,

  -- Actual Outcome
  predicted_conversion DECIMAL(3, 2),
  actual_converted BOOLEAN,
  prediction_correct BOOLEAN,

  -- Score Calibration
  predicted_score INTEGER,
  actual_outcome_score INTEGER,
  calibration_error DECIMAL(3, 2),

  -- Timeline Accuracy
  predicted_timeline_weeks INTEGER,
  actual_conversion_weeks INTEGER,

  -- Feedback
  notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_workspace
  ON prediction_feedback(workspace_id);
CREATE INDEX IF NOT EXISTS idx_feedback_prediction
  ON prediction_feedback(prediction_id);
CREATE INDEX IF NOT EXISTS idx_feedback_correct
  ON prediction_feedback(prediction_correct);

-- ============================================================================
-- TABLE: prediction_accuracy_metrics
-- PURPOSE: Track model accuracy and performance over time
-- ============================================================================

CREATE TABLE IF NOT EXISTS prediction_accuracy_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Workspace & Model
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  model_type VARCHAR(100) NOT NULL CHECK (
    model_type IN ('conversion', 'churn', 'lead_scoring')
  ),
  metric_period VARCHAR(50) NOT NULL CHECK (
    metric_period IN ('daily', 'weekly', 'monthly')
  ),

  -- Period
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,

  -- Performance Metrics
  accuracy DECIMAL(3, 2),
  precision DECIMAL(3, 2),
  recall DECIMAL(3, 2),
  f1_score DECIMAL(3, 2),
  auc_score DECIMAL(3, 2),

  -- Sample Size
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,

  -- Calibration
  expected_vs_actual_error DECIMAL(3, 2),
  confidence_calibration DECIMAL(3, 2),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_metrics CHECK (
    (accuracy IS NULL OR (accuracy >= 0 AND accuracy <= 1)) AND
    (precision IS NULL OR (precision >= 0 AND precision <= 1)) AND
    (recall IS NULL OR (recall >= 0 AND recall <= 1)) AND
    (f1_score IS NULL OR (f1_score >= 0 AND f1_score <= 1)) AND
    (auc_score IS NULL OR (auc_score >= 0 AND auc_score <= 1))
  )
);

CREATE INDEX IF NOT EXISTS idx_accuracy_workspace
  ON prediction_accuracy_metrics(workspace_id, period_end_date DESC);
CREATE INDEX IF NOT EXISTS idx_accuracy_model
  ON prediction_accuracy_metrics(model_type);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE alert_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_accuracy_metrics ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- alert_predictions policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'alert_predictions' AND policyname = 'select_predictions'
  ) THEN
    CREATE POLICY select_predictions ON alert_predictions
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'alert_predictions' AND policyname = 'insert_predictions'
  ) THEN
    CREATE POLICY insert_predictions ON alert_predictions
      FOR INSERT WITH CHECK (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- lead_scores policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lead_scores' AND policyname = 'select_scores'
  ) THEN
    CREATE POLICY select_scores ON lead_scores
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lead_scores' AND policyname = 'insert_scores'
  ) THEN
    CREATE POLICY insert_scores ON lead_scores
      FOR INSERT WITH CHECK (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'lead_scores' AND policyname = 'update_scores'
  ) THEN
    CREATE POLICY update_scores ON lead_scores
      FOR UPDATE USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- prediction_feedback policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'prediction_feedback' AND policyname = 'select_feedback'
  ) THEN
    CREATE POLICY select_feedback ON prediction_feedback
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'prediction_feedback' AND policyname = 'insert_feedback'
  ) THEN
    CREATE POLICY insert_feedback ON prediction_feedback
      FOR INSERT WITH CHECK (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- prediction_accuracy_metrics policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'prediction_accuracy_metrics' AND policyname = 'select_metrics'
  ) THEN
    CREATE POLICY select_metrics ON prediction_accuracy_metrics
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'prediction_accuracy_metrics' AND policyname = 'insert_metrics'
  ) THEN
    CREATE POLICY insert_metrics ON prediction_accuracy_metrics
      FOR INSERT WITH CHECK (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON alert_predictions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON lead_scores TO authenticated;
GRANT SELECT, INSERT ON prediction_feedback TO authenticated;
GRANT SELECT, INSERT ON prediction_accuracy_metrics TO authenticated;

COMMENT ON TABLE alert_predictions
  IS 'Phase 6 Week 3 - Lead conversion and churn predictions with confidence intervals';
COMMENT ON TABLE lead_scores
  IS 'Phase 6 Week 3 - Multi-factor lead scores with component breakdown';
COMMENT ON TABLE prediction_feedback
  IS 'Phase 6 Week 3 - Actual outcomes for prediction model training and validation';
COMMENT ON TABLE prediction_accuracy_metrics
  IS 'Phase 6 Week 3 - Model accuracy tracking and performance metrics';
