# AI Database Migration - Step-by-Step Guide

## Method 1: Using Supabase Dashboard (Recommended - No Password Required)

### Step 1: Open Supabase SQL Editor
Click this link to open the SQL editor for your project:
[https://supabase.com/dashboard/project/hdfggelozqzdxvupbnbp/sql/new](https://supabase.com/dashboard/project/hdfggelozqzdxvupbnbp/sql/new)

### Step 2: Copy the AI Schema
**IMPORTANT**: Use the safe version that handles existing objects!
The safe AI schema is located in `database/ai_schema_safe.sql`. Copy the entire contents of that file.

Note: This safe version will:
- Drop and recreate indexes properly
- Handle existing tables gracefully
- Reset policies correctly

### Step 3: Paste and Run
1. Paste the SQL into the editor
2. Click "Run" or press Ctrl+Enter

### Step 4: Verify Success
After running, paste and run this verification query:
```sql
-- Check if AI tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'ai_%'
ORDER BY table_name;
```

You should see these 8 tables:
- ai_deployments
- ai_events
- ai_optimizations
- ai_predictions
- ai_system_health
- ai_system_metrics
- ai_threat_detections
- ai_validation_rules

## Method 2: Fix CLI for Future Use (Optional)

If you want to fix the CLI for future migrations, run this in the SQL editor:
```sql
-- Mark problematic migrations as applied
INSERT INTO supabase_migrations.schema_migrations (version) VALUES
  ('20250601000000_create_clients_table'),
  ('20250601070000_create_permissions_table'),
  ('20250601082900_create_projects_table'),
  ('20250601083000_create_tasks_table')
ON CONFLICT (version) DO NOTHING;
```

## Next Steps After Migration

### 1. Update Production Environment Variables
Add these to your Vercel environment variables:
- AI_MONITORING_ENABLED=true
- AI_PREDICTION_INTERVAL=60000
- AI_OPTIMIZATION_INTERVAL=300000
- AI_THREAT_DETECTION_ENABLED=true
- AI_DEPLOYMENT_VALIDATION_ENABLED=true

### 2. Fix Stripe Configuration
Update STRIPE_SECRET_KEY with your actual live key (starting with sk_live_)

### 3. Access AI Dashboard
Navigate to: https://your-app.vercel.app/dashboard/ai

## Quick Links
- [Supabase SQL Editor](https://supabase.com/dashboard/project/hdfggelozqzdxvupbnbp/sql/new)
- [Vercel Environment Variables](https://vercel.com/your-team/your-project/settings/environment-variables)

## Why the Password Issue?
The Supabase CLI requires database passwords for security, but when you have multiple migrations or complex schemas, it can prompt multiple times. Using the dashboard is more convenient for one-time operations like this.
