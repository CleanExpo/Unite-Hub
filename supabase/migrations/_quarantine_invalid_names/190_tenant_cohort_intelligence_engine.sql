-- Migration 190: Tenant Cohort Intelligence Engine (TCIE)
-- Phase 147: Clusters tenants into non-identifying cohorts for safe benchmarking

-- Tenant cohorts table
CREATE TABLE IF NOT EXISTS tenant_cohorts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_label TEXT NOT NULL UNIQUE,
  description TEXT,
  clustering_criteria JSONB NOT NULL,
  member_count INTEGER NOT NULL DEFAULT 0,
  min_members_required INTEGER NOT NULL DEFAULT 5,
  similarity_index NUMERIC CHECK (similarity_index >= 0 AND similarity_index <= 1),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenant cohort memberships table (hashed for privacy)
CREATE TABLE IF NOT EXISTS tenant_cohort_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES tenant_cohorts(id) ON DELETE CASCADE,
  tenant_hash TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Cohort intelligence summaries table
CREATE TABLE IF NOT EXISTS cohort_intelligence_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id UUID REFERENCES tenant_cohorts(id) ON DELETE CASCADE,
  summary_type TEXT NOT NULL,
  aggregated_data JSONB NOT NULL,
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenant_cohorts_active ON tenant_cohorts(is_active);
CREATE INDEX IF NOT EXISTS idx_cohort_memberships_cohort ON tenant_cohort_memberships(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_summaries_cohort ON cohort_intelligence_summaries(cohort_id);

-- RLS (cohorts are global but anonymised)
ALTER TABLE tenant_cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_cohort_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_intelligence_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view cohorts" ON tenant_cohorts;
CREATE POLICY "Authenticated users can view cohorts" ON tenant_cohorts
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can view cohort summaries" ON cohort_intelligence_summaries;
CREATE POLICY "Authenticated users can view cohort summaries" ON cohort_intelligence_summaries
  FOR SELECT USING (
    cohort_id IN (SELECT id FROM tenant_cohorts WHERE is_active = true)
  );
