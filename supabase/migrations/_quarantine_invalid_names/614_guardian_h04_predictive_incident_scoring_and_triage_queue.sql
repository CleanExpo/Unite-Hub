/**
 * H04: Predictive Incident Scoring (Advisory) & Triage Queue
 *
 * Adds tenant-scoped tables for:
 * - Incident score snapshots (predictive severity scoring from aggregate signals)
 * - Triage queue state (admin-managed triage status, priority, tags, notes)
 *
 * All data is aggregate-only and PII-free (no raw payloads, no incident details).
 * Scoring is advisory-only: does NOT modify core incidents table.
 * H04 respects Z10 governance for optional AI explanations.
 * H04 does NOT change incident creation/closure behavior.
 */

-- Table 1: guardian_incident_scores
-- Stores predictive incident score snapshots
CREATE TABLE IF NOT EXISTS guardian_incident_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Model identification
  model_key TEXT NOT NULL DEFAULT 'h04_v1_heuristic',
  -- 'h04_v1_heuristic' | 'h04_v1_ai'

  -- Timestamp of score computation
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Score output
  score NUMERIC NOT NULL,
  -- 0..100 normalized severity score

  severity_band TEXT NOT NULL,
  -- 'low' | 'medium' | 'high' | 'critical'

  -- Features used in scoring (aggregate-only, no PII)
  features JSONB NOT NULL,
  -- {
  --   alert_count_1h: number,
  --   alert_count_24h: number,
  --   unique_rule_count: number,
  --   correlation_cluster_count: number,
  --   risk_score_latest: number,
  --   risk_delta_24h: number,
  --   notification_failure_rate: number,
  --   anomaly_event_count: number,
  --   incident_age_minutes: number,
  --   reopen_count: number
  -- }

  -- Plain-language PII-free summary
  rationale TEXT NOT NULL,
  -- e.g., "High alert rate + recent reopens; correlation density moderate"

  -- Confidence (optional, AI-only)
  confidence NUMERIC NULL,
  -- 0..1 if AI-assisted; NULL for heuristic

  -- Extensibility: may include AI narrative, weights used, etc.
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT severity_band_valid CHECK (severity_band IN ('low', 'medium', 'high', 'critical')),
  CONSTRAINT score_range CHECK (score >= 0 AND score <= 100),
  CONSTRAINT confidence_range CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

-- Indexes for score queries
CREATE INDEX IF NOT EXISTS idx_incident_scores_tenant_incident
  ON guardian_incident_scores(tenant_id, incident_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_scores_tenant_computed
  ON guardian_incident_scores(tenant_id, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_scores_tenant_band
  ON guardian_incident_scores(tenant_id, severity_band, computed_at DESC);

-- Table 2: guardian_incident_triage
-- Tracks admin-managed triage state per incident
CREATE TABLE IF NOT EXISTS guardian_incident_triage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Triage status
  triage_status TEXT NOT NULL DEFAULT 'untriaged',
  -- 'untriaged' | 'in_review' | 'actioned' | 'watch' | 'closed_out'

  -- Optional manual priority override (1=highest, 5=lowest)
  priority_override INTEGER NULL,

  -- Optional owner (system id or role, not PII like email)
  owner TEXT NULL,

  -- Sensitive free-text notes (should be scrubbed from exports unless internal-only)
  notes TEXT NULL,

  -- Tags for categorization
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],

  -- Latest score snapshot info (for fast queue sorting)
  last_score NUMERIC NULL,
  last_scored_at TIMESTAMPTZ NULL,

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT triage_status_valid CHECK (triage_status IN ('untriaged', 'in_review', 'actioned', 'watch', 'closed_out')),
  CONSTRAINT priority_override_range CHECK (priority_override IS NULL OR (priority_override >= 1 AND priority_override <= 5)),
  CONSTRAINT uq_triage_incident UNIQUE (tenant_id, incident_id)
);

-- Indexes for triage queries
CREATE INDEX IF NOT EXISTS idx_incident_triage_tenant_status
  ON guardian_incident_triage(tenant_id, triage_status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_triage_tenant_score
  ON guardian_incident_triage(tenant_id, last_score DESC NULLS LAST, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_triage_tenant_incident
  ON guardian_incident_triage(tenant_id, incident_id);

-- Enable RLS on both tables
ALTER TABLE guardian_incident_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_incident_triage ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Tenant isolation for scores
DROP POLICY IF EXISTS "tenant_isolation_incident_scores" ON guardian_incident_scores;
CREATE POLICY "tenant_isolation_incident_scores" ON guardian_incident_scores
FOR ALL USING (tenant_id = get_current_workspace_id());

-- RLS Policies: Tenant isolation for triage
DROP POLICY IF EXISTS "tenant_isolation_incident_triage" ON guardian_incident_triage;
CREATE POLICY "tenant_isolation_incident_triage" ON guardian_incident_triage
FOR ALL USING (tenant_id = get_current_workspace_id());

-- Comments for documentation
COMMENT ON TABLE guardian_incident_scores IS
  'Tenant-scoped predictive incident scores. Stores snapshots of advisory severity predictions (0..100 scale and band classification) computed from aggregate signals (alert counts, risk scores, correlation density, anomaly events, etc.). Scores do NOT modify core incidents table. Each score includes aggregate-only features and a PII-free rationale explaining top contributors.';

COMMENT ON COLUMN guardian_incident_scores.features IS
  'Aggregate-only feature dictionary used to compute the score. Contains counts, rates, and summaries only; no raw payloads, no PII, no event text.';

COMMENT ON COLUMN guardian_incident_scores.rationale IS
  'Plain-language PII-free explanation of score drivers (e.g., "High alert rate, recent reopens, low correlation density"). Suitable for admin review and audit logs.';

COMMENT ON COLUMN guardian_incident_scores.metadata IS
  'Extensible metadata. May include model_weights (for transparency), ai_narrative (if AI-assisted and allowed), or other context about how the score was derived.';

COMMENT ON TABLE guardian_incident_triage IS
  'Tenant-scoped triage queue state per incident. Admins use this to track which incidents have been reviewed, assigned priority or owner, tagged, and marked for watch or closure. Triage status and notes are independent of incident core fields (status, severity, etc.). The notes field is sensitive and should be redacted from external exports unless explicitly allowed by governance.';

COMMENT ON COLUMN guardian_incident_triage.triage_status IS
  'Admin-managed state: untriaged (new incident, not reviewed), in_review (under investigation), actioned (decision made), watch (monitoring for patterns), closed_out (resolved or dismissed).';

COMMENT ON COLUMN guardian_incident_triage.priority_override IS
  'Optional manual priority (1=highest). If set, overrides score-based ordering in triage queue.';

COMMENT ON COLUMN guardian_incident_triage.notes IS
  'Sensitive free-text admin notes (e.g., investigation findings, context). Must be redacted from external exports; safe for internal backups and admin access only.';
