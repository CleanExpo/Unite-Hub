-- ============================================================
-- Model Operator Gateway — operator_jobs / operator_events (Phase OPG-3)
-- Spec: 2nd-brain/.agentic_nexus/OPERATOR_GATEWAY_DB_UI_ARCHITECTURE.md
-- Board decision: approve_operator_gateway_db_and_ui
-- Date: 2026-06-06
--
-- ⚠️  SANDBOX-FIRST / PROPOSAL ONLY.
--     This file is created for Board + sandbox review. It has NOT been run.
--     APPLY TARGET (when approved): "Unite-Group Test" project (xgqwfwqumliuguzhshwv).
--     DO NOT apply to production. Applying is a separate, explicitly-gated operator action.
--
-- Additive only. Founder-scoped RLS on every table (founder_id = auth.uid()),
-- mirroring 20260604010000_cc_command_centre_phase2.sql. Reversible DOWN block at foot.
--
-- Tables added:
--   operator_jobs    (durable; one row per operator-lane work unit)
--   operator_events  (append-only; immutable per-job timeline)
-- ============================================================

-- ============================================================
-- 1. OPERATOR_JOBS (durable)
-- ============================================================
CREATE TABLE IF NOT EXISTS operator_jobs (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id                   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lane_id                      TEXT NOT NULL,           -- matches OperatorLane.laneId
  title                        TEXT NOT NULL,
  task_type                    TEXT NOT NULL,
  status                       TEXT NOT NULL DEFAULT 'planned'
                               CHECK (status IN ('planned','queued','running','blocked','done','failed','cancelled')),
  -- Hard-gated work is prohibited at the data layer by default. These flags can only
  -- become TRUE via a SEPARATE, explicitly-approved future migration + Board grant.
  external_action_requested    BOOLEAN NOT NULL DEFAULT FALSE,
  production_action_requested  BOOLEAN NOT NULL DEFAULT FALSE,
  -- No operator job may itself request an API key (no-API-key gateway principle).
  api_key_requested            BOOLEAN NOT NULL DEFAULT FALSE
                               CHECK (api_key_requested = FALSE),
  evidence_refs                TEXT[] NOT NULL DEFAULT '{}',
  metadata                     JSONB NOT NULL DEFAULT '{}',
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE operator_jobs IS 'Model Operator Gateway job records (founder-scoped; no live execution in OPG batch)';

-- ============================================================
-- 2. OPERATOR_EVENTS (append-only timeline)
-- ============================================================
CREATE TABLE IF NOT EXISTS operator_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id       UUID NOT NULL REFERENCES operator_jobs(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL
               CHECK (event_type IN ('created','status_changed','evidence_added','gate_blocked','note')),
  from_status  TEXT,
  to_status    TEXT,
  detail       TEXT NOT NULL DEFAULT '',
  evidence_ref TEXT,
  at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE operator_events IS 'Immutable per-job event timeline (append-only; SELECT/INSERT only)';

-- ============================================================
-- 3. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS operator_jobs_founder_status_idx ON operator_jobs(founder_id, status);
CREATE INDEX IF NOT EXISTS operator_jobs_lane_idx           ON operator_jobs(founder_id, lane_id);
CREATE INDEX IF NOT EXISTS operator_events_job_idx          ON operator_events(job_id, at DESC);
CREATE INDEX IF NOT EXISTS operator_events_founder_idx      ON operator_events(founder_id, at DESC);

-- ============================================================
-- 4. RLS (founder-scoped on every table)
-- ============================================================
ALTER TABLE operator_jobs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_events ENABLE ROW LEVEL SECURITY;

-- operator_jobs: full CRUD, founder-owned.
CREATE POLICY operator_jobs_all ON operator_jobs
  FOR ALL USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());

-- operator_events: append-only ⇒ SELECT + INSERT only (no UPDATE/DELETE policy).
-- INSERT additionally requires the parent job to be founder-owned.
CREATE POLICY operator_events_select ON operator_events
  FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY operator_events_insert ON operator_events
  FOR INSERT WITH CHECK (
    founder_id = auth.uid()
    AND EXISTS (SELECT 1 FROM operator_jobs j WHERE j.id = operator_events.job_id AND j.founder_id = auth.uid())
  );

-- ============================================================
-- 5. updated_at trigger (reuse cc_update_updated_at_column from cc_command_centre phase 1)
-- ============================================================
DROP TRIGGER IF EXISTS operator_jobs_updated_at ON operator_jobs;
CREATE TRIGGER operator_jobs_updated_at BEFORE UPDATE ON operator_jobs
  FOR EACH ROW EXECUTE FUNCTION cc_update_updated_at_column();

-- ============================================================
-- DOWN / rollback  (drop in reverse dependency order)
-- ============================================================
-- DROP TRIGGER IF EXISTS operator_jobs_updated_at ON operator_jobs;
-- DROP TABLE IF EXISTS operator_events;
-- DROP TABLE IF EXISTS operator_jobs;
-- ============================================================
