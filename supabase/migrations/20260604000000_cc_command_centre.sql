-- ============================================================
-- Nexus Command Centre — Task Schema (CC-03)
-- Spec: NEXUS_AUTONOMOUS_COMMAND_CENTER_SPEC.md §6 (data model)
-- Build queue: NEXUS_BUILD_QUEUE_PLAN.md CC-03
-- Date: 2026-06-04
-- Author: Hermes Agent / Pi-CEO Board
--
-- Additive only. No destructive changes to existing tables.
-- Follows the existing RLS pattern: founder_id = auth.uid()
-- (mirrors 20260603000000_knowledge_schema_phase1.sql).
--
-- Tables added:
--   1. cc_tasks            — durable task records behind the queue
--   2. cc_task_events      — append-only audit trail per task
--   3. cc_evidence_records — evidence notes linked to a task
--
-- A reversible "-- DOWN / rollback" section is at the foot of the file.
-- APPLY TARGET: "Unite-Group Test" project (xgqwfwqumliuguzhshwv) — NOT production.
-- Apply via the Supabase SQL editor (paste everything above the DOWN line), or via
-- the MCP once a permission rule for apply_migration is added. Remote migration apply
-- is gated by the harness, so it is performed deliberately, never silently.
-- Companion: 20260604010000_cc_command_centre_phase2.sql (remaining data-model tables).
-- ============================================================

-- ============================================================
-- 1. CC_TASKS (durable task records)
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_tasks (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Stable external key (e.g. the RunQueueStore id 'run_<taskId>'); unique per founder.
  external_ref            TEXT,
  queue_id                UUID,
  project_id              UUID,
  -- Free-text project key/name for callers without a cc_projects row yet.
  project_key             TEXT,
  title                   TEXT NOT NULL,
  objective               TEXT NOT NULL DEFAULT '',
  priority                TEXT NOT NULL DEFAULT 'P2'
                          CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
  status                  TEXT NOT NULL DEFAULT 'proposed'
                          CHECK (status IN ('proposed', 'queued', 'running', 'blocked',
                                            'awaiting_approval', 'done', 'failed')),
  agent_owner             TEXT,
  risk_level              TEXT NOT NULL DEFAULT 'low'
                          CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  execution_mode          TEXT NOT NULL DEFAULT 'advisory'
                          CHECK (execution_mode IN ('advisory', 'local-code', 'branch-preview', 'overnight')),
  origin                  TEXT NOT NULL DEFAULT 'idea'
                          CHECK (origin IN ('idea', 'board-review', 'blocker', 'self-improvement')),
  dependencies            UUID[] NOT NULL DEFAULT '{}',
  human_approval_required BOOLEAN NOT NULL DEFAULT TRUE,
  evidence_path           TEXT,
  validation_required     TEXT[] NOT NULL DEFAULT '{}',
  linear_id               TEXT,
  preview_url             TEXT,
  metadata                JSONB NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(founder_id, external_ref)
);

COMMENT ON TABLE cc_tasks IS 'Durable Command Centre task records behind the autonomous work queue (CC-03)';
COMMENT ON COLUMN cc_tasks.external_ref IS 'Stable external key, e.g. the RunQueueStore id run_<taskId>';
COMMENT ON COLUMN cc_tasks.status IS 'proposed/queued/running/blocked/awaiting_approval/done/failed';

-- ============================================================
-- 2. CC_TASK_EVENTS (append-only audit trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_task_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id     UUID NOT NULL REFERENCES cc_tasks(id) ON DELETE CASCADE,
  type        TEXT NOT NULL
              CHECK (type IN ('created', 'status_changed', 'approved', 'blocked',
                              'started', 'completed', 'failed', 'evidence_added',
                              'comment', 'linear_synced')),
  actor       TEXT NOT NULL DEFAULT 'system',
  payload     JSONB NOT NULL DEFAULT '{}',
  at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cc_task_events IS 'Append-only audit trail of every Command Centre task transition (CC-03)';

-- ============================================================
-- 3. CC_EVIDENCE_RECORDS (evidence notes linked to a task)
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_evidence_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id     UUID NOT NULL REFERENCES cc_tasks(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL DEFAULT 'brief'
              CHECK (kind IN ('brief', 'research', 'decision', 'validation', 'handoff', 'daily')),
  wiki_path   TEXT NOT NULL,
  sources     JSONB NOT NULL DEFAULT '[]',
  confidence  TEXT NOT NULL DEFAULT 'medium'
              CHECK (confidence IN ('high', 'medium', 'low')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE cc_evidence_records IS 'Evidence notes (wiki paths + sources) linked to a Command Centre task (CC-03)';

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS cc_tasks_founder_status_idx
  ON cc_tasks(founder_id, status);

CREATE INDEX IF NOT EXISTS cc_tasks_founder_project_idx
  ON cc_tasks(founder_id, project_key);

CREATE INDEX IF NOT EXISTS cc_tasks_dependencies_idx
  ON cc_tasks USING GIN(dependencies);

CREATE INDEX IF NOT EXISTS cc_task_events_task_idx
  ON cc_task_events(task_id, at DESC);

CREATE INDEX IF NOT EXISTS cc_task_events_founder_idx
  ON cc_task_events(founder_id, at DESC);

CREATE INDEX IF NOT EXISTS cc_evidence_records_task_idx
  ON cc_evidence_records(task_id, created_at DESC);

CREATE INDEX IF NOT EXISTS cc_evidence_records_founder_idx
  ON cc_evidence_records(founder_id, created_at DESC);

-- ============================================================
-- 5. RLS POLICIES (founder-scoped, mirrors knowledge_* pattern)
-- ============================================================

ALTER TABLE cc_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_task_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cc_evidence_records ENABLE ROW LEVEL SECURITY;

-- cc_tasks: founder owns full CRUD on their own rows.
CREATE POLICY cc_tasks_select ON cc_tasks
  FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY cc_tasks_insert ON cc_tasks
  FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY cc_tasks_update ON cc_tasks
  FOR UPDATE USING (founder_id = auth.uid())
  WITH CHECK (founder_id = auth.uid());
CREATE POLICY cc_tasks_delete ON cc_tasks
  FOR DELETE USING (founder_id = auth.uid());

-- cc_task_events: append-only — SELECT + INSERT only, scoped to the founder
-- AND to a task the founder owns. No UPDATE/DELETE policies (immutable audit).
CREATE POLICY cc_task_events_select ON cc_task_events
  FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY cc_task_events_insert ON cc_task_events
  FOR INSERT WITH CHECK (
    founder_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM cc_tasks t
      WHERE t.id = cc_task_events.task_id
        AND t.founder_id = auth.uid()
    )
  );

-- cc_evidence_records: founder-scoped SELECT + INSERT, linked to an owned task.
CREATE POLICY cc_evidence_records_select ON cc_evidence_records
  FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY cc_evidence_records_insert ON cc_evidence_records
  FOR INSERT WITH CHECK (
    founder_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM cc_tasks t
      WHERE t.id = cc_evidence_records.task_id
        AND t.founder_id = auth.uid()
    )
  );

-- ============================================================
-- 6. TRIGGER: auto-update cc_tasks.updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION cc_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cc_tasks_updated_at
  BEFORE UPDATE ON cc_tasks
  FOR EACH ROW EXECUTE FUNCTION cc_update_updated_at_column();

-- ============================================================
-- DOWN / rollback  (drop in reverse dependency order)
-- ============================================================
-- Run the statements below to fully reverse this migration.
--
-- DROP TRIGGER IF EXISTS cc_tasks_updated_at ON cc_tasks;
-- DROP FUNCTION IF EXISTS cc_update_updated_at_column();
--
-- DROP POLICY IF EXISTS cc_evidence_records_insert ON cc_evidence_records;
-- DROP POLICY IF EXISTS cc_evidence_records_select ON cc_evidence_records;
-- DROP POLICY IF EXISTS cc_task_events_insert ON cc_task_events;
-- DROP POLICY IF EXISTS cc_task_events_select ON cc_task_events;
-- DROP POLICY IF EXISTS cc_tasks_delete ON cc_tasks;
-- DROP POLICY IF EXISTS cc_tasks_update ON cc_tasks;
-- DROP POLICY IF EXISTS cc_tasks_insert ON cc_tasks;
-- DROP POLICY IF EXISTS cc_tasks_select ON cc_tasks;
--
-- DROP INDEX IF EXISTS cc_evidence_records_founder_idx;
-- DROP INDEX IF EXISTS cc_evidence_records_task_idx;
-- DROP INDEX IF EXISTS cc_task_events_founder_idx;
-- DROP INDEX IF EXISTS cc_task_events_task_idx;
-- DROP INDEX IF EXISTS cc_tasks_dependencies_idx;
-- DROP INDEX IF EXISTS cc_tasks_founder_project_idx;
-- DROP INDEX IF EXISTS cc_tasks_founder_status_idx;
--
-- DROP TABLE IF EXISTS cc_evidence_records;
-- DROP TABLE IF EXISTS cc_task_events;
-- DROP TABLE IF EXISTS cc_tasks;
-- ============================================================
