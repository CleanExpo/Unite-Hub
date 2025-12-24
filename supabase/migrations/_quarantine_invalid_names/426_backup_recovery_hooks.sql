-- Migration 426: Backup & Disaster Recovery Hooks (Phase E11)
-- Metadata tracking for backup and restore operations

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS restore_jobs CASCADE;
DROP TABLE IF EXISTS backup_artifacts CASCADE;
DROP TABLE IF EXISTS backup_jobs CASCADE;

-- Enums (idempotent)
DO $$ BEGIN
  CREATE TYPE backup_scope AS ENUM ('global', 'tenant', 'database', 'storage');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE backup_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Backup Jobs table
CREATE TABLE backup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL for global backups
  scope backup_scope NOT NULL DEFAULT 'tenant',
  status backup_status NOT NULL DEFAULT 'pending',
  storage_location TEXT, -- S3 URL, local path, etc.
  backup_size_bytes BIGINT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb, -- backup-specific config
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_backup_jobs_tenant ON backup_jobs(tenant_id, created_at DESC);
CREATE INDEX idx_backup_jobs_scope ON backup_jobs(scope, created_at DESC);
CREATE INDEX idx_backup_jobs_status ON backup_jobs(status, created_at DESC);
CREATE INDEX idx_backup_jobs_created ON backup_jobs(created_at DESC);

-- RLS for backup_jobs
ALTER TABLE backup_jobs ENABLE ROW LEVEL SECURITY;

-- Tenants can see their own backups; admins can see global backups
CREATE POLICY backup_jobs_access ON backup_jobs
  FOR ALL
  USING (
    tenant_id = auth.uid() OR
    (tenant_id IS NULL AND EXISTS (
      SELECT 1 FROM user_roles_v2
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM roles_v2 WHERE name = 'owner'
      )
    ))
  );

-- Backup Artifacts table (individual backup files/resources)
CREATE TABLE backup_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_job_id UUID NOT NULL REFERENCES backup_jobs(id) ON DELETE CASCADE,
  artifact_type TEXT NOT NULL, -- 'database', 'files', 'config', 'media'
  storage_location TEXT NOT NULL,
  file_size_bytes BIGINT,
  checksum TEXT, -- SHA-256 or MD5 hash
  compression TEXT, -- 'gzip', 'zstd', 'none'
  encryption BOOLEAN NOT NULL DEFAULT FALSE,
  retention_until TIMESTAMPTZ, -- auto-delete after this date
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_backup_artifacts_job ON backup_artifacts(backup_job_id);
CREATE INDEX idx_backup_artifacts_type ON backup_artifacts(artifact_type);
CREATE INDEX idx_backup_artifacts_retention ON backup_artifacts(retention_until);

-- Restore Jobs table
CREATE TABLE restore_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scope backup_scope NOT NULL DEFAULT 'tenant',
  source_backup_id UUID REFERENCES backup_jobs(id) ON DELETE SET NULL,
  source_artifact_id UUID REFERENCES backup_artifacts(id) ON DELETE SET NULL,
  status backup_status NOT NULL DEFAULT 'pending',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  notes TEXT,
  restoration_notes TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_restore_jobs_tenant ON restore_jobs(tenant_id, created_at DESC);
CREATE INDEX idx_restore_jobs_scope ON restore_jobs(scope, created_at DESC);
CREATE INDEX idx_restore_jobs_status ON restore_jobs(status, created_at DESC);
CREATE INDEX idx_restore_jobs_backup ON restore_jobs(source_backup_id);
CREATE INDEX idx_restore_jobs_created ON restore_jobs(created_at DESC);

-- RLS for restore_jobs
ALTER TABLE restore_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY restore_jobs_access ON restore_jobs
  FOR ALL
  USING (
    tenant_id = auth.uid() OR
    (tenant_id IS NULL AND EXISTS (
      SELECT 1 FROM user_roles_v2
      WHERE user_id = auth.uid() AND role_id IN (
        SELECT id FROM roles_v2 WHERE name = 'owner'
      )
    ))
  );

-- Function: Register backup job
CREATE OR REPLACE FUNCTION register_backup_job(
  p_tenant_id UUID,
  p_scope backup_scope DEFAULT 'tenant',
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO backup_jobs (
    tenant_id,
    scope,
    notes,
    metadata,
    created_by
  )
  VALUES (
    p_tenant_id,
    p_scope,
    p_notes,
    p_metadata,
    p_created_by
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Complete backup job
CREATE OR REPLACE FUNCTION complete_backup_job(
  p_job_id UUID,
  p_status backup_status,
  p_storage_location TEXT DEFAULT NULL,
  p_backup_size_bytes BIGINT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
BEGIN
  SELECT started_at INTO v_started_at
  FROM backup_jobs
  WHERE id = p_job_id;

  UPDATE backup_jobs
  SET
    status = p_status,
    storage_location = p_storage_location,
    backup_size_bytes = p_backup_size_bytes,
    finished_at = now(),
    duration_ms = EXTRACT(EPOCH FROM (now() - v_started_at))::INTEGER * 1000,
    error_message = p_error_message
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Register restore job
CREATE OR REPLACE FUNCTION register_restore_job(
  p_tenant_id UUID,
  p_scope backup_scope DEFAULT 'tenant',
  p_source_backup_id UUID DEFAULT NULL,
  p_source_artifact_id UUID DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO restore_jobs (
    tenant_id,
    scope,
    source_backup_id,
    source_artifact_id,
    notes,
    metadata,
    created_by
  )
  VALUES (
    p_tenant_id,
    p_scope,
    p_source_backup_id,
    p_source_artifact_id,
    p_notes,
    p_metadata,
    p_created_by
  )
  RETURNING id INTO v_job_id;

  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Complete restore job
CREATE OR REPLACE FUNCTION complete_restore_job(
  p_job_id UUID,
  p_status backup_status,
  p_restoration_notes TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
BEGIN
  SELECT started_at INTO v_started_at
  FROM restore_jobs
  WHERE id = p_job_id;

  UPDATE restore_jobs
  SET
    status = p_status,
    restoration_notes = p_restoration_notes,
    finished_at = now(),
    duration_ms = EXTRACT(EPOCH FROM (now() - v_started_at))::INTEGER * 1000,
    error_message = p_error_message
  WHERE id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION register_backup_job TO authenticated;
GRANT EXECUTE ON FUNCTION complete_backup_job TO authenticated;
GRANT EXECUTE ON FUNCTION register_restore_job TO authenticated;
GRANT EXECUTE ON FUNCTION complete_restore_job TO authenticated;
