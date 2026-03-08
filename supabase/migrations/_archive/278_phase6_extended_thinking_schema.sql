/**
 * Phase 6 - Extended Thinking Schema Migration
 * Creates tables for Extended Thinking operations, cost tracking, and ML preparation
 *
 * Tables:
 * 1. extended_thinking_operations - Tracks all thinking operations with cost data
 * 2. thinking_operation_feedback - User feedback on thinking results
 * 3. thinking_cost_summary - Daily/monthly cost aggregations
 * 4. thinking_prompts_used - Analytics on prompt template usage
 */

-- ============================================================================
-- TABLE: extended_thinking_operations
-- PURPOSE: Track all Extended Thinking API calls with full cost and performance data
-- ============================================================================

CREATE TABLE IF NOT EXISTS extended_thinking_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Operational Info
  operation_type VARCHAR(255) NOT NULL,
  complexity_level VARCHAR(50) NOT NULL CHECK (complexity_level IN ('low', 'medium', 'high', 'very_high')),
  agent_name VARCHAR(255),

  -- Input/Output
  input_text TEXT,
  thinking_content TEXT,
  result_content TEXT NOT NULL,

  -- Token Accounting
  input_tokens INTEGER NOT NULL DEFAULT 0,
  thinking_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens INTEGER NOT NULL DEFAULT 0,
  cache_creation_tokens INTEGER NOT NULL DEFAULT 0,

  -- Cost Tracking (in USD)
  thinking_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,

  -- Performance
  duration_ms INTEGER NOT NULL DEFAULT 0,

  -- Relationships
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Metadata
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT valid_tokens CHECK (
    input_tokens >= 0 AND
    thinking_tokens >= 0 AND
    output_tokens >= 0
  ),
  CONSTRAINT valid_cost CHECK (thinking_cost >= 0 AND total_cost >= 0)
);

CREATE INDEX IF NOT EXISTS idx_extended_thinking_workspace
  ON extended_thinking_operations(workspace_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_extended_thinking_user
  ON extended_thinking_operations(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_extended_thinking_operation_type
  ON extended_thinking_operations(operation_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_extended_thinking_complexity
  ON extended_thinking_operations(complexity_level);
CREATE INDEX IF NOT EXISTS idx_extended_thinking_timestamp
  ON extended_thinking_operations(timestamp DESC);

-- ============================================================================
-- TABLE: thinking_operation_feedback
-- PURPOSE: Collect feedback on thinking operation quality and usefulness
-- ============================================================================

CREATE TABLE IF NOT EXISTS thinking_operation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Operation Reference
  operation_id UUID NOT NULL REFERENCES extended_thinking_operations(id) ON DELETE CASCADE,

  -- Feedback
  user_rating INTEGER NOT NULL CHECK (user_rating >= 1 AND user_rating <= 5),
  feedback_text TEXT,
  was_useful BOOLEAN,

  -- Quality Metrics
  accuracy_score DECIMAL(3, 2) CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
  completeness_score DECIMAL(3, 2) CHECK (completeness_score >= 0 AND completeness_score <= 1),
  actionability_score DECIMAL(3, 2) CHECK (actionability_score >= 0 AND actionability_score <= 1),

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- Keep FK reference to auth.users (allowed in migrations)
user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_thinking_feedback_operation
  ON thinking_operation_feedback(operation_id);
CREATE INDEX IF NOT EXISTS idx_thinking_feedback_user
  ON thinking_operation_feedback(user_id);

-- ============================================================================
-- TABLE: thinking_cost_summary
-- PURPOSE: Daily and monthly cost aggregations for budget monitoring
-- ============================================================================

CREATE TABLE IF NOT EXISTS thinking_cost_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Period
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  summary_date DATE NOT NULL,
  summary_period VARCHAR(50) NOT NULL CHECK (summary_period IN ('daily', 'monthly')),

  -- Cost Metrics
  total_operations INTEGER NOT NULL DEFAULT 0,
  total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  average_cost DECIMAL(10, 6),
  max_operation_cost DECIMAL(10, 6),

  -- Token Metrics
  total_thinking_tokens BIGINT NOT NULL DEFAULT 0,
  total_input_tokens BIGINT NOT NULL DEFAULT 0,
  total_output_tokens BIGINT NOT NULL DEFAULT 0,
  total_cache_tokens BIGINT NOT NULL DEFAULT 0,

  -- Performance
  average_duration_ms DECIMAL(10, 2),

  -- Complexity Distribution
  low_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  very_high_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_summary_per_period UNIQUE (workspace_id, summary_date, summary_period)
);

CREATE INDEX IF NOT EXISTS idx_thinking_summary_workspace
  ON thinking_cost_summary(workspace_id, summary_date DESC);
CREATE INDEX IF NOT EXISTS idx_thinking_summary_date
  ON thinking_cost_summary(summary_date DESC);

-- ============================================================================
-- TABLE: thinking_prompts_used
-- PURPOSE: Track which prompt templates are used and their effectiveness
-- ============================================================================

CREATE TABLE IF NOT EXISTS thinking_prompts_used (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Prompt Info
  prompt_name VARCHAR(255) NOT NULL,
  prompt_category VARCHAR(100),
  complexity_level VARCHAR(50),

  -- Usage Metrics
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  usage_count INTEGER NOT NULL DEFAULT 1,
  total_cost DECIMAL(10, 6) NOT NULL DEFAULT 0,
  average_rating DECIMAL(3, 2),

  -- Token Metrics
  average_thinking_tokens INTEGER,
  average_output_tokens INTEGER,
  average_duration_ms INTEGER,

  -- Time Tracking
  first_used TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_prompt_per_workspace UNIQUE (prompt_name, workspace_id)
);

CREATE INDEX IF NOT EXISTS idx_prompts_used_workspace
  ON thinking_prompts_used(workspace_id, usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_used_category
  ON thinking_prompts_used(prompt_category);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE extended_thinking_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE thinking_operation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE thinking_cost_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE thinking_prompts_used ENABLE ROW LEVEL SECURITY;

-- extended_thinking_operations policies
DO $$
BEGIN
  -- Users can only see their own workspace's operations
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'extended_thinking_operations'
    AND policyname = 'select_own_operations'
  ) THEN
    CREATE POLICY select_own_operations ON extended_thinking_operations
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  -- Users can only insert operations for their workspace
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'extended_thinking_operations'
    AND policyname = 'insert_own_operations'
  ) THEN
    CREATE POLICY insert_own_operations ON extended_thinking_operations
      FOR INSERT WITH CHECK (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        ) AND user_id = auth.uid()
      );
  END IF;

  -- Operations cannot be modified after creation
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'extended_thinking_operations'
    AND policyname = 'delete_own_operations'
  ) THEN
    CREATE POLICY delete_own_operations ON extended_thinking_operations
      FOR DELETE USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- thinking_operation_feedback policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'thinking_operation_feedback'
    AND policyname = 'select_operation_feedback'
  ) THEN
    CREATE POLICY select_operation_feedback ON thinking_operation_feedback
      FOR SELECT USING (
        operation_id IN (
          SELECT id FROM extended_thinking_operations
          WHERE workspace_id IN (
            SELECT workspace_id FROM user_organizations
            WHERE user_id = auth.uid()
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'thinking_operation_feedback'
    AND policyname = 'insert_operation_feedback'
  ) THEN
    CREATE POLICY insert_operation_feedback ON thinking_operation_feedback
      FOR INSERT WITH CHECK (
        operation_id IN (
          SELECT id FROM extended_thinking_operations
          WHERE workspace_id IN (
            SELECT workspace_id FROM user_organizations
            WHERE user_id = auth.uid()
          )
        ) AND user_id = auth.uid()
      );
  END IF;
END $$;

-- thinking_cost_summary policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'thinking_cost_summary'
    AND policyname = 'select_cost_summary'
  ) THEN
    CREATE POLICY select_cost_summary ON thinking_cost_summary
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'thinking_cost_summary'
    AND policyname = 'insert_cost_summary'
  ) THEN
    CREATE POLICY insert_cost_summary ON thinking_cost_summary
      FOR INSERT WITH CHECK (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- thinking_prompts_used policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'thinking_prompts_used'
    AND policyname = 'select_prompts_used'
  ) THEN
    CREATE POLICY select_prompts_used ON thinking_prompts_used
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'thinking_prompts_used'
    AND policyname = 'insert_prompts_used'
  ) THEN
    CREATE POLICY insert_prompts_used ON thinking_prompts_used
      FOR INSERT WITH CHECK (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'thinking_prompts_used'
    AND policyname = 'update_prompts_used'
  ) THEN
    CREATE POLICY update_prompts_used ON thinking_prompts_used
      FOR UPDATE USING (
        workspace_id IN (
          SELECT workspace_id FROM user_organizations
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ============================================================================
-- AUDIT TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_thinking_operations()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      workspace_id,
      action,
      table_name,
      record_id,
      user_id,
      details,
      created_at
    ) VALUES (
      NEW.workspace_id,
      'INSERT',
      'extended_thinking_operations',
      NEW.id::TEXT,
      NEW.user_id,
      jsonb_build_object(
        'operation_type', NEW.operation_type,
        'total_cost', NEW.total_cost,
        'thinking_tokens', NEW.thinking_tokens
      ),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER thinking_operations_audit
AFTER INSERT ON extended_thinking_operations
FOR EACH ROW
EXECUTE FUNCTION audit_thinking_operations();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, DELETE ON extended_thinking_operations TO authenticated;
GRANT SELECT, INSERT, DELETE ON thinking_operation_feedback TO authenticated;
GRANT SELECT, INSERT ON thinking_cost_summary TO authenticated;
GRANT SELECT, INSERT, UPDATE ON thinking_prompts_used TO authenticated;

COMMENT ON TABLE extended_thinking_operations
  IS 'Phase 6 - Extended Thinking operations with full cost and performance tracking';
COMMENT ON TABLE thinking_operation_feedback
  IS 'Phase 6 - User feedback on thinking operation quality';
COMMENT ON TABLE thinking_cost_summary
  IS 'Phase 6 - Daily/monthly cost aggregations for budget monitoring';
COMMENT ON TABLE thinking_prompts_used
  IS 'Phase 6 - Analytics on prompt template usage and effectiveness';
