-- Migration: 275_founder_cognitive_twin_core.sql
-- Description: Create tables for Founder Cognitive Twin / Deep Memory Engine
-- Created: 2025-11-28

-- ============================================================================
-- FOUNDER MEMORY SNAPSHOTS
-- Aggregated signals from all data sources into periodic snapshots
-- ============================================================================
CREATE TABLE IF NOT EXISTS founder_memory_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_range_start TIMESTAMPTZ NOT NULL,
  time_range_end TIMESTAMPTZ NOT NULL,
  summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Summary includes: total_clients, total_pre_clients, active_campaigns,
  -- total_emails_processed, key_themes, sentiment_overview, etc.
  data_sources_included TEXT[] DEFAULT '{}',
  confidence_score DECIMAL(3,2) DEFAULT 0.80,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founder_memory_snapshots_founder_time
  ON founder_memory_snapshots(founder_id, snapshot_at DESC);
CREATE INDEX IF NOT EXISTS idx_founder_memory_snapshots_workspace
  ON founder_memory_snapshots(workspace_id, snapshot_at DESC);

-- ============================================================================
-- FOUNDER FOCUS AREAS
-- Dynamic priority areas requiring founder attention
-- ============================================================================
CREATE TABLE IF NOT EXISTS founder_focus_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- marketing, sales, delivery, product, clients, engineering, finance, operations
  priority_score DECIMAL(5,2) NOT NULL DEFAULT 50.00, -- 0-100
  confidence DECIMAL(3,2) DEFAULT 0.70,
  reason TEXT,
  evidence_json JSONB DEFAULT '{}'::jsonb,
  last_evaluated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founder_focus_areas_founder_priority
  ON founder_focus_areas(founder_id, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_founder_focus_areas_category
  ON founder_focus_areas(founder_id, category);

-- ============================================================================
-- CROSS-CLIENT PATTERNS
-- Recurring themes and patterns detected across multiple clients
-- ============================================================================
CREATE TABLE IF NOT EXISTS cross_client_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  pattern_type VARCHAR(100) NOT NULL, -- communication, project, opportunity, risk, behavior, sentiment, timing
  title VARCHAR(500) NOT NULL,
  description TEXT,
  evidence_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Evidence: array of { client_id, pre_client_id, source_type, source_id, snippet, timestamp }
  affected_client_ids UUID[] DEFAULT '{}',
  affected_pre_client_ids UUID[] DEFAULT '{}',
  strength_score DECIMAL(3,2) NOT NULL DEFAULT 0.50, -- 0-1
  recurrence_count INTEGER DEFAULT 1,
  first_detected_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'active', -- active, resolved, dismissed, archived
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cross_client_patterns_founder_type
  ON cross_client_patterns(founder_id, pattern_type);
CREATE INDEX IF NOT EXISTS idx_cross_client_patterns_strength
  ON cross_client_patterns(founder_id, strength_score DESC);
CREATE INDEX IF NOT EXISTS idx_cross_client_patterns_last_seen
  ON cross_client_patterns(founder_id, last_seen_at DESC);

-- ============================================================================
-- FOUNDER OPPORTUNITY BACKLOG
-- Consolidated opportunities from all sources
-- ============================================================================
CREATE TABLE IF NOT EXISTS founder_opportunity_backlog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  related_client_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  related_pre_client_id UUID REFERENCES pre_clients(id) ON DELETE SET NULL,
  source_type VARCHAR(100) NOT NULL, -- email_idea, pre_client_insight, social_mention, ad_signal, search_trend, manual
  source_id UUID, -- Reference to the original source record
  title VARCHAR(500) NOT NULL,
  description TEXT,
  estimated_value_score DECIMAL(5,2) DEFAULT 50.00, -- 0-100
  effort_score DECIMAL(5,2) DEFAULT 50.00, -- 0-100 (lower = easier)
  time_horizon_weeks INTEGER DEFAULT 4,
  category VARCHAR(100), -- new_client, upsell, partnership, market_expansion, product, process
  tags TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'open', -- open, evaluating, accepted, rejected, completed, deferred
  priority_rank INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founder_opportunity_backlog_founder_status
  ON founder_opportunity_backlog(founder_id, status);
CREATE INDEX IF NOT EXISTS idx_founder_opportunity_backlog_value
  ON founder_opportunity_backlog(founder_id, estimated_value_score DESC);
CREATE INDEX IF NOT EXISTS idx_founder_opportunity_backlog_source
  ON founder_opportunity_backlog(source_type, source_id);

-- ============================================================================
-- FOUNDER RISK REGISTER
-- Detected risks from various signals
-- ============================================================================
CREATE TABLE IF NOT EXISTS founder_risk_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  related_client_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  related_pre_client_id UUID REFERENCES pre_clients(id) ON DELETE SET NULL,
  source_type VARCHAR(100) NOT NULL, -- email_sentiment, missed_followup, campaign_underperformance, client_delay, churn_signal, manual
  source_id UUID,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  likelihood_score DECIMAL(3,2) NOT NULL DEFAULT 0.50, -- 0-1
  impact_score DECIMAL(3,2) NOT NULL DEFAULT 0.50, -- 0-1
  risk_score DECIMAL(3,2) GENERATED ALWAYS AS (likelihood_score * impact_score) STORED,
  category VARCHAR(100), -- client_churn, delivery_delay, revenue, reputation, operational, compliance
  mitigation_status VARCHAR(50) DEFAULT 'identified', -- identified, analyzing, mitigating, accepted, resolved, escalated
  mitigation_plan TEXT,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founder_risk_register_founder_status
  ON founder_risk_register(founder_id, mitigation_status);
CREATE INDEX IF NOT EXISTS idx_founder_risk_register_risk_score
  ON founder_risk_register(founder_id, risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_founder_risk_register_likelihood_impact
  ON founder_risk_register(founder_id, likelihood_score DESC, impact_score DESC);

-- ============================================================================
-- FOUNDER MOMENTUM SCORES
-- Periodic momentum assessment across key business dimensions
-- ============================================================================
CREATE TABLE IF NOT EXISTS founder_momentum_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  -- Domain scores: 0-100
  marketing_score DECIMAL(5,2) DEFAULT 50.00,
  sales_score DECIMAL(5,2) DEFAULT 50.00,
  delivery_score DECIMAL(5,2) DEFAULT 50.00,
  product_score DECIMAL(5,2) DEFAULT 50.00,
  clients_score DECIMAL(5,2) DEFAULT 50.00,
  engineering_score DECIMAL(5,2) DEFAULT 50.00,
  finance_score DECIMAL(5,2) DEFAULT 50.00,
  -- Overall composite
  overall_score DECIMAL(5,2) GENERATED ALWAYS AS (
    (marketing_score + sales_score + delivery_score + product_score +
     clients_score + engineering_score + finance_score) / 7
  ) STORED,
  -- Trend indicators: -1 (declining), 0 (stable), 1 (improving)
  marketing_trend INTEGER DEFAULT 0,
  sales_trend INTEGER DEFAULT 0,
  delivery_trend INTEGER DEFAULT 0,
  product_trend INTEGER DEFAULT 0,
  clients_trend INTEGER DEFAULT 0,
  engineering_trend INTEGER DEFAULT 0,
  finance_trend INTEGER DEFAULT 0,
  -- Supporting data
  notes_json JSONB DEFAULT '{}'::jsonb,
  -- notes_json: { marketing_notes: string, sales_notes: string, ... }
  input_signals_json JSONB DEFAULT '{}'::jsonb,
  -- input_signals: sources and counts used to compute each score
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(founder_id, workspace_id, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_founder_momentum_scores_founder_period
  ON founder_momentum_scores(founder_id, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_founder_momentum_scores_overall
  ON founder_momentum_scores(founder_id, overall_score DESC);

-- ============================================================================
-- FOUNDER DECISION SCENARIOS
-- Shadow Founder decision simulator scenarios and outcomes
-- ============================================================================
CREATE TABLE IF NOT EXISTS founder_decision_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  scenario_type VARCHAR(100) DEFAULT 'strategic', -- strategic, tactical, operational, financial, hiring, product
  -- Input: What strategic move is being considered?
  input_assumptions_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- { action: string, affected_areas: string[], timeframe_weeks: number,
  --   resource_requirements: string, constraints: string[] }
  -- Output: Simulated outcomes
  simulated_outcomes_json JSONB DEFAULT '{}'::jsonb,
  -- { best_case: {...}, expected_case: {...}, worst_case: {...},
  --   affected_momentum: {...}, risks_introduced: [...], opportunities_unlocked: [...],
  --   confidence: number, reasoning: string }
  status VARCHAR(50) DEFAULT 'draft', -- draft, simulated, adopted, rejected, archived
  adopted_at TIMESTAMPTZ,
  adoption_notes TEXT,
  simulation_model_version VARCHAR(50) DEFAULT 'v1.0',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founder_decision_scenarios_founder_status
  ON founder_decision_scenarios(founder_id, status);
CREATE INDEX IF NOT EXISTS idx_founder_decision_scenarios_type
  ON founder_decision_scenarios(founder_id, scenario_type);

-- ============================================================================
-- FOUNDER WEEKLY DIGESTS
-- Structured weekly summary reports
-- ============================================================================
CREATE TABLE IF NOT EXISTS founder_weekly_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  headline_summary TEXT NOT NULL,
  -- Wins
  wins_json JSONB DEFAULT '[]'::jsonb,
  -- [ { title: string, description: string, impact: string, related_to: string } ]
  -- Risks
  risks_json JSONB DEFAULT '[]'::jsonb,
  -- [ { title: string, description: string, severity: string, status: string } ]
  -- Opportunities
  opportunities_json JSONB DEFAULT '[]'::jsonb,
  -- [ { title: string, description: string, value: string, next_step: string } ]
  -- Focus recommendations
  focus_recommendations_json JSONB DEFAULT '[]'::jsonb,
  -- [ { area: string, recommendation: string, priority: number, rationale: string } ]
  -- Additional sections
  momentum_snapshot_json JSONB DEFAULT '{}'::jsonb,
  patterns_detected_json JSONB DEFAULT '[]'::jsonb,
  key_metrics_json JSONB DEFAULT '{}'::jsonb,
  -- Delivery tracking
  delivered_at TIMESTAMPTZ,
  delivery_method VARCHAR(50), -- dashboard, email, both
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(founder_id, workspace_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_founder_weekly_digests_founder_week
  ON founder_weekly_digests(founder_id, week_start DESC);
CREATE INDEX IF NOT EXISTS idx_founder_weekly_digests_workspace
  ON founder_weekly_digests(workspace_id, week_start DESC);

-- ============================================================================
-- FOUNDER NEXT ACTIONS CACHE
-- Cached recommendations for "What should I do next?"
-- ============================================================================
CREATE TABLE IF NOT EXISTS founder_next_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  action_title VARCHAR(500) NOT NULL,
  action_description TEXT,
  category VARCHAR(100) NOT NULL, -- opportunity, risk_mitigation, follow_up, decision, review, communication
  priority_score DECIMAL(5,2) NOT NULL DEFAULT 50.00,
  urgency VARCHAR(50) DEFAULT 'normal', -- low, normal, high, urgent
  related_entity_type VARCHAR(100), -- client, pre_client, campaign, opportunity, risk, pattern
  related_entity_id UUID,
  context_json JSONB DEFAULT '{}'::jsonb,
  -- { why: string, expected_outcome: string, time_estimate: string, dependencies: string[] }
  status VARCHAR(50) DEFAULT 'suggested', -- suggested, accepted, dismissed, completed
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_founder_next_actions_founder_priority
  ON founder_next_actions(founder_id, priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_founder_next_actions_status
  ON founder_next_actions(founder_id, status, expires_at);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE founder_memory_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_focus_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cross_client_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_opportunity_backlog ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_risk_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_momentum_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_decision_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_weekly_digests ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_next_actions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
  -- founder_memory_snapshots
  DROP POLICY IF EXISTS founder_memory_snapshots_owner_policy ON founder_memory_snapshots;
  DROP POLICY IF EXISTS founder_memory_snapshots_workspace_policy ON founder_memory_snapshots;

  -- founder_focus_areas
  DROP POLICY IF EXISTS founder_focus_areas_owner_policy ON founder_focus_areas;
  DROP POLICY IF EXISTS founder_focus_areas_workspace_policy ON founder_focus_areas;

  -- cross_client_patterns
  DROP POLICY IF EXISTS cross_client_patterns_owner_policy ON cross_client_patterns;
  DROP POLICY IF EXISTS cross_client_patterns_workspace_policy ON cross_client_patterns;

  -- founder_opportunity_backlog
  DROP POLICY IF EXISTS founder_opportunity_backlog_owner_policy ON founder_opportunity_backlog;
  DROP POLICY IF EXISTS founder_opportunity_backlog_workspace_policy ON founder_opportunity_backlog;

  -- founder_risk_register
  DROP POLICY IF EXISTS founder_risk_register_owner_policy ON founder_risk_register;
  DROP POLICY IF EXISTS founder_risk_register_workspace_policy ON founder_risk_register;

  -- founder_momentum_scores
  DROP POLICY IF EXISTS founder_momentum_scores_owner_policy ON founder_momentum_scores;
  DROP POLICY IF EXISTS founder_momentum_scores_workspace_policy ON founder_momentum_scores;

  -- founder_decision_scenarios
  DROP POLICY IF EXISTS founder_decision_scenarios_owner_policy ON founder_decision_scenarios;
  DROP POLICY IF EXISTS founder_decision_scenarios_workspace_policy ON founder_decision_scenarios;

  -- founder_weekly_digests
  DROP POLICY IF EXISTS founder_weekly_digests_owner_policy ON founder_weekly_digests;
  DROP POLICY IF EXISTS founder_weekly_digests_workspace_policy ON founder_weekly_digests;

  -- founder_next_actions
  DROP POLICY IF EXISTS founder_next_actions_owner_policy ON founder_next_actions;
  DROP POLICY IF EXISTS founder_next_actions_workspace_policy ON founder_next_actions;
END $$;

-- Create policies: Founder can access their own data
CREATE POLICY founder_memory_snapshots_owner_policy ON founder_memory_snapshots
  FOR ALL USING (founder_id = auth.uid());

CREATE POLICY founder_focus_areas_owner_policy ON founder_focus_areas
  FOR ALL USING (founder_id = auth.uid());

CREATE POLICY cross_client_patterns_owner_policy ON cross_client_patterns
  FOR ALL USING (founder_id = auth.uid());

CREATE POLICY founder_opportunity_backlog_owner_policy ON founder_opportunity_backlog
  FOR ALL USING (founder_id = auth.uid());

CREATE POLICY founder_risk_register_owner_policy ON founder_risk_register
  FOR ALL USING (founder_id = auth.uid());

CREATE POLICY founder_momentum_scores_owner_policy ON founder_momentum_scores
  FOR ALL USING (founder_id = auth.uid());

CREATE POLICY founder_decision_scenarios_owner_policy ON founder_decision_scenarios
  FOR ALL USING (founder_id = auth.uid());

CREATE POLICY founder_weekly_digests_owner_policy ON founder_weekly_digests
  FOR ALL USING (founder_id = auth.uid());

CREATE POLICY founder_next_actions_owner_policy ON founder_next_actions
  FOR ALL USING (founder_id = auth.uid());

-- Workspace member access (for delegated staff with founder role permissions)
-- Join through workspaces -> organizations -> user_organizations
CREATE POLICY founder_memory_snapshots_workspace_policy ON founder_memory_snapshots
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('owner', 'admin')
    )
  );

CREATE POLICY founder_focus_areas_workspace_policy ON founder_focus_areas
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('owner', 'admin')
    )
  );

CREATE POLICY cross_client_patterns_workspace_policy ON cross_client_patterns
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('owner', 'admin')
    )
  );

CREATE POLICY founder_opportunity_backlog_workspace_policy ON founder_opportunity_backlog
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('owner', 'admin')
    )
  );

CREATE POLICY founder_risk_register_workspace_policy ON founder_risk_register
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('owner', 'admin')
    )
  );

CREATE POLICY founder_momentum_scores_workspace_policy ON founder_momentum_scores
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('owner', 'admin')
    )
  );

CREATE POLICY founder_decision_scenarios_workspace_policy ON founder_decision_scenarios
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('owner', 'admin')
    )
  );

CREATE POLICY founder_weekly_digests_workspace_policy ON founder_weekly_digests
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('owner', 'admin')
    )
  );

CREATE POLICY founder_next_actions_workspace_policy ON founder_next_actions
  FOR SELECT USING (
    workspace_id IN (
      SELECT w.id FROM workspaces w
      JOIN user_organizations uo ON uo.org_id = w.org_id
      WHERE uo.user_id = auth.uid() AND uo.role IN ('owner', 'admin')
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get latest momentum scores for a founder
CREATE OR REPLACE FUNCTION get_latest_founder_momentum(p_founder_id UUID, p_workspace_id UUID)
RETURNS TABLE (
  marketing_score DECIMAL,
  sales_score DECIMAL,
  delivery_score DECIMAL,
  product_score DECIMAL,
  clients_score DECIMAL,
  engineering_score DECIMAL,
  finance_score DECIMAL,
  overall_score DECIMAL,
  period_end DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fms.marketing_score,
    fms.sales_score,
    fms.delivery_score,
    fms.product_score,
    fms.clients_score,
    fms.engineering_score,
    fms.finance_score,
    fms.overall_score,
    fms.period_end
  FROM founder_momentum_scores fms
  WHERE fms.founder_id = p_founder_id
    AND fms.workspace_id = p_workspace_id
  ORDER BY fms.period_end DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top risks by risk score
CREATE OR REPLACE FUNCTION get_top_founder_risks(p_founder_id UUID, p_workspace_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  risk_score DECIMAL,
  likelihood_score DECIMAL,
  impact_score DECIMAL,
  mitigation_status VARCHAR,
  category VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    frr.id,
    frr.title,
    frr.risk_score,
    frr.likelihood_score,
    frr.impact_score,
    frr.mitigation_status,
    frr.category
  FROM founder_risk_register frr
  WHERE frr.founder_id = p_founder_id
    AND frr.workspace_id = p_workspace_id
    AND frr.mitigation_status NOT IN ('resolved', 'accepted')
  ORDER BY frr.risk_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top opportunities by value score
CREATE OR REPLACE FUNCTION get_top_founder_opportunities(p_founder_id UUID, p_workspace_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  estimated_value_score DECIMAL,
  effort_score DECIMAL,
  time_horizon_weeks INTEGER,
  status VARCHAR,
  category VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fob.id,
    fob.title,
    fob.estimated_value_score,
    fob.effort_score,
    fob.time_horizon_weeks,
    fob.status,
    fob.category
  FROM founder_opportunity_backlog fob
  WHERE fob.founder_id = p_founder_id
    AND fob.workspace_id = p_workspace_id
    AND fob.status IN ('open', 'evaluating')
  ORDER BY fob.estimated_value_score DESC, fob.effort_score ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- AUDIT LOGGING TRIGGERS
-- ============================================================================

-- Trigger function for audit logging
CREATE OR REPLACE FUNCTION log_founder_memory_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for key tables
DROP TRIGGER IF EXISTS audit_founder_decision_scenarios ON founder_decision_scenarios;
CREATE TRIGGER audit_founder_decision_scenarios
  AFTER INSERT OR UPDATE OR DELETE ON founder_decision_scenarios
  FOR EACH ROW EXECUTE FUNCTION log_founder_memory_changes();

DROP TRIGGER IF EXISTS audit_founder_risk_register ON founder_risk_register;
CREATE TRIGGER audit_founder_risk_register
  AFTER INSERT OR UPDATE OR DELETE ON founder_risk_register
  FOR EACH ROW EXECUTE FUNCTION log_founder_memory_changes();

DROP TRIGGER IF EXISTS audit_founder_opportunity_backlog ON founder_opportunity_backlog;
CREATE TRIGGER audit_founder_opportunity_backlog
  AFTER INSERT OR UPDATE OR DELETE ON founder_opportunity_backlog
  FOR EACH ROW EXECUTE FUNCTION log_founder_memory_changes();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE founder_memory_snapshots IS 'Aggregated multi-source data snapshots for founder cognitive twin';
COMMENT ON TABLE founder_focus_areas IS 'Dynamic priority areas requiring founder attention';
COMMENT ON TABLE cross_client_patterns IS 'Recurring patterns detected across multiple clients';
COMMENT ON TABLE founder_opportunity_backlog IS 'Consolidated opportunities from all data sources';
COMMENT ON TABLE founder_risk_register IS 'Detected risks with likelihood and impact scoring';
COMMENT ON TABLE founder_momentum_scores IS 'Periodic momentum assessment across business dimensions';
COMMENT ON TABLE founder_decision_scenarios IS 'Shadow Founder decision simulator scenarios';
COMMENT ON TABLE founder_weekly_digests IS 'Structured weekly summary reports for founders';
COMMENT ON TABLE founder_next_actions IS 'Cached next action recommendations';
