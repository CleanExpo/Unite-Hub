-- Migration 240: CONVEX Marketing Intelligence Module Database Schema
-- Purpose: Create tables for CONVEX frameworks, reasoning patterns, templates, and scoring
-- Version: 1.0.0
-- Date: 2025-11-27

-- ============================================================================
-- TABLE 1: convex_frameworks
-- Purpose: Store CONVEX framework definitions (brand positioning, funnel design, SEO patterns, competitor model, offer architecture)
-- ============================================================================

CREATE TABLE IF NOT EXISTS convex_frameworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  framework_type TEXT NOT NULL CHECK (framework_type IN ('brand_positioning', 'funnel_design', 'seo_patterns', 'competitor_model', 'offer_architecture')),
  framework_name TEXT NOT NULL,
  description TEXT,
  components TEXT[] NOT NULL,
  rules JSONB,
  reasoning_patterns JSONB[],
  metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,

  -- Constraints
  CONSTRAINT fk_workspace_id FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_convex_frameworks_workspace ON convex_frameworks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_convex_frameworks_type ON convex_frameworks(framework_type);
CREATE INDEX IF NOT EXISTS idx_convex_frameworks_created ON convex_frameworks(created_at DESC);

-- Enable RLS
ALTER TABLE convex_frameworks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for convex_frameworks
DO $$
BEGIN
  BEGIN
    CREATE POLICY "convex_frameworks_workspace_isolation" ON convex_frameworks
      FOR SELECT
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_frameworks_insert" ON convex_frameworks
      FOR INSERT
      WITH CHECK (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_frameworks_update" ON convex_frameworks
      FOR UPDATE
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_frameworks_delete" ON convex_frameworks
      FOR DELETE
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role = 'owner'
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================================
-- TABLE 2: convex_reasoning_patterns
-- Purpose: Store CONVEX reasoning patterns (compression rules, conversion logic, safety rules)
-- ============================================================================

CREATE TABLE IF NOT EXISTS convex_reasoning_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  pattern_category TEXT NOT NULL CHECK (pattern_category IN ('compression', 'conversion', 'safety')),
  pattern_name TEXT NOT NULL,
  description TEXT,
  rules TEXT[] NOT NULL,
  examples JSONB[],
  priority INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,

  -- Constraints
  CONSTRAINT fk_workspace_id FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_convex_reasoning_workspace ON convex_reasoning_patterns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_convex_reasoning_category ON convex_reasoning_patterns(pattern_category);
CREATE INDEX IF NOT EXISTS idx_convex_reasoning_enabled ON convex_reasoning_patterns(enabled);

-- Enable RLS
ALTER TABLE convex_reasoning_patterns ENABLE ROW LEVEL SECURITY;

-- RLS Policies for convex_reasoning_patterns
DO $$
BEGIN
  BEGIN
    CREATE POLICY "convex_reasoning_workspace_isolation" ON convex_reasoning_patterns
      FOR SELECT
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_reasoning_insert" ON convex_reasoning_patterns
      FOR INSERT
      WITH CHECK (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_reasoning_update" ON convex_reasoning_patterns
      FOR UPDATE
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================================
-- TABLE 3: convex_execution_templates
-- Purpose: Store CONVEX execution templates (landing page, SEO plan, paid ads, offer architecture)
-- ============================================================================

CREATE TABLE IF NOT EXISTS convex_execution_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('landing_page', 'seo_plan', 'paid_ads', 'offer_architecture')),
  template_name TEXT NOT NULL,
  description TEXT,
  framework_id UUID,
  template_content JSONB NOT NULL,
  variables JSONB,
  example_output JSONB,
  sections TEXT[] NOT NULL,
  estimated_duration_hours INTEGER,
  expected_results TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,

  -- Constraints
  CONSTRAINT fk_workspace_id FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_framework_id FOREIGN KEY (framework_id) REFERENCES convex_frameworks(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_convex_templates_workspace ON convex_execution_templates(workspace_id);
CREATE INDEX IF NOT EXISTS idx_convex_templates_type ON convex_execution_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_convex_templates_framework ON convex_execution_templates(framework_id);

-- Enable RLS
ALTER TABLE convex_execution_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for convex_execution_templates
DO $$
BEGIN
  BEGIN
    CREATE POLICY "convex_templates_workspace_isolation" ON convex_execution_templates
      FOR SELECT
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_templates_insert" ON convex_execution_templates
      FOR INSERT
      WITH CHECK (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_templates_update" ON convex_execution_templates
      FOR UPDATE
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================================
-- TABLE 4: convex_strategy_scores
-- Purpose: Track CONVEX compliance scoring for strategies (0-100 score, compliance status)
-- ============================================================================

CREATE TABLE IF NOT EXISTS convex_strategy_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  strategy_id UUID NOT NULL,
  framework_id UUID,
  convex_score NUMERIC(5,2) CHECK (convex_score >= 0 AND convex_score <= 100),
  compliance_status TEXT NOT NULL DEFAULT 'needs_revision' CHECK (compliance_status IN ('pass', 'needs_revision', 'fail')),
  scoring_details JSONB,

  -- Scoring breakdown
  clarity_score NUMERIC(5,2),
  specificity_score NUMERIC(5,2),
  outcome_focus_score NUMERIC(5,2),
  proof_score NUMERIC(5,2),
  objection_handling_score NUMERIC(5,2),
  risk_removal_score NUMERIC(5,2),

  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT fk_workspace_id FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
  CONSTRAINT fk_framework_id FOREIGN KEY (framework_id) REFERENCES convex_frameworks(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_convex_scores_workspace ON convex_strategy_scores(workspace_id);
CREATE INDEX IF NOT EXISTS idx_convex_scores_strategy ON convex_strategy_scores(strategy_id);
CREATE INDEX IF NOT EXISTS idx_convex_scores_compliance ON convex_strategy_scores(compliance_status);
CREATE INDEX IF NOT EXISTS idx_convex_scores_created ON convex_strategy_scores(created_at DESC);

-- Enable RLS
ALTER TABLE convex_strategy_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for convex_strategy_scores
DO $$
BEGIN
  BEGIN
    CREATE POLICY "convex_scores_workspace_isolation" ON convex_strategy_scores
      FOR SELECT
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_scores_insert" ON convex_strategy_scores
      FOR INSERT
      WITH CHECK (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_scores_update" ON convex_strategy_scores
      FOR UPDATE
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================================
-- TABLE 5: convex_market_analysis
-- Purpose: Track CONVEX market analysis (positioning, disruption, weakness analysis)
-- ============================================================================

CREATE TABLE IF NOT EXISTS convex_market_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  competitor_id UUID,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('positioning', 'disruption', 'weakness')),
  company_name TEXT,
  analysis_data JSONB NOT NULL,
  signals JSONB[],
  recommendations JSONB[],
  confidence_score NUMERIC(5,2) CHECK (confidence_score >= 0 AND confidence_score <= 100),

  -- Analysis tracking
  market_position TEXT,
  competitive_advantage TEXT,
  vulnerability_areas TEXT[],
  opportunity_score NUMERIC(5,2),

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,

  -- Constraints
  CONSTRAINT fk_workspace_id FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_convex_analysis_workspace ON convex_market_analysis(workspace_id);
CREATE INDEX IF NOT EXISTS idx_convex_analysis_type ON convex_market_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_convex_analysis_created ON convex_market_analysis(created_at DESC);

-- Enable RLS
ALTER TABLE convex_market_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for convex_market_analysis
DO $$
BEGIN
  BEGIN
    CREATE POLICY "convex_analysis_workspace_isolation" ON convex_market_analysis
      FOR SELECT
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_analysis_insert" ON convex_market_analysis
      FOR INSERT
      WITH CHECK (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;

  BEGIN
    CREATE POLICY "convex_analysis_update" ON convex_market_analysis
      FOR UPDATE
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations
        WHERE user_id = auth.uid() AND role IN ('owner', 'editor')
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================================
-- AUDIT LOGGING
-- Purpose: Track all changes to CONVEX tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS convex_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_by UUID,

  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT fk_workspace_id FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_convex_audit_workspace ON convex_audit_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_convex_audit_table ON convex_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_convex_audit_created ON convex_audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE convex_audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  BEGIN
    CREATE POLICY "convex_audit_workspace_isolation" ON convex_audit_log
      FOR SELECT
      USING (workspace_id IN (
        SELECT org_id FROM user_organizations WHERE user_id = auth.uid() AND role = 'owner'
      ));
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ============================================================================
-- TRIGGER FUNCTIONS
-- Purpose: Automatically log all changes to audit table
-- ============================================================================

CREATE OR REPLACE FUNCTION log_convex_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO convex_audit_log (workspace_id, table_name, record_id, operation, old_values, new_values, changed_by)
  VALUES (
    COALESCE(NEW.workspace_id, OLD.workspace_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for all CONVEX tables
CREATE TRIGGER convex_frameworks_audit AFTER INSERT OR UPDATE OR DELETE ON convex_frameworks
  FOR EACH ROW EXECUTE FUNCTION log_convex_change();

CREATE TRIGGER convex_reasoning_patterns_audit AFTER INSERT OR UPDATE OR DELETE ON convex_reasoning_patterns
  FOR EACH ROW EXECUTE FUNCTION log_convex_change();

CREATE TRIGGER convex_templates_audit AFTER INSERT OR UPDATE OR DELETE ON convex_execution_templates
  FOR EACH ROW EXECUTE FUNCTION log_convex_change();

CREATE TRIGGER convex_scores_audit AFTER INSERT OR UPDATE OR DELETE ON convex_strategy_scores
  FOR EACH ROW EXECUTE FUNCTION log_convex_change();

CREATE TRIGGER convex_analysis_audit AFTER INSERT OR UPDATE OR DELETE ON convex_market_analysis
  FOR EACH ROW EXECUTE FUNCTION log_convex_change();

-- ============================================================================
-- MIGRATION VERIFICATION
-- ============================================================================

-- Verify all tables created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name IN (
      'convex_frameworks',
      'convex_reasoning_patterns',
      'convex_execution_templates',
      'convex_strategy_scores',
      'convex_market_analysis',
      'convex_audit_log'
    )
  ) THEN
    RAISE NOTICE 'Migration 240: CONVEX framework tables created successfully';
  ELSE
    RAISE WARNING 'Migration 240: Some tables may have failed to create';
  END IF;
END $$;

-- End of Migration 240;
