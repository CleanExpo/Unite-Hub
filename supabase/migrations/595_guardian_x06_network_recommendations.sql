/**
 * Guardian X06: Network Recommendations Tables
 *
 * Tenant-scoped recommendations derived from X01-X05 network intelligence.
 * All recommendations are advisory-only; no automatic configuration changes occur.
 *
 * Privacy Notes:
 * - rationale and related_entities contain only IDs, labels, severities, and aggregate stats
 * - No PII, raw logs, or cross-tenant identifiers are permitted
 * - Recommendations describe only tenant-local insights or cohort-relative statements
 */

-- X06: Network-driven recommendations
CREATE TABLE IF NOT EXISTS guardian_network_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL, -- Denormalized for RLS; matches workspace_id for this context
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Source of recommendation: network_benchmark, network_anomaly, early_warning, qa_coverage
  source TEXT NOT NULL,

  -- Metric being recommended: e.g., 'alerts', 'incidents', 'risk', 'notifications', 'qa', 'performance'
  metric_family TEXT NOT NULL,

  -- Specific metric key: e.g., 'alerts.total', 'incidents.critical', 'perf.p95_ms'
  metric_key TEXT NOT NULL,

  -- Severity: low, medium, high, critical
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),

  -- Status: open, in_progress, implemented, dismissed
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'implemented', 'dismissed')),

  -- Recommendation type: rule_tuning, playbook_drill, qa_focus, performance_tuning, coverage_gap
  recommendation_type TEXT NOT NULL CHECK (
    recommendation_type IN ('rule_tuning', 'playbook_drill', 'qa_focus', 'performance_tuning', 'coverage_gap')
  ),

  -- Suggestion theme: tighten_alert_thresholds, relax_alert_thresholds, prioritise_critical_incidents, etc.
  suggestion_theme TEXT NOT NULL,

  -- Human-readable title
  title TEXT NOT NULL,

  -- Summary of the recommendation
  summary TEXT NOT NULL,

  -- Structured rationale (aggregate stats, no PII)
  rationale JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Related entities: rule IDs, playbook IDs, coverage items (IDs and labels only)
  related_entities JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Metadata: AI-generated summaries, next steps, internal tracking
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT no_pii_in_summary CHECK (
    summary !~ '([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}|phone|email|password|key|token|secret|credential)'
  )
);

-- Indexes for performance
CREATE INDEX idx_x06_recommendations_tenant_status
  ON guardian_network_recommendations(workspace_id, status, created_at DESC);

CREATE INDEX idx_x06_recommendations_tenant_type
  ON guardian_network_recommendations(workspace_id, recommendation_type, status);

CREATE INDEX idx_x06_recommendations_tenant_severity
  ON guardian_network_recommendations(workspace_id, severity, created_at DESC);

-- RLS: Tenant isolation
ALTER TABLE guardian_network_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON guardian_network_recommendations
  FOR ALL USING (workspace_id = get_current_workspace_id());

-- X06: Links from recommendations back to source entities (anomalies, early warnings, coverage)
CREATE TABLE IF NOT EXISTS guardian_network_recommendation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  recommendation_id UUID NOT NULL REFERENCES guardian_network_recommendations(id) ON DELETE CASCADE,

  -- Source table: guardian_network_anomaly_signals, guardian_network_early_warnings, guardian_qa_coverage_items
  source_table TEXT NOT NULL,

  -- Source entity ID (in the source table)
  source_id UUID NOT NULL,

  -- Metadata about the link (e.g., confidence score, contributing metric)
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_x06_links_recommendation
  ON guardian_network_recommendation_links(workspace_id, recommendation_id);

CREATE INDEX idx_x06_links_source
  ON guardian_network_recommendation_links(workspace_id, source_table, source_id);

-- RLS: Tenant isolation
ALTER TABLE guardian_network_recommendation_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON guardian_network_recommendation_links
  FOR ALL USING (workspace_id = get_current_workspace_id());

-- Grant appropriate permissions
GRANT SELECT, INSERT, UPDATE ON guardian_network_recommendations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON guardian_network_recommendation_links TO authenticated;
