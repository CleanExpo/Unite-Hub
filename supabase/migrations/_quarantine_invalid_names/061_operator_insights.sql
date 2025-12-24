-- Phase 10 Week 5-6: Operator Insights Tables
-- Human feedback intelligence layer for reviewer scoring, accuracy tracking, and bias detection

-- Reviewer Scores Table - Aggregate performance metrics
CREATE TABLE IF NOT EXISTS reviewer_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,

  -- Core metrics (0-100 scale)
  accuracy_score DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  speed_score DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  consistency_score DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  impact_score DECIMAL(5,2) NOT NULL DEFAULT 50.00,

  -- Composite reliability score
  reliability_score DECIMAL(5,2) NOT NULL DEFAULT 50.00,

  -- Review statistics
  total_reviews INTEGER NOT NULL DEFAULT 0,
  correct_decisions INTEGER NOT NULL DEFAULT 0,
  overturned_decisions INTEGER NOT NULL DEFAULT 0,
  avg_review_time_seconds INTEGER,

  -- Decay-weighted metrics (recent reviews weighted higher)
  weighted_accuracy DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  last_review_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(operator_id, organization_id)
);

-- Accuracy History Table - Track decision outcomes over time
CREATE TABLE IF NOT EXISTS accuracy_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,

  -- Decision context
  queue_item_id UUID,
  proposal_id UUID,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVE', 'REJECT', 'DEFER')),
  decision_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Outcome tracking
  outcome TEXT CHECK (outcome IN ('CORRECT', 'OVERTURNED', 'PENDING', 'INCONCLUSIVE')),
  outcome_at TIMESTAMPTZ,
  outcome_reason TEXT,

  -- Performance metrics
  review_time_seconds INTEGER,
  confidence_level DECIMAL(3,2), -- 0.00 to 1.00

  -- Weight for decay calculation
  decay_weight DECIMAL(5,4) NOT NULL DEFAULT 1.0000,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bias Signals Table - Track potential reviewer biases
CREATE TABLE IF NOT EXISTS bias_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,

  -- Bias classification
  bias_type TEXT NOT NULL CHECK (bias_type IN (
    'DOMAIN_PREFERENCE',      -- Over-approving specific domains
    'DOMAIN_AVERSION',        -- Over-rejecting specific domains
    'APPROVAL_BIAS',          -- Approves too often overall
    'REJECTION_BIAS',         -- Rejects too often overall
    'SPEED_BIAS',             -- Rushing through reviews
    'AUTHORITY_DEFERENCE',    -- Always follows senior votes
    'INCONSISTENT_WEIGHTING', -- Varies criteria application
    'TIME_OF_DAY_BIAS',       -- Different behavior at certain times
    'WORKLOAD_BIAS'           -- Quality drops with volume
  )),

  -- Severity and confidence
  severity TEXT NOT NULL DEFAULT 'LOW' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  confidence DECIMAL(3,2) NOT NULL, -- 0.00 to 1.00

  -- Evidence
  evidence JSONB NOT NULL DEFAULT '{}',
  affected_domains TEXT[], -- Which domains are affected
  sample_decisions UUID[], -- Example decision IDs

  -- Status
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED')),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id),
  resolution TEXT,

  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feedback Events Table - Record all feedback interactions
CREATE TABLE IF NOT EXISTS feedback_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Event context
  event_type TEXT NOT NULL CHECK (event_type IN (
    'REVIEW_SUBMITTED',
    'DECISION_OVERTURNED',
    'OUTCOME_RECORDED',
    'BIAS_DETECTED',
    'BIAS_RESOLVED',
    'SCORE_UPDATED',
    'CALIBRATION_COMPLETE',
    'FEEDBACK_PROVIDED',
    'RECOMMENDATION_GENERATED'
  )),

  -- Actor and target
  actor_id UUID REFERENCES auth.users(id),
  target_operator_id UUID REFERENCES auth.users(id),

  -- Related entities
  queue_item_id UUID,
  proposal_id UUID,
  bias_signal_id UUID REFERENCES bias_signals(id),

  -- Event data
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Impact on scores
  score_delta JSONB, -- { "accuracy": -2.5, "consistency": 1.0 }

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Autonomy Tuning Table - Track how feedback affects autonomy levels
CREATE TABLE IF NOT EXISTS autonomy_tuning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,

  -- Tuning context
  domain TEXT NOT NULL,
  previous_level TEXT NOT NULL,
  new_level TEXT NOT NULL,

  -- Reasoning
  reason TEXT NOT NULL,
  triggering_events UUID[], -- feedback_events that triggered this

  -- Confidence in recommendation
  confidence DECIMAL(3,2) NOT NULL,

  -- Status
  status TEXT NOT NULL DEFAULT 'RECOMMENDED' CHECK (status IN ('RECOMMENDED', 'APPLIED', 'REJECTED')),
  applied_at TIMESTAMPTZ,
  applied_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviewer_scores_operator ON reviewer_scores(operator_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_scores_org ON reviewer_scores(organization_id);
CREATE INDEX IF NOT EXISTS idx_reviewer_scores_reliability ON reviewer_scores(reliability_score DESC);

CREATE INDEX IF NOT EXISTS idx_accuracy_history_operator ON accuracy_history(operator_id);
CREATE INDEX IF NOT EXISTS idx_accuracy_history_org ON accuracy_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_accuracy_history_decision_at ON accuracy_history(decision_at DESC);
CREATE INDEX IF NOT EXISTS idx_accuracy_history_outcome ON accuracy_history(outcome);

CREATE INDEX IF NOT EXISTS idx_bias_signals_operator ON bias_signals(operator_id);
CREATE INDEX IF NOT EXISTS idx_bias_signals_org ON bias_signals(organization_id);
CREATE INDEX IF NOT EXISTS idx_bias_signals_type ON bias_signals(bias_type);
CREATE INDEX IF NOT EXISTS idx_bias_signals_status ON bias_signals(status);
CREATE INDEX IF NOT EXISTS idx_bias_signals_severity ON bias_signals(severity);

CREATE INDEX IF NOT EXISTS idx_feedback_events_org ON feedback_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_feedback_events_type ON feedback_events(event_type);
CREATE INDEX IF NOT EXISTS idx_feedback_events_actor ON feedback_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_feedback_events_target ON feedback_events(target_operator_id);
CREATE INDEX IF NOT EXISTS idx_feedback_events_created ON feedback_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_autonomy_tuning_org ON autonomy_tuning(organization_id);
CREATE INDEX IF NOT EXISTS idx_autonomy_tuning_domain ON autonomy_tuning(domain);
CREATE INDEX IF NOT EXISTS idx_autonomy_tuning_status ON autonomy_tuning(status);

-- RLS Policies
ALTER TABLE reviewer_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE accuracy_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE bias_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE autonomy_tuning ENABLE ROW LEVEL SECURITY;

-- Reviewer scores: operators see own, managers see all in org
CREATE POLICY reviewer_scores_select ON reviewer_scores
  FOR SELECT USING (
    operator_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    )
  );

CREATE POLICY reviewer_scores_insert ON reviewer_scores
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    )
  );

CREATE POLICY reviewer_scores_update ON reviewer_scores
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    )
  );

-- Accuracy history: operators see own
CREATE POLICY accuracy_history_select ON accuracy_history
  FOR SELECT USING (
    operator_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    )
  );

CREATE POLICY accuracy_history_insert ON accuracy_history
  FOR INSERT WITH CHECK (true);

-- Bias signals: managers can see all in org
CREATE POLICY bias_signals_select ON bias_signals
  FOR SELECT USING (
    operator_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    )
  );

CREATE POLICY bias_signals_insert ON bias_signals
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    )
  );

CREATE POLICY bias_signals_update ON bias_signals
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    )
  );

-- Feedback events: org members can read
CREATE POLICY feedback_events_select ON feedback_events
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY feedback_events_insert ON feedback_events
  FOR INSERT WITH CHECK (true);

-- Autonomy tuning: managers and owners
CREATE POLICY autonomy_tuning_select ON autonomy_tuning
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY autonomy_tuning_insert ON autonomy_tuning
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    )
  );

CREATE POLICY autonomy_tuning_update ON autonomy_tuning
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM operator_profiles
      WHERE user_id = auth.uid() AND role IN ('OWNER', 'MANAGER')
    )
  );

-- Function to update reviewer scores with decay
CREATE OR REPLACE FUNCTION update_reviewer_score_with_decay(
  p_operator_id UUID,
  p_organization_id UUID
) RETURNS void AS $$
DECLARE
  v_decay_factor DECIMAL := 0.95; -- 5% decay per day
  v_accuracy DECIMAL;
  v_weighted_accuracy DECIMAL;
  v_total_reviews INTEGER;
  v_correct INTEGER;
  v_overturned INTEGER;
BEGIN
  -- Calculate decay-weighted accuracy
  WITH weighted_history AS (
    SELECT
      outcome,
      decay_weight * POWER(v_decay_factor, EXTRACT(DAY FROM NOW() - decision_at)) as weight
    FROM accuracy_history
    WHERE operator_id = p_operator_id
      AND organization_id = p_organization_id
      AND outcome IS NOT NULL
  )
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE outcome = 'CORRECT'),
    COUNT(*) FILTER (WHERE outcome = 'OVERTURNED'),
    COALESCE(SUM(weight) FILTER (WHERE outcome = 'CORRECT') / NULLIF(SUM(weight), 0) * 100, 50)
  INTO v_total_reviews, v_correct, v_overturned, v_weighted_accuracy
  FROM weighted_history;

  -- Calculate raw accuracy
  v_accuracy := CASE
    WHEN v_total_reviews > 0 THEN (v_correct::DECIMAL / v_total_reviews) * 100
    ELSE 50
  END;

  -- Update or insert score
  INSERT INTO reviewer_scores (
    operator_id, organization_id, accuracy_score, weighted_accuracy,
    total_reviews, correct_decisions, overturned_decisions, last_review_at
  )
  VALUES (
    p_operator_id, p_organization_id, v_accuracy, v_weighted_accuracy,
    v_total_reviews, v_correct, v_overturned, NOW()
  )
  ON CONFLICT (operator_id, organization_id) DO UPDATE SET
    accuracy_score = v_accuracy,
    weighted_accuracy = v_weighted_accuracy,
    total_reviews = v_total_reviews,
    correct_decisions = v_correct,
    overturned_decisions = v_overturned,
    last_review_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
