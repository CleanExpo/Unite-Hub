-- Phase E44: Multi-Agent Cross-Domain Intelligence Bus
-- Migration: 533
-- Description: Normalised signal bus for cross-domain agent insights and observations.

-- Drop existing objects (idempotent)
DROP TABLE IF EXISTS intelligence_signals CASCADE;

DO $$ BEGIN
  CREATE TYPE intelligence_domain AS ENUM ('seo', 'ops', 'security', 'product', 'market', 'finance', 'content', 'social', 'governance', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE intelligence_kind AS ENUM ('observation', 'insight', 'recommendation', 'alert', 'anomaly', 'pattern', 'forecast', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Intelligence Signals (cross-domain agent messages)
CREATE TABLE intelligence_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_agent TEXT NOT NULL,
  domain intelligence_domain NOT NULL DEFAULT 'other',
  kind intelligence_kind NOT NULL DEFAULT 'observation',
  title TEXT,
  summary TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  importance INTEGER DEFAULT 0 CHECK (importance >= 0 AND importance <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE intelligence_signals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY intelligence_signals_tenant_policy ON intelligence_signals
  FOR ALL USING (tenant_id = auth.uid()) WITH CHECK (tenant_id = auth.uid());

-- Indexes
CREATE INDEX idx_intelligence_signals_tenant_created ON intelligence_signals (tenant_id, created_at DESC);
CREATE INDEX idx_intelligence_signals_domain ON intelligence_signals (tenant_id, domain, created_at DESC);
CREATE INDEX idx_intelligence_signals_kind ON intelligence_signals (tenant_id, kind, created_at DESC);
CREATE INDEX idx_intelligence_signals_importance ON intelligence_signals (tenant_id, importance DESC, created_at DESC);
CREATE INDEX idx_intelligence_signals_source ON intelligence_signals (tenant_id, source_agent, created_at DESC);

-- Functions
DROP FUNCTION IF EXISTS record_intelligence_signal CASCADE;
CREATE OR REPLACE FUNCTION record_intelligence_signal(
  p_tenant_id UUID,
  p_source_agent TEXT,
  p_domain intelligence_domain,
  p_kind intelligence_kind,
  p_title TEXT DEFAULT NULL,
  p_summary TEXT DEFAULT NULL,
  p_payload JSONB DEFAULT '{}'::jsonb,
  p_importance INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_signal_id UUID;
BEGIN
  INSERT INTO intelligence_signals (tenant_id, source_agent, domain, kind, title, summary, payload, importance)
  VALUES (p_tenant_id, p_source_agent, p_domain, p_kind, p_title, p_summary, p_payload, p_importance)
  RETURNING id INTO v_signal_id;

  RETURN v_signal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS list_intelligence_signals CASCADE;
CREATE OR REPLACE FUNCTION list_intelligence_signals(
  p_tenant_id UUID,
  p_domain intelligence_domain DEFAULT NULL,
  p_kind intelligence_kind DEFAULT NULL,
  p_source_agent TEXT DEFAULT NULL,
  p_min_importance INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 300
)
RETURNS SETOF intelligence_signals AS $$
BEGIN
  RETURN QUERY
  SELECT isig.*
  FROM intelligence_signals isig
  WHERE isig.tenant_id = p_tenant_id
    AND (p_domain IS NULL OR isig.domain = p_domain)
    AND (p_kind IS NULL OR isig.kind = p_kind)
    AND (p_source_agent IS NULL OR isig.source_agent = p_source_agent)
    AND (p_min_importance IS NULL OR isig.importance >= p_min_importance)
  ORDER BY isig.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS get_intelligence_summary CASCADE;
CREATE OR REPLACE FUNCTION get_intelligence_summary(
  p_tenant_id UUID,
  p_hours INTEGER DEFAULT 24
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_since TIMESTAMPTZ;
BEGIN
  v_since := now() - (p_hours || ' hours')::interval;

  SELECT jsonb_build_object(
    'total_signals', COUNT(*),
    'by_domain', (
      SELECT jsonb_object_agg(isig_domain.domain, isig_domain.count)
      FROM (
        SELECT isig.domain, COUNT(*) as count
        FROM intelligence_signals isig
        WHERE isig.tenant_id = p_tenant_id
          AND isig.created_at >= v_since
        GROUP BY isig.domain
      ) isig_domain
    ),
    'by_kind', (
      SELECT jsonb_object_agg(isig_kind.kind, isig_kind.count)
      FROM (
        SELECT isig.kind, COUNT(*) as count
        FROM intelligence_signals isig
        WHERE isig.tenant_id = p_tenant_id
          AND isig.created_at >= v_since
        GROUP BY isig.kind
      ) isig_kind
    ),
    'high_importance', COUNT(*) FILTER (WHERE isig.importance >= 75),
    'alerts', COUNT(*) FILTER (WHERE isig.kind = 'alert'),
    'anomalies', COUNT(*) FILTER (WHERE isig.kind = 'anomaly')
  ) INTO v_result
  FROM intelligence_signals isig
  WHERE isig.tenant_id = p_tenant_id
    AND isig.created_at >= v_since;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
