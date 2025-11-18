# Monitoring System - Practical Examples

**Real-world usage examples for Unite-Hub database monitoring**

This guide provides copy-paste examples for common monitoring scenarios.

---

## Example 1: Daily Health Check (Simplest Setup)

**Goal**: Get a daily email if the database has issues

**Setup Time**: 2 minutes

```bash
# 1. Configure email
cp .env.monitoring.example ~/.unite-hub-monitoring.env
echo 'GMAIL_ALERT_EMAIL="you@company.com"' >> ~/.unite-hub-monitoring.env

# 2. Test it works
source ~/.unite-hub-monitoring.env
./scripts/monitor-database-health.sh

# 3. Schedule for 9 AM daily
crontab -e
# Add this line:
0 9 * * * source ~/.unite-hub-monitoring.env && /absolute/path/to/Unite-Hub/scripts/monitor-database-health.sh
```

**Expected Behavior**:
- Script runs every day at 9 AM
- If database status is "critical", you receive an email
- If everything is healthy, no email (silent success)
- Reports saved to `monitoring/reports/` for review

---

## Example 2: Team Notifications via Google Chat

**Goal**: Real-time alerts in your team's Google Chat space

**Setup Time**: 5 minutes

### Step 1: Create Google Chat Webhook

1. Open [Google Chat](https://chat.google.com)
2. Click **"+ Create a space"**
3. Name: **"Unite-Hub Monitoring"**
4. Add team members
5. Click space name → **"Apps & integrations"**
6. Click **"+ Add webhooks"**
7. Name: **"Database Health Monitor"**
8. Avatar URL (optional):
   ```
   https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg
   ```
9. Click **"Save"**
10. **Copy the webhook URL** (looks like `https://chat.googleapis.com/v1/spaces/...`)

### Step 2: Configure Monitoring

```bash
# Edit config
nano ~/.unite-hub-monitoring.env

# Add this line (paste your actual webhook URL):
GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/AAAA.../messages?key=...&token=..."
```

### Step 3: Test It

```bash
# Manually trigger monitoring
source ~/.unite-hub-monitoring.env
./scripts/monitor-database-health.sh

# Check your Google Chat space - you should see output
```

### Step 4: Automate (Every 6 Hours)

```bash
crontab -e

# Add this line (replace /path/to with your actual path):
0 */6 * * * source ~/.unite-hub-monitoring.env && /path/to/Unite-Hub/scripts/monitor-database-health.sh
```

**Expected Alert in Google Chat**:

```
┌─────────────────────────────────────────────┐
│ 🚨 Unite-Hub Database Alert                 │
│ Critical Health Status                      │
├─────────────────────────────────────────────┤
│ Status: critical                            │
│ Success Rate: 85%                           │
│ Average Latency: 1200ms                     │
│ Circuit Breaker: OPEN                       │
├─────────────────────────────────────────────┤
│ Alerts:                                     │
│ • [CRITICAL] Circuit breaker opened         │
│ • [WARNING] High latency detected           │
│                                             │
│ Report: health_20250118_143022.json         │
│ 2025-01-18 14:30:00                         │
└─────────────────────────────────────────────┘
```

---

## Example 3: Full Observability with Google Cloud Monitoring

**Goal**: Historical metrics, dashboards, and alerting policies

**Setup Time**: 10 minutes

### Step 1: Install gcloud CLI

**macOS**:
```bash
brew install --cask google-cloud-sdk
```

**Linux**:
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Windows**: Download from https://cloud.google.com/sdk/docs/install

### Step 2: Authenticate and Setup

```bash
# Initialize gcloud
gcloud init

# Login
gcloud auth login

# Create or select project
gcloud projects create unite-hub-monitoring --name="Unite-Hub Monitoring"
# OR
gcloud config set project YOUR_EXISTING_PROJECT_ID

# Enable Monitoring API
gcloud services enable monitoring.googleapis.com
```

### Step 3: Configure Monitoring

```bash
nano ~/.unite-hub-monitoring.env

# Add this line (use your actual project ID):
GCP_PROJECT_ID="unite-hub-monitoring"
```

### Step 4: Test Metrics Collection

```bash
source ~/.unite-hub-monitoring.env
./scripts/monitor-database-health.sh

# Expected output:
# Sending metrics to Google Cloud Monitoring...
# ✅ Metrics sent to Google Cloud Monitoring
```

### Step 5: View Metrics in GCP Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **Monitoring** → **Metrics Explorer**
3. Click **"Select a metric"**
4. Search for: `custom.googleapis.com/database/pool/success_rate`
5. Click **"Apply"**

**Available Metrics**:
- `custom.googleapis.com/database/pool/success_rate` (percentage)
- `custom.googleapis.com/database/pool/latency` (milliseconds)
- `custom.googleapis.com/database/pool/circuit_state` (0=CLOSED, 1=HALF_OPEN, 2=OPEN)

### Step 6: Create a Dashboard

1. In Monitoring, go to **Dashboards** → **"Create Dashboard"**
2. Name: **"Unite-Hub Database Health"**
3. Click **"Add Chart"**

**Chart 1: Success Rate**
- Metric: `custom.googleapis.com/database/pool/success_rate`
- Resource type: `global`
- Aggregation: `mean`
- Chart type: `Line chart`
- Y-axis: Min: 0, Max: 100

**Chart 2: Average Latency**
- Metric: `custom.googleapis.com/database/pool/latency`
- Resource type: `global`
- Aggregation: `mean`
- Chart type: `Line chart`
- Y-axis label: "Milliseconds"

**Chart 3: Circuit Breaker State**
- Metric: `custom.googleapis.com/database/pool/circuit_state`
- Resource type: `global`
- Aggregation: `most recent value`
- Chart type: `Stacked bar chart`

### Step 7: Set Up Alerting Policy

1. In Monitoring, go to **Alerting** → **"Create Policy"**
2. Click **"Add Condition"**

**Alert: High Latency**
- Target:
  - Metric: `custom.googleapis.com/database/pool/latency`
  - Resource type: `global`
- Configuration:
  - Condition type: `Threshold`
  - Threshold position: `Above threshold`
  - Threshold value: `1000` (milliseconds)
  - For: `5 minutes`
- Notifications:
  - Email: Your email address
  - Google Chat: Your webhook URL
- Documentation:
  ```
  Database latency exceeded 1000ms for 5 minutes.

  Check the health reports in monitoring/reports/ for details.
  Review slow queries and consider adding database indexes.
  ```
- Name: **"Database High Latency Alert"**

**Alert: Low Success Rate**
- Target: `custom.googleapis.com/database/pool/success_rate`
- Condition: `Below threshold`
- Threshold: `90` (percent)
- For: `10 minutes`
- Documentation:
  ```
  Database success rate fell below 90%.

  Check circuit breaker state and review error logs.
  This may indicate connectivity issues or query failures.
  ```

**Alert: Circuit Breaker Open**
- Target: `custom.googleapis.com/database/pool/circuit_state`
- Condition: `Equals`
- Value: `2` (OPEN state)
- For: `1 minute`
- Documentation:
  ```
  Circuit breaker opened - system under stress.

  Immediate action required:
  1. Check database connection
  2. Review recent error logs
  3. Verify Supabase service status
  ```

---

## Example 4: Monitoring Multiple Environments

**Goal**: Separate monitoring for dev, staging, and production

### Directory Structure

```bash
mkdir -p ~/.unite-hub-monitoring
touch ~/.unite-hub-monitoring/dev.env
touch ~/.unite-hub-monitoring/staging.env
touch ~/.unite-hub-monitoring/production.env
```

### Configuration Files

**~/.unite-hub-monitoring/dev.env**:
```bash
# Development environment
GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/DEV_SPACE/..."
GMAIL_ALERT_EMAIL="dev-team@company.com"
GCP_PROJECT_ID="unite-hub-dev"
```

**~/.unite-hub-monitoring/staging.env**:
```bash
# Staging environment
GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/STAGING_SPACE/..."
GMAIL_ALERT_EMAIL="staging-alerts@company.com"
GCP_PROJECT_ID="unite-hub-staging"
```

**~/.unite-hub-monitoring/production.env**:
```bash
# Production environment
GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/PROD_SPACE/..."
GMAIL_ALERT_EMAIL="prod-alerts@company.com"
GCP_PROJECT_ID="unite-hub-production"
```

### Cron Jobs (Different Frequencies)

```bash
crontab -e

# Production: Every hour
0 * * * * source ~/.unite-hub-monitoring/production.env && /path/to/Unite-Hub/scripts/monitor-database-health.sh

# Staging: Every 6 hours
0 */6 * * * source ~/.unite-hub-monitoring/staging.env && /path/to/Unite-Hub/scripts/monitor-database-health.sh

# Development: Daily at 9 AM
0 9 * * * source ~/.unite-hub-monitoring/dev.env && /path/to/Unite-Hub/scripts/monitor-database-health.sh
```

---

## Example 5: Custom Slack Integration (Legacy)

**Goal**: Use Slack instead of Google Chat

**Note**: While Google Chat is recommended, Slack is still supported.

### Step 1: Create Slack Webhook

1. Go to [Slack API](https://api.slack.com/messaging/webhooks)
2. Click **"Create your Slack app"**
3. Choose **"From scratch"**
4. App name: **"Unite-Hub Monitor"**
5. Select workspace
6. Navigate to **"Incoming Webhooks"**
7. Activate webhooks
8. Click **"Add New Webhook to Workspace"**
9. Select channel: **#monitoring** (or create it)
10. **Copy the webhook URL**

### Step 2: Configure

```bash
nano ~/.unite-hub-monitoring.env

# Add this line:
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"
```

### Step 3: Test

```bash
source ~/.unite-hub-monitoring.env
./scripts/monitor-database-health.sh
```

Check your Slack channel for the alert message.

---

## Example 6: Manual Testing Without Cron

**Goal**: Run health checks manually whenever needed

```bash
# Quick check (console output only)
./scripts/monitor-database-health.sh

# With email alerts
GMAIL_ALERT_EMAIL="you@company.com" ./scripts/monitor-database-health.sh

# With Google Chat
GOOGLE_CHAT_WEBHOOK_URL="your-webhook-url" ./scripts/monitor-database-health.sh

# View latest report
cat monitoring/reports/health_*.json | tail -1 | jq .

# View all reports from today
ls -lh monitoring/reports/health_$(date +%Y%m%d)*.json
```

---

## Example 7: Integration with CI/CD (GitHub Actions)

**Goal**: Run health checks before/after deployments

### .github/workflows/health-check.yml

```yaml
name: Database Health Check

on:
  workflow_dispatch:  # Manual trigger
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours

jobs:
  health-check:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Install dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y curl jq

      - name: Run health check
        env:
          GOOGLE_CHAT_WEBHOOK_URL: ${{ secrets.GOOGLE_CHAT_WEBHOOK_URL }}
          GMAIL_ALERT_EMAIL: ${{ secrets.GMAIL_ALERT_EMAIL }}
          GCP_PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
        run: |
          chmod +x scripts/monitor-database-health.sh
          ./scripts/monitor-database-health.sh

      - name: Upload health report
        uses: actions/upload-artifact@v3
        with:
          name: health-report
          path: monitoring/reports/health_*.json
          retention-days: 7
```

### GitHub Secrets to Add

1. Go to your repository → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Add each of these:
   - `GOOGLE_CHAT_WEBHOOK_URL`
   - `GMAIL_ALERT_EMAIL`
   - `GCP_PROJECT_ID`

---

## Example 8: Custom Alert Thresholds

**Goal**: Change when alerts are triggered

### Edit Agent Configuration

```bash
nano .claude/agents/monitoring-agent.json
```

Find this section in the `prompt` field:

```json
"ALERT THRESHOLDS:\n- Success rate < 95%: WARNING\n- Success rate < 90%: CRITICAL\n- Average latency > 500ms: WARNING\n- Average latency > 1000ms: CRITICAL\n- Circuit state = OPEN: CRITICAL\n- Circuit state = HALF_OPEN: WARNING"
```

**Example: More Aggressive Thresholds**

Change to:
```json
"ALERT THRESHOLDS:\n- Success rate < 98%: WARNING\n- Success rate < 95%: CRITICAL\n- Average latency > 300ms: WARNING\n- Average latency > 700ms: CRITICAL\n- Circuit state = OPEN: CRITICAL\n- Circuit state = HALF_OPEN: WARNING"
```

**Example: More Lenient Thresholds**

Change to:
```json
"ALERT THRESHOLDS:\n- Success rate < 90%: WARNING\n- Success rate < 80%: CRITICAL\n- Average latency > 1000ms: WARNING\n- Average latency > 2000ms: CRITICAL\n- Circuit state = OPEN: CRITICAL\n- Circuit state = HALF_OPEN: WARNING"
```

After editing, test the new thresholds:

```bash
./scripts/monitor-database-health.sh
```

---

## Example 9: Viewing Historical Reports

**Goal**: Analyze trends and investigate past issues

### View All Reports

```bash
# List all reports (most recent first)
ls -lht monitoring/reports/

# Count total reports
ls monitoring/reports/ | wc -l

# View specific report
cat monitoring/reports/health_20250118_143022.json | jq .
```

### Extract Specific Data

```bash
# Get all success rates from today
for file in monitoring/reports/health_$(date +%Y%m%d)*.json; do
    echo "$(basename $file): $(jq -r '.metrics.successRate' $file)"
done

# Find reports with critical status
grep -l '"status":"critical"' monitoring/reports/*.json

# View all alerts from a specific report
jq -r '.alerts[] | "[\(.severity)] \(.message)"' monitoring/reports/health_20250118_143022.json
```

### Generate Summary

```bash
# Create a summary of the last 24 hours
echo "Database Health Summary - Last 24 Hours"
echo "========================================"
echo ""

CRITICAL_COUNT=$(grep -l '"status":"critical"' monitoring/reports/health_$(date +%Y%m%d)*.json 2>/dev/null | wc -l)
DEGRADED_COUNT=$(grep -l '"status":"degraded"' monitoring/reports/health_$(date +%Y%m%d)*.json 2>/dev/null | wc -l)
HEALTHY_COUNT=$(grep -l '"status":"healthy"' monitoring/reports/health_$(date +%Y%m%d)*.json 2>/dev/null | wc -l)

echo "Critical: $CRITICAL_COUNT"
echo "Degraded: $DEGRADED_COUNT"
echo "Healthy: $HEALTHY_COUNT"
```

---

## Troubleshooting Common Issues

### Issue: "Permission denied" when running scripts

**Solution**:
```bash
chmod +x scripts/monitor-database-health.sh
chmod +x scripts/test-monitoring-setup.sh
```

### Issue: "curl: command not found"

**Solution**:
```bash
# Ubuntu/Debian
sudo apt-get install curl

# macOS (usually pre-installed)
# If missing: brew install curl
```

### Issue: "jq: command not found"

**Note**: The monitoring script doesn't actually require `jq` for basic operation. However, for viewing reports:

**Solution**:
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq
```

### Issue: Health endpoint returns 404

**Solution**: Make sure dev server is running:
```bash
npm run dev
```

### Issue: Cron job not working

**Common causes**:

1. **Wrong path**: Use absolute paths in crontab
   ```bash
   # Find your absolute path
   cd /path/to/Unite-Hub
   pwd  # Copy this output
   ```

2. **Environment variables not loaded**: Always source the config file
   ```bash
   source ~/.unite-hub-monitoring.env && ./scripts/monitor-database-health.sh
   ```

3. **Check cron logs**:
   ```bash
   # Ubuntu/Debian
   grep CRON /var/log/syslog

   # macOS
   log show --predicate 'eventMessage contains "cron"' --last 1h
   ```

---

## Best Practices

### 1. Start Simple

Begin with email-only alerts, then add more integrations as needed.

### 2. Test Before Automating

Always run the monitoring script manually first to ensure everything works:
```bash
./scripts/monitor-database-health.sh
```

### 3. Monitor the Monitors

Set up a weekly reminder to review monitoring reports and ensure the system is working.

### 4. Adjust Thresholds Based on Reality

After running for a week, review your alerts and adjust thresholds to reduce noise.

### 5. Document Your Setup

Keep notes on:
- Which integrations you're using
- When alerts should trigger
- Who should respond to alerts
- Escalation procedures

---

## Quick Reference

### Common Commands

```bash
# Validate setup
./scripts/test-monitoring-setup.sh

# Manual health check
./scripts/monitor-database-health.sh

# View latest report
ls -t monitoring/reports/ | head -1 | xargs cat

# Edit configuration
nano ~/.unite-hub-monitoring.env

# Test specific integration
GOOGLE_CHAT_WEBHOOK_URL="your-url" ./scripts/monitor-database-health.sh
```

### File Locations

- Configuration: `~/.unite-hub-monitoring.env`
- Reports: `monitoring/reports/health_*.json`
- Scripts: `scripts/monitor-database-health.sh`
- Agent configs: `.claude/agents/*.json`

---

**Need more help?** See the full documentation:
- [QUICK_START_MONITORING.md](../QUICK_START_MONITORING.md)
- [GOOGLE_INTEGRATIONS_SETUP.md](../GOOGLE_INTEGRATIONS_SETUP.md)
- [DYNAMIC_AGENT_MONITORING_GUIDE.md](../DYNAMIC_AGENT_MONITORING_GUIDE.md)
