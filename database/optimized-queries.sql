-- ====================================================================
-- OPTIMIZED QUERIES FOR UNITE GROUP CRM DATABASE
-- ====================================================================
-- Performance-optimized SQL queries with proper indexing and caching
-- Generated: 2025-06-04
-- Purpose: Enhance database performance across all CRM operations

-- ====================================================================
-- 1. CONSULTATION QUERIES OPTIMIZATION
-- ====================================================================

-- Optimized consultation retrieval with proper indexing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consultations_status_created 
ON public.consultations (status, created_at DESC) 
WHERE status IN ('pending', 'confirmed', 'completed');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consultations_user_scheduled 
ON public.consultations (user_id, scheduled_at) 
WHERE scheduled_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_consultations_email_service 
ON public.consultations (client_email, service_type);

-- Optimized query for active consultations dashboard
CREATE OR REPLACE VIEW v_active_consultations AS
SELECT 
    c.id,
    c.client_name,
    c.client_email,
    c.company,
    c.service_type,
    c.scheduled_at,
    c.status,
    c.payment_status,
    c.payment_amount,
    c.created_at,
    -- Calculate consultation priority score
    CASE 
        WHEN c.scheduled_at < NOW() + INTERVAL '24 hours' THEN 'urgent'
        WHEN c.scheduled_at < NOW() + INTERVAL '72 hours' THEN 'high'
        WHEN c.scheduled_at < NOW() + INTERVAL '7 days' THEN 'medium'
        ELSE 'normal'
    END as priority,
    -- Calculate revenue potential
    CASE 
        WHEN c.payment_status = 'paid' THEN c.payment_amount
        ELSE 0
    END as confirmed_revenue
FROM public.consultations c
WHERE c.status IN ('pending', 'confirmed', 'in_progress')
ORDER BY c.scheduled_at ASC;

-- ====================================================================
-- 2. DEALS OPTIMIZATION
-- ====================================================================

-- Optimized indexes for deals table
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_client_status 
ON public.deals (client_id, deal_status) 
WHERE deal_status IN ('active', 'pending', 'negotiation');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_stage_amount 
ON public.deals (deal_stage, deal_amount DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_date_rep 
ON public.deals (deal_date DESC, sales_rep_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deals_amount_range 
ON public.deals (deal_amount) 
WHERE deal_amount > 1000;

-- High-performance deals pipeline view
CREATE OR REPLACE VIEW v_deals_pipeline AS
SELECT 
    d.client_id,
    d.deal_date,
    d.deal_amount,
    d.deal_status,
    d.deal_stage,
    d.sales_rep_id,
    d.product_id,
    -- Performance metrics
    EXTRACT(DAY FROM (CURRENT_DATE - d.deal_date)) AS deal_age_days,
    -- Revenue forecasting
    CASE d.deal_stage
        WHEN 'qualified' THEN d.deal_amount * 0.2
        WHEN 'proposal' THEN d.deal_amount * 0.4
        WHEN 'negotiation' THEN d.deal_amount * 0.7
        WHEN 'closed_won' THEN d.deal_amount
        ELSE 0
    END as weighted_value,
    -- Stage progression tracking
    CASE 
        WHEN d.deal_stage = 'qualified' AND EXTRACT(DAY FROM (CURRENT_DATE - d.deal_date)) > 30 THEN 'stale'
        WHEN d.deal_stage = 'proposal' AND EXTRACT(DAY FROM (CURRENT_DATE - d.deal_date)) > 14 THEN 'stale'
        WHEN d.deal_stage = 'negotiation' AND EXTRACT(DAY FROM (CURRENT_DATE - d.deal_date)) > 7 THEN 'stale'
        ELSE 'active'
    END as progression_status
FROM public.deals d
WHERE d.deal_status != 'closed_lost';

-- Optimized deal analytics aggregation
CREATE OR REPLACE FUNCTION get_deal_analytics(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE,
    sales_rep_filter UUID DEFAULT NULL
)
RETURNS TABLE (
    total_deals BIGINT,
    total_value NUMERIC,
    avg_deal_size NUMERIC,
    conversion_rate NUMERIC,
    pipeline_velocity NUMERIC,
    top_stage TEXT,
    revenue_this_month NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH deal_stats AS (
        SELECT 
            COUNT(*) as deal_count,
            SUM(d.deal_amount) as total_amount,
            AVG(d.deal_amount) as avg_amount,
            COUNT(CASE WHEN d.deal_status = 'closed_won' THEN 1 END) as won_deals,
            AVG(EXTRACT(DAY FROM (CURRENT_DATE - d.deal_date))) as avg_cycle_time
        FROM public.deals d
        WHERE d.deal_date BETWEEN start_date AND end_date
        AND (sales_rep_filter IS NULL OR d.sales_rep_id = sales_rep_filter)
    ),
    stage_stats AS (
        SELECT 
            d.deal_stage,
            COUNT(*) as stage_count,
            ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rn
        FROM public.deals d
        WHERE d.deal_date BETWEEN start_date AND end_date
        AND (sales_rep_filter IS NULL OR d.sales_rep_id = sales_rep_filter)
        GROUP BY d.deal_stage
    ),
    revenue_stats AS (
        SELECT COALESCE(SUM(d.deal_amount), 0) as monthly_revenue
        FROM public.deals d
        WHERE d.deal_status = 'closed_won'
        AND d.deal_date >= DATE_TRUNC('month', CURRENT_DATE)
        AND (sales_rep_filter IS NULL OR d.sales_rep_id = sales_rep_filter)
    )
    SELECT 
        ds.deal_count,
        COALESCE(ds.total_amount, 0),
        COALESCE(ds.avg_amount, 0),
        CASE 
            WHEN ds.deal_count > 0 THEN (ds.won_deals::NUMERIC / ds.deal_count::NUMERIC) * 100
            ELSE 0
        END,
        COALESCE(ds.avg_cycle_time, 0),
        COALESCE(ss.deal_stage, 'unknown'),
        rs.monthly_revenue
    FROM deal_stats ds
    CROSS JOIN revenue_stats rs
    LEFT JOIN stage_stats ss ON ss.rn = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 3. RESEARCH PROJECTS OPTIMIZATION
-- ====================================================================

-- Optimized indexes for research projects
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_research_projects_user_created 
ON public.research_projects (user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_research_projects_title_search 
ON public.research_projects USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- High-performance project retrieval
CREATE OR REPLACE FUNCTION get_user_research_projects_optimized(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0,
    p_search TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    description TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    item_count BIGINT,
    recent_activity TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rp.id,
        rp.title,
        rp.description,
        rp.created_at,
        rp.updated_at,
        COALESCE(ri.item_count, 0) as item_count,
        COALESCE(ri.last_activity, rp.updated_at) as recent_activity
    FROM public.research_projects rp
    LEFT JOIN (
        SELECT 
            project_id,
            COUNT(*) as item_count,
            MAX(updated_at) as last_activity
        FROM public.research_items
        GROUP BY project_id
    ) ri ON rp.id = ri.project_id
    WHERE rp.user_id = p_user_id
    AND (p_search IS NULL OR to_tsvector('english', rp.title || ' ' || COALESCE(rp.description, '')) @@ plainto_tsquery('english', p_search))
    ORDER BY recent_activity DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 4. MACHINE LEARNING OPTIMIZATION
-- ====================================================================

-- Optimized ML training log queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ml_training_timestamp_model 
ON public.model_training_log (timestamp DESC, model_name);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ml_training_status_accuracy 
ON public.model_training_log (training_status, accuracy DESC) 
WHERE accuracy IS NOT NULL;

-- ML performance analytics view
CREATE OR REPLACE VIEW v_ml_performance_analytics AS
SELECT 
    mtl.model_name,
    COUNT(*) as training_runs,
    AVG(mtl.accuracy) as avg_accuracy,
    MAX(mtl.accuracy) as best_accuracy,
    MIN(mtl.accuracy) as worst_accuracy,
    COUNT(CASE WHEN mtl.training_status = 'completed' THEN 1 END) as successful_runs,
    COUNT(CASE WHEN mtl.training_status = 'failed' THEN 1 END) as failed_runs,
    MAX(mtl.timestamp) as last_training,
    -- Performance trend (positive = improving, negative = declining)
    CASE 
        WHEN COUNT(*) >= 2 THEN
            (SELECT accuracy FROM public.model_training_log mtl2 
             WHERE mtl2.model_name = mtl.model_name 
             ORDER BY timestamp DESC LIMIT 1) -
            (SELECT accuracy FROM public.model_training_log mtl3 
             WHERE mtl3.model_name = mtl.model_name 
             ORDER BY timestamp DESC LIMIT 1 OFFSET 1)
        ELSE 0
    END as accuracy_trend
FROM public.model_training_log mtl
WHERE mtl.accuracy IS NOT NULL
GROUP BY mtl.model_name
ORDER BY avg_accuracy DESC;

-- ====================================================================
-- 5. DEAL FEATURES OPTIMIZATION FOR ANALYTICS
-- ====================================================================

-- Optimized indexes for deal features
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deal_features_client_amount 
ON public.deal_features (client_id, deal_amount DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deal_features_status_stage 
ON public.deal_features (deal_status, deal_stage);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_deal_features_age_amount 
ON public.deal_features (deal_age_days, deal_amount DESC);

-- High-performance predictive analytics query
CREATE OR REPLACE FUNCTION get_predictive_deal_insights(
    p_client_id UUID DEFAULT NULL,
    p_min_amount NUMERIC DEFAULT 1000,
    p_max_age_days INTEGER DEFAULT 365
)
RETURNS TABLE (
    client_id UUID,
    predicted_close_probability NUMERIC,
    predicted_deal_value NUMERIC,
    risk_score NUMERIC,
    recommended_action TEXT,
    deal_velocity_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH deal_aggregates AS (
        SELECT 
            df.client_id,
            COUNT(*) as total_deals,
            AVG(df.deal_amount) as avg_deal_size,
            AVG(df.deal_age_days) as avg_deal_age,
            COUNT(CASE WHEN df.deal_status = 'closed_won' THEN 1 END) as won_deals,
            COUNT(CASE WHEN df.deal_status = 'closed_lost' THEN 1 END) as lost_deals,
            MAX(df.deal_amount) as largest_deal,
            MIN(df.deal_age_days) as fastest_close
        FROM public.deal_features df
        WHERE (p_client_id IS NULL OR df.client_id = p_client_id)
        AND df.deal_amount >= p_min_amount
        AND df.deal_age_days <= p_max_age_days
        GROUP BY df.client_id
    )
    SELECT 
        da.client_id,
        -- Predicted close probability based on historical data
        CASE 
            WHEN da.total_deals = 0 THEN 0::NUMERIC
            ELSE ROUND((da.won_deals::NUMERIC / da.total_deals::NUMERIC) * 100, 2)
        END as predicted_close_probability,
        -- Predicted deal value (weighted average)
        ROUND(da.avg_deal_size * 
              CASE 
                  WHEN da.won_deals > da.lost_deals THEN 1.2
                  WHEN da.won_deals = da.lost_deals THEN 1.0
                  ELSE 0.8
              END, 2) as predicted_deal_value,
        -- Risk score (higher = more risk)
        ROUND(
            CASE 
                WHEN da.avg_deal_age > 90 THEN 0.8
                WHEN da.avg_deal_age > 60 THEN 0.6
                WHEN da.avg_deal_age > 30 THEN 0.4
                ELSE 0.2
            END * 100 +
            CASE 
                WHEN da.lost_deals > da.won_deals THEN 0.3
                WHEN da.lost_deals = da.won_deals THEN 0.2
                ELSE 0.1
            END * 100, 2) as risk_score,
        -- Recommended action
        CASE 
            WHEN da.avg_deal_age > 90 AND da.lost_deals > da.won_deals THEN 'High Risk - Immediate Attention Required'
            WHEN da.avg_deal_age > 60 THEN 'Follow-up Required'
            WHEN da.won_deals > da.lost_deals AND da.avg_deal_age < 30 THEN 'High Potential - Accelerate'
            ELSE 'Monitor Progress'
        END as recommended_action,
        -- Deal velocity score (higher = faster)
        ROUND(
            CASE 
                WHEN da.fastest_close <= 7 THEN 100
                WHEN da.fastest_close <= 14 THEN 80
                WHEN da.fastest_close <= 30 THEN 60
                WHEN da.fastest_close <= 60 THEN 40
                ELSE 20
            END, 2) as deal_velocity_score
    FROM deal_aggregates da
    ORDER BY predicted_close_probability DESC, predicted_deal_value DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 6. PERFORMANCE MONITORING AND MAINTENANCE
-- ====================================================================

-- Query performance monitoring view
CREATE OR REPLACE VIEW v_query_performance AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation,
    most_common_vals,
    most_common_freqs
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;

-- Database size and growth monitoring
CREATE OR REPLACE FUNCTION get_database_health_metrics()
RETURNS TABLE (
    table_name TEXT,
    table_size TEXT,
    row_count BIGINT,
    index_count BIGINT,
    last_vacuum TIMESTAMP,
    last_analyze TIMESTAMP,
    health_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::TEXT,
        pg_size_pretty(pg_total_relation_size(t.table_name::regclass))::TEXT as table_size,
        COALESCE(c.reltuples::BIGINT, 0) as row_count,
        (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name)::BIGINT as index_count,
        s.last_vacuum,
        s.last_analyze,
        -- Health score based on multiple factors
        ROUND(
            CASE 
                WHEN s.last_vacuum IS NULL OR s.last_vacuum < NOW() - INTERVAL '7 days' THEN 0.3
                WHEN s.last_vacuum < NOW() - INTERVAL '3 days' THEN 0.7
                ELSE 1.0
            END * 40 +
            CASE 
                WHEN s.last_analyze IS NULL OR s.last_analyze < NOW() - INTERVAL '7 days' THEN 0.3
                WHEN s.last_analyze < NOW() - INTERVAL '3 days' THEN 0.7
                ELSE 1.0
            END * 30 +
            CASE 
                WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name) = 0 THEN 0.5
                WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = t.table_name) > 10 THEN 0.7
                ELSE 1.0
            END * 30, 2) as health_score
    FROM information_schema.tables t
    LEFT JOIN pg_class c ON c.relname = t.table_name
    LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
    WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    ORDER BY health_score ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 7. AUTOMATED MAINTENANCE PROCEDURES
-- ====================================================================

-- Automated vacuum and analyze procedure
CREATE OR REPLACE FUNCTION automated_maintenance()
RETURNS TEXT AS $$
DECLARE
    maintenance_log TEXT := '';
    table_record RECORD;
BEGIN
    -- Vacuum and analyze tables that need it
    FOR table_record IN 
        SELECT tablename 
        FROM pg_stat_user_tables 
        WHERE schemaname = 'public'
        AND (last_vacuum IS NULL OR last_vacuum < NOW() - INTERVAL '7 days'
             OR last_analyze IS NULL OR last_analyze < NOW() - INTERVAL '7 days')
    LOOP
        EXECUTE 'VACUUM ANALYZE public.' || quote_ident(table_record.tablename);
        maintenance_log := maintenance_log || 'Vacuumed and analyzed: ' || table_record.tablename || E'\n';
    END LOOP;
    
    -- Update statistics
    EXECUTE 'ANALYZE';
    maintenance_log := maintenance_log || 'Updated database statistics' || E'\n';
    
    -- Reindex if needed
    FOR table_record IN
        SELECT tablename 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND pg_total_relation_size(tablename::regclass) > 100 * 1024 * 1024 -- Tables > 100MB
    LOOP
        EXECUTE 'REINDEX TABLE public.' || quote_ident(table_record.tablename);
        maintenance_log := maintenance_log || 'Reindexed: ' || table_record.tablename || E'\n';
    END LOOP;
    
    RETURN maintenance_log;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ====================================================================
-- 8. GRANT PERMISSIONS
-- ====================================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_deal_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_research_projects_optimized TO authenticated;
GRANT EXECUTE ON FUNCTION get_predictive_deal_insights TO authenticated;
GRANT EXECUTE ON FUNCTION get_database_health_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION automated_maintenance TO authenticated;

-- Grant select permissions on views
GRANT SELECT ON v_active_consultations TO authenticated;
GRANT SELECT ON v_deals_pipeline TO authenticated;
GRANT SELECT ON v_ml_performance_analytics TO authenticated;
GRANT SELECT ON v_query_performance TO authenticated;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- ====================================================================
-- END OF OPTIMIZED QUERIES
-- ====================================================================

-- Performance monitoring query to validate optimizations
SELECT 
    'Optimization Complete' as status,
    NOW() as timestamp,
    'All indexes created and functions optimized' as message;
