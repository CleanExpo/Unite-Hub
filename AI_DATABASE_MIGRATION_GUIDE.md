# AI Database Migration Guide

## Overview
This guide provides instructions for migrating the AI database schema for Version 14.0, which includes tables for monitoring, predictions, threats, deployments, and optimizations.

## Pre-Migration Checklist
- [ ] Backup your database
- [ ] Ensure you have service role access
- [ ] Verify UUID extension is enabled
- [ ] Check current schema conflicts

## Migration Steps

### 1. Connect to Supabase Database

First, find your Supabase project reference in your Supabase dashboard URL: `https://app.supabase.com/project/YOUR-PROJECT-REF`

#### For Windows PowerShell:
```powershell
# Set the password environment variable
$env:PGPASSWORD='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'

# Replace YOUR-PROJECT-REF with your actual project reference
psql -h YOUR-PROJECT-REF.supabase.co -p 5432 -d postgres -U postgres -f database/ai_schema.sql
```

#### For Unix/Linux/Mac:
```bash
# Set the password environment variable
export PGPASSWORD='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'

# Replace YOUR-PROJECT-REF with your actual project reference
psql -h YOUR-PROJECT-REF.supabase.co -p 5432 -d postgres -U postgres -f database/ai_schema.sql
```

#### Using Supabase CLI (Alternative):
```bash
# This method doesn't require manual password entry
supabase db push database/ai_schema.sql
```

### 2. Verify Migration Success
```sql
-- Check if all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ai_%'
ORDER BY table_name;

-- Expected tables:
-- ai_deployments
-- ai_events
-- ai_optimizations
-- ai_predictions
-- ai_system_health
-- ai_system_metrics
-- ai_threat_detections
-- ai_validation_rules
```

### 3. Verify RLS Policies
```sql
-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename LIKE 'ai_%'
ORDER BY tablename, policyname;
```

### 4. Test Basic Operations
```sql
-- Test insert (requires service role)
INSERT INTO ai_system_metrics (component, metric_name, metric_value)
VALUES ('test', 'test-metric', '{"value": 100}'::jsonb);

-- Test select (authenticated users)
SELECT * FROM ai_system_metrics LIMIT 5;
```

## Production Environment Variables

Add these to your production environment:

```env
# AI System Configuration
AI_MONITORING_ENABLED=true
AI_PREDICTION_INTERVAL=60000
AI_OPTIMIZATION_INTERVAL=300000
AI_THREAT_DETECTION_ENABLED=true
AI_AUTO_DEPLOYMENT_ENABLED=false

# AI Feature Flags
ENABLE_AI_DASHBOARD=true
ENABLE_PREDICTIVE_FAILURE_DETECTION=true
ENABLE_SELF_OPTIMIZATION=true
ENABLE_THREAT_DETECTION=true
ENABLE_AUTOMATED_DEPLOYMENT=false

# AI Performance Tuning
AI_MAX_METRICS_HISTORY=10000
AI_METRICS_RETENTION_DAYS=30
AI_EVENTS_RETENTION_DAYS=90
AI_HEALTH_RETENTION_DAYS=7
```

## Post-Migration Verification

### 1. Test AI Dashboard Access
Navigate to `/dashboard/ai` and verify:
- System metrics are loading
- Health score is displayed
- Predictions are visible
- Threat detection is active

### 2. Monitor Initial Data Collection
```sql
-- Check if metrics are being collected
SELECT 
    component,
    metric_name,
    COUNT(*) as count,
    MAX(timestamp) as latest
FROM ai_system_metrics
GROUP BY component, metric_name
ORDER BY latest DESC;
```

### 3. Schedule Cleanup Jobs (Optional)
If your Supabase instance has pg_cron enabled:

```sql
-- Enable cleanup jobs
SELECT cron.schedule('cleanup-ai-system-metrics', '0 2 * * *', 'SELECT cleanup_old_ai_system_metrics();');
SELECT cron.schedule('cleanup-ai-events', '0 3 * * *', 'SELECT cleanup_old_ai_events();');
SELECT cron.schedule('cleanup-ai-health', '0 4 * * *', 'SELECT cleanup_old_ai_system_health();');
```

## Rollback Plan

If issues occur:

```sql
-- Drop all AI tables (CAUTION: This will delete all AI data)
DROP TABLE IF EXISTS ai_validation_rules CASCADE;
DROP TABLE IF EXISTS ai_system_health CASCADE;
DROP TABLE IF EXISTS ai_events CASCADE;
DROP TABLE IF EXISTS ai_optimizations CASCADE;
DROP TABLE IF EXISTS ai_deployments CASCADE;
DROP TABLE IF EXISTS ai_threat_detections CASCADE;
DROP TABLE IF EXISTS ai_predictions CASCADE;
DROP TABLE IF EXISTS ai_system_metrics CASCADE;
```

## Troubleshooting

### Common Issues

1. **UUID extension not enabled**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

2. **RLS policies blocking access**
   - Ensure you're using service role for writes
   - Verify user is authenticated for reads

3. **Index name conflicts**
   - The migration handles existing indexes gracefully
   - Check for custom indexes that might conflict

### Support

For issues, check:
- Supabase dashboard logs
- API route responses at `/api/ai/*`
- Browser console for client-side errors

## Next Steps

After successful migration:
1. Monitor AI dashboard for 24 hours
2. Review initial predictions and metrics
3. Fine-tune thresholds based on your system
4. Enable auto-optimization if desired
