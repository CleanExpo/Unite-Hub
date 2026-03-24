-- Migration: advisory_cases source column
-- Tracks whether a case was created manually or auto-triggered from a bookkeeper run.
-- Date: 24/03/2026

ALTER TABLE advisory_cases
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'auto-bookkeeper'));

-- Index for filtering auto-triggered cases in the UI
CREATE INDEX IF NOT EXISTS advisory_cases_source_idx
  ON advisory_cases (founder_id, source);
