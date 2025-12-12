-- Guardian Z14: Meta Status Page & Stakeholder Views
-- Migration: Status snapshots for fast rendering and historical trend analysis
-- Date: December 12, 2025
-- Purpose: Tenant-scoped status views for operators, leadership, and CS
--          Summarizes Z01-Z13 meta signals in role-safe, PII-free cards
--          No modification to core Guardian G/H/I/X runtime behaviour

-- Table: guardian_meta_status_snapshots
-- Captures frozen Z-series summary at point-in-time for fast stakeholder views
CREATE TABLE IF NOT EXISTS guardian_meta_status_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- View type and period
  view_type TEXT NOT NULL,  -- 'operator' | 'leadership' | 'cs'
  period_label TEXT NOT NULL,  -- 'last_7d' | 'last_30d' | 'quarter_to_date'

  -- Overall status for the period
  overall_status TEXT NOT NULL,  -- 'experimental' | 'limited' | 'recommended' | 'needs_attention'
  headline TEXT NOT NULL,  -- Short summary headline

  -- Cards (PII-free compact summaries)
  -- Each card: { key, title, status: 'good'|'warn'|'bad'|'info', value?, details?, links? }
  cards JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Top-level issues and warnings
  blockers TEXT[] NOT NULL DEFAULT '{}'::text[],  -- Critical blockers (no more than 3)
  warnings TEXT[] NOT NULL DEFAULT '{}'::text[],  -- Warnings (no more than 5)

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- RLS
  CONSTRAINT view_type_valid CHECK (view_type IN ('operator', 'leadership', 'cs')),
  CONSTRAINT status_valid CHECK (overall_status IN ('experimental', 'limited', 'recommended', 'needs_attention')),
  CONSTRAINT period_valid CHECK (period_label IN ('last_7d', 'last_30d', 'quarter_to_date'))
);

CREATE INDEX IF NOT EXISTS idx_status_snapshots_tenant_view_period ON guardian_meta_status_snapshots(tenant_id, view_type, period_label, captured_at DESC);
CREATE INDEX IF NOT EXISTS idx_status_snapshots_tenant_captured ON guardian_meta_status_snapshots(tenant_id, captured_at DESC);

-- Row Level Security: guardian_meta_status_snapshots
ALTER TABLE guardian_meta_status_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_status_snapshots" ON guardian_meta_status_snapshots;
CREATE POLICY "tenant_isolation_status_snapshots" ON guardian_meta_status_snapshots
FOR ALL USING (tenant_id = get_current_workspace_id());

-- Table comments
COMMENT ON TABLE guardian_meta_status_snapshots IS
  'Tenant-scoped frozen snapshots of Z-series meta status for fast rendering of stakeholder views. PII-free cards; no secrets, URLs, or identifying data. Supports operator, leadership, and CS views with role-safe redaction.';

COMMENT ON COLUMN guardian_meta_status_snapshots.view_type IS
  'Stakeholder view: operator (detailed, admin links), leadership (executive summary), or cs (customer-safe). Determines card granularity and redaction rules.';

COMMENT ON COLUMN guardian_meta_status_snapshots.period_label IS
  'Analysis period: last_7d (daily snapshot), last_30d (weekly snapshot), or quarter_to_date (rolling). Used for trend analysis and scheduling.';

COMMENT ON COLUMN guardian_meta_status_snapshots.cards IS
  'Array of compact status cards (PII-free): [{ key, title, status: "good"|"warn"|"bad"|"info", value?, details?, links? }, ...]. Operator cards may include admin links; leadership/CS cards must have links=[] or null.';

COMMENT ON COLUMN guardian_meta_status_snapshots.blockers IS
  'Array of critical blockers (max 3 items). Examples: "Readiness below 50%", "No active improvement cycles". No actor names, emails, or internal IDs.';

COMMENT ON COLUMN guardian_meta_status_snapshots.warnings IS
  'Array of warnings (max 5 items). Examples: "KPI on-track rate declining", "Automation last run 3 days ago". No sensitive internal details.';
