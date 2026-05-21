-- =============================================================================
-- Migration: email_triage + RLS fixes + Xero encryption + performance indexes
-- Date: 20/03/2026
-- Covers: migrations 20260318000001, 20260319000000, 20260319000001,
--         20260319000003, 20260319000004 (consolidated — all confirmed applied)
-- Also fixes: auto_research_runs + trend_insights RLS (legacy tables, no founder_id)
-- =============================================================================

-- ============================================================
-- 1. email_triage_results
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_triage_results (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_email    TEXT NOT NULL,
  thread_id        TEXT NOT NULL,
  subject          TEXT,
  from_email       TEXT,
  category         TEXT NOT NULL,
  action           TEXT NOT NULL,
  priority         INTEGER DEFAULT 3,
  reason           TEXT,
  linear_issue_id  TEXT,
  auto_applied     BOOLEAN DEFAULT FALSE,
  applied_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (founder_id, account_email, thread_id)
);
CREATE INDEX IF NOT EXISTS idx_email_triage_founder ON public.email_triage_results(founder_id);
CREATE INDEX IF NOT EXISTS idx_email_triage_account ON public.email_triage_results(account_email);
CREATE INDEX IF NOT EXISTS idx_email_triage_created ON public.email_triage_results(created_at DESC);
ALTER TABLE public.email_triage_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "founder_only" ON public.email_triage_results;
CREATE POLICY "founder_only" ON public.email_triage_results USING (founder_id = auth.uid());
DROP POLICY IF EXISTS "founder_email_triage_insert" ON public.email_triage_results;
CREATE POLICY "founder_email_triage_insert" ON public.email_triage_results FOR INSERT WITH CHECK (founder_id = auth.uid());
DROP POLICY IF EXISTS "founder_email_triage_update" ON public.email_triage_results;
CREATE POLICY "founder_email_triage_update" ON public.email_triage_results FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
DROP POLICY IF EXISTS "founder_email_triage_delete" ON public.email_triage_results;
CREATE POLICY "founder_email_triage_delete" ON public.email_triage_results FOR DELETE USING (founder_id = auth.uid());

-- ============================================================
-- 2. advisory_cases.xero_entry_id
-- ============================================================
ALTER TABLE public.advisory_cases ADD COLUMN IF NOT EXISTS xero_entry_id TEXT;
COMMENT ON COLUMN public.advisory_cases.xero_entry_id
  IS 'Xero ManualJournal ID created when this advisory verdict is executed. NULL when Xero not connected or advisory-only.';

-- ============================================================
-- 3. bookkeeper_transactions encryption columns (UNI-1593)
-- ============================================================
ALTER TABLE public.bookkeeper_transactions
  ADD COLUMN IF NOT EXISTS raw_xero_data_encrypted TEXT,
  ADD COLUMN IF NOT EXISTS raw_xero_data_iv        TEXT,
  ADD COLUMN IF NOT EXISTS raw_xero_data_salt      TEXT;
UPDATE public.bookkeeper_transactions SET raw_xero_data = NULL WHERE raw_xero_data IS NOT NULL;

-- ============================================================
-- 4. Performance indexes (UNI-1594, column-existence guarded)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='experiments') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_experiments_founder_status ON public.experiments (founder_id, status, created_at DESC)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='experiment_results') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_experiment_results_period ON public.experiment_results (experiment_id, period_date DESC)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='credentials_vault') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_credentials_vault_service ON public.credentials_vault (founder_id, service)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='nexus_databases' AND column_name='owner_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_nexus_databases_owner ON public.nexus_databases (owner_id, business_id)';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='connected_projects' AND column_name='owner_id') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_connected_projects_owner ON public.connected_projects (owner_id)';
  END IF;
END $$;

-- ============================================================
-- 5. RLS on legacy tables (NodeJS-Starter-V1, no founder_id — service_role only)
-- ============================================================
ALTER TABLE public.auto_research_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_only" ON public.auto_research_runs;
CREATE POLICY "service_role_only" ON public.auto_research_runs
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.trend_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role_only" ON public.trend_insights;
CREATE POLICY "service_role_only" ON public.trend_insights
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
