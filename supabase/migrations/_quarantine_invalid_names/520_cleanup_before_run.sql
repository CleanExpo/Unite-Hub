-- Cleanup script: Run BEFORE migration 520 if tables already exist
-- Only needed if you get "column tenant_id does not exist" error

DROP TABLE IF EXISTS sla_reports CASCADE;
DROP TABLE IF EXISTS sla_incidents CASCADE;
DROP TABLE IF EXISTS uptime_checks CASCADE;
DROP TABLE IF EXISTS sla_definitions CASCADE;

-- Drop ENUMs if they exist
DROP TYPE IF EXISTS sla_incident_status CASCADE;
DROP TYPE IF EXISTS sla_incident_severity CASCADE;
DROP TYPE IF EXISTS uptime_check_status CASCADE;
DROP TYPE IF EXISTS sla_target_type CASCADE;

-- Now safe to run migration 520
