-- Guardian Z11: Meta Packaging, Export Bundles & Transfer Kit
-- Migration: guardian_meta_export_bundles + guardian_meta_export_bundle_items
-- Date: December 12, 2025
-- Purpose: Tenant-scoped export bundles for Z01-Z10 meta data
--          PII-free transfers via deterministic bundles with checksums

-- Table 1: guardian_meta_export_bundles
-- Tracks export bundle jobs with status lifecycle
CREATE TABLE IF NOT EXISTS guardian_meta_export_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Bundle identification
  bundle_key TEXT NOT NULL,  -- 'cs_transfer_kit', 'exec_briefing_pack', 'implementation_handoff'
  label TEXT NOT NULL,
  description TEXT NOT NULL,

  -- Scope and period
  scope TEXT[] NOT NULL,  -- ['readiness', 'uplift', 'editions', 'executive', 'adoption', 'lifecycle', 'integrations', 'goals_okrs', 'playbooks', 'governance']
  period_start DATE NULL,
  period_end DATE NULL,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'building' | 'ready' | 'failed' | 'archived'

  -- Manifest (filled when status = 'ready')
  manifest JSONB NULL,  -- { schemaVersion, generatedAt, scope, items[], warnings[] }

  -- Error handling
  error_message TEXT NULL,

  -- Audit
  created_by TEXT NULL,  -- actor who requested export

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Validation
  CONSTRAINT status_valid CHECK (status IN ('pending', 'building', 'ready', 'failed', 'archived')),
  CONSTRAINT scope_not_empty CHECK (array_length(scope, 1) > 0)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_export_bundles_tenant_created ON guardian_meta_export_bundles(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_bundles_tenant_status ON guardian_meta_export_bundles(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_export_bundles_tenant_bundle_key ON guardian_meta_export_bundles(tenant_id, bundle_key, created_at DESC);

-- Table 2: guardian_meta_export_bundle_items
-- Individual items within export bundles
CREATE TABLE IF NOT EXISTS guardian_meta_export_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES guardian_meta_export_bundles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Item identification
  item_key TEXT NOT NULL,  -- 'manifest', 'readiness_snapshot', 'playbooks', etc.
  content_type TEXT NOT NULL DEFAULT 'application/json',

  -- Content (PII-scrubbed JSONB)
  content JSONB NOT NULL,

  -- Integrity
  checksum TEXT NOT NULL,  -- SHA-256 of canonical JSON string
  order_index INTEGER NOT NULL DEFAULT 0,

  -- Extensibility
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Constraints
  CONSTRAINT uq_bundle_item_key UNIQUE (bundle_id, item_key)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bundle_items_bundle ON guardian_meta_export_bundle_items(bundle_id, order_index);
CREATE INDEX IF NOT EXISTS idx_bundle_items_tenant ON guardian_meta_export_bundle_items(tenant_id);

-- Row Level Security: guardian_meta_export_bundles
ALTER TABLE guardian_meta_export_bundles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_export_bundles" ON guardian_meta_export_bundles;
CREATE POLICY "tenant_isolation_export_bundles" ON guardian_meta_export_bundles
FOR ALL USING (tenant_id = get_current_workspace_id());

-- Row Level Security: guardian_meta_export_bundle_items
ALTER TABLE guardian_meta_export_bundle_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_bundle_items" ON guardian_meta_export_bundle_items;
CREATE POLICY "tenant_isolation_bundle_items" ON guardian_meta_export_bundle_items
FOR ALL USING (tenant_id = get_current_workspace_id());

-- Table comments
COMMENT ON TABLE guardian_meta_export_bundles IS
  'Tenant-scoped export bundles for Z01-Z10 meta data. Produces portable, PII-free transfer packages for CS, exec briefings, and implementation handoffs. Does not export core Guardian G/H/I/X runtime data.';

COMMENT ON COLUMN guardian_meta_export_bundles.bundle_key IS
  'Preset bundle template: cs_transfer_kit, exec_briefing_pack, implementation_handoff. Determines default scope and label.';

COMMENT ON COLUMN guardian_meta_export_bundles.scope IS
  'Array of Z-series domains to include: readiness, uplift, editions, executive, adoption, lifecycle, integrations, goals_okrs, playbooks, governance. Determines which meta data is exported.';

COMMENT ON COLUMN guardian_meta_export_bundles.status IS
  'Job lifecycle: pending (created) → building (processing) → ready (complete) | failed (error) → archived (cleanup). Advisory-only status for client consumption.';

COMMENT ON COLUMN guardian_meta_export_bundles.manifest IS
  'Filled when status=ready. Contains: schemaVersion (string), generatedAt (ISO date), scope (array), items (array of {itemKey, checksum, contentType, bytesApprox}), warnings (array of strings). PII-free.';

COMMENT ON TABLE guardian_meta_export_bundle_items IS
  'Individual items within an export bundle. Content must be PII-scrubbed JSONB (no emails, IPs, raw logs, webhook URLs with secrets, etc.). Checksum is SHA-256 of canonical JSON.';

COMMENT ON COLUMN guardian_meta_export_bundle_items.content IS
  'PII-scrubbed JSONB payload. Must contain only meta-level data: scores, statuses, counts, dimension names, labels. No free-text fields with user input, no raw alert/incident payloads, no webhook secrets.';

COMMENT ON COLUMN guardian_meta_export_bundle_items.checksum IS
  'SHA-256 checksum of canonical JSON string. Used for integrity verification and deduplication. Deterministic across runs (same input → same checksum).';

-- Seed: Create default export history for all existing workspaces
-- This ensures tenants can see export options immediately
INSERT INTO guardian_meta_export_bundles (
  tenant_id, bundle_key, label, description, scope, status, created_by
)
SELECT
  id as tenant_id,
  'cs_transfer_kit'::text,
  'CS Transfer Kit'::text,
  'Complete tenant readiness, uplift, governance, and lifecycle data for customer success handoff'::text,
  ARRAY['readiness', 'uplift', 'governance', 'lifecycle', 'adoption']::text[],
  'ready'::text,
  'system'::text
FROM workspaces
WHERE id NOT IN (
  SELECT DISTINCT tenant_id FROM guardian_meta_export_bundles
  WHERE bundle_key = 'cs_transfer_kit'
)
ON CONFLICT DO NOTHING;

-- Create companion seed items for CS Transfer Kit (manifest only)
INSERT INTO guardian_meta_export_bundle_items (
  bundle_id, tenant_id, item_key, content_type, content, checksum, order_index
)
SELECT
  b.id,
  b.tenant_id,
  'manifest'::text,
  'application/json'::text,
  jsonb_build_object(
    'schemaVersion', '1.0.0',
    'generatedAt', NOW()::text,
    'tenantScoped', true,
    'bundleKey', 'cs_transfer_kit',
    'scope', ARRAY['readiness', 'uplift', 'governance', 'lifecycle', 'adoption'],
    'items', ARRAY[]::jsonb[],
    'warnings', ARRAY['Seed manifest - awaiting first build']::text[]
  ),
  '0000000000000000000000000000000000000000000000000000000000000000'::text,
  -1::integer
FROM guardian_meta_export_bundles b
WHERE b.bundle_key = 'cs_transfer_kit'
AND b.status = 'ready'
AND NOT EXISTS (
  SELECT 1 FROM guardian_meta_export_bundle_items i
  WHERE i.bundle_id = b.id AND i.item_key = 'manifest'
)
ON CONFLICT DO NOTHING;
