-- Migration 181: Incident Postmortem Intelligence Engine
-- Phase 138: Structured postmortems for incidents and failures

-- Postmortems table
CREATE TABLE IF NOT EXISTS incident_postmortems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('regression', 'campaign_failure', 'system_error', 'safety_breach', 'other')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  facts JSONB NOT NULL DEFAULT '[]',
  hypotheses JSONB DEFAULT '[]',
  root_causes JSONB DEFAULT '[]',
  lessons JSONB DEFAULT '[]',
  linked_patterns JSONB DEFAULT '[]',
  linked_training JSONB DEFAULT '[]',
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  uncertainty_notes TEXT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'review', 'published', 'archived')) DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_postmortems_tenant ON incident_postmortems(tenant_id);
CREATE INDEX IF NOT EXISTS idx_postmortems_type ON incident_postmortems(incident_type);
CREATE INDEX IF NOT EXISTS idx_postmortems_status ON incident_postmortems(status);

-- RLS
ALTER TABLE incident_postmortems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view postmortems" ON incident_postmortems;
CREATE POLICY "Users can view postmortems" ON incident_postmortems
  FOR SELECT USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can manage postmortems" ON incident_postmortems;
CREATE POLICY "Users can manage postmortems" ON incident_postmortems
  FOR ALL USING (
    tenant_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid())
  );
