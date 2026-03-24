-- Migration: hub_satellites table
-- One row per owned satellite business. Tracks last sweep data,
-- health status, and aggregated KPIs for the Unite-Group Hub dashboard.
-- Date: 24/03/2026

CREATE TABLE IF NOT EXISTS hub_satellites (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_key            TEXT NOT NULL,
  business_name           TEXT NOT NULL,
  repo_url                TEXT,
  stack                   TEXT CHECK (stack IN ('next.js', 'fastapi', 'wordpress', 'static', 'prisma', 'other')),
  open_linear_issues      INTEGER NOT NULL DEFAULT 0,
  last_commit_sha         TEXT,
  last_commit_at          TIMESTAMPTZ,
  last_macas_verdict_date TIMESTAMPTZ,
  last_bookkeeper_run_date TIMESTAMPTZ,
  health_status           TEXT NOT NULL DEFAULT 'unknown'
                          CHECK (health_status IN ('green', 'yellow', 'red', 'unknown')),
  notes                   TEXT,
  last_sweep_data         JSONB NOT NULL DEFAULT '{}',
  last_swept_at           TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(founder_id, business_key)
);

-- RLS
ALTER TABLE hub_satellites ENABLE ROW LEVEL SECURITY;

CREATE POLICY hub_satellites_select ON hub_satellites
  FOR SELECT USING (founder_id = auth.uid());

CREATE POLICY hub_satellites_insert ON hub_satellites
  FOR INSERT WITH CHECK (founder_id = auth.uid());

CREATE POLICY hub_satellites_update ON hub_satellites
  FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());

CREATE POLICY hub_satellites_delete ON hub_satellites
  FOR DELETE USING (founder_id = auth.uid());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hub_satellites_founder ON hub_satellites(founder_id);

-- updated_at trigger
CREATE TRIGGER update_hub_satellites_updated_at
  BEFORE UPDATE ON hub_satellites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
