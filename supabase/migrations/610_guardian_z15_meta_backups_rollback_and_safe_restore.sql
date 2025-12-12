-- Guardian Z15: Meta Backups, Rollback & Safe Restore
-- Migration: Tenant-scoped backup sets, items, and controlled restore runs
-- Date: December 12, 2025
-- Purpose: Add safe backup/restore capability for Z01-Z14 meta configuration
--          Only meta tables; no core Guardian G/H/I/X runtime data
--          Scrubbed of secrets/PII; requires admin confirmation to apply

-- Table: guardian_meta_backup_sets
-- Tracks backup jobs with scope and manifest
CREATE TABLE IF NOT EXISTS guardian_meta_backup_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Backup identification
  backup_key TEXT NOT NULL,  -- e.g. 'pre_q1_rollout', 'before_major_changes'
  label TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Scope: which meta domains to include
  scope TEXT[] NOT NULL,  -- 'readiness','uplift','editions','executive','adoption','lifecycle','integrations','goals_okrs','playbooks','governance','exports','improvement_loop','automation','status'

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'building',  -- 'building' | 'ready' | 'failed' | 'archived'

  -- Manifest (filled when ready)
  manifest JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { schemaVersion, generatedAt, scope, items[], checksums }

  -- Metadata
  created_by TEXT NULL,  -- actor who created backup
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT status_valid CHECK (status IN ('building', 'ready', 'failed', 'archived')),
  CONSTRAINT scope_not_empty CHECK (array_length(scope, 1) > 0),
  CONSTRAINT uq_tenant_backup_key UNIQUE (tenant_id, backup_key)
);

CREATE INDEX IF NOT EXISTS idx_backup_sets_tenant_created ON guardian_meta_backup_sets(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backup_sets_tenant_status ON guardian_meta_backup_sets(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_backup_sets_tenant_backup_key ON guardian_meta_backup_sets(tenant_id, backup_key);

-- Table: guardian_meta_backup_items
-- Individual items within a backup set (deterministic, checksummed)
CREATE TABLE IF NOT EXISTS guardian_meta_backup_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_id UUID NOT NULL REFERENCES guardian_meta_backup_sets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Item identification
  item_key TEXT NOT NULL,  -- e.g. 'readiness_config', 'automation_schedules'
  content_type TEXT NOT NULL DEFAULT 'application/json',

  -- Content (scrubbed of secrets/PII)
  content JSONB NOT NULL,

  -- Integrity
  checksum TEXT NOT NULL,  -- SHA-256 of canonical JSON
  order_index INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT uq_backup_item_key UNIQUE (backup_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_backup_items_backup ON guardian_meta_backup_items(backup_id, order_index);
CREATE INDEX IF NOT EXISTS idx_backup_items_tenant ON guardian_meta_backup_items(tenant_id);

-- Table: guardian_meta_restore_runs
-- Tracks restore operations: preview → apply → result
CREATE TABLE IF NOT EXISTS guardian_meta_restore_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ NULL,
  finished_at TIMESTAMPTZ NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'preview',  -- 'preview' | 'applying' | 'completed' | 'failed'

  -- Backup reference
  backup_id UUID NOT NULL REFERENCES guardian_meta_backup_sets(id) ON DELETE RESTRICT,

  -- Restore mode
  target_mode TEXT NOT NULL DEFAULT 'merge',  -- 'merge' | 'replace' (replace limited to safe entities)

  -- Preview and plan
  preview_diff JSONB NOT NULL DEFAULT '{}'::jsonb,  -- PII-free diff: { adds: [], updates: [], skips: [] }
  apply_plan JSONB NOT NULL DEFAULT '{}'::jsonb,  -- Ordered operations per scope

  -- Result (filled after apply)
  result_summary JSONB NOT NULL DEFAULT '{}'::jsonb,  -- { appliedCount, updatedCount, skippedCount, errors }

  -- Error handling
  error_message TEXT NULL,

  -- Audit
  actor TEXT NULL,  -- admin who initiated/applied restore

  -- Metadata
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT status_valid CHECK (status IN ('preview', 'applying', 'completed', 'failed')),
  CONSTRAINT target_mode_valid CHECK (target_mode IN ('merge', 'replace'))
);

CREATE INDEX IF NOT EXISTS idx_restore_runs_tenant_created ON guardian_meta_restore_runs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_restore_runs_tenant_status ON guardian_meta_restore_runs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_restore_runs_backup ON guardian_meta_restore_runs(backup_id);

-- Row Level Security: guardian_meta_backup_sets
ALTER TABLE guardian_meta_backup_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_backup_sets" ON guardian_meta_backup_sets;
CREATE POLICY "tenant_isolation_backup_sets" ON guardian_meta_backup_sets
FOR ALL USING (tenant_id = get_current_workspace_id());

-- Row Level Security: guardian_meta_backup_items
ALTER TABLE guardian_meta_backup_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_backup_items" ON guardian_meta_backup_items;
CREATE POLICY "tenant_isolation_backup_items" ON guardian_meta_backup_items
FOR ALL USING (tenant_id = get_current_workspace_id());

-- Row Level Security: guardian_meta_restore_runs
ALTER TABLE guardian_meta_restore_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_restore_runs" ON guardian_meta_restore_runs;
CREATE POLICY "tenant_isolation_restore_runs" ON guardian_meta_restore_runs
FOR ALL USING (tenant_id = get_current_workspace_id());

-- Table comments
COMMENT ON TABLE guardian_meta_backup_sets IS
  'Tenant-scoped backup sets for Z01-Z14 meta configuration. Stores frozen snapshots of meta-only tables (readiness, uplift, editions, adoption, lifecycle, integrations, goals/OKRs, playbooks, governance, exports, improvement loop, automation, status snapshots). Never backs up core Guardian G/H/I/X runtime tables. All content is scrubbed of secrets, PII, and sensitive fields.';

COMMENT ON COLUMN guardian_meta_backup_sets.scope IS
  'Array of meta domains to backup: readiness, uplift, editions, executive, adoption, lifecycle, integrations, goals_okrs, playbooks, governance, exports, improvement_loop, automation, status. Determines what is included in the backup.';

COMMENT ON COLUMN guardian_meta_backup_sets.manifest IS
  'Filled when status=ready. Contains: schemaVersion, generatedAt, scope, items (array of {itemKey, checksum, contentType}). PII-free and deterministic.';

COMMENT ON TABLE guardian_meta_backup_items IS
  'Individual scrubbed data items within a backup. Content is PII-free: no secrets, headers, webhook URLs, notes (by default), or actor names. Checksum is SHA-256 of canonical JSON for integrity verification.';

COMMENT ON COLUMN guardian_meta_backup_items.content IS
  'Scrubbed JSONB configuration/summary data. Must never contain: API keys, webhook URLs with credentials, raw alert/incident payloads, free-text notes (unless includeNotes=true and governance allows), email addresses, IP addresses, or other PII.';

COMMENT ON TABLE guardian_meta_restore_runs IS
  'Tracks restore operations from backup sets. Workflow: 1) Create with status=preview, 2) Preview diff computed (PII-free), 3) Admin confirms, 4) Apply plan executed with status=applying, 5) Complete or fail. Never modifies core Guardian runtime tables. Allows "merge" (safe update) or "replace" (limited to safe entities only).';

COMMENT ON COLUMN guardian_meta_restore_runs.preview_diff IS
  'PII-free summary of changes that would be applied: {adds: {scope: [keys]}, updates: {scope: [keys]}, skips: {scope: [reason]}}. Does not include actual payloads.';

COMMENT ON COLUMN guardian_meta_restore_runs.apply_plan IS
  'Ordered sequence of operations to execute per scope, using only allowlisted upsert/delete patterns. Computed from preview_diff and enforced allowlist.';
