-- Create a function to get error distribution by category
CREATE OR REPLACE FUNCTION get_error_category_distribution(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days'
)
RETURNS TABLE (
  category TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    category,
    COUNT(*)::BIGINT as count
  FROM 
    error_logs
  WHERE 
    created_at >= start_date
  GROUP BY 
    category
  ORDER BY 
    count DESC;
END;
$$ LANGUAGE plpgsql;
