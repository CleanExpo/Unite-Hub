-- Migration 582: Guardian Replay Engine
-- Purpose: Reconstruct past system state using captured telemetry slices

-- Table 1: Replay Sessions
CREATE TABLE IF NOT EXISTS guardian_replay_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  source_kind TEXT NOT NULL CHECK (source_kind IN ('telemetry','warehouse','mixed')),
  status TEXT NOT NULL CHECK (status IN ('pending','ready','running','completed','failed')) DEFAULT 'ready',
  range_start TIMESTAMPTZ NOT NULL,
  range_end TIMESTAMPTZ NOT NULL,
  created_by TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guardian_replay_sessions_tenant_time
  ON guardian_replay_sessions (tenant_id, created_at DESC);

CREATE INDEX idx_guardian_replay_sessions_status
  ON guardian_replay_sessions (tenant_id, status) WHERE status IN ('running', 'pending');

ALTER TABLE guardian_replay_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_replay_sessions ON guardian_replay_sessions
  FOR SELECT USING (tenant_id = auth.uid());

COMMENT ON TABLE guardian_replay_sessions IS 'Guardian G27: Replay sessions for reconstructing past system state';

-- Table 2: Replay Events
CREATE TABLE IF NOT EXISTS guardian_replay_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  session_id UUID NOT NULL REFERENCES guardian_replay_sessions(id) ON DELETE CASCADE,
  source_table TEXT NOT NULL CHECK (source_table IN ('guardian_telemetry_events','guardian_warehouse_events','other')),
  source_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  level TEXT CHECK (level IN ('debug','info','warn','error','critical')),
  stream_key TEXT,
  payload JSONB NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_guardian_replay_events_tenant_session_time
  ON guardian_replay_events (tenant_id, session_id, occurred_at DESC);

CREATE INDEX idx_guardian_replay_events_level
  ON guardian_replay_events (tenant_id, session_id, level) WHERE level IN ('error', 'critical');

ALTER TABLE guardian_replay_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_replay_events ON guardian_replay_events
  FOR SELECT USING (tenant_id = auth.uid());

COMMENT ON TABLE guardian_replay_events IS 'Guardian G27: Captured events for replay sessions';
