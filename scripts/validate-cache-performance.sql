-- ============================================================================
-- Cache Performance Validation SQL Queries
-- ============================================================================
-- Purpose: Monitor prompt caching performance across all Anthropic AI agents
-- Usage: Run these queries in Supabase SQL Editor to validate cache effectiveness
-- Target Table: ai_usage_logs (from migration 046_ai_usage_tracking_CLEANED.sql)
-- ============================================================================

-- Query 1: Overall Cache Performance Summary (Last 24 Hours)
-- Shows aggregate cache hit rate, tokens saved, and cost savings
-- ============================================================================
SELECT
  COUNT(*) AS total_requests,
  COUNT(CASE WHEN tokens_cached > 0 THEN 1 END) AS cache_hits,
  COUNT(CASE WHEN tokens_cached = 0 OR tokens_cached IS NULL THEN 1 END) AS cache_misses,
  ROUND(
    (COUNT(CASE WHEN tokens_cached > 0 THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS cache_hit_rate_percent,
  SUM(tokens_cached) AS total_tokens_saved,
  -- Cost savings: 90% discount on cached tokens at ~$0.003/1K tokens
  ROUND(
    (SUM(tokens_cached)::DECIMAL / 1000) * 0.003 * 0.9,
    4
  ) AS estimated_cost_savings_usd,
  ROUND(AVG(latency_ms), 0) AS avg_latency_ms
FROM ai_usage_logs
WHERE
  provider = 'anthropic_direct'
  AND success = TRUE
  AND created_at >= NOW() - INTERVAL '24 hours';

-- Query 2: Cache Performance by Agent (Last 24 Hours)
-- Breaks down performance by task_type (agent name)
-- Identifies top performers and agents needing attention
-- ============================================================================
SELECT
  task_type AS agent,
  COUNT(*) AS total_requests,
  COUNT(CASE WHEN tokens_cached > 0 THEN 1 END) AS cache_hits,
  COUNT(CASE WHEN tokens_cached = 0 OR tokens_cached IS NULL THEN 1 END) AS cache_misses,
  ROUND(
    (COUNT(CASE WHEN tokens_cached > 0 THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS cache_hit_rate_percent,
  SUM(tokens_cached) AS tokens_saved,
  ROUND(
    (SUM(tokens_cached)::DECIMAL / 1000) * 0.003 * 0.9,
    4
  ) AS cost_savings_usd,
  ROUND(AVG(latency_ms), 0) AS avg_latency_ms,
  CASE
    WHEN (COUNT(CASE WHEN tokens_cached > 0 THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) >= 0.8 THEN 'excellent'
    WHEN (COUNT(CASE WHEN tokens_cached > 0 THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) >= 0.6 THEN 'good'
    WHEN (COUNT(CASE WHEN tokens_cached > 0 THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) >= 0.4 THEN 'needs_improvement'
    ELSE 'poor'
  END AS status
FROM ai_usage_logs
WHERE
  provider = 'anthropic_direct'
  AND success = TRUE
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY task_type
ORDER BY cache_hit_rate_percent DESC;

-- Query 3: Top 10 Cache Performers (Last 7 Days)
-- Agents with highest cache hit rates (minimum 10 requests)
-- ============================================================================
SELECT
  task_type AS agent,
  COUNT(*) AS total_requests,
  ROUND(
    (COUNT(CASE WHEN tokens_cached > 0 THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS cache_hit_rate_percent,
  SUM(tokens_cached) AS tokens_saved,
  ROUND(
    (SUM(tokens_cached)::DECIMAL / 1000) * 0.003 * 0.9,
    4
  ) AS cost_savings_usd
FROM ai_usage_logs
WHERE
  provider = 'anthropic_direct'
  AND success = TRUE
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY task_type
HAVING COUNT(*) >= 10
ORDER BY cache_hit_rate_percent DESC
LIMIT 10;

-- Query 4: Agents Needing Attention (Last 7 Days)
-- Agents with cache hit rate < 60% and significant usage (minimum 5 requests)
-- ============================================================================
SELECT
  task_type AS agent,
  COUNT(*) AS total_requests,
  ROUND(
    (COUNT(CASE WHEN tokens_cached > 0 THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS cache_hit_rate_percent,
  SUM(tokens_cached) AS tokens_saved,
  ROUND(AVG(latency_ms), 0) AS avg_latency_ms
FROM ai_usage_logs
WHERE
  provider = 'anthropic_direct'
  AND success = TRUE
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY task_type
HAVING
  COUNT(*) >= 5
  AND (COUNT(CASE WHEN tokens_cached > 0 THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) < 0.6
ORDER BY cache_hit_rate_percent ASC;

-- Query 5: Cache Performance Trend (Last 30 Days, Daily Breakdown)
-- Shows how cache hit rate evolves over time
-- ============================================================================
SELECT
  DATE(created_at) AS date,
  COUNT(*) AS total_requests,
  COUNT(CASE WHEN tokens_cached > 0 THEN 1 END) AS cache_hits,
  ROUND(
    (COUNT(CASE WHEN tokens_cached > 0 THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS cache_hit_rate_percent,
  SUM(tokens_cached) AS tokens_saved,
  ROUND(
    (SUM(tokens_cached)::DECIMAL / 1000) * 0.003 * 0.9,
    4
  ) AS cost_savings_usd
FROM ai_usage_logs
WHERE
  provider = 'anthropic_direct'
  AND success = TRUE
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Query 6: Model-Specific Cache Performance (Last 7 Days)
-- Compares cache effectiveness across Claude models (Opus, Sonnet, Haiku)
-- ============================================================================
SELECT
  model_id,
  COUNT(*) AS total_requests,
  COUNT(CASE WHEN tokens_cached > 0 THEN 1 END) AS cache_hits,
  ROUND(
    (COUNT(CASE WHEN tokens_cached > 0 THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS cache_hit_rate_percent,
  SUM(tokens_cached) AS tokens_saved,
  ROUND(
    (SUM(tokens_cached)::DECIMAL / 1000) * 0.003 * 0.9,
    4
  ) AS cost_savings_usd,
  ROUND(AVG(latency_ms), 0) AS avg_latency_ms
FROM ai_usage_logs
WHERE
  provider = 'anthropic_direct'
  AND success = TRUE
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY model_id
ORDER BY total_requests DESC;

-- Query 7: Workspace-Level Cache Performance (Last 7 Days)
-- Shows cache performance per workspace (for multi-tenant analysis)
-- ============================================================================
SELECT
  workspace_id,
  COUNT(*) AS total_requests,
  COUNT(CASE WHEN tokens_cached > 0 THEN 1 END) AS cache_hits,
  ROUND(
    (COUNT(CASE WHEN tokens_cached > 0 THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS cache_hit_rate_percent,
  SUM(tokens_cached) AS tokens_saved,
  ROUND(
    (SUM(tokens_cached)::DECIMAL / 1000) * 0.003 * 0.9,
    4
  ) AS cost_savings_usd
FROM ai_usage_logs
WHERE
  provider = 'anthropic_direct'
  AND success = TRUE
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY workspace_id
ORDER BY total_requests DESC;

-- Query 8: Cache Miss Analysis (Last 24 Hours)
-- Identifies agents with zero cache hits (potential configuration issues)
-- ============================================================================
SELECT
  task_type AS agent,
  COUNT(*) AS total_requests,
  model_id,
  ROUND(AVG(tokens_input), 0) AS avg_input_tokens,
  ROUND(AVG(latency_ms), 0) AS avg_latency_ms,
  MAX(created_at) AS last_request_at
FROM ai_usage_logs
WHERE
  provider = 'anthropic_direct'
  AND success = TRUE
  AND (tokens_cached = 0 OR tokens_cached IS NULL)
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY task_type, model_id
HAVING COUNT(*) >= 5
ORDER BY total_requests DESC;

-- Query 9: Cost Savings Projection (Based on Last 7 Days)
-- Estimates monthly and annual savings from prompt caching
-- ============================================================================
WITH weekly_stats AS (
  SELECT
    SUM(tokens_cached) AS total_tokens_saved,
    ROUND(
      (SUM(tokens_cached)::DECIMAL / 1000) * 0.003 * 0.9,
      4
    ) AS weekly_savings_usd
  FROM ai_usage_logs
  WHERE
    provider = 'anthropic_direct'
    AND success = TRUE
    AND created_at >= NOW() - INTERVAL '7 days'
)
SELECT
  total_tokens_saved AS tokens_saved_last_7_days,
  weekly_savings_usd AS savings_last_7_days_usd,
  ROUND(weekly_savings_usd * 4.33, 2) AS projected_monthly_savings_usd,
  ROUND(weekly_savings_usd * 52, 2) AS projected_annual_savings_usd
FROM weekly_stats;

-- Query 10: Cache Performance by Hour (Last 24 Hours)
-- Identifies peak usage times and cache effectiveness patterns
-- ============================================================================
SELECT
  EXTRACT(HOUR FROM created_at) AS hour_of_day,
  COUNT(*) AS total_requests,
  COUNT(CASE WHEN tokens_cached > 0 THEN 1 END) AS cache_hits,
  ROUND(
    (COUNT(CASE WHEN tokens_cached > 0 THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
    2
  ) AS cache_hit_rate_percent,
  SUM(tokens_cached) AS tokens_saved
FROM ai_usage_logs
WHERE
  provider = 'anthropic_direct'
  AND success = TRUE
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY EXTRACT(HOUR FROM created_at)
ORDER BY hour_of_day;

-- ============================================================================
-- Usage Notes:
-- ============================================================================
-- 1. Run queries in Supabase SQL Editor or your PostgreSQL client
-- 2. Adjust time intervals (e.g., INTERVAL '24 hours') as needed
-- 3. Filter by workspace_id if analyzing specific workspaces
-- 4. Cache TTL is 5 minutes, so expect fluctuations in hit rate
-- 5. Target: 80%+ cache hit rate for optimal cost savings
-- 6. Cost calculation uses Anthropic pricing: ~$0.003/1K tokens with 90% discount
-- ============================================================================

-- ============================================================================
-- Expected Results Interpretation:
-- ============================================================================
-- Cache Hit Rate:
--   - Excellent: >= 80%  (Strong caching effectiveness)
--   - Good:      >= 60%  (Acceptable performance)
--   - Needs Improvement: >= 40%  (Configuration may need tuning)
--   - Poor:      < 40%   (Investigate prompt structure or usage patterns)
--
-- Cost Savings:
--   - Target: $1,200-$1,800/month (based on UNI-64 projections)
--   - Formula: (tokens_cached / 1000) * $0.003 * 0.9
--
-- Common Issues:
--   - Zero cache hits: Missing cache_control in system prompt
--   - Low hit rate: System prompts changing frequently
--   - High misses: New agents without warm cache (first 5 minutes)
-- ============================================================================
