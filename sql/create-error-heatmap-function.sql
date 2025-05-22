-- Create a function to get error heatmap data
CREATE OR REPLACE FUNCTION get_error_heatmap_data(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days'
)
RETURNS TABLE (
  day_of_week INTEGER,
  hour_of_day INTEGER,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXTRACT(DOW FROM created_at)::INTEGER as day_of_week,
    EXTRACT(HOUR FROM created_at)::INTEGER as hour_of_day,
    COUNT(*)::BIGINT as count
  FROM 
    error_logs
  WHERE 
    created_at >= start_date
  GROUP BY 
    day_of_week, hour_of_day
  ORDER BY 
    day_of_week, hour_of_day;
END;
$$ LANGUAGE plpgsql;
