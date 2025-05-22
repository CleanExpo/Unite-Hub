-- Create a function to get error resolution times by type
CREATE OR REPLACE FUNCTION get_error_resolution_times_by_type(
  group_by_field TEXT,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '90 days'
)
RETURNS TABLE (
  severity TEXT,
  category TEXT,
  count BIGINT,
  avg_resolution_time NUMERIC,
  min_resolution_time NUMERIC,
  max_resolution_time NUMERIC,
  median_resolution_time NUMERIC
) AS $$
BEGIN
  IF group_by_field = 'severity' THEN
    RETURN QUERY
    WITH resolved_errors AS (
      SELECT 
        severity,
        EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 as resolution_hours
      FROM 
        error_logs
      WHERE 
        resolved = true 
        AND resolved_at IS NOT NULL
        AND created_at >= start_date
    )
    SELECT 
      severity,
      NULL::TEXT as category,
      COUNT(*)::BIGINT as count,
      AVG(resolution_hours)::NUMERIC as avg_resolution_time,
      MIN(resolution_hours)::NUMERIC as min_resolution_time,
      MAX(resolution_hours)::NUMERIC as max_resolution_time,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY resolution_hours)::NUMERIC as median_resolution_time
    FROM 
      resolved_errors
    GROUP BY 
      severity
    ORDER BY 
      avg_resolution_time DESC;
  ELSIF group_by_field = 'category' THEN
    RETURN QUERY
    WITH resolved_errors AS (
      SELECT 
        category,
        EXTRACT(EPOCH FROM (resolved_at - created_at))/3600 as resolution_hours
      FROM 
        error_logs
      WHERE 
        resolved = true 
        AND resolved_at IS NOT NULL
        AND created_at >= start_date
    )
    SELECT 
      NULL::TEXT as severity,
      category,
      COUNT(*)::BIGINT as count,
      AVG(resolution_hours)::NUMERIC as avg_resolution_time,
      MIN(resolution_hours)::NUMERIC as min_resolution_time,
      MAX(resolution_hours)::NUMERIC as max_resolution_time,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY resolution_hours)::NUMERIC as median_resolution_time
    FROM 
      resolved_errors
    GROUP BY 
      category
    ORDER BY 
      avg_resolution_time DESC;
  ELSE
    RAISE EXCEPTION 'Invalid group_by_field: %. Must be "severity" or "category"', group_by_field;
  END IF;
END;
$$ LANGUAGE plpgsql;
