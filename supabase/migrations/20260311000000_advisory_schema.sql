-- ============================================================
-- Advisory System Schema — Multi-Agent Competitive Accounting
-- Date: 11/03/2026
-- Auth: Single-tenant, founder_id = auth.uid()
-- ============================================================

-- ============================================================
-- ADVISORY CASES (debate sessions)
-- ============================================================
CREATE TABLE IF NOT EXISTS advisory_cases (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id       UUID REFERENCES businesses(id) ON DELETE SET NULL,
  title             TEXT NOT NULL,
  scenario          TEXT NOT NULL,
  financial_context JSONB NOT NULL DEFAULT '{}',
  status            TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN (
                      'draft','debating','judged','pending_review',
                      'approved','rejected','executed','closed'
                    )),
  current_round     INTEGER NOT NULL DEFAULT 0
                    CHECK (current_round >= 0 AND current_round <= 5),
  total_rounds      INTEGER NOT NULL DEFAULT 5,
  winning_firm      TEXT,
  judge_summary     TEXT,
  judge_scores      JSONB,
  accountant_notes  TEXT,
  reviewed_by       TEXT,
  reviewed_at       TIMESTAMPTZ,
  approval_queue_id UUID REFERENCES approval_queue(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ADVISORY PROPOSALS (per-firm, per-round submissions)
-- ============================================================
CREATE TABLE IF NOT EXISTS advisory_proposals (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id          UUID NOT NULL REFERENCES advisory_cases(id) ON DELETE CASCADE,
  founder_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_key         TEXT NOT NULL
                   CHECK (firm_key IN (
                     'tax_strategy','grants_incentives',
                     'cashflow_optimisation','compliance'
                   )),
  round            INTEGER NOT NULL
                   CHECK (round >= 1 AND round <= 5),
  round_type       TEXT NOT NULL
                   CHECK (round_type IN (
                     'proposal','rebuttal','counterargument',
                     'risk_assessment','final_recommendation'
                   )),
  content          TEXT NOT NULL,
  structured_data  JSONB NOT NULL DEFAULT '{}',
  confidence_score NUMERIC(4,2),
  risk_level       TEXT CHECK (risk_level IN ('low','medium','high','critical')),
  model_used       TEXT,
  input_tokens     INTEGER,
  output_tokens    INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(case_id, firm_key, round)
);

-- ============================================================
-- EVIDENCE LEDGER (ATO citations)
-- ============================================================
CREATE TABLE IF NOT EXISTS advisory_evidence (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id     UUID NOT NULL REFERENCES advisory_proposals(id) ON DELETE CASCADE,
  case_id         UUID NOT NULL REFERENCES advisory_cases(id) ON DELETE CASCADE,
  founder_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  citation_type   TEXT NOT NULL
                  CHECK (citation_type IN (
                    'ato_ruling','legislation','case_law',
                    'ato_guidance','industry_standard'
                  )),
  reference_id    TEXT NOT NULL,
  reference_title TEXT NOT NULL,
  excerpt         TEXT,
  relevance_score NUMERIC(4,2),
  url             TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- JUDGE SCORES (per-firm scoring)
-- ============================================================
CREATE TABLE IF NOT EXISTS advisory_judge_scores (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id                   UUID NOT NULL REFERENCES advisory_cases(id) ON DELETE CASCADE,
  founder_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  firm_key                  TEXT NOT NULL
                            CHECK (firm_key IN (
                              'tax_strategy','grants_incentives',
                              'cashflow_optimisation','compliance'
                            )),
  legality_score            NUMERIC(4,2) NOT NULL,
  compliance_risk_score     NUMERIC(4,2) NOT NULL,
  financial_outcome_score   NUMERIC(4,2) NOT NULL,
  documentation_score       NUMERIC(4,2) NOT NULL,
  ethics_score              NUMERIC(4,2) NOT NULL,
  weighted_total            NUMERIC(5,2) NOT NULL,
  rationale                 TEXT NOT NULL,
  risk_flags                JSONB NOT NULL DEFAULT '[]',
  audit_triggers            JSONB NOT NULL DEFAULT '[]',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(case_id, firm_key)
);

-- ============================================================
-- TRIGGERS (reuse existing update_updated_at_column function)
-- ============================================================
DROP TRIGGER IF EXISTS update_advisory_cases_updated_at ON advisory_cases;
CREATE TRIGGER update_advisory_cases_updated_at
  BEFORE UPDATE ON advisory_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_advisory_cases_founder_status ON advisory_cases(founder_id, status);
CREATE INDEX IF NOT EXISTS idx_advisory_cases_business ON advisory_cases(business_id);
CREATE INDEX IF NOT EXISTS idx_advisory_proposals_case ON advisory_proposals(case_id);
CREATE INDEX IF NOT EXISTS idx_advisory_proposals_case_firm_round ON advisory_proposals(case_id, firm_key, round);
CREATE INDEX IF NOT EXISTS idx_advisory_evidence_proposal ON advisory_evidence(proposal_id);
CREATE INDEX IF NOT EXISTS idx_advisory_evidence_case ON advisory_evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_advisory_judge_scores_case ON advisory_judge_scores(case_id);

-- ============================================================
-- RLS POLICIES (single-tenant: founder_id = auth.uid())
-- ============================================================
ALTER TABLE advisory_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisory_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisory_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisory_judge_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "founder_advisory_cases" ON advisory_cases;
CREATE POLICY "founder_advisory_cases" ON advisory_cases
  FOR ALL USING (founder_id = auth.uid());

DROP POLICY IF EXISTS "founder_advisory_proposals" ON advisory_proposals;
CREATE POLICY "founder_advisory_proposals" ON advisory_proposals
  FOR ALL USING (founder_id = auth.uid());

DROP POLICY IF EXISTS "founder_advisory_evidence" ON advisory_evidence;
CREATE POLICY "founder_advisory_evidence" ON advisory_evidence
  FOR ALL USING (founder_id = auth.uid());

DROP POLICY IF EXISTS "founder_advisory_judge_scores" ON advisory_judge_scores;
CREATE POLICY "founder_advisory_judge_scores" ON advisory_judge_scores
  FOR ALL USING (founder_id = auth.uid());
