-- Create activity log table
CREATE TABLE IF NOT EXISTS crm_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX idx_crm_activity_logs_user ON crm_activity_logs(user_id);
CREATE INDEX idx_crm_activity_logs_resource ON crm_activity_logs(resource_type, resource_id);
CREATE INDEX idx_crm_activity_logs_created ON crm_activity_logs(created_at);

-- Function to log activity
CREATE OR REPLACE FUNCTION log_crm_activity(
  user_id UUID,
  action VARCHAR,
  resource_type VARCHAR,
  resource_id UUID,
  details JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO crm_activity_logs (user_id, action, resource_type, resource_id, details)
  VALUES (user_id, action, resource_type, resource_id, details);
END;
$$ LANGUAGE plpgsql;

-- Add activity triggers to CRM tables

-- Client activity
CREATE OR REPLACE FUNCTION log_client_activity() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_crm_activity(NEW.created_by, 'create', 'client', NEW.id);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_crm_activity(NEW.created_by, 'update', 'client', NEW.id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_crm_activity(OLD.created_by, 'delete', 'client', OLD.id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_activity_trigger
AFTER INSERT OR UPDATE OR DELETE ON crm_clients
FOR EACH ROW EXECUTE FUNCTION log_client_activity();

-- Project activity
CREATE OR REPLACE FUNCTION log_project_activity() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_crm_activity(NEW.created_by, 'create', 'project', NEW.id);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_crm_activity(NEW.created_by, 'update', 'project', NEW.id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_crm_activity(OLD.created_by, 'delete', 'project', OLD.id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER project_activity_trigger
AFTER INSERT OR UPDATE OR DELETE ON crm_projects
FOR EACH ROW EXECUTE FUNCTION log_project_activity();

-- Task activity
CREATE OR REPLACE FUNCTION log_task_activity() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_crm_activity(NEW.created_by, 'create', 'task', NEW.id);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_crm_activity(NEW.created_by, 'update', 'task', NEW.id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_crm_activity(OLD.created_by, 'delete', 'task', OLD.id);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_activity_trigger
AFTER INSERT OR UPDATE OR DELETE ON crm_tasks
FOR EACH ROW EXECUTE FUNCTION log_task_activity();
