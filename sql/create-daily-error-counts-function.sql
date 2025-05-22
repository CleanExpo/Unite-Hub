CREATE OR REPLACE FUNCTION get_daily_error_counts(
  start_date TIMESTAMP,
  end_date TIMESTAMP
)
RETURNS TABLE (
  date DATE,
  total_count BIGINT,
  critical_count BIGINT,
  error_count BIGINT,
  warning_count BIGINT,
  info_count BIGINT,
  debug_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(created_at) AS date,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE severity = 'critical') AS critical_count,
    COUNT(*) FILTER (WHERE severity = 'error') AS error_count,
    COUNT(*) FILTER (WHERE severity = 'warning') AS warning_count,
    COUNT(*) FILTER (WHERE severity = 'info') AS info_count,
    COUNT(*) FILTER (WHERE severity = 'debug') AS debug_count
  FROM
    error_logs
  WHERE
    created_at BETWEEN start_date AND end_date
  GROUP BY
    DATE(created_at)
  ORDER BY
    date ASC;
END;
$$ LANGUAGE plpgsql;
