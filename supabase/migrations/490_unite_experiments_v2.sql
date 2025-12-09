-- =====================================================================
-- Phase D62: Experimentation & A/B Testing Framework (Enhanced)
-- =====================================================================
-- Note: This extends D55 experiments with additional features
-- Tables: unite_exp_*, unite_exp_variants, unite_exp_assignments, unite_exp_events
--
-- Migration: 490

DROP TABLE IF EXISTS unite_exp_events CASCADE;
DROP TABLE IF EXISTS unite_exp_assignments CASCADE;
DROP TABLE IF EXISTS unite_exp_variants CASCADE;
DROP TABLE IF EXISTS unite_exp_experiments CASCADE;

CREATE TABLE unite_exp_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  slug text NOT NULL,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft',
  target_area text NOT NULL,
  hypothesis text,
  primary_metric text NOT NULL,
  secondary_metrics text[],
  traffic_allocation jsonb,
  start_at timestamptz,
  end_at timestamptz,
  ai_design jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE unite_exp_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id uuid NOT NULL REFERENCES unite_exp_experiments(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  description text,
  allocation_percent numeric(5,2) NOT NULL,
  config jsonb,
  ai_profile jsonb
);

CREATE TABLE unite_exp_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  experiment_id uuid NOT NULL REFERENCES unite_exp_experiments(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES unite_exp_variants(id) ON DELETE CASCADE,
  subject_type text NOT NULL,
  subject_id text NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  metadata jsonb
);

CREATE TABLE unite_exp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid,
  experiment_id uuid NOT NULL REFERENCES unite_exp_experiments(id) ON DELETE CASCADE,
  variant_id uuid NOT NULL REFERENCES unite_exp_variants(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  value numeric(18,4),
  metadata jsonb,
  occurred_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_unite_exp_experiments_tenant_slug ON unite_exp_experiments(tenant_id, slug);
CREATE INDEX idx_unite_exp_experiments_status ON unite_exp_experiments(tenant_id, status);
CREATE INDEX idx_unite_exp_variants_experiment ON unite_exp_variants(experiment_id);
CREATE INDEX idx_unite_exp_assignments_subject ON unite_exp_assignments(tenant_id, experiment_id, subject_type, subject_id);
CREATE INDEX idx_unite_exp_events_experiment ON unite_exp_events(tenant_id, experiment_id, event_type, occurred_at DESC);

ALTER TABLE unite_exp_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_exp_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE unite_exp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON unite_exp_experiments
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON unite_exp_assignments
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);

CREATE POLICY "tenant_isolation" ON unite_exp_events
  USING (tenant_id IS NULL OR tenant_id = current_setting('app.tenant_id', true)::uuid);
