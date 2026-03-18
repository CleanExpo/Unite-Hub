-- =============================================================================
-- Migration: Add xero_entry_id to advisory_cases
-- Date: 19/03/2026
-- Purpose: Store Xero ManualJournal ID when an advisory verdict is executed
--          and a journal entry is posted to Xero.
-- =============================================================================

ALTER TABLE advisory_cases
  ADD COLUMN IF NOT EXISTS xero_entry_id TEXT;

COMMENT ON COLUMN advisory_cases.xero_entry_id
  IS 'Xero ManualJournal ID created when this advisory verdict is executed. NULL when Xero is not connected or the entry was advisory-only.';
