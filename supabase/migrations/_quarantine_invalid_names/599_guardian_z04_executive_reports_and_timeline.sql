-- Z04: Executive Reports & Health Timeline Storyboards
-- Status: Executive observation and reporting layer
-- Tables: guardian_executive_reports, guardian_health_timeline_points
-- RLS: Tenant-scoped isolation on both tables

-- Enable UUID and JSONB support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- Table 1: guardian_executive_reports
-- Purpose: Store executive reports with summaries, sections, narratives
-- Scope: Tenant-scoped (workspace isolation via RLS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_executive_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Report metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL, -- 'monthly', 'quarterly', 'custom', 'snapshot'
  audience TEXT NOT NULL DEFAULT 'executive', -- 'executive' | 'ops' | 'board'

  -- Summary: high-level metrics (readiness score delta, uplift progress %, etc.)
  summary JSONB NOT NULL DEFAULT '{}', -- { readiness_score, readiness_delta, uplift_progress_pct, edition_alignment, etc. }

  -- Sections: structured report content
  sections JSONB NOT NULL DEFAULT '{}', -- [{ section_key, section_title, metrics, highlights, recommendations }]

  -- Optional edition focus
  edition_key TEXT NULL REFERENCES guardian_edition_profiles(key),

  -- Optional uplift plan link
  uplift_plan_id UUID NULL REFERENCES guardian_tenant_uplift_plans(id) ON DELETE SET NULL,

  -- Narrative: optional prose/bullet points (advisory commentary)
  narrative JSONB NOT NULL DEFAULT '{}', -- { intro_paragraph, key_findings, recommendations_prose, etc. }

  -- Export metadata for PDF/CSV/slide generation
  export_metadata JSONB NOT NULL DEFAULT '{}', -- { format, page_count, generated_at, etc. }

  -- General metadata
  metadata JSONB NOT NULL DEFAULT '{}', -- { custom_fields, tags, etc. }

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT report_type_valid CHECK (report_type IN ('monthly', 'quarterly', 'custom', 'snapshot')),
  CONSTRAINT audience_valid CHECK (audience IN ('executive', 'ops', 'board')),
  CONSTRAINT period_valid CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_executive_reports_tenant
  ON guardian_executive_reports(tenant_id);

CREATE INDEX IF NOT EXISTS idx_executive_reports_tenant_created
  ON guardian_executive_reports(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_executive_reports_tenant_period
  ON guardian_executive_reports(tenant_id, period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_executive_reports_tenant_type
  ON guardian_executive_reports(tenant_id, report_type);

CREATE INDEX IF NOT EXISTS idx_executive_reports_tenant_audience
  ON guardian_executive_reports(tenant_id, audience);

-- RLS Policy: Tenant isolation
ALTER TABLE guardian_executive_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_select" ON guardian_executive_reports;
CREATE POLICY "tenant_isolation_select" ON guardian_executive_reports
FOR SELECT USING (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_isolation_insert" ON guardian_executive_reports;
CREATE POLICY "tenant_isolation_insert" ON guardian_executive_reports
FOR INSERT WITH CHECK (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_isolation_update" ON guardian_executive_reports;
CREATE POLICY "tenant_isolation_update" ON guardian_executive_reports
FOR UPDATE USING (tenant_id = get_current_workspace_id()) WITH CHECK (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "tenant_isolation_delete" ON guardian_executive_reports;
CREATE POLICY "tenant_isolation_delete" ON guardian_executive_reports
FOR DELETE USING (tenant_id = get_current_workspace_id());

-- ============================================================================
-- Table 2: guardian_health_timeline_points
-- Purpose: Immutable timeline of health events/state changes
-- Scope: Tenant-scoped (workspace isolation via RLS)
-- Pattern: Append-only, enables audit trail and historical playback
-- ============================================================================

CREATE TABLE IF NOT EXISTS guardian_health_timeline_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,

  -- Event metadata
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source TEXT NOT NULL, -- 'readiness', 'edition_fit', 'uplift', 'network', 'qa', 'governance', etc.
  label TEXT NOT NULL, -- Human-readable event name
  category TEXT NOT NULL, -- 'core', 'ai_intelligence', 'qa_chaos', 'network_intelligence', 'governance', 'meta'

  -- Metric data (optional; for quantitative events)
  metric_key TEXT NULL, -- e.g., 'readiness_overall_score', 'edition_fit_core', 'uplift_task_completed'
  metric_value NUMERIC NULL, -- e.g., 75, 60, 1

  -- Narrative snippet (optional; human-readable summary, no PII)
  narrative_snippet TEXT NULL, -- e.g., "Readiness improved from 60 to 75", "Risk engine enabled"

  -- Related IDs for tracing back to source objects (append-only audit trail)
  related_ids JSONB NOT NULL DEFAULT '{}', -- { readiness_snapshot_id, edition_fit_id, uplift_plan_id, uplift_task_id, network_alert_id, etc. }

  -- General metadata
  metadata JSONB NOT NULL DEFAULT '{}', -- { severity, importance_score, tags, etc. }

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT category_valid CHECK (category IN ('core', 'ai_intelligence', 'qa_chaos', 'network_intelligence', 'governance', 'meta')),
  CONSTRAINT source_not_empty CHECK (source != '')
);

CREATE INDEX IF NOT EXISTS idx_health_timeline_tenant
  ON guardian_health_timeline_points(tenant_id);

CREATE INDEX IF NOT EXISTS idx_health_timeline_tenant_occurred
  ON guardian_health_timeline_points(tenant_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_health_timeline_tenant_category
  ON guardian_health_timeline_points(tenant_id, category);

CREATE INDEX IF NOT EXISTS idx_health_timeline_tenant_source
  ON guardian_health_timeline_points(tenant_id, source);

CREATE INDEX IF NOT EXISTS idx_health_timeline_tenant_metric
  ON guardian_health_timeline_points(tenant_id, metric_key)
  WHERE metric_key IS NOT NULL;

-- RLS Policy: Tenant isolation (append-only)
ALTER TABLE guardian_health_timeline_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "timeline_tenant_select" ON guardian_health_timeline_points;
CREATE POLICY "timeline_tenant_select" ON guardian_health_timeline_points
FOR SELECT USING (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "timeline_tenant_insert" ON guardian_health_timeline_points;
CREATE POLICY "timeline_tenant_insert" ON guardian_health_timeline_points
FOR INSERT WITH CHECK (tenant_id = get_current_workspace_id());

-- Prevent updates/deletes (append-only)
DROP POLICY IF EXISTS "timeline_tenant_update_denied" ON guardian_health_timeline_points;
CREATE POLICY "timeline_tenant_update_denied" ON guardian_health_timeline_points
FOR UPDATE USING (false);

DROP POLICY IF EXISTS "timeline_tenant_delete_denied" ON guardian_health_timeline_points;
CREATE POLICY "timeline_tenant_delete_denied" ON guardian_health_timeline_points
FOR DELETE USING (false);

-- ============================================================================
-- Summary
-- ============================================================================
-- Z04 creates two tenant-scoped, RLS-protected tables:
-- 1. guardian_executive_reports — Periodic reports with summaries, sections, narratives
-- 2. guardian_health_timeline_points — Immutable append-only event timeline
--
-- Both support advisory-only observation (no runtime impact on Guardian)
-- Timeline enables audit trail and historical playback
-- Reports link to editions and uplift plans for context-aware guidance
