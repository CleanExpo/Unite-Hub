-- Migration 316: Self-Healing Jobs and Patches
-- Purpose: Track production issues and AI-proposed patches for Founder-governed self-healing
-- Generated: 2025-11-29
--
-- VERIFIED SCHEMA:
-- - profiles.role uses user_role ENUM ('FOUNDER', 'STAFF', 'CLIENT', 'ADMIN')
-- - Uses public schema for all tables and functions
-- - References observability_logs.id and observability_anomalies.id for linking

-- ============================================
-- SELF-HEALING JOBS TABLE
-- Tracks detected production issues that may be auto-patched
-- ============================================

CREATE TABLE IF NOT EXISTS self_healing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route TEXT NOT NULL,
  error_signature TEXT NOT NULL,
  error_category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM',
  status TEXT NOT NULL DEFAULT 'PENDING',
  occurrences INTEGER NOT NULL DEFAULT 1,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  related_observability_log_ids UUID[] DEFAULT '{}',
  related_anomaly_ids UUID[] DEFAULT '{}',
  ai_summary TEXT,
  ai_recommended_actions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments
COMMENT ON TABLE self_healing_jobs IS 'Tracks detected production issues that may be auto-patched by the self-healing engine.';
COMMENT ON COLUMN self_healing_jobs.error_category IS 'Category: RLS_VIOLATION, AUTH_FAILURE, SSR_HYDRATION, API_SCHEMA, PERFORMANCE, UI_BUG, REDIRECT_LOOP, DB_ERROR, UNKNOWN';
COMMENT ON COLUMN self_healing_jobs.severity IS 'LOW, MEDIUM, HIGH, CRITICAL';
COMMENT ON COLUMN self_healing_jobs.status IS 'PENDING, ANALYSING, PATCH_GENERATED, AWAITING_APPROVAL, APPROVED, APPLIED_SANDBOX, APPLIED_MAIN, REJECTED, FAILED';

-- Create unique constraint for deduplication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'self_healing_jobs_route_signature_unique'
  ) THEN
    ALTER TABLE self_healing_jobs ADD CONSTRAINT self_healing_jobs_route_signature_unique
      UNIQUE (route, error_signature);
  END IF;
END $$;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_self_healing_jobs_status
  ON self_healing_jobs(status);

CREATE INDEX IF NOT EXISTS idx_self_healing_jobs_severity
  ON self_healing_jobs(severity);

CREATE INDEX IF NOT EXISTS idx_self_healing_jobs_category
  ON self_healing_jobs(error_category);

CREATE INDEX IF NOT EXISTS idx_self_healing_jobs_created_at
  ON self_healing_jobs(created_at DESC);

-- ============================================
-- SELF-HEALING PATCHES TABLE
-- AI-proposed patches linked to jobs
-- ============================================

CREATE TABLE IF NOT EXISTS self_healing_patches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES self_healing_jobs(id) ON DELETE CASCADE,
  patch_type TEXT NOT NULL,
  description TEXT NOT NULL,
  files_changed TEXT[] NOT NULL DEFAULT '{}',
  sql_migration_path TEXT,
  sandbox_branch TEXT DEFAULT 'self-healing-sandbox',
  ai_diff_proposal TEXT,
  ai_patch_payload JSONB,
  confidence_score NUMERIC(5,2) DEFAULT 0.70,
  status TEXT NOT NULL DEFAULT 'PROPOSED',
  created_by TEXT DEFAULT 'AI_PHILL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add comments
COMMENT ON TABLE self_healing_patches IS 'AI-proposed patches for self-healing, linked to self_healing_jobs.';
COMMENT ON COLUMN self_healing_patches.patch_type IS 'FILE_EDIT, SQL_MIGRATION, CONFIG_CHANGE, TEST_FIX';
COMMENT ON COLUMN self_healing_patches.status IS 'PROPOSED, VALIDATED, AWAITING_APPROVAL, APPROVED, APPLIED_SANDBOX, APPLIED_MAIN, REJECTED, FAILED';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_self_healing_patches_job_id
  ON self_healing_patches(job_id);

CREATE INDEX IF NOT EXISTS idx_self_healing_patches_status
  ON self_healing_patches(status);

-- ============================================
-- SELF-HEALING DECISIONS TABLE
-- Audit trail of founder decisions
-- ============================================

CREATE TABLE IF NOT EXISTS self_healing_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES self_healing_jobs(id) ON DELETE CASCADE,
  patch_id UUID REFERENCES self_healing_patches(id) ON DELETE SET NULL,
  decision TEXT NOT NULL,
  decision_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  decision_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE self_healing_decisions IS 'Audit trail of founder approval/rejection decisions for self-healing.';
COMMENT ON COLUMN self_healing_decisions.decision IS 'APPROVED, REJECTED, APPLY_SANDBOX, APPLY_MAIN, DEFERRED';

CREATE INDEX IF NOT EXISTS idx_self_healing_decisions_job_id
  ON self_healing_decisions(job_id);

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE self_healing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_healing_patches ENABLE ROW LEVEL SECURITY;
ALTER TABLE self_healing_decisions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: FOUNDER/ADMIN + service operations
-- ============================================

-- Self-healing jobs: FOUNDER/ADMIN can read/write
DO $$
BEGIN
  DROP POLICY IF EXISTS "self_healing_jobs_founder_admin_all" ON self_healing_jobs;

  CREATE POLICY "self_healing_jobs_founder_admin_all" ON self_healing_jobs
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('ADMIN', 'FOUNDER')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('ADMIN', 'FOUNDER')
      )
    );

  RAISE NOTICE 'self_healing_jobs policies created';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'self_healing_jobs policy error: %', SQLERRM;
END $$;

-- Allow service-level inserts (for automated error recording)
DO $$
BEGIN
  DROP POLICY IF EXISTS "self_healing_jobs_service_insert" ON self_healing_jobs;

  CREATE POLICY "self_healing_jobs_service_insert" ON self_healing_jobs
    FOR INSERT WITH CHECK (true);

  RAISE NOTICE 'self_healing_jobs service insert policy created';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'self_healing_jobs service policy error: %', SQLERRM;
END $$;

-- Self-healing patches: FOUNDER/ADMIN can read/write
DO $$
BEGIN
  DROP POLICY IF EXISTS "self_healing_patches_founder_admin_all" ON self_healing_patches;

  CREATE POLICY "self_healing_patches_founder_admin_all" ON self_healing_patches
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('ADMIN', 'FOUNDER')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('ADMIN', 'FOUNDER')
      )
    );

  RAISE NOTICE 'self_healing_patches policies created';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'self_healing_patches policy error: %', SQLERRM;
END $$;

-- Allow service-level inserts for patches
DO $$
BEGIN
  DROP POLICY IF EXISTS "self_healing_patches_service_insert" ON self_healing_patches;

  CREATE POLICY "self_healing_patches_service_insert" ON self_healing_patches
    FOR INSERT WITH CHECK (true);

  RAISE NOTICE 'self_healing_patches service insert policy created';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'self_healing_patches service policy error: %', SQLERRM;
END $$;

-- Self-healing decisions: FOUNDER/ADMIN can read/write
DO $$
BEGIN
  DROP POLICY IF EXISTS "self_healing_decisions_founder_admin_all" ON self_healing_decisions;

  CREATE POLICY "self_healing_decisions_founder_admin_all" ON self_healing_decisions
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('ADMIN', 'FOUNDER')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('ADMIN', 'FOUNDER')
      )
    );

  RAISE NOTICE 'self_healing_decisions policies created';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'self_healing_decisions policy error: %', SQLERRM;
END $$;

-- ============================================
-- HELPER FUNCTION: Upsert self-healing job
-- Handles deduplication by route + signature
-- ============================================

CREATE OR REPLACE FUNCTION public.upsert_self_healing_job(
  p_route TEXT,
  p_error_signature TEXT,
  p_error_category TEXT,
  p_severity TEXT DEFAULT 'MEDIUM',
  p_ai_summary TEXT DEFAULT NULL,
  p_observability_log_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
  v_existing_logs UUID[];
BEGIN
  -- Try to find existing job
  SELECT id, related_observability_log_ids INTO v_job_id, v_existing_logs
  FROM self_healing_jobs
  WHERE route = p_route AND error_signature = p_error_signature;

  IF v_job_id IS NOT NULL THEN
    -- Update existing job
    UPDATE self_healing_jobs
    SET
      occurrences = occurrences + 1,
      last_seen_at = now(),
      updated_at = now(),
      severity = CASE
        WHEN p_severity = 'CRITICAL' THEN 'CRITICAL'
        WHEN p_severity = 'HIGH' AND severity NOT IN ('CRITICAL') THEN 'HIGH'
        ELSE severity
      END,
      related_observability_log_ids = CASE
        WHEN p_observability_log_id IS NOT NULL
          AND NOT (v_existing_logs @> ARRAY[p_observability_log_id])
        THEN array_append(v_existing_logs, p_observability_log_id)
        ELSE v_existing_logs
      END
    WHERE id = v_job_id;

    RETURN v_job_id;
  ELSE
    -- Create new job
    INSERT INTO self_healing_jobs (
      route, error_signature, error_category, severity, ai_summary,
      related_observability_log_ids
    ) VALUES (
      p_route, p_error_signature, p_error_category, p_severity, p_ai_summary,
      CASE WHEN p_observability_log_id IS NOT NULL
        THEN ARRAY[p_observability_log_id]
        ELSE '{}'::UUID[]
      END
    ) RETURNING id INTO v_job_id;

    RETURN v_job_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.upsert_self_healing_job(TEXT, TEXT, TEXT, TEXT, TEXT, UUID) TO authenticated;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.update_self_healing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  DROP TRIGGER IF EXISTS self_healing_jobs_updated_at ON self_healing_jobs;
  CREATE TRIGGER self_healing_jobs_updated_at
    BEFORE UPDATE ON self_healing_jobs
    FOR EACH ROW EXECUTE FUNCTION public.update_self_healing_updated_at();

  DROP TRIGGER IF EXISTS self_healing_patches_updated_at ON self_healing_patches;
  CREATE TRIGGER self_healing_patches_updated_at
    BEFORE UPDATE ON self_healing_patches
    FOR EACH ROW EXECUTE FUNCTION public.update_self_healing_updated_at();
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run after migration to verify:
-- SELECT tablename FROM pg_tables WHERE tablename LIKE 'self_healing%';
-- SELECT proname FROM pg_proc WHERE proname = 'upsert_self_healing_job';
