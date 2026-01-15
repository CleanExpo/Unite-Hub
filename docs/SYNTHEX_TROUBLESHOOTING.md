# Synthex CLI - Troubleshooting Guide

**Version**: 1.0.0
**Last Updated**: 2026-01-15
**Target Audience**: Operations teams, support staff, developers

---

## Table of Contents

1. [Introduction](#introduction)
2. [General Troubleshooting Steps](#general-troubleshooting-steps)
3. [Installation & Setup Issues](#installation--setup-issues)
4. [Authentication Problems](#authentication-problems)
5. [Database Connection Errors](#database-connection-errors)
6. [Shopify Integration Issues](#shopify-integration-issues)
7. [Google Merchant Center Problems](#google-merchant-center-problems)
8. [Credential Management Errors](#credential-management-errors)
9. [Performance Issues](#performance-issues)
10. [Batch Operation Failures](#batch-operation-failures)
11. [Monitoring & Alerting Issues](#monitoring--alerting-issues)
12. [Common Error Messages](#common-error-messages)
13. [Debugging Tools & Techniques](#debugging-tools--techniques)
14. [When to Escalate](#when-to-escalate)

---

## Introduction

This guide provides solutions to common problems encountered when using the Synthex Apex Architecture CLI. Each section includes:
- **Problem description**: What you're experiencing
- **Symptoms**: How to identify the issue
- **Cause**: Why it's happening
- **Solution**: Step-by-step fix
- **Prevention**: How to avoid in the future

**Quick Tip**: Most issues fall into these categories:
1. **Configuration errors** (60%) - Missing or incorrect environment variables
2. **Authentication failures** (20%) - Expired or invalid credentials
3. **Network issues** (10%) - API timeouts, connectivity problems
4. **Database errors** (10%) - RLS policies, connection limits

---

## General Troubleshooting Steps

### Step 1: Check System Health

```bash
# Run comprehensive health check
npm run synthex -- health check

# Expected output:
# ✓ Database: healthy
# ✓ Shopify API: healthy
# ✓ Google Merchant API: healthy
# ✓ Credentials: healthy
# ✓ Disk Space: healthy
# ✓ Memory Usage: healthy
```

**If any check shows "degraded" or "unhealthy"**, see the specific section below.

### Step 2: Verify Environment Configuration

```bash
# Check required environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY
echo $GOOGLE_APPLICATION_CREDENTIALS
echo $GCP_PROJECT_ID

# All should return non-empty values
# If any are empty, update .env.local
```

### Step 3: Check CLI Version

```bash
# Verify CLI version
npm run synthex -- --version

# Expected: 1.0.0 or later
# If outdated, update:
git pull origin main
npm install
npm run build
```

### Step 4: Review Recent Logs

```bash
# Check recent errors
npm run synthex -- analytics errors --period 1d

# Look for patterns:
# - Same error repeating?
# - Specific tenant causing issues?
# - Time-based patterns (e.g., errors at midnight)?
```

### Step 5: Test with Minimal Example

```bash
# Test basic functionality
npm run synthex -- tenant workspace info

# If this fails, core configuration is broken
# If this works, issue is with specific operation
```

---

## Installation & Setup Issues

### Issue: `npm install` Fails

**Symptoms**:
```bash
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Cause**: Conflicting package versions or corrupted node_modules

**Solution**:
```bash
# Step 1: Clear npm cache
npm cache clean --force

# Step 2: Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Step 3: Reinstall
npm install

# Step 4: If still failing, use --legacy-peer-deps
npm install --legacy-peer-deps
```

**Prevention**: Keep Node.js and npm updated to latest LTS versions

---

### Issue: TypeScript Compilation Errors

**Symptoms**:
```bash
npm run build
# Error: TS2304: Cannot find name 'X'
```

**Cause**: Missing type definitions or incorrect TypeScript configuration

**Solution**:
```bash
# Step 1: Install missing types
npm install --save-dev @types/node @types/react

# Step 2: Verify tsconfig.json includes all source directories
cat tsconfig.json | grep "include"

# Step 3: Clean build cache and rebuild
rm -rf .next
npm run build
```

**Prevention**: Run `npm run build` before committing code

---

### Issue: CLI Command Not Found

**Symptoms**:
```bash
synthex --version
# bash: synthex: command not found
```

**Cause**: CLI not installed globally or PATH not configured

**Solution**:
```bash
# Option 1: Use npm run (recommended for local development)
npm run synthex -- --version

# Option 2: Install globally (for system-wide access)
npm install -g .
synthex --version

# Option 3: Add alias to .bashrc or .zshrc
echo 'alias synthex="npm run synthex --"' >> ~/.bashrc
source ~/.bashrc
```

**Prevention**: Document installation method in team wiki

---

## Authentication Problems

### Issue: "Unauthorized" Error

**Symptoms**:
```bash
synthex tenant tenants list
# Error: Unauthorized - Invalid or expired token
```

**Cause**: Missing or expired authentication token

**Solution**:
```bash
# Step 1: Check if workspace is initialized
npm run synthex -- tenant workspace info

# If not initialized:
npm run synthex -- init --market ANZ_SMB --region AU-SE1

# Step 2: Verify Supabase connection
curl -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" $NEXT_PUBLIC_SUPABASE_URL/rest/v1/

# Should return 200 OK

# Step 3: Check service role key
# Ensure SUPABASE_SERVICE_ROLE_KEY is set and valid
```

**Prevention**: Store credentials in .env.local (never commit)

---

### Issue: OAuth Flow Fails (Shopify)

**Symptoms**:
```bash
synthex auth login --service shopify --tenant-id "CLIENT_001"
# Error: OAuth redirect failed
```

**Cause**: Incorrect redirect URI or OAuth credentials

**Solution**:
```bash
# Step 1: Verify Shopify app credentials
echo $SHOPIFY_CLIENT_ID
echo $SHOPIFY_CLIENT_SECRET

# Step 2: Check redirect URI in Shopify Partners dashboard
# Should match: http://localhost:3008/api/integrations/shopify/callback

# Step 3: Verify callback route exists
ls src/app/api/integrations/shopify/callback/

# Step 4: Test OAuth flow manually
# 1. Go to Shopify Partners → Apps → Your App → OAuth
# 2. Add http://localhost:3008/api/integrations/shopify/callback
# 3. Retry authentication
```

**Prevention**: Document OAuth setup in team wiki

---

### Issue: Google OAuth "Invalid Credentials"

**Symptoms**:
```bash
synthex auth login --service google-merchant --client-id "CLIENT_001"
# Error: Invalid credentials
```

**Cause**: Service account key file missing or incorrect

**Solution**:
```bash
# Step 1: Verify service account key file exists
ls $GOOGLE_APPLICATION_CREDENTIALS

# Should list JSON file

# Step 2: Verify key file is valid JSON
cat $GOOGLE_APPLICATION_CREDENTIALS | jq .

# Should parse without errors

# Step 3: Check service account permissions
gcloud projects get-iam-policy $GCP_PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:*"

# Should show Secret Manager Secret Accessor role

# Step 4: Re-download service account key if corrupted
# Go to GCP Console → IAM → Service Accounts → Keys → Add Key
```

**Prevention**: Store service account key outside repository, reference via environment variable

---

## Database Connection Errors

### Issue: "Connection Refused"

**Symptoms**:
```bash
synthex tenant tenants list
# Error: Connection refused to database
```

**Cause**: Supabase project offline or incorrect connection string

**Solution**:
```bash
# Step 1: Verify Supabase project status
curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/

# Should return 200 OK
# If 503 or timeout, Supabase project may be paused

# Step 2: Check Supabase Dashboard
# Go to https://app.supabase.com
# Verify project is active (not paused)

# Step 3: Verify connection string format
echo $NEXT_PUBLIC_SUPABASE_URL
# Should be: https://[project-ref].supabase.co

# Step 4: Test direct database connection
psql $DATABASE_URL -c "SELECT 1;"

# Step 5: If paused, unpause in Supabase Dashboard
# Settings → General → Pause Project → Resume
```

**Prevention**: Monitor Supabase project status, set up uptime monitoring

---

### Issue: "Row Level Security Violation"

**Symptoms**:
```bash
synthex tenant tenants create --tenant-id "CLIENT_001" --name "Test"
# Error: new row violates row-level security policy
```

**Cause**: RLS policies blocking operation or missing workspace context

**Solution**:
```bash
# Step 1: Verify workspace is initialized
npm run synthex -- tenant workspace info

# Should show workspace_id

# Step 2: Check RLS policies in Supabase Dashboard
# SQL Editor → Run query:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

# All tables should have rowsecurity = true

# Step 3: Verify service role key is used (bypasses RLS)
echo $SUPABASE_SERVICE_ROLE_KEY | cut -c 1-20
# Should start with: eyJhbGciOiJIUzI1NiIs...

# Step 4: If using anon key instead, switch to service role
# Update code to use service role key for admin operations
```

**Prevention**: Use service role key for CLI operations, reserve anon key for client-side

---

### Issue: "Too Many Connections"

**Symptoms**:
```bash
synthex batch tenants create --from-csv large-batch.csv
# Error: FATAL: too many connections for role
```

**Cause**: Connection limit exceeded (default: 60 connections)

**Solution**:
```bash
# Step 1: Check current connection count
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Step 2: Enable Supabase Pooler
# Go to Supabase Dashboard → Settings → Database
# Enable "Enable Pooler"
# Copy Pooler connection string

# Step 3: Update connection string to use pooler
# Format: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Step 4: Close idle connections
psql $DATABASE_URL -c "
  SELECT pg_terminate_backend(pid)
  FROM pg_stat_activity
  WHERE state = 'idle'
  AND state_change < current_timestamp - INTERVAL '5 minutes';
"

# Step 5: Reduce batch size
# Split large CSV into smaller batches (25-50 rows each)
```

**Prevention**: Always use Supabase Pooler for production, implement connection pooling

---

## Shopify Integration Issues

### Issue: "Product Sync Timeout"

**Symptoms**:
```bash
synthex shopify sync products --tenant-id "CLIENT_001"
# Error: Request timeout after 30000ms
```

**Cause**: Large product catalog (>1000 products) or slow Shopify API

**Solution**:
```bash
# Step 1: Check Shopify store product count
# Go to Shopify Admin → Products
# Note total count

# Step 2: If >500 products, use pagination
# Modify sync to use batches of 250 products
# (Shopify API limit)

# Step 3: Increase timeout in sync service
# Edit src/cli/services/integrations/shopify-service.ts
# Update timeout to 60000ms (60 seconds)

# Step 4: Retry sync with smaller batch
synthex shopify sync products --tenant-id "CLIENT_001" --limit 250

# Step 5: Monitor Shopify API rate limits
# Shopify allows 2 requests/second (standard) or 4 requests/second (Plus)
```

**Prevention**: Implement pagination for large catalogs, add retry logic with exponential backoff

---

### Issue: "Invalid Shop Domain"

**Symptoms**:
```bash
synthex tenant tenants create --shopify-shop "mystore.com"
# Error: Invalid Shopify shop domain
```

**Cause**: Incorrect Shopify shop format

**Solution**:
```bash
# Correct format: [store-name].myshopify.com
# Examples:
# ✅ CORRECT: acme.myshopify.com
# ✅ CORRECT: my-store-123.myshopify.com
# ❌ WRONG: mystore.com
# ❌ WRONG: https://acme.myshopify.com
# ❌ WRONG: acme.shopify.com

# Retry with correct format:
synthex tenant tenants create \
  --tenant-id "CLIENT_001" \
  --name "Acme Corp" \
  --type shopify \
  --shopify-shop "acme.myshopify.com"
```

**Prevention**: Validate shop domain format before tenant creation

---

### Issue: "Shopify API Rate Limit Exceeded"

**Symptoms**:
```bash
synthex shopify sync products --tenant-id "CLIENT_001"
# Error: 429 Too Many Requests - Rate limit exceeded
```

**Cause**: Exceeded Shopify API rate limit (2 requests/second for standard plans)

**Solution**:
```bash
# Step 1: Wait 60 seconds before retrying
sleep 60
synthex shopify sync products --tenant-id "CLIENT_001"

# Step 2: Implement exponential backoff (automatic in CLI)
# Retry schedule:
# - First retry: 2 seconds
# - Second retry: 4 seconds
# - Third retry: 8 seconds

# Step 3: Check Shopify plan tier
# Shopify Plus has 4 requests/second limit (2x standard)

# Step 4: Reduce concurrent operations
# Don't sync multiple tenants simultaneously
```

**Prevention**: Implement rate limiting in sync logic, monitor API usage

---

## Google Merchant Center Problems

### Issue: "GMC Feed Sync Failed"

**Symptoms**:
```bash
synthex google-merchant sync feed --tenant-id "CLIENT_001"
# Error: Feed sync failed - Invalid product data
```

**Cause**: Product data doesn't meet GMC requirements

**Solution**:
```bash
# Step 1: Check product status
synthex google-merchant products status \
  --tenant-id "CLIENT_001" \
  --product-id "12345"

# Step 2: Review error details
# Common GMC validation errors:
# - Missing required fields (title, description, price, image)
# - Invalid GTIN format
# - Incorrect product category
# - Image URL not accessible

# Step 3: Validate product data
# Required fields:
# - id (unique)
# - title (max 150 chars)
# - description (max 5000 chars)
# - link (valid URL)
# - imageLink (valid image URL)
# - price (format: "10.00 AUD")
# - availability (in stock, out of stock, preorder)

# Step 4: Fix validation errors and retry
synthex google-merchant sync feed --tenant-id "CLIENT_001"
```

**Prevention**: Validate product data before sync, use GMC product data specification

---

### Issue: "GMC Merchant ID Not Found"

**Symptoms**:
```bash
synthex tenant tenants create --gmc-merchant-id "123456789"
# Error: GMC Merchant ID not found or inaccessible
```

**Cause**: Incorrect merchant ID or missing API access

**Solution**:
```bash
# Step 1: Verify merchant ID
# Go to https://merchants.google.com
# Top-right corner shows merchant ID (9-digit number)

# Step 2: Verify Content API is enabled
# GMC → Settings → APIs → Enable Content API

# Step 3: Verify service account has access
# GMC → Settings → Users → Add service account email
# Grant "Admin" or "Standard" access

# Step 4: Test API access
curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  https://shoppingcontent.googleapis.com/content/v2.1/[MERCHANT_ID]/products

# Should return product list (may be empty)

# Step 5: Retry tenant creation with correct merchant ID
```

**Prevention**: Document GMC setup process, verify merchant ID before tenant creation

---

## Credential Management Errors

### Issue: "Credential Not Found"

**Symptoms**:
```bash
synthex shopify sync products --tenant-id "CLIENT_001"
# Error: Credentials not found for tenant CLIENT_001
```

**Cause**: OAuth authentication not completed or credentials deleted

**Solution**:
```bash
# Step 1: Verify tenant exists
synthex tenant tenants show --tenant-id "CLIENT_001"

# Step 2: Check credential status
synthex tenant credentials list --tenant-id "CLIENT_001"

# If empty:
# Step 3: Re-authenticate
synthex auth login --service shopify --tenant-id "CLIENT_001"

# Follow OAuth flow in browser

# Step 4: Verify credentials stored
synthex tenant credentials list --tenant-id "CLIENT_001"

# Should show:
# Service: shopify
# Status: valid
# Expires: [date]
```

**Prevention**: Set up credential expiry alerts to prevent unexpected failures

---

### Issue: "Expired Credentials"

**Symptoms**:
```bash
synthex shopify sync products --tenant-id "CLIENT_001"
# Error: Credentials expired on 2026-01-01
```

**Cause**: OAuth tokens expired (typically 90 days for Shopify/GMC)

**Solution**:
```bash
# Step 1: Check expiration date
synthex tenant credentials list --tenant-id "CLIENT_001"

# Step 2: Delete expired credentials
synthex tenant credentials cleanup --tenant-id "CLIENT_001"

# Step 3: Re-authenticate
synthex auth login --service shopify --tenant-id "CLIENT_001"

# Step 4: Verify new credentials
synthex tenant credentials list --tenant-id "CLIENT_001"

# Should show new expiration date
```

**Prevention**: Set up automated alerts for expiring credentials (7-day warning)

---

### Issue: "Secret Manager Access Denied"

**Symptoms**:
```bash
synthex auth login --service shopify --tenant-id "CLIENT_001"
# Error: Permission denied accessing Secret Manager
```

**Cause**: Service account lacks Secret Manager permissions

**Solution**:
```bash
# Step 1: Verify service account
gcloud auth list

# Should show: synthex-cli@[project-id].iam.gserviceaccount.com

# Step 2: Grant Secret Manager permissions
gcloud projects add-iam-policy-binding $GCP_PROJECT_ID \
  --member="serviceAccount:synthex-cli@[project-id].iam.gserviceaccount.com" \
  --role="roles/secretmanager.admin"

# Step 3: Wait 60 seconds for IAM propagation
sleep 60

# Step 4: Retry authentication
synthex auth login --service shopify --tenant-id "CLIENT_001"
```

**Prevention**: Document GCP service account setup, use least-privilege roles

---

## Performance Issues

### Issue: "Slow Query Performance"

**Symptoms**:
```bash
synthex tenant tenants list
# Takes >10 seconds to complete
```

**Cause**: Missing database indexes or large dataset

**Solution**:
```bash
# Step 1: Check query execution plan
psql $DATABASE_URL -c "
  EXPLAIN ANALYZE
  SELECT * FROM tenants WHERE workspace_id = '[workspace-id]';
"

# Look for "Seq Scan" (bad) vs "Index Scan" (good)

# Step 2: Add missing indexes
psql $DATABASE_URL -c "
  CREATE INDEX IF NOT EXISTS idx_tenants_workspace_id
  ON tenants(workspace_id);
"

# Step 3: Analyze table for query planner
psql $DATABASE_URL -c "ANALYZE tenants;"

# Step 4: Retry query
synthex tenant tenants list

# Should be <1 second now
```

**Prevention**: Create indexes for all foreign keys and frequently queried columns

---

### Issue: "High Memory Usage"

**Symptoms**:
```bash
synthex health check
# ⚠ Memory Usage: degraded (92% used)
```

**Cause**: Large batch operations or memory leak

**Solution**:
```bash
# Step 1: Identify high-memory processes
top -o MEM

# Look for node processes using >1GB

# Step 2: Reduce batch size
# If running batch operations, reduce from 100 to 25-50

# Step 3: Restart CLI after large operations
# Exit and restart terminal

# Step 4: Monitor for memory leaks
# If memory keeps increasing, create GitHub issue with:
# - Steps to reproduce
# - Memory usage graph
# - Node.js version
```

**Prevention**: Implement streaming for large datasets, use pagination

---

### Issue: "Disk Space Low"

**Symptoms**:
```bash
synthex health check
# ⚠ Disk Space: degraded (88% used)
```

**Cause**: Log files or temporary data accumulation

**Solution**:
```bash
# Step 1: Check disk usage
df -h

# Step 2: Find large files
du -sh /var/log/synthex/*
du -sh ~/.cache/*

# Step 3: Clean up old logs (>30 days)
find /var/log/synthex/ -name "*.log" -mtime +30 -delete

# Step 4: Clean npm cache
npm cache clean --force

# Step 5: Clean build artifacts
rm -rf .next node_modules/.cache

# Step 6: Verify disk space
df -h
# Should be <85%
```

**Prevention**: Set up log rotation (daily), automated cleanup scripts (weekly)

---

## Batch Operation Failures

### Issue: "Batch Create Fails Midway"

**Symptoms**:
```bash
synthex batch tenants create --from-csv tenants.csv
# Created 25/100 tenants
# Error: Validation failed at row 26
```

**Cause**: Invalid data in CSV row 26

**Solution**:
```bash
# Step 1: Identify failed row
head -26 tenants.csv | tail -1

# Step 2: Review validation error
# Common issues:
# - Duplicate tenant ID
# - Invalid email format
# - Missing required field
# - Invalid type/market/region value

# Step 3: Create CSV with only failed rows
tail -n +26 tenants.csv > tenants-remaining.csv

# Step 4: Fix validation error in CSV
# Edit row 26 in tenants-remaining.csv

# Step 5: Retry with remaining rows
synthex batch tenants create --from-csv tenants-remaining.csv

# Step 6: Verify all created
synthex tenant tenants list | wc -l
# Should equal 100
```

**Prevention**: Use `--dry-run` flag to validate before executing

---

### Issue: "CSV Parse Error"

**Symptoms**:
```bash
synthex batch tenants create --from-csv tenants.csv
# Error: CSV parse error - Unexpected token at line 15
```

**Cause**: Malformed CSV (unescaped commas, missing quotes)

**Solution**:
```bash
# Step 1: Validate CSV format
# Use online CSV validator: https://csvlint.io/

# Step 2: Check for common issues
# - Commas in values must be escaped: "Acme, Inc."
# - Quotes in values must be doubled: "She said ""hello"""
# - Newlines in values must be in quotes: "Line 1\nLine 2"

# Step 3: Fix CSV formatting
# Use Excel or Google Sheets "Export as CSV"

# Step 4: Verify header row
head -1 tenants.csv
# Expected: tenantId,name,type,market,region,shopifyShop,gmcMerchantId

# Step 5: Retry import
synthex batch tenants create --from-csv tenants.csv
```

**Prevention**: Use CSV export from spreadsheet software, validate before import

---

## Monitoring & Alerting Issues

### Issue: "Alerts Not Sending"

**Symptoms**:
```bash
synthex alerts check-now
# Generated 3 alerts
# But no emails received
```

**Cause**: Email service not configured or incorrect webhook URL

**Solution**:
```bash
# Step 1: Verify alert rules exist
synthex alerts rules

# If empty:
# Step 2: Create alert rule
synthex alerts create-rule \
  --type expiring_7d \
  --channel email \
  --recipients "ops@example.com"

# Step 3: Verify email configuration
echo $NOTIFICATION_EMAIL_RECIPIENTS

# Should be: admin@example.com,ops@example.com

# Step 4: Test email delivery
# Check email service logs (SendGrid, Resend, etc.)

# Step 5: For Slack webhooks, verify URL
curl -X POST $SLACK_WEBHOOK_URL \
  -H 'Content-Type: application/json' \
  -d '{"text": "Test alert"}'

# Should post message to Slack channel
```

**Prevention**: Test alert delivery after initial setup, monitor notification logs

---

### Issue: "Health Check Always Fails"

**Symptoms**:
```bash
synthex health check --service database
# ✗ Database: unhealthy - Connection timeout
```

**Cause**: Firewall blocking connection or incorrect connection string

**Solution**:
```bash
# Step 1: Test direct connection
psql $DATABASE_URL -c "SELECT 1;"

# If this works, but health check fails:
# Step 2: Check health check timeout (default 5 seconds)
# May need to increase for slow connections

# Step 3: Verify health check query
# Edit src/cli/services/monitoring/health-monitor.ts
# Check query: SELECT 1;

# Step 4: Check network connectivity
ping [supabase-host]
traceroute [supabase-host]

# Step 5: Verify firewall rules
# Supabase: Check IP allowlist in dashboard
# GCP: Check VPC firewall rules
```

**Prevention**: Whitelist server IPs in Supabase dashboard, configure appropriate timeouts

---

## Common Error Messages

### "Error: ECONNREFUSED"

**Meaning**: Connection to database or API refused

**Quick Fix**:
```bash
# Check service is running
curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/

# Verify credentials
echo $SUPABASE_SERVICE_ROLE_KEY | cut -c 1-20
```

---

### "Error: ENOTFOUND"

**Meaning**: DNS lookup failed (hostname not found)

**Quick Fix**:
```bash
# Verify URL format
echo $NEXT_PUBLIC_SUPABASE_URL
# Should be: https://[project-ref].supabase.co

# Test DNS resolution
nslookup [project-ref].supabase.co
```

---

### "Error: Invalid JSON"

**Meaning**: Response is not valid JSON

**Quick Fix**:
```bash
# Verify API endpoint
curl $NEXT_PUBLIC_SUPABASE_URL/rest/v1/tenants \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"

# Should return JSON array, not HTML error page
```

---

### "Error: Workspace not found"

**Meaning**: Workspace not initialized

**Quick Fix**:
```bash
# Initialize workspace
synthex init --market ANZ_SMB --region AU-SE1

# Verify initialization
synthex tenant workspace info
```

---

### "Error: RLS policy violation"

**Meaning**: Row-level security blocking operation

**Quick Fix**:
```bash
# Verify using service role key (not anon key)
echo $SUPABASE_SERVICE_ROLE_KEY | wc -c
# Should be >100 characters

# Check RLS policies in Supabase Dashboard
# SQL Editor → Run: SELECT * FROM pg_policies;
```

---

## Debugging Tools & Techniques

### Enable Debug Logging

```bash
# Set debug environment variable
export DEBUG=synthex:*

# Run command with debug output
npm run synthex -- tenant tenants list

# Debug output shows:
# - Database queries executed
# - API calls made
# - Response times
# - Cache hits/misses
```

### Use JSON Output for Parsing

```bash
# Output as JSON for programmatic analysis
synthex tenant tenants list --format json > tenants.json

# Parse with jq
cat tenants.json | jq '.[] | select(.status == "active")'

# Count active tenants
cat tenants.json | jq '[.[] | select(.status == "active")] | length'
```

### Dry Run Mode

```bash
# Preview changes without executing
synthex batch tenants create --from-csv tenants.csv --dry-run

# Shows what would be created without creating
```

### Database Query Logging

```bash
# Enable Supabase query logging
# Dashboard → Settings → API → Enable "Log all queries"

# View logs
# Dashboard → Logs → Query Logs

# Analyze slow queries
# Look for queries >1 second
```

### API Call Tracing

```bash
# Trace API calls with curl
curl -v https://[store].myshopify.com/admin/api/2024-01/products.json \
  -H "X-Shopify-Access-Token: [token]"

# -v flag shows:
# - Request headers
# - Response headers
# - Response body
```

---

## When to Escalate

### Escalate to Team Lead if:

- Issue persists after following troubleshooting steps
- Data loss or corruption suspected
- Security incident detected (unauthorized access, exposed credentials)
- Performance degraded >50% with no obvious cause
- Multiple tenants affected simultaneously

### Escalate to Product Team if:

- Confirmed bug in CLI logic
- Feature request needed to resolve issue
- Documentation incorrect or missing
- Integration API changed behavior (Shopify, GMC)

### Escalate to Infrastructure Team if:

- Database performance issues (Supabase)
- Network connectivity problems
- GCP service outage
- Resource limits exceeded (CPU, memory, disk)

### Create GitHub Issue for:

- Reproducible bugs
- Feature requests
- Documentation improvements
- Performance optimization suggestions

**GitHub Issue Template**:
```markdown
### Issue Description
[Clear description of the problem]

### Steps to Reproduce
1. Run command: `synthex ...`
2. Observe error: `...`

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Environment
- CLI Version: 1.0.0
- Node.js Version: v18.0.0
- OS: macOS 14.0
- Market: ANZ_SMB
- Region: AU-SE1

### Logs/Screenshots
[Paste relevant logs or attach screenshots]

### Additional Context
[Any other relevant information]
```

---

## Quick Reference

### Common Commands for Troubleshooting

```bash
# Check system health
synthex health check

# Verify workspace
synthex tenant workspace info

# List tenants
synthex tenant tenants list

# Check credentials
synthex tenant credentials list --tenant-id "ID"

# View recent errors
synthex analytics errors --period 1d

# Test authentication
synthex auth login --service shopify --tenant-id "ID"

# Check alerts
synthex alerts list --unacknowledged

# Run diagnostic
synthex health check --format json > diagnostic.json
```

### Log Locations

```bash
# Application logs
/var/log/synthex/production.log

# Error logs
/var/log/synthex/error.log

# Access logs
/var/log/synthex/access.log

# Health check logs
/var/log/synthex/health-*.json
```

### Support Contacts

- **Technical Support**: support@synthex.com
- **Emergency Hotline**: +61 2 XXXX XXXX (24/7 for production outages)
- **GitHub Issues**: https://github.com/YourOrg/Unite-Hub/issues
- **Documentation**: https://docs.synthex.com

---

**Last Updated**: 2026-01-15
**Need more help?** Check the [Integration Guide](SYNTHEX_INTEGRATION_GUIDE.md) or [API Reference](SYNTHEX_API_REFERENCE.md)
