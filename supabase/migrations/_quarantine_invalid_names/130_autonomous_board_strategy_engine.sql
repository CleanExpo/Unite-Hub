-- Migration 130: Autonomous Board Strategy Engine
-- Required by Phase 78 - Autonomous Board Strategy Engine (ABSE)
-- Board-level decision intelligence and strategic reports

-- Drop existing tables if they exist (for clean re-run)
DROP TABLE IF EXISTS board_strategy_reports CASCADE;

-- Board strategy reports table
CREATE TABLE board_strategy_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL,
  report_period TEXT NOT NULL,
  executive_summary TEXT,
  risk_matrix JSONB DEFAULT '{}'::jsonb,
  competitor_breakdown JSONB DEFAULT '{}'::jsonb,
  forecast_highlights JSONB DEFAULT '{}'::jsonb,
  budget_recommendations JSONB DEFAULT '{}'::jsonb,
  hiring_plan JSONB DEFAULT '{}'::jsonb,
  pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status check
  CONSTRAINT board_strategy_reports_status_check CHECK (
    status IN ('draft', 'pending_review', 'approved', 'published', 'archived')
  ),

  -- Foreign key
  CONSTRAINT board_strategy_reports_org_fk
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_board_strategy_reports_org ON board_strategy_reports(org_id);
CREATE INDEX IF NOT EXISTS idx_board_strategy_reports_period ON board_strategy_reports(report_period);
CREATE INDEX IF NOT EXISTS idx_board_strategy_reports_status ON board_strategy_reports(status);
CREATE INDEX IF NOT EXISTS idx_board_strategy_reports_created ON board_strategy_reports(created_at DESC);

-- Enable RLS
ALTER TABLE board_strategy_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY board_strategy_reports_select ON board_strategy_reports
  FOR SELECT TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY board_strategy_reports_insert ON board_strategy_reports
  FOR INSERT TO authenticated
  WITH CHECK (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY board_strategy_reports_update ON board_strategy_reports
  FOR UPDATE TO authenticated
  USING (org_id IN (
    SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- Comment
COMMENT ON TABLE board_strategy_reports IS 'Board strategy reports (Phase 78)';
