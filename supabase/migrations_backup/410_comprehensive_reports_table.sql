-- Migration 410: Comprehensive Reports Table
-- Created: 2026-01-15
-- Purpose: Store unified V3 audit reports combining trust anchor, citation gaps, UCP, and ghostwriter data

-- =====================================================
-- Table: comprehensive_reports
-- Purpose: Store comprehensive V3 audit reports
-- =====================================================
CREATE TABLE IF NOT EXISTS comprehensive_reports (
  id TEXT PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Client info
  client_name TEXT NOT NULL,
  sector TEXT NOT NULL,

  -- Full report data (JSON)
  report_data JSONB NOT NULL,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for reports
CREATE INDEX IF NOT EXISTS idx_comprehensive_reports_workspace
  ON comprehensive_reports(workspace_id);
CREATE INDEX IF NOT EXISTS idx_comprehensive_reports_client
  ON comprehensive_reports(workspace_id, client_name);
CREATE INDEX IF NOT EXISTS idx_comprehensive_reports_sector
  ON comprehensive_reports(workspace_id, sector);
CREATE INDEX IF NOT EXISTS idx_comprehensive_reports_created
  ON comprehensive_reports(workspace_id, created_at DESC);

-- Enable RLS
ALTER TABLE comprehensive_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY comprehensive_reports_workspace_isolation ON comprehensive_reports
  FOR ALL
  USING (workspace_id IN (
    SELECT workspace_id FROM public.user_workspaces
    WHERE user_id = auth.uid()
  ));

-- =====================================================
-- Migration Complete
-- =====================================================
-- Summary:
-- - comprehensive_reports: Unified V3 audit reports combining:
--   * Trust anchor data (ABN/NZBN, Maps, E-E-A-T score)
--   * Citation gap analysis with Synthex actions
--   * UCP status and active offers
--   * Ghostwriter constraints (forbidden words, voice, burstiness)
-- - Full RLS enforcement for workspace isolation
-- - Optimized indexes for common queries
