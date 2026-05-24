-- Migration: 20260326000002_satellite_dispatches
-- Tracks work packages dispatched from Unite-Group CEO to satellite businesses via Linear.

CREATE TABLE satellite_dispatches (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_key      text NOT NULL,
  title             text NOT NULL,
  description       text,
  priority          integer NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 4),
  type              text NOT NULL DEFAULT 'task',
  deadline          date,
  linear_issue_id   text,
  linear_issue_url  text,
  status            text NOT NULL DEFAULT 'dispatched'
                    CHECK (status IN ('dispatched', 'in_progress', 'completed', 'cancelled', 'linear_failed')),
  metadata          jsonb DEFAULT '{}',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX ON satellite_dispatches (founder_id, created_at DESC);
CREATE INDEX ON satellite_dispatches (founder_id, business_key, status);

ALTER TABLE satellite_dispatches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "founder owns satellite_dispatches"
  ON satellite_dispatches FOR ALL
  USING (founder_id = auth.uid());

-- ROLLBACK
-- DROP POLICY IF EXISTS "founder owns satellite_dispatches" ON satellite_dispatches;
-- DROP INDEX IF EXISTS satellite_dispatches_founder_id_business_key_status_idx;
-- DROP INDEX IF EXISTS satellite_dispatches_founder_id_created_at_idx;
-- DROP TABLE IF EXISTS satellite_dispatches;
