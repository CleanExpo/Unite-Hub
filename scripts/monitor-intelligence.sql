-- =====================================================
-- EMAIL INTELLIGENCE MONITORING QUERIES
-- =====================================================
-- Copy these queries into Supabase SQL Editor to monitor
-- the Email Intelligence System
--
-- Usage: Run each section separately
-- =====================================================

-- ╔════════════════════════════════════════════════════════╗
-- ║  1. SYSTEM HEALTH CHECK                                ║
-- ╚════════════════════════════════════════════════════════╝

-- Check recent cron executions
SELECT
  executed_at,
  status,
  (output_data->>'total_processed')::int as emails_processed,
  (output_data->>'total_failed')::int as emails_failed,
  (output_data->>'workspaces_count')::int as workspaces,
  completed_at - executed_at as duration
FROM autonomous_tasks
WHERE task_type = 'continuous_intelligence_update'
ORDER BY executed_at DESC
LIMIT 10;

-- ────────────────────────────────────────────────────────

-- ╔════════════════════════════════════════════════════════╗
-- ║  2. EMAIL PROCESSING STATUS                            ║
-- ╚════════════════════════════════════════════════════════╝

-- Unanalyzed emails by workspace
SELECT
  workspace_id,
  COUNT(*) as unanalyzed_count,
  MIN(received_at) as oldest_unanalyzed,
  MAX(received_at) as newest_unanalyzed
FROM client_emails
WHERE intelligence_analyzed = false
GROUP BY workspace_id
ORDER BY unanalyzed_count DESC;

-- ────────────────────────────────────────────────────────

-- Overall processing stats
SELECT
  COUNT(*) FILTER (WHERE intelligence_analyzed = true) as analyzed,
  COUNT(*) FILTER (WHERE intelligence_analyzed = false) as unanalyzed,
  COUNT(*) as total,
  ROUND(
    (COUNT(*) FILTER (WHERE intelligence_analyzed = true)::numeric / COUNT(*)) * 100,
    2
  ) as percentage_analyzed
FROM client_emails;

-- ────────────────────────────────────────────────────────

-- ╔════════════════════════════════════════════════════════╗
-- ║  3. INTELLIGENCE QUALITY METRICS                       ║
-- ╚════════════════════════════════════════════════════════╝

-- Intelligence records by workspace
SELECT
  workspace_id,
  COUNT(*) as total_intelligence_records,
  ROUND(AVG(confidence_score), 2) as avg_confidence,
  MIN(confidence_score) as min_confidence,
  MAX(confidence_score) as max_confidence,
  COUNT(*) FILTER (WHERE confidence_score >= 80) as high_confidence_count,
  ROUND(
    (COUNT(*) FILTER (WHERE confidence_score >= 80)::numeric / COUNT(*)) * 100,
    2
  ) as high_confidence_percentage
FROM email_intelligence
GROUP BY workspace_id
ORDER BY total_intelligence_records DESC;

-- ────────────────────────────────────────────────────────

-- Intent distribution
SELECT
  primary_intent,
  COUNT(*) as count,
  ROUND(AVG(confidence_score), 2) as avg_confidence,
  ROUND((COUNT(*)::numeric / SUM(COUNT(*)) OVER ()) * 100, 2) as percentage
FROM email_intelligence
GROUP BY primary_intent
ORDER BY count DESC;

-- ────────────────────────────────────────────────────────

-- Sentiment distribution
SELECT
  sentiment,
  COUNT(*) as count,
  ROUND(AVG(confidence_score), 2) as avg_confidence,
  ROUND((COUNT(*)::numeric / SUM(COUNT(*)) OVER ()) * 100, 2) as percentage
FROM email_intelligence
GROUP BY sentiment
ORDER BY count DESC;

-- ────────────────────────────────────────────────────────

-- Urgency distribution
SELECT
  urgency_level,
  COUNT(*) as count,
  ROUND(AVG(confidence_score), 2) as avg_confidence,
  ROUND((COUNT(*)::numeric / SUM(COUNT(*)) OVER ()) * 100, 2) as percentage
FROM email_intelligence
GROUP BY urgency_level
ORDER BY
  CASE urgency_level
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END;

-- ────────────────────────────────────────────────────────

-- ╔════════════════════════════════════════════════════════╗
-- ║  4. BUSINESS INSIGHTS                                  ║
-- ╚════════════════════════════════════════════════════════╝

-- Emails with business opportunities
SELECT
  workspace_id,
  COUNT(*) as opportunity_count,
  COUNT(*) FILTER (WHERE budget_mentioned = true) as with_budget,
  COUNT(*) FILTER (WHERE timeline_mentioned = true) as with_timeline,
  COUNT(*) FILTER (WHERE decision_maker = true) as from_decision_makers,
  ROUND(AVG(confidence_score), 2) as avg_confidence
FROM email_intelligence
WHERE business_opportunity IS NOT NULL
GROUP BY workspace_id
ORDER BY opportunity_count DESC;

-- ────────────────────────────────────────────────────────

-- High priority emails (high urgency + business opportunity)
SELECT
  ei.workspace_id,
  ce.from_email,
  ce.subject,
  ei.primary_intent,
  ei.urgency_level,
  ei.business_opportunity,
  ei.budget_mentioned,
  ei.timeline_mentioned,
  ei.decision_maker,
  ei.confidence_score,
  ce.received_at
FROM email_intelligence ei
JOIN client_emails ce ON ei.email_id = ce.id
WHERE ei.urgency_level IN ('high', 'critical')
  AND ei.business_opportunity IS NOT NULL
ORDER BY
  CASE ei.urgency_level
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
  END,
  ei.confidence_score DESC,
  ce.received_at DESC
LIMIT 20;

-- ────────────────────────────────────────────────────────

-- ╔════════════════════════════════════════════════════════╗
-- ║  5. PERFORMANCE METRICS                                ║
-- ╚════════════════════════════════════════════════════════╝

-- Processing performance by hour
SELECT
  DATE_TRUNC('hour', executed_at) as hour,
  COUNT(*) as executions,
  SUM((output_data->>'total_processed')::int) as total_emails_processed,
  ROUND(
    AVG((output_data->>'total_processed')::int),
    2
  ) as avg_emails_per_execution,
  SUM((output_data->>'total_failed')::int) as total_failed,
  ROUND(
    AVG(EXTRACT(EPOCH FROM (completed_at - executed_at))),
    2
  ) as avg_duration_seconds
FROM autonomous_tasks
WHERE task_type = 'continuous_intelligence_update'
  AND executed_at >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', executed_at)
ORDER BY hour DESC;

-- ────────────────────────────────────────────────────────

-- Latest execution details
SELECT
  executed_at,
  status,
  output_data,
  completed_at - executed_at as duration
FROM autonomous_tasks
WHERE task_type = 'continuous_intelligence_update'
ORDER BY executed_at DESC
LIMIT 1;

-- ────────────────────────────────────────────────────────

-- ╔════════════════════════════════════════════════════════╗
-- ║  6. ERROR TRACKING                                     ║
-- ╚════════════════════════════════════════════════════════╝

-- Failed or partially failed executions
SELECT
  executed_at,
  status,
  (output_data->>'total_processed')::int as processed,
  (output_data->>'total_failed')::int as failed,
  output_data->'results' as error_details
FROM autonomous_tasks
WHERE task_type = 'continuous_intelligence_update'
  AND status IN ('partial_failure', 'failed')
ORDER BY executed_at DESC
LIMIT 10;

-- ────────────────────────────────────────────────────────

-- ╔════════════════════════════════════════════════════════╗
-- ║  7. COST ESTIMATION                                    ║
-- ╚════════════════════════════════════════════════════════╝

-- Estimate costs (assuming $0.0045 per email)
SELECT
  DATE_TRUNC('day', extracted_at) as day,
  COUNT(*) as emails_analyzed,
  ROUND(COUNT(*) * 0.0045, 2) as estimated_cost_usd
FROM email_intelligence
WHERE extracted_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', extracted_at)
ORDER BY day DESC;

-- ────────────────────────────────────────────────────────

-- Monthly cost estimate
SELECT
  DATE_TRUNC('month', extracted_at) as month,
  COUNT(*) as emails_analyzed,
  ROUND(COUNT(*) * 0.0045, 2) as estimated_cost_usd
FROM email_intelligence
GROUP BY DATE_TRUNC('month', extracted_at)
ORDER BY month DESC;

-- ────────────────────────────────────────────────────────

-- ╔════════════════════════════════════════════════════════╗
-- ║  8. REAL-TIME DASHBOARD QUERY                          ║
-- ╚════════════════════════════════════════════════════════╝

-- Combined dashboard view
SELECT
  -- System Status
  (SELECT COUNT(*) FROM autonomous_tasks WHERE task_type = 'continuous_intelligence_update' AND executed_at >= NOW() - INTERVAL '24 hours') as executions_24h,
  (SELECT MAX(executed_at) FROM autonomous_tasks WHERE task_type = 'continuous_intelligence_update') as last_execution,

  -- Email Processing
  (SELECT COUNT(*) FROM client_emails WHERE intelligence_analyzed = true) as total_analyzed,
  (SELECT COUNT(*) FROM client_emails WHERE intelligence_analyzed = false) as total_unanalyzed,

  -- Intelligence Quality
  (SELECT ROUND(AVG(confidence_score), 2) FROM email_intelligence) as avg_confidence,
  (SELECT COUNT(*) FROM email_intelligence WHERE confidence_score >= 80) as high_confidence_count,

  -- Business Insights
  (SELECT COUNT(*) FROM email_intelligence WHERE business_opportunity IS NOT NULL) as opportunity_count,
  (SELECT COUNT(*) FROM email_intelligence WHERE urgency_level IN ('high', 'critical')) as high_urgency_count,

  -- Costs
  (SELECT ROUND(COUNT(*) * 0.0045, 2) FROM email_intelligence WHERE extracted_at >= NOW() - INTERVAL '30 days') as cost_last_30_days;

-- ────────────────────────────────────────────────────────

-- ╔════════════════════════════════════════════════════════╗
-- ║  MONITORING COMPLETE                                   ║
-- ╚════════════════════════════════════════════════════════╝
--
-- 📊 Use these queries to:
--   1. Monitor system health
--   2. Track processing performance
--   3. Analyze intelligence quality
--   4. Identify business opportunities
--   5. Estimate costs
--
-- 💡 Tip: Bookmark this file and run queries in Supabase SQL Editor
-- 🔄 Refresh frequency: Every 30 minutes (after cron execution)
