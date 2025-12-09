-- =====================================================================
-- Phase D47: Risk & Incident Center (Agents + Delivery Safety)
-- =====================================================================
-- Tables: synthex_risk_events, synthex_incidents, synthex_incident_actions
--
-- Purpose:
-- - Track risk events from agents, delivery systems, and automated workflows
-- - Manage incidents with root cause analysis and AI-powered insights
-- - Define and track remediation actions with ownership and deadlines
--
-- Key Concepts:
-- - Risk events capture anomalies, errors, and warnings across the system
-- - Incidents are formal issues requiring investigation and resolution
-- - Actions are concrete tasks to resolve or mitigate incidents
--
-- Author: Synthex Growth Stack
-- Date: 2025-12-08

-- =====================================================================
-- 1. ENUMs
-- =====================================================================

DO $$ BEGIN
  CREATE TYPE synthex_risk_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE synthex_risk_category AS ENUM ('agent_failure', 'delivery_error', 'rate_limit', 'data_quality', 'security', 'compliance', 'performance', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE synthex_incident_status AS ENUM ('open', 'investigating', 'mitigating', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE synthex_action_status AS ENUM ('pending', 'in_progress', 'blocked', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================
-- 2. Risk Events Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS synthex_risk_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  business_id uuid, -- Optional: specific business affected

  -- Event source
  source_type text NOT NULL, -- 'agent' | 'delivery' | 'api' | 'workflow' | 'system'
  source_ref text, -- Agent name, workflow ID, API endpoint, etc.

  -- Severity & category
  severity synthex_risk_severity NOT NULL,
  category synthex_risk_category NOT NULL,

  -- Event details
  message text NOT NULL,
  context jsonb, -- Additional event data (stack trace, request details, etc.)

  -- Detection
  detected_by text, -- System component or user that detected the event
  created_at timestamptz DEFAULT now(),

  -- Acknowledgement
  acknowledged_at timestamptz
);

-- =====================================================================
-- 3. Incidents Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS synthex_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  business_id uuid, -- Optional: specific business affected

  -- Incident details
  title text NOT NULL,
  status synthex_incident_status NOT NULL DEFAULT 'open',
  severity synthex_risk_severity NOT NULL,

  -- Analysis
  root_cause text, -- Description of root cause
  impact_summary text, -- Impact on business/operations
  ai_analysis jsonb, -- AI-generated insights, recommendations

  -- Timestamps
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz
);

-- =====================================================================
-- 4. Incident Actions Table
-- =====================================================================

CREATE TABLE IF NOT EXISTS synthex_incident_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  incident_id uuid NOT NULL REFERENCES synthex_incidents(id) ON DELETE CASCADE,

  -- Action details
  action_type text NOT NULL, -- 'fix' | 'monitor' | 'rollback' | 'investigate' | 'escalate'
  description text NOT NULL,

  -- Ownership
  owner_user_id uuid, -- User assigned to this action

  -- Status & timeline
  status synthex_action_status NOT NULL DEFAULT 'pending',
  due_at timestamptz,
  completed_at timestamptz,

  -- Metadata
  metadata jsonb,

  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- =====================================================================
-- 5. Indexes
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_synthex_risk_events_tenant ON synthex_risk_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_risk_events_business ON synthex_risk_events(tenant_id, business_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_synthex_risk_events_severity ON synthex_risk_events(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_synthex_risk_events_source ON synthex_risk_events(source_type, source_ref);

CREATE INDEX IF NOT EXISTS idx_synthex_incidents_tenant ON synthex_incidents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_incidents_business ON synthex_incidents(tenant_id, business_id, status, severity);
CREATE INDEX IF NOT EXISTS idx_synthex_incidents_status ON synthex_incidents(status, opened_at DESC);

CREATE INDEX IF NOT EXISTS idx_synthex_incident_actions_tenant ON synthex_incident_actions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_synthex_incident_actions_incident ON synthex_incident_actions(incident_id, status);
CREATE INDEX IF NOT EXISTS idx_synthex_incident_actions_owner ON synthex_incident_actions(owner_user_id, status);

-- =====================================================================
-- 6. Row Level Security (RLS)
-- =====================================================================

ALTER TABLE synthex_risk_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE synthex_incident_actions ENABLE ROW LEVEL SECURITY;

-- Risk Events Policies
CREATE POLICY synthex_risk_events_tenant_isolation ON synthex_risk_events
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Incidents Policies
CREATE POLICY synthex_incidents_tenant_isolation ON synthex_incidents
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Incident Actions Policies
CREATE POLICY synthex_incident_actions_tenant_isolation ON synthex_incident_actions
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- =====================================================================
-- 7. Helper Function: Get Incident Summary
-- =====================================================================

CREATE OR REPLACE FUNCTION synthex_get_incident_summary(
  p_tenant_id uuid,
  p_days integer DEFAULT 7
) RETURNS TABLE(
  total_incidents integer,
  critical_incidents integer,
  open_incidents integer,
  avg_resolution_time_hours numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::integer AS total_incidents,
    COUNT(*) FILTER (WHERE severity = 'critical')::integer AS critical_incidents,
    COUNT(*) FILTER (WHERE status IN ('open', 'investigating', 'mitigating'))::integer AS open_incidents,
    AVG(EXTRACT(EPOCH FROM (closed_at - opened_at)) / 3600)::numeric AS avg_resolution_time_hours
  FROM synthex_incidents
  WHERE tenant_id = p_tenant_id
    AND opened_at >= NOW() - (p_days || ' days')::interval;
END;
$$ LANGUAGE plpgsql STABLE;
