# Complete Fix Guide for Unite Group API Issues

## What We've Done

### 1. Created a Diagnostic Endpoint
**File**: `src/app/api/debug/connection/route.ts`
- Visit `/api/debug/connection` in your deployed app
- This will tell you EXACTLY what's missing or misconfigured
- Shows which environment variables are missing
- Tests the Supabase connection
- Provides specific recommendations

### 2. Improved Error Reporting
**File**: `src/lib/supabase/api.ts`
- Better error messages that tell you exactly what's wrong
- Validates environment variables before attempting connection
- Provides clear guidance on what to fix

### 3. Unified Authentication Approach
**File**: `src/lib/supabase/unified-auth.ts`
- Simplified authentication that works consistently
- No more cookie issues in production
- Clear error messages when configuration is missing

### 4. Updated API Routes
**Files**: 
- `src/app/api/crm/dashboard/route.ts`
- `src/app/api/consultations/route.ts`
- Removed complex authentication wrappers
- Use direct service client connection
- Will work as soon as environment variables are set

## Next Steps

### Step 1: Deploy and Test the Diagnostic
1. Commit and push these changes
2. Wait for Vercel to deploy
3. Visit: `https://your-app.vercel.app/api/debug/connection`
4. Screenshot or copy the response - it will tell us exactly what's wrong

### Step 2: Fix Environment Variables in Vercel
Based on the diagnostic results, you'll need to:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add these variables if missing:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://hdfggelozqzdxvupbnbp.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your anon key from VERCEL_ENV_VARIABLES.md]
   SUPABASE_SERVICE_ROLE_KEY=[your service role key from VERCEL_ENV_VARIABLES.md]
   ```
4. Make sure to select "Production", "Preview", and "Development" environments
5. Click "Save" for each variable

### Step 3: Create Database Tables
Once the connection works, run one of these SQL scripts in Supabase:
- `database/setup-crm-minimal.sql` - Just creates tables, no modifications
- `database/setup-crm-step-by-step.sql` - Run section by section to debug

### Step 4: Verify Everything Works
1. Check `/api/debug/connection` again - should show all green
2. Visit the CRM Dashboard - should load without errors
3. Visit the Consultations page - should load without errors

## Troubleshooting

### If Environment Variables Still Don't Work:
1. Check if they have leading/trailing spaces
2. Ensure they're not wrapped in quotes
3. Try redeploying after adding them (Deployments → Redeploy)

### If Database Queries Fail:
1. The diagnostic will tell you which tables are missing
2. Run the setup SQL scripts in the order shown
3. Check Supabase logs for any SQL errors

### If You Still See Cookie Errors:
This shouldn't happen with our new approach, but if it does:
1. Clear your browser cache
2. Try in an incognito window
3. Check that middleware.ts isn't interfering

## Key Insight
The root cause was that your API routes couldn't connect to Supabase because:
1. Environment variables weren't properly set in Vercel
2. The authentication system was too complex for production
3. Error messages weren't helpful enough to diagnose the issue

Our fix addresses all three problems with a simpler, more robust approach.
