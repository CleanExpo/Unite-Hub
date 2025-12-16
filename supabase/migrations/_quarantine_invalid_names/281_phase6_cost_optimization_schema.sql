/**
 * Phase 6 Week 4 - Cost Optimization & Monitoring Schema Migration
 * Creates tables for cost tracking, budget management, and usage analytics
 */

-- ============================================================================
-- TABLE: ai_cost_tracking
-- PURPOSE: Track individual operations and their costs
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_cost_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  operation_type VARCHAR(100) NOT NULL, -- 'extended_thinking', 'prediction', 'pattern_detection', etc.
  operation_id VARCHAR(255) NOT NULL,

  -- Token Counts
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  thinking_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER GENERATED ALWAYS AS (input_tokens + output_tokens + thinking_tokens) STORED,

  -- Cost Breakdown
  cost_usd DECIMAL(10, 8) NOT NULL DEFAULT 0,
  cost_breakdown JSONB, -- {input_cost, output_cost, thinking_cost}

  -- Date Tracking
  date DATE NOT NULL, -- YYYY-MM-DD for aggregation
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_tokens CHECK (
    input_tokens >= 0 AND output_tokens >= 0 AND thinking_tokens >= 0
  ),
  CONSTRAINT valid_cost CHECK (cost_usd >= 0)
);

CREATE INDEX IF NOT EXISTS idx_cost_tracking_workspace
  ON ai_cost_tracking(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_date
  ON ai_cost_tracking(workspace_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_cost_tracking_operation
  ON ai_cost_tracking(operation_type, date DESC);

-- ============================================================================
-- TABLE: ai_budget_allocations
-- PURPOSE: Store budget limits and allocation by workspace
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_budget_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Workspace Reference
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Budget Settings
  monthly_budget_usd DECIMAL(12, 2) NOT NULL DEFAULT 500.00,
  tier_type VARCHAR(50) CHECK (tier_type IN ('startup', 'growth', 'enterprise', 'unlimited')),

  -- Operation Limits
  operation_limits JSONB, -- {extended_thinking, prediction, pattern_detection, other}

  -- Metadata
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_budget CHECK (monthly_budget_usd > 0),
  UNIQUE(workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_budget_allocations_workspace
  ON ai_budget_allocations(workspace_id);

-- ============================================================================
-- TABLE: ai_cost_summaries
-- PURPOSE: Daily cost aggregations for performance
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_cost_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  date DATE NOT NULL,

  -- Aggregated Totals
  total_operations INTEGER DEFAULT 0,
  total_input_tokens BIGINT DEFAULT 0,
  total_output_tokens BIGINT DEFAULT 0,
  total_thinking_tokens BIGINT DEFAULT 0,
  total_cost_usd DECIMAL(12, 8) DEFAULT 0,

  -- By Operation Type Breakdown
  by_operation_type JSONB, -- {extended_thinking: {count, cost, tokens}, ...}

  -- Metrics
  daily_average_cost DECIMAL(12, 8) DEFAULT 0,
  projected_monthly_cost DECIMAL(12, 2) DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_aggregates CHECK (
    total_operations >= 0 AND
    total_input_tokens >= 0 AND
    total_output_tokens >= 0 AND
    total_thinking_tokens >= 0 AND
    total_cost_usd >= 0
  ),
  UNIQUE(workspace_id, date)
);

CREATE INDEX IF NOT EXISTS idx_cost_summaries_workspace
  ON ai_cost_summaries(workspace_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_cost_summaries_date
  ON ai_cost_summaries(date DESC);

-- ============================================================================
-- TABLE: ai_budget_alerts
-- PURPOSE: Track budget threshold alerts and notifications
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Alert Details
  alert_type VARCHAR(50) NOT NULL CHECK (
    alert_type IN ('warning_80', 'warning_90', 'critical_100')
  ),
  current_spend_usd DECIMAL(12, 8) NOT NULL,
  budget_limit_usd DECIMAL(12, 2) NOT NULL,
  percentage_used DECIMAL(5, 2) NOT NULL CHECK (percentage_used >= 0 AND percentage_used <= 100),
  days_remaining_in_month INTEGER,
  projected_overage_usd DECIMAL(12, 8) DEFAULT 0,

  -- Status
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by VARCHAR(255),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_budget_alerts_workspace
  ON ai_budget_alerts(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_type
  ON ai_budget_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_acknowledged
  ON ai_budget_alerts(acknowledged);

-- ============================================================================
-- TABLE: ai_cost_optimization_recommendations
-- PURPOSE: Store cost optimization suggestions for workspaces
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_cost_optimization_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Recommendation Details
  recommendation_type VARCHAR(100) NOT NULL, -- 'reduce_thinking', 'batch_operations', 'increase_budget', etc.
  recommendation_text TEXT NOT NULL,
  priority VARCHAR(50) CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  estimated_savings_usd DECIMAL(12, 8),

  -- Status
  actioned BOOLEAN DEFAULT FALSE,
  actioned_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_recommendations_workspace
  ON ai_cost_optimization_recommendations(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority
  ON ai_cost_optimization_recommendations(priority);
CREATE INDEX IF NOT EXISTS idx_recommendations_actioned
  ON ai_cost_optimization_recommendations(actioned);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE ai_cost_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_budget_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cost_optimization_recommendations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- ai_cost_tracking policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_cost_tracking' AND policyname = 'select_cost_tracking'
  ) THEN
    CREATE POLICY select_cost_tracking ON ai_cost_tracking
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_cost_tracking' AND policyname = 'insert_cost_tracking'
  ) THEN
    CREATE POLICY insert_cost_tracking ON ai_cost_tracking
      FOR INSERT WITH CHECK (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- ai_budget_allocations policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_budget_allocations' AND policyname = 'select_budget_allocations'
  ) THEN
    CREATE POLICY select_budget_allocations ON ai_budget_allocations
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_budget_allocations' AND policyname = 'update_budget_allocations'
  ) THEN
    CREATE POLICY update_budget_allocations ON ai_budget_allocations
      FOR UPDATE USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid() AND role = 'owner'
        )
      );
  END IF;

  -- ai_cost_summaries policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_cost_summaries' AND policyname = 'select_cost_summaries'
  ) THEN
    CREATE POLICY select_cost_summaries ON ai_cost_summaries
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_cost_summaries' AND policyname = 'insert_cost_summaries'
  ) THEN
    CREATE POLICY insert_cost_summaries ON ai_cost_summaries
      FOR INSERT WITH CHECK (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- ai_budget_alerts policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_budget_alerts' AND policyname = 'select_budget_alerts'
  ) THEN
    CREATE POLICY select_budget_alerts ON ai_budget_alerts
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_budget_alerts' AND policyname = 'insert_budget_alerts'
  ) THEN
    CREATE POLICY insert_budget_alerts ON ai_budget_alerts
      FOR INSERT WITH CHECK (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_budget_alerts' AND policyname = 'update_budget_alerts'
  ) THEN
    CREATE POLICY update_budget_alerts ON ai_budget_alerts
      FOR UPDATE USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- ai_cost_optimization_recommendations policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_cost_optimization_recommendations' AND policyname = 'select_recommendations'
  ) THEN
    CREATE POLICY select_recommendations ON ai_cost_optimization_recommendations
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_cost_optimization_recommendations' AND policyname = 'insert_recommendations'
  ) THEN
    CREATE POLICY insert_recommendations ON ai_cost_optimization_recommendations
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

GRANT SELECT, INSERT, UPDATE ON ai_cost_tracking TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_budget_allocations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_cost_summaries TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_budget_alerts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_cost_optimization_recommendations TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE ai_cost_tracking
  IS 'Phase 6 Week 4 - Individual operation cost tracking';
COMMENT ON TABLE ai_budget_allocations
  IS 'Phase 6 Week 4 - Workspace budget limits and allocations';
COMMENT ON TABLE ai_cost_summaries
  IS 'Phase 6 Week 4 - Daily cost aggregations for reporting';
COMMENT ON TABLE ai_budget_alerts
  IS 'Phase 6 Week 4 - Budget threshold alerts and notifications';
COMMENT ON TABLE ai_cost_optimization_recommendations
  IS 'Phase 6 Week 4 - Cost optimization suggestions';
