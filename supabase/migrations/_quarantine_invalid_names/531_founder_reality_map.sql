-- Phase E42: Founder Reality Map v1
-- Migration: 531
-- Description: Snapshot-style aggregation of key governance/ops signals into founder-facing reality panels.

-- Drop existing objects (idempotent)
DROP TABLE IF EXISTS founder_reality_snapshots CASCADE;
DROP TABLE IF EXISTS founder_reality_panels CASCADE;

DO $$ BEGIN
  CREATE TYPE reality_panel_status AS ENUM ('active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE reality_level AS ENUM ('healthy', 'watch', 'stress', 'critical', 'unknown');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Reality Panels (panel definitions)
CREATE TABLE founder_reality_panels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status reality_panel_status NOT NULL DEFAULT 'active',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

-- Reality Snapshots (time-series panel readings)
CREATE TABLE founder_reality_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  panel_code TEXT NOT NULL,
  score NUMERIC,
  level reality_level NOT NULL DEFAULT 'unknown',
  summary TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE founder_reality_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_reality_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY founder_reality_panels_tenant_policy ON founder_reality_panels
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

CREATE POLICY founder_reality_snapshots_tenant_policy ON founder_reality_snapshots
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- Indexes
CREATE INDEX idx_founder_reality_panels_tenant_code ON founder_reality_panels (tenant_id, code);
CREATE INDEX idx_founder_reality_panels_status ON founder_reality_panels (tenant_id, status, created_at DESC);

CREATE INDEX idx_founder_reality_snapshots_tenant_panel ON founder_reality_snapshots (tenant_id, panel_code, created_at DESC);
CREATE INDEX idx_founder_reality_snapshots_level ON founder_reality_snapshots (tenant_id, level, created_at DESC);

-- Functions
DROP FUNCTION IF EXISTS record_reality_panel CASCADE;
CREATE OR REPLACE FUNCTION record_reality_panel(
  p_tenant_id UUID,
  p_code TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_panel_id UUID;
BEGIN
  INSERT INTO founder_reality_panels (tenant_id, code, title, description, metadata)
  VALUES (p_tenant_id, p_code, p_title, p_description, p_metadata)
  ON CONFLICT (tenant_id, code) DO UPDATE
  SET title = EXCLUDED.title,
      description = EXCLUDED.description,
      metadata = EXCLUDED.metadata,
      updated_at = now()
  RETURNING id INTO v_panel_id;

  RETURN v_panel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS record_reality_snapshot CASCADE;
CREATE OR REPLACE FUNCTION record_reality_snapshot(
  p_tenant_id UUID,
  p_panel_code TEXT,
  p_score NUMERIC DEFAULT NULL,
  p_level reality_level DEFAULT 'unknown',
  p_summary TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_snapshot_id UUID;
BEGIN
  INSERT INTO founder_reality_snapshots (tenant_id, panel_code, score, level, summary, metadata)
  VALUES (p_tenant_id, p_panel_code, p_score, p_level, p_summary, p_metadata)
  RETURNING id INTO v_snapshot_id;

  RETURN v_snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS list_reality_panels CASCADE;
CREATE OR REPLACE FUNCTION list_reality_panels(
  p_tenant_id UUID,
  p_status reality_panel_status DEFAULT NULL
)
RETURNS SETOF founder_reality_panels AS $$
BEGIN
  RETURN QUERY
  SELECT rp.*
  FROM founder_reality_panels rp
  WHERE rp.tenant_id = p_tenant_id
    AND (p_status IS NULL OR rp.status = p_status)
  ORDER BY rp.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_latest_reality_snapshots CASCADE;
CREATE OR REPLACE FUNCTION get_latest_reality_snapshots(
  p_tenant_id UUID,
  p_panel_code TEXT DEFAULT NULL
)
RETURNS SETOF founder_reality_snapshots AS $$
BEGIN
  IF p_panel_code IS NOT NULL THEN
    RETURN QUERY
    SELECT rs.*
    FROM founder_reality_snapshots rs
    WHERE rs.tenant_id = p_tenant_id
      AND rs.panel_code = p_panel_code
    ORDER BY rs.created_at DESC
    LIMIT 1;
  ELSE
    -- Return latest snapshot per panel
    RETURN QUERY
    SELECT DISTINCT ON (rs.panel_code) rs.*
    FROM founder_reality_snapshots rs
    WHERE rs.tenant_id = p_tenant_id
    ORDER BY rs.panel_code, rs.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_reality_map_summary CASCADE;
CREATE OR REPLACE FUNCTION get_reality_map_summary(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_panels', COUNT(DISTINCT rp.code),
    'active_panels', COUNT(DISTINCT rp.code) FILTER (WHERE rp.status = 'active'),
    'critical_panels', COUNT(DISTINCT rs.panel_code) FILTER (WHERE rs.level = 'critical' AND rs.id IN (
      SELECT DISTINCT ON (rs2.panel_code) rs2.id
      FROM founder_reality_snapshots rs2
      WHERE rs2.tenant_id = p_tenant_id
      ORDER BY rs2.panel_code, rs2.created_at DESC
    )),
    'avg_score', AVG(rs.score) FILTER (WHERE rs.score IS NOT NULL AND rs.id IN (
      SELECT DISTINCT ON (rs3.panel_code) rs3.id
      FROM founder_reality_snapshots rs3
      WHERE rs3.tenant_id = p_tenant_id
      ORDER BY rs3.panel_code, rs3.created_at DESC
    ))
  ) INTO v_result
  FROM founder_reality_panels rp
  LEFT JOIN founder_reality_snapshots rs ON rs.tenant_id = rp.tenant_id AND rs.panel_code = rp.code
  WHERE rp.tenant_id = p_tenant_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
