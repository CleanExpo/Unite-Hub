-- Guardian Z10: Meta Governance, Safeguards & Release Gate
-- =========================================================
-- Adds meta-only governance layer for Z01-Z09 stack
-- Three tables: feature flags (per-tenant), governance prefs (per-tenant), audit log (append-only)
-- Idempotent: safe to re-run

-- ===== TABLE 1: guardian_meta_feature_flags =====
-- Per-tenant AI helper toggles for Z-series features
-- Conservative defaults: all flags false (opt-in)
-- One row per tenant via UNIQUE constraint

CREATE TABLE IF NOT EXISTS guardian_meta_feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- AI helper flags (conservative defaults = opt-in)
  enable_z_ai_hints BOOLEAN NOT NULL DEFAULT false,
  enable_z_success_narrative BOOLEAN NOT NULL DEFAULT false,
  enable_z_playbook_ai BOOLEAN NOT NULL DEFAULT false,
  enable_z_lifecycle_ai BOOLEAN NOT NULL DEFAULT false,
  enable_z_goals_ai BOOLEAN NOT NULL DEFAULT false,

  -- Scope marker (reserved for future use)
  scope TEXT NOT NULL DEFAULT 'meta',

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  CONSTRAINT uq_meta_flags_tenant UNIQUE (tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_meta_flags_tenant ON guardian_meta_feature_flags(tenant_id);

COMMENT ON TABLE guardian_meta_feature_flags IS
  'Tenant-scoped AI helper flags for Z-series meta features. Governs AI hints, drafts, narratives. Does not affect core Guardian runtime.';

COMMENT ON COLUMN guardian_meta_feature_flags.enable_z_ai_hints IS
  'When true, allows AI-powered hints/suggestions in Z-series UIs (readiness, adoption, etc.). Gated by ai_usage_policy in prefs.';

COMMENT ON COLUMN guardian_meta_feature_flags.enable_z_success_narrative IS
  'When true, allows AI-generated success narratives. Gated by ai_usage_policy and external_sharing_policy.';

COMMENT ON COLUMN guardian_meta_feature_flags.enable_z_playbook_ai IS
  'When true, allows AI-assisted playbook drafting. Gated by ai_usage_policy.';

COMMENT ON COLUMN guardian_meta_feature_flags.enable_z_lifecycle_ai IS
  'When true, allows AI-powered lifecycle policy recommendations. Gated by ai_usage_policy.';

COMMENT ON COLUMN guardian_meta_feature_flags.enable_z_goals_ai IS
  'When true, allows AI-powered KPI and OKR recommendations. Gated by ai_usage_policy.';

-- ===== TABLE 2: guardian_meta_governance_prefs =====
-- Per-tenant governance policies
-- One row per tenant with master AI policy gate

CREATE TABLE IF NOT EXISTS guardian_meta_governance_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Governance policies
  risk_posture TEXT NOT NULL DEFAULT 'standard',  -- 'standard', 'conservative', 'experimental'
  ai_usage_policy TEXT NOT NULL DEFAULT 'limited',  -- 'off', 'limited', 'advisory'
  external_sharing_policy TEXT NOT NULL DEFAULT 'internal_only',  -- 'internal_only', 'cs_safe', 'exec_ready'

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Validation
  CONSTRAINT risk_posture_valid CHECK (risk_posture IN ('standard', 'conservative', 'experimental')),
  CONSTRAINT ai_usage_valid CHECK (ai_usage_policy IN ('off', 'limited', 'advisory')),
  CONSTRAINT external_sharing_valid CHECK (external_sharing_policy IN ('internal_only', 'cs_safe', 'exec_ready')),
  CONSTRAINT uq_meta_prefs_tenant UNIQUE (tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_meta_prefs_tenant ON guardian_meta_governance_prefs(tenant_id);

COMMENT ON TABLE guardian_meta_governance_prefs IS
  'Tenant governance preferences: risk posture, AI usage policy, external sharing policy. Meta-only, advisory governance layer.';

COMMENT ON COLUMN guardian_meta_governance_prefs.risk_posture IS
  'Governs rollout conservatism. conservative = stricter readiness gates, experimental = looser gates, standard = moderate gates.';

COMMENT ON COLUMN guardian_meta_governance_prefs.ai_usage_policy IS
  'Master AI policy: off = no AI calls, limited = essential AI only, advisory = all AI helpers allowed. Overrides individual feature flags.';

COMMENT ON COLUMN guardian_meta_governance_prefs.external_sharing_policy IS
  'Controls what meta insights can be shared with external parties (CS, execs). internal_only = team only, cs_safe = with CS context, exec_ready = full exec visibility.';

-- ===== TABLE 3: guardian_meta_audit_log =====
-- Append-only PII-free audit trail for Z01-Z09 configuration changes
-- Service role inserts, tenant reads only (RLS enforced)

CREATE TABLE IF NOT EXISTS guardian_meta_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Actor & context
  actor TEXT NOT NULL,  -- user email or 'system'
  source TEXT NOT NULL,  -- 'readiness', 'uplift', 'editions', 'executive', 'adoption', 'lifecycle', 'integrations', 'goals_okrs', 'playbooks', 'meta_governance'
  action TEXT NOT NULL,  -- 'create', 'update', 'delete', 'archive', 'policy_change'

  -- Entity
  entity_type TEXT NOT NULL,  -- e.g., 'readiness_profile', 'uplift_plan', 'goal', 'playbook', 'meta_flag'
  entity_id TEXT NULL,  -- textual ID or key

  -- Audit payload (PII-free, config-only)
  summary TEXT NOT NULL,  -- short human-readable description
  details JSONB NOT NULL DEFAULT '{}'::jsonb,  -- config-level diff, NO raw logs or payloads
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Validation
  CONSTRAINT source_valid CHECK (source IN (
    'readiness', 'uplift', 'editions', 'executive', 'adoption',
    'lifecycle', 'integrations', 'goals_okrs', 'playbooks', 'meta_governance'
  )),
  CONSTRAINT action_valid CHECK (action IN ('create', 'update', 'delete', 'archive', 'policy_change'))
);

CREATE INDEX IF NOT EXISTS idx_meta_audit_tenant_time ON guardian_meta_audit_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meta_audit_tenant_source ON guardian_meta_audit_log(tenant_id, source, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_meta_audit_entity ON guardian_meta_audit_log(tenant_id, entity_type, entity_id);

COMMENT ON TABLE guardian_meta_audit_log IS
  'PII-free append-only audit log for Z01-Z09 configuration changes. Details must contain only config-level diffs (keys, flags, thresholds), no raw logs or payloads.';

COMMENT ON COLUMN guardian_meta_audit_log.actor IS
  'User email (from auth context) or "system" for automated events. Used for accountability and tracing.';

COMMENT ON COLUMN guardian_meta_audit_log.source IS
  'Z-series domain that triggered the audit event (readiness, uplift, editions, etc.). Organizes events by domain.';

COMMENT ON COLUMN guardian_meta_audit_log.details IS
  'JSONB payload with PII-free config changes. Example: {"flag": "enable_z_ai_hints", "old": false, "new": true} or {"policy": "ai_usage_policy", "old": "limited", "new": "advisory"}. Max 10KB.';

-- ===== RLS POLICIES =====

-- guardian_meta_feature_flags: Tenant isolation (full access to own tenant flags)
ALTER TABLE guardian_meta_feature_flags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_meta_flags" ON guardian_meta_feature_flags;
CREATE POLICY "tenant_isolation_meta_flags" ON guardian_meta_feature_flags
FOR ALL USING (tenant_id = get_current_workspace_id());

-- guardian_meta_governance_prefs: Tenant isolation (full access to own tenant prefs)
ALTER TABLE guardian_meta_governance_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_meta_prefs" ON guardian_meta_governance_prefs;
CREATE POLICY "tenant_isolation_meta_prefs" ON guardian_meta_governance_prefs
FOR ALL USING (tenant_id = get_current_workspace_id());

-- guardian_meta_audit_log: Read-only for tenant (can view own audit trail), service role inserts
ALTER TABLE guardian_meta_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_select_meta_audit" ON guardian_meta_audit_log;
CREATE POLICY "tenant_select_meta_audit" ON guardian_meta_audit_log
FOR SELECT USING (tenant_id = get_current_workspace_id());

DROP POLICY IF EXISTS "service_insert_meta_audit" ON guardian_meta_audit_log;
CREATE POLICY "service_insert_meta_audit" ON guardian_meta_audit_log
FOR INSERT WITH CHECK (true);

-- ===== SEED DATA (optional) =====
-- Upsert default flags + prefs for all existing workspaces on migration run
-- This ensures all tenants have governance settings without explicit creation

INSERT INTO guardian_meta_feature_flags (tenant_id, enable_z_ai_hints, enable_z_success_narrative, enable_z_playbook_ai, enable_z_lifecycle_ai, enable_z_goals_ai, scope, metadata)
SELECT id, false, false, false, false, false, 'meta', '{}'::jsonb
FROM workspaces
ON CONFLICT (tenant_id) DO NOTHING;

INSERT INTO guardian_meta_governance_prefs (tenant_id, risk_posture, ai_usage_policy, external_sharing_policy, metadata)
SELECT id, 'standard', 'limited', 'internal_only', '{}'::jsonb
FROM workspaces
ON CONFLICT (tenant_id) DO NOTHING;
