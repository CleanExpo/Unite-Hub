-- Phase E43: Synthex-L1 AI Oversight Loop
-- Migration: 532
-- Description: Tracks AI evaluations of system health, content quality, and governance actions.

-- Drop existing objects (idempotent)
DROP TABLE IF EXISTS ai_oversight_events CASCADE;
DROP TABLE IF EXISTS ai_oversight_policies CASCADE;

DO $$ BEGIN
  CREATE TYPE oversight_policy_status AS ENUM ('active', 'paused', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE oversight_event_level AS ENUM ('info', 'warning', 'risk', 'block');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AI Oversight Policies (what AI checks for)
CREATE TABLE ai_oversight_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status oversight_policy_status NOT NULL DEFAULT 'active',
  threshold NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

-- AI Oversight Events (AI evaluations and alerts)
CREATE TABLE ai_oversight_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_code TEXT NOT NULL,
  level oversight_event_level NOT NULL DEFAULT 'info',
  summary TEXT,
  details TEXT,
  impact_score NUMERIC,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE ai_oversight_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_oversight_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY ai_oversight_policies_tenant_policy ON ai_oversight_policies
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

CREATE POLICY ai_oversight_events_tenant_policy ON ai_oversight_events
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- Indexes
CREATE INDEX idx_ai_oversight_policies_tenant_code ON ai_oversight_policies (tenant_id, code);
CREATE INDEX idx_ai_oversight_policies_status ON ai_oversight_policies (tenant_id, status, created_at DESC);

CREATE INDEX idx_ai_oversight_events_tenant_policy ON ai_oversight_events (tenant_id, policy_code, created_at DESC);
CREATE INDEX idx_ai_oversight_events_level ON ai_oversight_events (tenant_id, level, created_at DESC);

-- Functions
DROP FUNCTION IF EXISTS record_oversight_policy CASCADE;
CREATE OR REPLACE FUNCTION record_oversight_policy(
  p_tenant_id UUID,
  p_code TEXT,
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_threshold NUMERIC DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_policy_id UUID;
BEGIN
  INSERT INTO ai_oversight_policies (tenant_id, code, name, description, threshold, metadata)
  VALUES (p_tenant_id, p_code, p_name, p_description, p_threshold, p_metadata)
  ON CONFLICT (tenant_id, code) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      threshold = EXCLUDED.threshold,
      metadata = EXCLUDED.metadata,
      updated_at = now()
  RETURNING id INTO v_policy_id;

  RETURN v_policy_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS record_oversight_event CASCADE;
CREATE OR REPLACE FUNCTION record_oversight_event(
  p_tenant_id UUID,
  p_policy_code TEXT,
  p_level oversight_event_level,
  p_summary TEXT DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_impact_score NUMERIC DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO ai_oversight_events (tenant_id, policy_code, level, summary, details, impact_score, metadata)
  VALUES (p_tenant_id, p_policy_code, p_level, p_summary, p_details, p_impact_score, p_metadata)
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS list_oversight_policies CASCADE;
CREATE OR REPLACE FUNCTION list_oversight_policies(
  p_tenant_id UUID,
  p_status oversight_policy_status DEFAULT NULL
)
RETURNS SETOF ai_oversight_policies AS $$
BEGIN
  RETURN QUERY
  SELECT op.*
  FROM ai_oversight_policies op
  WHERE op.tenant_id = p_tenant_id
    AND (p_status IS NULL OR op.status = p_status)
  ORDER BY op.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS list_oversight_events CASCADE;
CREATE OR REPLACE FUNCTION list_oversight_events(
  p_tenant_id UUID,
  p_policy_code TEXT DEFAULT NULL,
  p_level oversight_event_level DEFAULT NULL,
  p_limit INTEGER DEFAULT 200
)
RETURNS SETOF ai_oversight_events AS $$
BEGIN
  RETURN QUERY
  SELECT oe.*
  FROM ai_oversight_events oe
  WHERE oe.tenant_id = p_tenant_id
    AND (p_policy_code IS NULL OR oe.policy_code = p_policy_code)
    AND (p_level IS NULL OR oe.level = p_level)
  ORDER BY oe.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_oversight_summary CASCADE;
CREATE OR REPLACE FUNCTION get_oversight_summary(
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_policies', COUNT(DISTINCT op.code),
    'active_policies', COUNT(DISTINCT op.code) FILTER (WHERE op.status = 'active'),
    'total_events', (SELECT COUNT(*) FROM ai_oversight_events oe WHERE oe.tenant_id = p_tenant_id),
    'block_events', (SELECT COUNT(*) FROM ai_oversight_events oe WHERE oe.tenant_id = p_tenant_id AND oe.level = 'block'),
    'risk_events', (SELECT COUNT(*) FROM ai_oversight_events oe WHERE oe.tenant_id = p_tenant_id AND oe.level = 'risk'),
    'warning_events', (SELECT COUNT(*) FROM ai_oversight_events oe WHERE oe.tenant_id = p_tenant_id AND oe.level = 'warning')
  ) INTO v_result
  FROM ai_oversight_policies op
  WHERE op.tenant_id = p_tenant_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
