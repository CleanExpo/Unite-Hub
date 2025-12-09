-- Phase E32: Evidence Pack Builder
-- Migration: 521
-- Purpose: Bundle governance artifacts for auditors/insurers
-- Tables: evidence_packs, evidence_pack_items
-- Functions: create_evidence_pack, add_pack_item, get_pack_summary
-- RLS: All tables tenant-scoped

-- =====================================================
-- 1. ENUMS (Idempotent)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE evidence_pack_status AS ENUM ('draft', 'pending_review', 'approved', 'exported', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE evidence_item_type AS ENUM (
    'audit_log',
    'policy_document',
    'incident_report',
    'sla_report',
    'compliance_certificate',
    'security_scan',
    'backup_record',
    'access_log',
    'data_retention_record',
    'webhook_log',
    'risk_assessment',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. TABLES
-- =====================================================

-- Evidence Packs
CREATE TABLE IF NOT EXISTS evidence_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  purpose TEXT, -- 'audit', 'compliance', 'insurance', 'investigation', 'other'
  status evidence_pack_status NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  exported_at TIMESTAMPTZ,
  export_format TEXT, -- 'pdf', 'zip', 'json'
  export_url TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_packs_tenant ON evidence_packs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evidence_packs_status ON evidence_packs(status);
CREATE INDEX IF NOT EXISTS idx_evidence_packs_purpose ON evidence_packs(purpose);
CREATE INDEX IF NOT EXISTS idx_evidence_packs_created_by ON evidence_packs(created_by);

-- Evidence Pack Items
CREATE TABLE IF NOT EXISTS evidence_pack_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES evidence_packs(id) ON DELETE CASCADE,
  item_type evidence_item_type NOT NULL,
  item_id UUID, -- ID of the referenced record (audit log, incident, etc.)
  item_title TEXT NOT NULL,
  item_summary TEXT,
  item_data JSONB DEFAULT '{}'::jsonb, -- Full record snapshot
  attached_file_url TEXT,
  item_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_evidence_pack_items_pack ON evidence_pack_items(pack_id);
CREATE INDEX IF NOT EXISTS idx_evidence_pack_items_type ON evidence_pack_items(item_type);
CREATE INDEX IF NOT EXISTS idx_evidence_pack_items_item_id ON evidence_pack_items(item_id);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE evidence_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_pack_items ENABLE ROW LEVEL SECURITY;

-- Evidence Packs: Tenant-scoped
DROP POLICY IF EXISTS evidence_packs_tenant_isolation ON evidence_packs;
CREATE POLICY evidence_packs_tenant_isolation ON evidence_packs
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Evidence Pack Items: Via pack tenant_id
DROP POLICY IF EXISTS evidence_pack_items_tenant_isolation ON evidence_pack_items;
CREATE POLICY evidence_pack_items_tenant_isolation ON evidence_pack_items
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM evidence_packs WHERE evidence_packs.id = evidence_pack_items.pack_id AND evidence_packs.tenant_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM evidence_packs WHERE evidence_packs.id = evidence_pack_items.pack_id AND evidence_packs.tenant_id = auth.uid()
    )
  );

-- =====================================================
-- 4. TRIGGERS (updated_at)
-- =====================================================

DROP TRIGGER IF EXISTS set_updated_at_evidence_packs ON evidence_packs;
CREATE TRIGGER set_updated_at_evidence_packs BEFORE UPDATE ON evidence_packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. FUNCTIONS (CASCADE DROP for idempotency)
-- =====================================================

-- Create evidence pack
DO $$
BEGIN
  DROP FUNCTION IF EXISTS create_evidence_pack CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION create_evidence_pack(
  p_tenant_id UUID,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_purpose TEXT DEFAULT NULL,
  p_created_by UUID DEFAULT NULL,
  p_period_start TIMESTAMPTZ DEFAULT NULL,
  p_period_end TIMESTAMPTZ DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_pack_id UUID;
BEGIN
  INSERT INTO evidence_packs (tenant_id, name, description, purpose, created_by, period_start, period_end, metadata)
  VALUES (p_tenant_id, p_name, p_description, p_purpose, COALESCE(p_created_by, p_tenant_id), p_period_start, p_period_end, p_metadata)
  RETURNING id INTO v_pack_id;

  RETURN v_pack_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add item to evidence pack
DO $$
BEGIN
  DROP FUNCTION IF EXISTS add_evidence_pack_item CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION add_evidence_pack_item(
  p_pack_id UUID,
  p_item_type evidence_item_type,
  p_item_id UUID,
  p_item_title TEXT,
  p_item_summary TEXT DEFAULT NULL,
  p_item_data JSONB DEFAULT '{}'::jsonb,
  p_attached_file_url TEXT DEFAULT NULL,
  p_item_order INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_item_id UUID;
BEGIN
  INSERT INTO evidence_pack_items (pack_id, item_type, item_id, item_title, item_summary, item_data, attached_file_url, item_order)
  VALUES (p_pack_id, p_item_type, p_item_id, p_item_title, p_item_summary, p_item_data, p_attached_file_url, p_item_order)
  RETURNING id INTO v_item_id;

  RETURN v_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update pack status
DO $$
BEGIN
  DROP FUNCTION IF EXISTS update_evidence_pack_status CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION update_evidence_pack_status(
  p_pack_id UUID,
  p_status evidence_pack_status,
  p_reviewed_by UUID DEFAULT NULL,
  p_export_format TEXT DEFAULT NULL,
  p_export_url TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE evidence_packs
  SET
    status = p_status,
    reviewed_by = COALESCE(p_reviewed_by, reviewed_by),
    approved_at = CASE WHEN p_status = 'approved' AND approved_at IS NULL THEN now() ELSE approved_at END,
    exported_at = CASE WHEN p_status = 'exported' AND exported_at IS NULL THEN now() ELSE exported_at END,
    export_format = COALESCE(p_export_format, export_format),
    export_url = COALESCE(p_export_url, export_url)
  WHERE id = p_pack_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pack summary
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_evidence_pack_summary CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION get_evidence_pack_summary(p_pack_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'pack_id', ep.id,
    'name', ep.name,
    'description', ep.description,
    'purpose', ep.purpose,
    'status', ep.status,
    'created_at', ep.created_at,
    'period_start', ep.period_start,
    'period_end', ep.period_end,
    'total_items', COUNT(epi.id),
    'items_by_type', jsonb_object_agg(
      COALESCE(epi.item_type::text, 'none'),
      COUNT(epi.id)
    ) FILTER (WHERE epi.item_type IS NOT NULL),
    'export_format', ep.export_format,
    'export_url', ep.export_url
  ) INTO v_result
  FROM evidence_packs ep
  LEFT JOIN evidence_pack_items epi ON epi.pack_id = ep.id
  WHERE ep.id = p_pack_id
  GROUP BY ep.id, ep.name, ep.description, ep.purpose, ep.status, ep.created_at, ep.period_start, ep.period_end, ep.export_format, ep.export_url;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List evidence packs
DO $$
BEGIN
  DROP FUNCTION IF EXISTS list_evidence_packs CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION list_evidence_packs(
  p_tenant_id UUID,
  p_status evidence_pack_status DEFAULT NULL,
  p_purpose TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  purpose TEXT,
  status evidence_pack_status,
  created_by UUID,
  item_count BIGINT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ep.id,
    ep.name,
    ep.description,
    ep.purpose,
    ep.status,
    ep.created_by,
    COUNT(epi.id) AS item_count,
    ep.created_at,
    ep.updated_at
  FROM evidence_packs ep
  LEFT JOIN evidence_pack_items epi ON epi.pack_id = ep.id
  WHERE ep.tenant_id = p_tenant_id
    AND (p_status IS NULL OR ep.status = p_status)
    AND (p_purpose IS NULL OR ep.purpose = p_purpose)
  GROUP BY ep.id
  ORDER BY ep.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- List items in pack
DO $$
BEGIN
  DROP FUNCTION IF EXISTS list_pack_items CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION list_pack_items(p_pack_id UUID)
RETURNS TABLE (
  id UUID,
  item_type evidence_item_type,
  item_id UUID,
  item_title TEXT,
  item_summary TEXT,
  attached_file_url TEXT,
  item_order INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    epi.id,
    epi.item_type,
    epi.item_id,
    epi.item_title,
    epi.item_summary,
    epi.attached_file_url,
    epi.item_order,
    epi.created_at
  FROM evidence_pack_items epi
  WHERE epi.pack_id = p_pack_id
  ORDER BY epi.item_order, epi.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE evidence_packs IS 'E32: Evidence pack bundles for auditors/insurers';
COMMENT ON TABLE evidence_pack_items IS 'E32: Individual items within evidence packs';

-- Migration complete
