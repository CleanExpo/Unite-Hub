-- Migration 512: Incident Response Workflows (Phase E21)
-- Track outages, data breaches, delivery failures with timeline updates and actions

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS incident_actions CASCADE;
DROP TABLE IF EXISTS incident_updates CASCADE;
DROP TABLE IF EXISTS incidents CASCADE;

-- Incident types
DO $$ BEGIN
  CREATE TYPE incident_type AS ENUM (
    'outage',
    'performance_degradation',
    'data_breach',
    'security_incident',
    'delivery_failure',
    'integration_failure',
    'compliance_violation',
    'api_error',
    'payment_failure',
    'email_bounce',
    'spam_complaint',
    'user_complaint',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Incident statuses
DO $$ BEGIN
  CREATE TYPE incident_status AS ENUM (
    'open',
    'investigating',
    'identified',
    'monitoring',
    'resolved',
    'closed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Incident severities
DO $$ BEGIN
  CREATE TYPE incident_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Incident action statuses
DO $$ BEGIN
  CREATE TYPE incident_action_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Incidents table
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  type incident_type NOT NULL,
  status incident_status NOT NULL DEFAULT 'open',
  severity incident_severity NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  affected_resource TEXT, -- e.g., 'campaign', 'api', 'database'
  affected_resource_id TEXT,
  impact_description TEXT,
  root_cause TEXT,
  resolution_notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_incidents_tenant ON incidents(tenant_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_type ON incidents(type);
CREATE INDEX idx_incidents_detected_at ON incidents(detected_at DESC);
CREATE INDEX idx_incidents_tenant_status ON incidents(tenant_id, status, detected_at DESC);
CREATE INDEX idx_incidents_tenant_severity ON incidents(tenant_id, severity, detected_at DESC);

-- Incident Updates table
CREATE TABLE incident_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  update_text TEXT NOT NULL,
  status_change incident_status,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_incident_updates_incident ON incident_updates(incident_id);
CREATE INDEX idx_incident_updates_tenant ON incident_updates(tenant_id);
CREATE INDEX idx_incident_updates_created_at ON incident_updates(created_at DESC);

-- Incident Actions table
CREATE TABLE incident_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status incident_action_status NOT NULL DEFAULT 'pending',
  assignee UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_incident_actions_incident ON incident_actions(incident_id);
CREATE INDEX idx_incident_actions_tenant ON incident_actions(tenant_id);
CREATE INDEX idx_incident_actions_status ON incident_actions(status);
CREATE INDEX idx_incident_actions_assignee ON incident_actions(assignee);
CREATE INDEX idx_incident_actions_due_at ON incident_actions(due_at);

-- RLS for incidents
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY incidents_read_own ON incidents
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY incidents_tenant_manage ON incidents
  FOR ALL
  USING (tenant_id = auth.uid());

-- RLS for incident_updates
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;

CREATE POLICY incident_updates_read_own ON incident_updates
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY incident_updates_tenant_write ON incident_updates
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- RLS for incident_actions
ALTER TABLE incident_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY incident_actions_read_own ON incident_actions
  FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY incident_actions_tenant_manage ON incident_actions
  FOR ALL
  USING (tenant_id = auth.uid());

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_incident(UUID, TEXT, TEXT, incident_type, incident_severity, UUID, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS add_incident_update(UUID, UUID, UUID, TEXT, incident_status, JSONB);
DROP FUNCTION IF EXISTS create_incident_action(UUID, UUID, TEXT, TEXT, UUID, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS update_incident_status(UUID, UUID, incident_status);
DROP FUNCTION IF EXISTS get_incident_statistics(UUID);

-- Function: Create incident
CREATE OR REPLACE FUNCTION create_incident(
  p_tenant_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_type incident_type,
  p_severity incident_severity,
  p_assigned_to UUID DEFAULT NULL,
  p_affected_resource TEXT DEFAULT NULL,
  p_affected_resource_id TEXT DEFAULT NULL,
  p_impact_description TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_incident_id UUID;
BEGIN
  INSERT INTO incidents (
    tenant_id,
    title,
    description,
    type,
    severity,
    assigned_to,
    affected_resource,
    affected_resource_id,
    impact_description,
    metadata
  ) VALUES (
    p_tenant_id,
    p_title,
    p_description,
    p_type,
    p_severity,
    p_assigned_to,
    p_affected_resource,
    p_affected_resource_id,
    p_impact_description,
    p_metadata
  )
  RETURNING id INTO v_incident_id;

  RETURN v_incident_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Add incident update
CREATE OR REPLACE FUNCTION add_incident_update(
  p_incident_id UUID,
  p_tenant_id UUID,
  p_author_id UUID,
  p_update_text TEXT,
  p_status_change incident_status DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_update_id UUID;
BEGIN
  INSERT INTO incident_updates (
    incident_id,
    tenant_id,
    author_id,
    update_text,
    status_change,
    metadata
  ) VALUES (
    p_incident_id,
    p_tenant_id,
    p_author_id,
    p_update_text,
    p_status_change,
    p_metadata
  )
  RETURNING id INTO v_update_id;

  -- If status changed, update incident
  IF p_status_change IS NOT NULL THEN
    UPDATE incidents
    SET status = p_status_change,
        updated_at = now(),
        acknowledged_at = CASE WHEN p_status_change IN ('investigating', 'identified') AND acknowledged_at IS NULL THEN now() ELSE acknowledged_at END,
        resolved_at = CASE WHEN p_status_change = 'resolved' AND resolved_at IS NULL THEN now() ELSE resolved_at END,
        closed_at = CASE WHEN p_status_change = 'closed' AND closed_at IS NULL THEN now() ELSE closed_at END
    WHERE id = p_incident_id
      AND tenant_id = p_tenant_id;
  END IF;

  RETURN v_update_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Create incident action
CREATE OR REPLACE FUNCTION create_incident_action(
  p_incident_id UUID,
  p_tenant_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_assignee UUID DEFAULT NULL,
  p_due_at TIMESTAMPTZ DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_action_id UUID;
BEGIN
  INSERT INTO incident_actions (
    incident_id,
    tenant_id,
    title,
    description,
    assignee,
    due_at
  ) VALUES (
    p_incident_id,
    p_tenant_id,
    p_title,
    p_description,
    p_assignee,
    p_due_at
  )
  RETURNING id INTO v_action_id;

  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update incident status
CREATE OR REPLACE FUNCTION update_incident_status(
  p_incident_id UUID,
  p_tenant_id UUID,
  p_status incident_status
) RETURNS void AS $$
BEGIN
  UPDATE incidents
  SET status = p_status,
      updated_at = now(),
      acknowledged_at = CASE WHEN p_status IN ('investigating', 'identified') AND acknowledged_at IS NULL THEN now() ELSE acknowledged_at END,
      resolved_at = CASE WHEN p_status = 'resolved' AND resolved_at IS NULL THEN now() ELSE resolved_at END,
      closed_at = CASE WHEN p_status = 'closed' AND closed_at IS NULL THEN now() ELSE closed_at END
  WHERE id = p_incident_id
    AND tenant_id = p_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get incident statistics
CREATE OR REPLACE FUNCTION get_incident_statistics(
  p_tenant_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_total INTEGER;
  v_open INTEGER;
  v_investigating INTEGER;
  v_resolved INTEGER;
  v_critical INTEGER;
  v_by_type JSONB;
  v_by_severity JSONB;
BEGIN
  -- Count by status
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'open'),
    COUNT(*) FILTER (WHERE status = 'investigating'),
    COUNT(*) FILTER (WHERE status = 'resolved'),
    COUNT(*) FILTER (WHERE severity = 'critical')
  INTO v_total, v_open, v_investigating, v_resolved, v_critical
  FROM incidents
  WHERE tenant_id = p_tenant_id;

  -- Count by type
  SELECT jsonb_object_agg(type, count)
  INTO v_by_type
  FROM (
    SELECT type::TEXT, COUNT(*) as count
    FROM incidents
    WHERE tenant_id = p_tenant_id
    GROUP BY type
  ) t;

  -- Count by severity
  SELECT jsonb_object_agg(severity, count)
  INTO v_by_severity
  FROM (
    SELECT severity::TEXT, COUNT(*) as count
    FROM incidents
    WHERE tenant_id = p_tenant_id
    GROUP BY severity
  ) t;

  RETURN jsonb_build_object(
    'total', COALESCE(v_total, 0),
    'open', COALESCE(v_open, 0),
    'investigating', COALESCE(v_investigating, 0),
    'resolved', COALESCE(v_resolved, 0),
    'critical', COALESCE(v_critical, 0),
    'by_type', COALESCE(v_by_type, '{}'::jsonb),
    'by_severity', COALESCE(v_by_severity, '{}'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_incident TO authenticated;
GRANT EXECUTE ON FUNCTION add_incident_update TO authenticated;
GRANT EXECUTE ON FUNCTION create_incident_action TO authenticated;
GRANT EXECUTE ON FUNCTION update_incident_status TO authenticated;
GRANT EXECUTE ON FUNCTION get_incident_statistics TO authenticated;

-- Trigger to update incidents.updated_at
CREATE OR REPLACE FUNCTION update_incident_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER incident_updated_at
  BEFORE UPDATE ON incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_incident_timestamp();

-- Trigger to update incident_actions.updated_at
CREATE OR REPLACE FUNCTION update_incident_action_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.completed_at IS NULL THEN
    NEW.completed_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER incident_action_updated_at
  BEFORE UPDATE ON incident_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_incident_action_timestamp();

-- Auto-cleanup old closed incidents (keep 1 year for compliance)
CREATE OR REPLACE FUNCTION cleanup_old_incidents() RETURNS void AS $$
BEGIN
  DELETE FROM incidents
  WHERE closed_at < now() - interval '1 year'
    AND status = 'closed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_incidents() IS 'Run periodically via cron to delete incidents closed >1 year ago. Call: SELECT cleanup_old_incidents();';
