-- =====================================================================
-- Phase D67: Unite Observability & Event Timeline
-- =====================================================================
-- Tables: unite_event_types, unite_events, unite_event_annotations
-- Enables cross-system event tracking, correlation, and operational intelligence
--
-- Migration: 495

DROP TABLE IF EXISTS unite_event_annotations CASCADE;
DROP TABLE IF EXISTS unite_events CASCADE;
DROP TABLE IF EXISTS unite_event_types CASCADE;

-- Event Types - catalog of trackable events
CREATE TABLE unite_event_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  description text,
  schema jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Events - append-only event log
CREATE TABLE unite_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  source text NOT NULL,
  event_type_key text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  message text,
  payload jsonb,
  correlation_id text,
  request_id text,
  actor_type text,
  actor_id uuid,
  context jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  ingested_at timestamptz NOT NULL DEFAULT now()
);

-- Event Annotations - human context on events
CREATE TABLE unite_event_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES unite_events(id) ON DELETE CASCADE,
  author_id uuid,
  note text NOT NULL,
  tags text[],
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE UNIQUE INDEX idx_unite_event_types_key ON unite_event_types(key);
CREATE INDEX idx_unite_events_tenant_occurred ON unite_events(tenant_id, occurred_at DESC);
CREATE INDEX idx_unite_events_severity_occurred ON unite_events(severity, occurred_at DESC);
CREATE INDEX idx_unite_events_correlation ON unite_events(correlation_id);
CREATE INDEX idx_unite_events_event_type ON unite_events(event_type_key, occurred_at DESC);
CREATE INDEX idx_unite_event_annotations_event ON unite_event_annotations(event_id);

-- RLS Policies
ALTER TABLE unite_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_event_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON unite_events
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON unite_event_annotations
  USING (
    event_id IN (
      SELECT id FROM unite_events
      WHERE tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid
    )
  );

-- Helper Functions
CREATE OR REPLACE FUNCTION unite_get_event_summary(p_tenant_id uuid DEFAULT NULL, p_hours integer DEFAULT 24)
RETURNS jsonb AS $$
DECLARE
  v_summary jsonb;
BEGIN
  SELECT jsonb_build_object(
    'total_events', (
      SELECT COUNT(*)
      FROM unite_events
      WHERE (tenant_id = p_tenant_id OR p_tenant_id IS NULL)
        AND occurred_at >= NOW() - (p_hours || ' hours')::interval
    ),
    'errors', (
      SELECT COUNT(*)
      FROM unite_events
      WHERE (tenant_id = p_tenant_id OR p_tenant_id IS NULL)
        AND severity IN ('error', 'critical')
        AND occurred_at >= NOW() - (p_hours || ' hours')::interval
    ),
    'warnings', (
      SELECT COUNT(*)
      FROM unite_events
      WHERE (tenant_id = p_tenant_id OR p_tenant_id IS NULL)
        AND severity = 'warning'
        AND occurred_at >= NOW() - (p_hours || ' hours')::interval
    ),
    'top_source', (
      SELECT source
      FROM unite_events
      WHERE (tenant_id = p_tenant_id OR p_tenant_id IS NULL)
        AND occurred_at >= NOW() - (p_hours || ' hours')::interval
      GROUP BY source
      ORDER BY COUNT(*) DESC
      LIMIT 1
    )
  ) INTO v_summary;

  RETURN v_summary;
END;
$$ LANGUAGE plpgsql;
