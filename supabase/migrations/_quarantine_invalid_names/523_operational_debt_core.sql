-- Phase E34: Operational Debt Register
-- Migration: 523
-- Purpose: Track long-lived governance, security, compliance, and code debt
-- Tables: operational_debt, operational_debt_updates
-- Functions: list_operational_debt, create_operational_debt, add_debt_update
-- RLS: All tables tenant-scoped

-- =====================================================
-- 1. ENUMS (Idempotent)
-- =====================================================

DO $$ BEGIN
  CREATE TYPE debt_category AS ENUM ('security', 'compliance', 'architecture', 'data', 'process', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE debt_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE debt_status AS ENUM ('open', 'in_progress', 'blocked', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. TABLES (Idempotent - drop if exists)
-- =====================================================

DROP TABLE IF EXISTS operational_debt_updates CASCADE;
DROP TABLE IF EXISTS operational_debt CASCADE;

-- Operational Debt
CREATE TABLE operational_debt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category debt_category NOT NULL DEFAULT 'other',
  severity debt_severity NOT NULL,
  status debt_status NOT NULL DEFAULT 'open',
  owner TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_operational_debt_tenant ON operational_debt(tenant_id);
CREATE INDEX idx_operational_debt_status_severity ON operational_debt(tenant_id, status, severity);
CREATE INDEX idx_operational_debt_category ON operational_debt(category);

-- Debt Updates Timeline
CREATE TABLE operational_debt_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES operational_debt(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  author TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_debt_updates_debt ON operational_debt_updates(debt_id, created_at DESC);

-- =====================================================
-- 3. RLS POLICIES
-- =====================================================

ALTER TABLE operational_debt ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_debt_updates ENABLE ROW LEVEL SECURITY;

-- Operational Debt: Tenant-scoped
DROP POLICY IF EXISTS operational_debt_tenant_isolation ON operational_debt;
CREATE POLICY operational_debt_tenant_isolation ON operational_debt
  FOR ALL
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Debt Updates: Via debt tenant_id
DROP POLICY IF EXISTS debt_updates_tenant_isolation ON operational_debt_updates;
CREATE POLICY debt_updates_tenant_isolation ON operational_debt_updates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM operational_debt od
      WHERE od.id = operational_debt_updates.debt_id
        AND od.tenant_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM operational_debt od
      WHERE od.id = operational_debt_updates.debt_id
        AND od.tenant_id = auth.uid()
    )
  );

-- =====================================================
-- 4. TRIGGERS (updated_at)
-- =====================================================

DROP TRIGGER IF EXISTS set_updated_at_operational_debt ON operational_debt;
CREATE TRIGGER set_updated_at_operational_debt BEFORE UPDATE ON operational_debt
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. FUNCTIONS (CASCADE DROP for idempotency)
-- =====================================================

-- List operational debt
DO $$
BEGIN
  DROP FUNCTION IF EXISTS list_operational_debt CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION list_operational_debt(
  p_tenant_id UUID,
  p_status debt_status DEFAULT NULL,
  p_severity debt_severity DEFAULT NULL,
  p_category debt_category DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  category debt_category,
  severity debt_severity,
  status debt_status,
  owner TEXT,
  description TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    od.id,
    od.title,
    od.category,
    od.severity,
    od.status,
    od.owner,
    od.description,
    od.created_at,
    od.updated_at,
    od.resolved_at
  FROM operational_debt od
  WHERE od.tenant_id = p_tenant_id
    AND (p_status IS NULL OR od.status = p_status)
    AND (p_severity IS NULL OR od.severity = p_severity)
    AND (p_category IS NULL OR od.category = p_category)
  ORDER BY od.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create operational debt
DO $$
BEGIN
  DROP FUNCTION IF EXISTS create_operational_debt CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION create_operational_debt(
  p_tenant_id UUID,
  p_title TEXT,
  p_category debt_category,
  p_severity debt_severity,
  p_description TEXT DEFAULT NULL,
  p_owner TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_debt_id UUID;
BEGIN
  INSERT INTO operational_debt (tenant_id, title, category, severity, description, owner)
  VALUES (p_tenant_id, p_title, p_category, p_severity, p_description, p_owner)
  RETURNING id INTO v_debt_id;

  RETURN v_debt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update debt status
DO $$
BEGIN
  DROP FUNCTION IF EXISTS update_debt_status CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION update_debt_status(
  p_debt_id UUID,
  p_status debt_status
)
RETURNS VOID AS $$
BEGIN
  UPDATE operational_debt
  SET
    status = p_status,
    resolved_at = CASE WHEN p_status = 'resolved' THEN now() ELSE resolved_at END
  WHERE id = p_debt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add debt update
DO $$
BEGIN
  DROP FUNCTION IF EXISTS add_debt_update CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION add_debt_update(
  p_debt_id UUID,
  p_message TEXT,
  p_author TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_update_id UUID;
BEGIN
  INSERT INTO operational_debt_updates (debt_id, message, author)
  VALUES (p_debt_id, p_message, p_author)
  RETURNING id INTO v_update_id;

  RETURN v_update_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get debt summary
DO $$
BEGIN
  DROP FUNCTION IF EXISTS get_debt_summary CASCADE;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION get_debt_summary(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_debt', COUNT(*),
    'open', COUNT(*) FILTER (WHERE status = 'open'),
    'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'blocked', COUNT(*) FILTER (WHERE status = 'blocked'),
    'resolved', COUNT(*) FILTER (WHERE status = 'resolved'),
    'critical', COUNT(*) FILTER (WHERE severity = 'critical'),
    'high', COUNT(*) FILTER (WHERE severity = 'high'),
    'by_category', jsonb_object_agg(
      category::text,
      cat_count
    )
  ) INTO v_result
  FROM operational_debt od
  CROSS JOIN LATERAL (
    SELECT COUNT(*) as cat_count
    FROM operational_debt od2
    WHERE od2.tenant_id = p_tenant_id
      AND od2.category = od.category
  ) counts
  WHERE od.tenant_id = p_tenant_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. COMMENTS
-- =====================================================

COMMENT ON TABLE operational_debt IS 'E34: Operational debt tracking for governance, security, compliance';
COMMENT ON TABLE operational_debt_updates IS 'E34: Timeline of updates on operational debt items';

-- Migration complete
