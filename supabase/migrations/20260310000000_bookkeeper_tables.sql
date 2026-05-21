-- ============================================================
-- Bookkeeper Tables — Nightly Reconciliation Engine
-- Date: 10/03/2026
-- Auth: Single-tenant, founder_id = auth.uid()
-- Service role: Full access (CRON job runs as service_role)
-- ============================================================

-- ============================================================
-- BOOKKEEPER RUNS — Audit log of each nightly bookkeeper run
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookkeeper_runs (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  founder_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at            TIMESTAMPTZ NOT NULL,
  completed_at          TIMESTAMPTZ,
  status                TEXT NOT NULL CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  businesses_processed  JSONB NOT NULL DEFAULT '[]',
  total_transactions    INT NOT NULL DEFAULT 0,
  auto_reconciled       INT NOT NULL DEFAULT 0,
  flagged_for_review    INT NOT NULL DEFAULT 0,
  failed_count          INT NOT NULL DEFAULT 0,
  gst_collected_cents   BIGINT NOT NULL DEFAULT 0,
  gst_paid_cents        BIGINT NOT NULL DEFAULT 0,
  net_gst_cents         BIGINT NOT NULL DEFAULT 0,
  error_log             JSONB NOT NULL DEFAULT '[]',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BOOKKEEPER TRANSACTIONS — Individual reconciliation records
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookkeeper_transactions (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id                  UUID NOT NULL REFERENCES public.bookkeeper_runs(id) ON DELETE CASCADE,
  founder_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_key            TEXT NOT NULL,
  xero_tenant_id          TEXT NOT NULL,
  xero_transaction_id     TEXT NOT NULL,
  transaction_date        DATE NOT NULL,
  description             TEXT,
  amount_cents            BIGINT NOT NULL,
  currency                TEXT NOT NULL DEFAULT 'AUD',
  reconciliation_status   TEXT NOT NULL CHECK (reconciliation_status IN (
    'auto_matched', 'suggested_match', 'unmatched', 'manual_review', 'reconciled'
  )),
  confidence_score        NUMERIC(3,2) NOT NULL DEFAULT 0,
  matched_invoice_id      TEXT,
  matched_bill_id         TEXT,
  tax_code                TEXT,
  gst_amount_cents        BIGINT NOT NULL DEFAULT 0,
  tax_category            TEXT,
  is_deductible           BOOLEAN NOT NULL DEFAULT FALSE,
  deduction_category      TEXT,
  deduction_notes         TEXT,
  approval_queue_id       UUID REFERENCES public.approval_queue(id) ON DELETE SET NULL,
  approved_by             UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at             TIMESTAMPTZ,
  raw_xero_data           JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate processing within a single run
  UNIQUE(run_id, xero_transaction_id)
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.bookkeeper_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookkeeper_transactions ENABLE ROW LEVEL SECURITY;

-- BOOKKEEPER_RUNS — Founder read access
DROP POLICY IF EXISTS "bookkeeper_runs_select" ON public.bookkeeper_runs;
CREATE POLICY "bookkeeper_runs_select"
  ON public.bookkeeper_runs FOR SELECT
  USING (founder_id = auth.uid());

-- BOOKKEEPER_RUNS — Service role full access (CRON job)
DROP POLICY IF EXISTS "bookkeeper_runs_service_role" ON public.bookkeeper_runs;
CREATE POLICY "bookkeeper_runs_service_role"
  ON public.bookkeeper_runs FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- BOOKKEEPER_TRANSACTIONS — Founder read access
DROP POLICY IF EXISTS "bookkeeper_transactions_select" ON public.bookkeeper_transactions;
CREATE POLICY "bookkeeper_transactions_select"
  ON public.bookkeeper_transactions FOR SELECT
  USING (founder_id = auth.uid());

-- BOOKKEEPER_TRANSACTIONS — Founder update (approval workflow)
DROP POLICY IF EXISTS "bookkeeper_transactions_update" ON public.bookkeeper_transactions;
CREATE POLICY "bookkeeper_transactions_update"
  ON public.bookkeeper_transactions FOR UPDATE
  USING (founder_id = auth.uid())
  WITH CHECK (founder_id = auth.uid());

-- BOOKKEEPER_TRANSACTIONS — Service role full access (CRON job)
DROP POLICY IF EXISTS "bookkeeper_transactions_service_role" ON public.bookkeeper_transactions;
CREATE POLICY "bookkeeper_transactions_service_role"
  ON public.bookkeeper_transactions FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bookkeeper_runs_founder_status
  ON public.bookkeeper_runs(founder_id, status);

CREATE INDEX IF NOT EXISTS idx_bookkeeper_runs_started_at
  ON public.bookkeeper_runs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_bookkeeper_txns_run_id
  ON public.bookkeeper_transactions(run_id);

CREATE INDEX IF NOT EXISTS idx_bookkeeper_txns_founder_business
  ON public.bookkeeper_transactions(founder_id, business_key);

CREATE INDEX IF NOT EXISTS idx_bookkeeper_txns_status
  ON public.bookkeeper_transactions(reconciliation_status);

CREATE INDEX IF NOT EXISTS idx_bookkeeper_txns_date
  ON public.bookkeeper_transactions(transaction_date DESC);

-- ============================================================
-- UPDATED_AT TRIGGER (reuses existing function)
-- ============================================================
DROP TRIGGER IF EXISTS update_bookkeeper_transactions_updated_at ON public.bookkeeper_transactions;
CREATE TRIGGER update_bookkeeper_transactions_updated_at
  BEFORE UPDATE ON public.bookkeeper_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
