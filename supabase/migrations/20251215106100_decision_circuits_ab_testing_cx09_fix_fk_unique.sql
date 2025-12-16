-- =====================================================
-- Decision Circuits A/B Testing (CX09) - FK Compatibility Fix
-- Purpose:
--   Later migrations create composite foreign keys referencing
--   circuit_ab_tests(workspace_id, id). Postgres requires the referenced
--   columns to be covered by a UNIQUE/PRIMARY KEY constraint.
--
-- This migration adds a UNIQUE constraint on (workspace_id, id) if missing.
-- Idempotent: checks pg_constraint before adding.
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'circuit_ab_tests'
      AND c.contype = 'u'
      AND c.conname = 'uq_circuit_ab_tests_workspace_id_id'
  ) THEN
    ALTER TABLE public.circuit_ab_tests
      ADD CONSTRAINT uq_circuit_ab_tests_workspace_id_id
      UNIQUE (workspace_id, id);
  END IF;
END $$;
