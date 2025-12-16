-- ============================================================================
-- Migration: 302_boost_bump_engine.sql
-- Description: Boost Bump Behavioural Assist Engine Tables
-- Created: 2025-11-28
--
-- This migration creates tables for the Boost Bump engine, which manages
-- behavioural assist jobs for improving search rankings through legitimate
-- user engagement signals and rank tracking.
-- ============================================================================

-- ============================================================================
-- 1. BOOST JOBS
-- Primary table for managing boost job requests and execution
-- ============================================================================

CREATE TABLE IF NOT EXISTS boost_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    founder_business_id uuid REFERENCES founder_businesses(id) ON DELETE CASCADE,
    client_id uuid,
    url text NOT NULL,
    keyword_primary text NOT NULL,
    keyword_secondary text,
    geo_target text,
    boost_type text DEFAULT 'standard',
    status text DEFAULT 'pending',
    boosts_remaining int DEFAULT 3,
    created_at timestamptz DEFAULT now(),
    scheduled_at timestamptz,
    executed_at timestamptz,

    CONSTRAINT boost_jobs_boost_type_check CHECK (boost_type IN (
        'standard', 'aggressive', 'geo_targeted', 'video_focused', 'local_pack', 'custom'
    )),
    CONSTRAINT boost_jobs_status_check CHECK (status IN (
        'pending', 'scheduled', 'in_progress', 'completed', 'paused', 'failed', 'cancelled'
    )),
    CONSTRAINT boost_jobs_boosts_remaining_check CHECK (boosts_remaining >= 0)
);

COMMENT ON TABLE boost_jobs IS 'Boost Bump engine job queue for managing behavioural assist requests targeting specific URLs and keywords.';
COMMENT ON COLUMN boost_jobs.founder_business_id IS 'Reference to the founder business owning this job';
COMMENT ON COLUMN boost_jobs.client_id IS 'Optional client reference if job is for a specific client';
COMMENT ON COLUMN boost_jobs.url IS 'Target URL to boost in search rankings';
COMMENT ON COLUMN boost_jobs.keyword_primary IS 'Primary target keyword for the boost';
COMMENT ON COLUMN boost_jobs.keyword_secondary IS 'Optional secondary keyword for broader targeting';
COMMENT ON COLUMN boost_jobs.geo_target IS 'Geographic target region (e.g., Brisbane, AU or US-NY)';
COMMENT ON COLUMN boost_jobs.boost_type IS 'Type of boost: standard, aggressive, geo_targeted, video_focused, local_pack, custom';
COMMENT ON COLUMN boost_jobs.status IS 'Current job status: pending, scheduled, in_progress, completed, paused, failed, cancelled';
COMMENT ON COLUMN boost_jobs.boosts_remaining IS 'Number of boost iterations remaining for this job';
COMMENT ON COLUMN boost_jobs.scheduled_at IS 'Scheduled execution time';
COMMENT ON COLUMN boost_jobs.executed_at IS 'Actual execution completion time';

-- Performance indexes for boost_jobs
CREATE INDEX IF NOT EXISTS idx_boost_jobs_business_status
    ON boost_jobs (founder_business_id, status);

CREATE INDEX IF NOT EXISTS idx_boost_jobs_scheduled
    ON boost_jobs (scheduled_at)
    WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_boost_jobs_keyword
    ON boost_jobs (keyword_primary, geo_target);

CREATE INDEX IF NOT EXISTS idx_boost_jobs_created
    ON boost_jobs (created_at DESC);

-- ============================================================================
-- 2. BOOST RESULTS
-- Tracks before/after metrics for each boost execution
-- ============================================================================

CREATE TABLE IF NOT EXISTS boost_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    boost_job_id uuid NOT NULL REFERENCES boost_jobs(id) ON DELETE CASCADE,
    before_rank int,
    after_rank int,
    rank_change int,
    volatility_score numeric,
    geo_score numeric,
    video_impression_delta int,
    dwell_time_delta_seconds int,
    ctr_delta numeric,
    executed_at timestamptz DEFAULT now(),
    notes text,

    CONSTRAINT boost_results_rank_check CHECK (
        (before_rank IS NULL OR before_rank > 0) AND
        (after_rank IS NULL OR after_rank > 0)
    ),
    CONSTRAINT boost_results_volatility_check CHECK (
        volatility_score IS NULL OR (volatility_score >= 0 AND volatility_score <= 100)
    ),
    CONSTRAINT boost_results_geo_score_check CHECK (
        geo_score IS NULL OR (geo_score >= 0 AND geo_score <= 100)
    )
);

COMMENT ON TABLE boost_results IS 'Results and metrics from boost job executions, tracking before/after rank changes and engagement deltas.';
COMMENT ON COLUMN boost_results.boost_job_id IS 'Reference to the parent boost job';
COMMENT ON COLUMN boost_results.before_rank IS 'SERP rank position before boost execution';
COMMENT ON COLUMN boost_results.after_rank IS 'SERP rank position after boost execution';
COMMENT ON COLUMN boost_results.rank_change IS 'Rank improvement (positive = better ranking)';
COMMENT ON COLUMN boost_results.volatility_score IS 'SERP volatility score (0-100) indicating ranking stability';
COMMENT ON COLUMN boost_results.geo_score IS 'Geographic relevance score (0-100)';
COMMENT ON COLUMN boost_results.video_impression_delta IS 'Change in video impressions (for video-focused boosts)';
COMMENT ON COLUMN boost_results.dwell_time_delta_seconds IS 'Change in average dwell time in seconds';
COMMENT ON COLUMN boost_results.ctr_delta IS 'Change in click-through rate';
COMMENT ON COLUMN boost_results.executed_at IS 'Timestamp when this result was recorded';
COMMENT ON COLUMN boost_results.notes IS 'Additional notes or observations from the boost execution';

-- Performance indexes for boost_results
CREATE INDEX IF NOT EXISTS idx_boost_results_job
    ON boost_results (boost_job_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_boost_results_rank_change
    ON boost_results (rank_change DESC)
    WHERE rank_change IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_boost_results_executed
    ON boost_results (executed_at DESC);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE boost_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE boost_results ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES: boost_jobs
-- Access through founder_business ownership or direct owner_user_id
-- ============================================================================

DROP POLICY IF EXISTS "boost_jobs_select_via_business" ON boost_jobs;
CREATE POLICY "boost_jobs_select_via_business" ON boost_jobs
    FOR SELECT USING (
        founder_business_id IS NULL
        OR EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = boost_jobs.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "boost_jobs_insert_via_business" ON boost_jobs;
CREATE POLICY "boost_jobs_insert_via_business" ON boost_jobs
    FOR INSERT WITH CHECK (
        founder_business_id IS NULL
        OR EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = boost_jobs.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "boost_jobs_update_via_business" ON boost_jobs;
CREATE POLICY "boost_jobs_update_via_business" ON boost_jobs
    FOR UPDATE USING (
        founder_business_id IS NULL
        OR EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = boost_jobs.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "boost_jobs_delete_via_business" ON boost_jobs;
CREATE POLICY "boost_jobs_delete_via_business" ON boost_jobs
    FOR DELETE USING (
        founder_business_id IS NULL
        OR EXISTS (
            SELECT 1 FROM founder_businesses fb
            WHERE fb.id = boost_jobs.founder_business_id
            AND fb.owner_user_id = auth.uid()
        )
    );

-- ============================================================================
-- RLS POLICIES: boost_results
-- Access through parent boost_job -> founder_business ownership
-- ============================================================================

DROP POLICY IF EXISTS "boost_results_select_via_job" ON boost_results;
CREATE POLICY "boost_results_select_via_job" ON boost_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM boost_jobs bj
            LEFT JOIN founder_businesses fb ON fb.id = bj.founder_business_id
            WHERE bj.id = boost_results.boost_job_id
            AND (bj.founder_business_id IS NULL OR fb.owner_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "boost_results_insert_via_job" ON boost_results;
CREATE POLICY "boost_results_insert_via_job" ON boost_results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM boost_jobs bj
            LEFT JOIN founder_businesses fb ON fb.id = bj.founder_business_id
            WHERE bj.id = boost_results.boost_job_id
            AND (bj.founder_business_id IS NULL OR fb.owner_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "boost_results_update_via_job" ON boost_results;
CREATE POLICY "boost_results_update_via_job" ON boost_results
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM boost_jobs bj
            LEFT JOIN founder_businesses fb ON fb.id = bj.founder_business_id
            WHERE bj.id = boost_results.boost_job_id
            AND (bj.founder_business_id IS NULL OR fb.owner_user_id = auth.uid())
        )
    );

DROP POLICY IF EXISTS "boost_results_delete_via_job" ON boost_results;
CREATE POLICY "boost_results_delete_via_job" ON boost_results
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM boost_jobs bj
            LEFT JOIN founder_businesses fb ON fb.id = bj.founder_business_id
            WHERE bj.id = boost_results.boost_job_id
            AND (bj.founder_business_id IS NULL OR fb.owner_user_id = auth.uid())
        )
    );

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON boost_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON boost_results TO authenticated;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get active boost jobs for a business
CREATE OR REPLACE FUNCTION get_active_boost_jobs(p_business_id uuid)
RETURNS TABLE (
    id uuid,
    url text,
    keyword_primary text,
    boost_type text,
    status text,
    boosts_remaining int,
    scheduled_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bj.id,
        bj.url,
        bj.keyword_primary,
        bj.boost_type,
        bj.status,
        bj.boosts_remaining,
        bj.scheduled_at
    FROM boost_jobs bj
    WHERE bj.founder_business_id = p_business_id
    AND bj.status IN ('pending', 'scheduled', 'in_progress')
    ORDER BY bj.scheduled_at ASC NULLS LAST, bj.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate average rank improvement
CREATE OR REPLACE FUNCTION get_boost_performance_summary(p_job_id uuid)
RETURNS TABLE (
    total_executions bigint,
    avg_rank_improvement numeric,
    best_rank_achieved int,
    avg_ctr_improvement numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::bigint AS total_executions,
        ROUND(AVG(br.rank_change)::numeric, 2) AS avg_rank_improvement,
        MIN(br.after_rank) AS best_rank_achieved,
        ROUND(AVG(br.ctr_delta)::numeric, 4) AS avg_ctr_improvement
    FROM boost_results br
    WHERE br.boost_job_id = p_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE 'Migration 302_boost_bump_engine.sql completed successfully';
    RAISE NOTICE 'Created tables: boost_jobs, boost_results';
    RAISE NOTICE 'RLS enabled and policies created for all tables';
END $$;
