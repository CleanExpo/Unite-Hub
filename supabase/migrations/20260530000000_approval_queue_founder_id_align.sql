-- =============================================================================
-- Migration: Align approval_queue with canonical (founder_id) schema
-- Description:
--   The live sandbox `approval_queue` carried the legacy `_archive/507`
--   shape (owner_id / workspace_id, summary / content_json) because that
--   CREATE TABLE IF NOT EXISTS ran before the canonical
--   `20260309000000_nexus_schema.sql` definition. The application code and
--   generated `src/types/database.ts` expect the canonical founder-scoped
--   columns, so `/api/dashboard/stats` errored (column founder_id missing)
--   and silently zeroed the dashboard counts.
--
--   The table is EMPTY (0 rows), so this is an additive, zero-data-loss
--   change. Legacy-only columns are left in place (nullable, unused) to keep
--   the change surgical and trivially reversible.
-- Rollback:
--   ALTER TABLE approval_queue
--     DROP COLUMN founder_id, DROP COLUMN description, DROP COLUMN payload,
--     DROP COLUMN business_id, DROP COLUMN expires_at, DROP COLUMN approved_at,
--     DROP COLUMN executed_at;
--   DROP INDEX IF EXISTS idx_approval_queue_founder_status;
--   -- then recreate the legacy owner_id policies if required.
-- =============================================================================

-- ── Canonical columns (additive; safe NOT NULL on empty table) ──────────────
ALTER TABLE public.approval_queue
  ADD COLUMN IF NOT EXISTS founder_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS payload     jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS expires_at  timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS executed_at timestamptz;

-- ── Canonical index ─────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_approval_queue_founder_status
  ON public.approval_queue (founder_id, status);

-- ── RLS: replace legacy owner_id policies with canonical founder_id ─────────
ALTER TABLE public.approval_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS approval_queue_select ON public.approval_queue;
DROP POLICY IF EXISTS approval_queue_insert ON public.approval_queue;
DROP POLICY IF EXISTS approval_queue_update ON public.approval_queue;
DROP POLICY IF EXISTS approval_queue_delete ON public.approval_queue;

CREATE POLICY approval_queue_select ON public.approval_queue
  FOR SELECT USING (founder_id = auth.uid());

CREATE POLICY approval_queue_insert ON public.approval_queue
  FOR INSERT WITH CHECK (founder_id = auth.uid());

CREATE POLICY approval_queue_update ON public.approval_queue
  FOR UPDATE USING (founder_id = auth.uid())
  WITH CHECK (founder_id = auth.uid());

CREATE POLICY approval_queue_delete ON public.approval_queue
  FOR DELETE USING (founder_id = auth.uid());
