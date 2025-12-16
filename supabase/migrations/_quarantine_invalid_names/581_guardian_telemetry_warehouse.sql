-- Migration 581: Guardian Telemetry Warehouse
-- Purpose: Long-term telemetry storage with hourly/daily rollups for historical analysis

-- Table 1: Warehouse Events (immutable, append-only)
CREATE TABLE IF NOT EXISTS guardian_warehouse_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  stream_key TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('debug','info','warn','error','critical')),
  payload JSONB NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  source_event_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gw_events_tenant_time ON guardian_warehouse_events (tenant_id, occurred_at DESC);
CREATE INDEX idx_gw_events_stream ON guardian_warehouse_events (tenant_id, stream_key, occurred_at DESC);
CREATE INDEX idx_gw_events_level ON guardian_warehouse_events (tenant_id, level) WHERE level IN ('error', 'critical');

ALTER TABLE guardian_warehouse_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_warehouse_events ON guardian_warehouse_events
  FOR SELECT USING (tenant_id = auth.uid());

COMMENT ON TABLE guardian_warehouse_events IS 'Guardian G26: Long-term telemetry warehouse storage (append-only)';

-- Table 2: Hourly Rollups
CREATE TABLE IF NOT EXISTS guardian_warehouse_hourly_rollups (
  tenant_id UUID NOT NULL,
  stream_key TEXT NOT NULL,
  hour_bucket TIMESTAMPTZ NOT NULL,
  count_total INTEGER NOT NULL DEFAULT 0,
  count_error INTEGER NOT NULL DEFAULT 0,
  count_warn INTEGER NOT NULL DEFAULT 0,
  count_critical INTEGER NOT NULL DEFAULT 0,
  avg_payload_size NUMERIC,
  max_payload_size INTEGER,
  PRIMARY KEY (tenant_id, stream_key, hour_bucket)
);

CREATE INDEX idx_hourly_rollups_tenant_time ON guardian_warehouse_hourly_rollups (tenant_id, hour_bucket DESC);

ALTER TABLE guardian_warehouse_hourly_rollups ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_hourly_rollups ON guardian_warehouse_hourly_rollups
  FOR SELECT USING (tenant_id = auth.uid());

COMMENT ON TABLE guardian_warehouse_hourly_rollups IS 'Guardian G26: Hourly telemetry aggregations';

-- Table 3: Daily Rollups
CREATE TABLE IF NOT EXISTS guardian_warehouse_daily_rollups (
  tenant_id UUID NOT NULL,
  stream_key TEXT NOT NULL,
  day_bucket DATE NOT NULL,
  count_total INTEGER NOT NULL DEFAULT 0,
  count_error INTEGER NOT NULL DEFAULT 0,
  count_warn INTEGER NOT NULL DEFAULT 0,
  count_critical INTEGER NOT NULL DEFAULT 0,
  avg_payload_size NUMERIC,
  max_payload_size INTEGER,
  unique_tags_count INTEGER,
  PRIMARY KEY (tenant_id, stream_key, day_bucket)
);

CREATE INDEX idx_daily_rollups_tenant_time ON guardian_warehouse_daily_rollups (tenant_id, day_bucket DESC);

ALTER TABLE guardian_warehouse_daily_rollups ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_daily_rollups ON guardian_warehouse_daily_rollups
  FOR SELECT USING (tenant_id = auth.uid());

COMMENT ON TABLE guardian_warehouse_daily_rollups IS 'Guardian G26: Daily telemetry aggregations';
