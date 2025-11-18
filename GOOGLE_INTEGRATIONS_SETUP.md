# Google Integrations Setup Guide

**Replacing Slack with Google Products for Unite-Hub Monitoring**

This guide shows you how to set up Google Chat, Gmail, and Google Cloud Monitoring as alternatives to Slack and Datadog.

---

## 📋 Table of Contents

1. [Google Chat Webhooks](#google-chat-webhooks) (Slack Alternative)
2. [Gmail Alerts](#gmail-alerts) (Email Notifications)
3. [Google Cloud Monitoring](#google-cloud-monitoring) (Datadog Alternative)
4. [Complete Setup Example](#complete-setup-example)

---

## 1. Google Chat Webhooks

**Google Chat** is Google's team collaboration tool (similar to Slack). It supports incoming webhooks for automated notifications.

### Step 1: Create a Google Chat Space

1. Go to [Google Chat](https://chat.google.com)
2. Click **"+ Create a space"**
3. Name it something like: **"Unite-Hub Alerts"**
4. Add team members who should receive alerts

### Step 2: Create an Incoming Webhook

1. In your space, click the space name → **"Apps & integrations"**
2. Click **"+ Add webhooks"**
3. Give it a name: **"Database Health Monitor"**
4. **Optional:** Add an avatar URL (Google logo):
   ```
   https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg
   ```
5. Click **"Save"**
6. **Copy the webhook URL** (looks like):
   ```
   https://chat.googleapis.com/v1/spaces/AAAA.../messages?key=...&token=...
   ```

### Step 3: Configure the Script

```bash
# Set environment variable
export GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/YOUR_WEBHOOK_URL"

# Test it
./scripts/monitor-database-health.sh
```

### Message Format

When a critical alert occurs, Google Chat will receive a **card message** with:
- 🚨 Header with alert icon
- Status, Success Rate, Latency, Circuit Breaker metrics
- List of alerts with recommendations
- Timestamp and report file path

**Example Card:**

```
┌─────────────────────────────────────┐
│ 🚨 Unite-Hub Database Alert         │
│ Critical Health Status              │
├─────────────────────────────────────┤
│ Status:           critical          │
│ Success Rate:     85%               │
│ Average Latency:  1200ms            │
│ Circuit Breaker:  OPEN              │
├─────────────────────────────────────┤
│ Alerts:                             │
│ • [CRITICAL] Circuit breaker opened │
│ • [WARNING] High latency detected   │
├─────────────────────────────────────┤
│ Report: health_20250118.json        │
│ 2025-01-18 14:30:00                 │
└─────────────────────────────────────┘
```

---

## 2. Gmail Alerts

Send email alerts when critical issues occur. Uses standard Unix `mail` or `sendmail` commands.

### Option A: Using `mail` Command (Recommended)

#### Install mailutils (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install mailutils
```

#### Install mailx (macOS):
```bash
brew install mailutils
```

#### Configure Gmail SMTP (if needed):

1. Create `/etc/ssmtp/ssmtp.conf` or configure postfix with Gmail SMTP:
   ```
   mailhub=smtp.gmail.com:587
   AuthUser=your-email@gmail.com
   AuthPass=your-app-password
   UseSTARTTLS=YES
   ```

2. **Get Gmail App Password:**
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification
   - Go to **"App passwords"**
   - Generate password for "Mail"
   - Use this password (not your regular Gmail password)

### Option B: Using API (Advanced)

For programmatic Gmail sending via API, see [Gmail API Quickstart](https://developers.google.com/gmail/api/quickstart/python).

### Step 3: Configure the Script

```bash
# Set recipient email
export GMAIL_ALERT_EMAIL="alerts@your-company.com"

# Test it (will only send if status is critical)
./scripts/monitor-database-health.sh
```

### Email Format

**Subject:** `🚨 CRITICAL: Unite-Hub Database Alert`

**Body:**
```
🚨 CRITICAL: Unite-Hub Database Health Alert

Status: critical
Success Rate: 85%
Average Latency: 1200ms
Circuit Breaker: OPEN

═══════════════════════════════════════
 ALERTS
═══════════════════════════════════════
• [CRITICAL] Circuit breaker opened
  → Reduce database load immediately

• [WARNING] High latency detected
  → Review slow queries in contacts table

═══════════════════════════════════════
 RECOMMENDATIONS
═══════════════════════════════════════
• Add index on contacts(workspace_id, ai_score)
• Enable query caching for hot leads endpoint

═══════════════════════════════════════
Report saved: /path/to/monitoring/reports/health_20250118.json
Timestamp: Sat Jan 18 14:30:00 AEST 2025

This is an automated alert from the Unite-Hub monitoring system.
```

---

## 3. Google Cloud Monitoring

**Google Cloud Monitoring** (formerly Stackdriver) is Google's equivalent to Datadog for metrics, logging, and alerting.

### Step 1: Install gcloud CLI

#### macOS:
```bash
brew install --cask google-cloud-sdk
```

#### Linux:
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

#### Windows:
Download from: https://cloud.google.com/sdk/docs/install

### Step 2: Authenticate

```bash
# Initialize gcloud
gcloud init

# Login
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

### Step 3: Enable Monitoring API

```bash
# Enable the Cloud Monitoring API
gcloud services enable monitoring.googleapis.com
```

### Step 4: Configure the Script

```bash
# Set your GCP project ID
export GCP_PROJECT_ID="your-project-id"

# Run monitoring (will send metrics to GCP)
./scripts/monitor-database-health.sh
```

### Step 5: View Metrics in GCP Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **"Monitoring"** → **"Metrics Explorer"**
3. Search for your custom metrics:
   - `custom.googleapis.com/database/pool/success_rate`
   - `custom.googleapis.com/database/pool/latency`
   - `custom.googleapis.com/database/pool/circuit_state`

### Step 6: Create Dashboards

1. In Monitoring, go to **"Dashboards"** → **"Create Dashboard"**
2. Name it: **"Unite-Hub Database Health"**
3. Add charts for each metric:

**Chart 1: Success Rate**
- Metric: `custom.googleapis.com/database/pool/success_rate`
- Resource type: `global`
- Aggregation: `mean`
- Chart type: Line chart

**Chart 2: Latency**
- Metric: `custom.googleapis.com/database/pool/latency`
- Resource type: `global`
- Aggregation: `mean`
- Chart type: Line chart

**Chart 3: Circuit Breaker State**
- Metric: `custom.googleapis.com/database/pool/circuit_state`
- Resource type: `global`
- Aggregation: `most recent value`
- Chart type: Stacked bar chart

### Step 7: Set Up Alerts

1. In Monitoring, go to **"Alerting"** → **"Create Policy"**
2. **Alert 1: High Latency**
   - Condition: `database/pool/latency > 1000ms` for 5 minutes
   - Notification: Email, Google Chat
   - Documentation: "Database latency exceeded threshold. Check for slow queries."

3. **Alert 2: Circuit Breaker Open**
   - Condition: `database/pool/circuit_state == 2` (OPEN)
   - Notification: Email, Google Chat, SMS
   - Documentation: "Circuit breaker opened. System under stress."

4. **Alert 3: Low Success Rate**
   - Condition: `database/pool/success_rate < 90%` for 10 minutes
   - Notification: Email, Google Chat
   - Documentation: "Database success rate below 90%. Investigate failures."

---

## Complete Setup Example

### Environment Variables

Create a file: `~/.unite-hub-monitoring.env`

```bash
# Google Chat Webhooks (Slack Alternative)
export GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/.../messages?key=...&token=..."

# Gmail Alerts
export GMAIL_ALERT_EMAIL="team-alerts@your-company.com"

# Google Cloud Monitoring (Datadog Alternative)
export GCP_PROJECT_ID="your-gcp-project-id"

# Legacy Slack Support (optional)
# export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."

# Datadog (optional)
# export DD_API_KEY="your-datadog-key"
```

### Load Variables Before Running

```bash
# Source environment variables
source ~/.unite-hub-monitoring.env

# Run monitoring
./scripts/monitor-database-health.sh
```

### Automated Cron Job

```bash
# Edit crontab
crontab -e

# Add this line (runs every 6 hours)
0 */6 * * * source ~/.unite-hub-monitoring.env && /absolute/path/to/Unite-Hub/scripts/monitor-database-health.sh
```

---

## Comparison: Google vs Slack/Datadog

| Feature | Google Solution | Slack/Datadog |
|---------|----------------|---------------|
| **Team Chat** | Google Chat | Slack |
| **Webhooks** | ✅ Native support | ✅ Native support |
| **Card Messages** | ✅ Rich cards | ✅ Block Kit |
| **Email Alerts** | ✅ Gmail | ✅ Email integration |
| **Metrics** | Google Cloud Monitoring | Datadog |
| **Dashboards** | ✅ Built-in | ✅ Built-in |
| **Alerting** | ✅ Policy-based | ✅ Policy-based |
| **Cost (Small Team)** | ✅ **Free** (GCP Free Tier) | $$$ Paid plans |
| **Integration** | ✅ Single ecosystem | Multiple tools |

---

## Testing Your Setup

### Test Google Chat Webhook

```bash
export GOOGLE_CHAT_WEBHOOK_URL="your-webhook-url"

curl -X POST "$GOOGLE_CHAT_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "Test message from Unite-Hub monitoring system ✅"
  }'
```

**Expected:** Message appears in your Google Chat space

### Test Gmail Alerts

```bash
export GMAIL_ALERT_EMAIL="your-email@gmail.com"

echo "Test email from Unite-Hub" | mail -s "Test Alert" "$GMAIL_ALERT_EMAIL"
```

**Expected:** Email arrives in your inbox

### Test Google Cloud Monitoring

```bash
export GCP_PROJECT_ID="your-project-id"

# Send test metric
gcloud monitoring time-series create \
  --project="$GCP_PROJECT_ID" \
  --metric-type="custom.googleapis.com/test/metric" \
  --value-type=INT64 \
  --int64-value=42
```

**Expected:** Metric appears in GCP Monitoring console

---

## Troubleshooting

### Google Chat: "Request failed"

**Cause:** Invalid webhook URL

**Solution:**
1. Regenerate webhook in Google Chat
2. Ensure URL starts with `https://chat.googleapis.com/v1/spaces/`
3. Check for URL encoding issues (copy directly from Google Chat)

### Gmail: "mail: command not found"

**Cause:** mailutils not installed

**Solution:**
```bash
# Ubuntu/Debian
sudo apt-get install mailutils

# macOS
brew install mailutils
```

### Google Cloud: "Permission denied"

**Cause:** Not authenticated or missing API permissions

**Solution:**
```bash
# Re-authenticate
gcloud auth login

# Enable Monitoring API
gcloud services enable monitoring.googleapis.com

# Check project access
gcloud projects list
```

---

## Cost Estimates

### Google Cloud Monitoring (Free Tier)

**Free Tier Allowances:**
- 150 MB of logs per month
- First 1-150 time series: Free
- 151-100,000 time series: $0.0035/month each
- API calls: First 1M free/month

**Your Usage (3 metrics × 6 checks/day):**
- Time series: 3 (well within free tier)
- API calls: ~540/month (negligible)
- **Cost: $0/month** ✅

### Google Chat

**Cost: Free** for Google Workspace users ✅

### Gmail

**Cost: Free** for standard Gmail users ✅

---

## Next Steps

1. ✅ **Set up Google Chat webhook** (5 minutes)
2. ✅ **Configure Gmail alerts** (10 minutes)
3. ✅ **Enable Google Cloud Monitoring** (15 minutes)
4. ✅ **Create dashboards** (20 minutes)
5. ✅ **Set up alerting policies** (15 minutes)
6. ✅ **Test end-to-end** (10 minutes)

**Total setup time: ~75 minutes**

---

## Resources

- [Google Chat Webhooks Documentation](https://developers.google.com/chat/how-tos/webhooks)
- [Google Cloud Monitoring Quickstart](https://cloud.google.com/monitoring/docs/quickstart)
- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [gcloud CLI Reference](https://cloud.google.com/sdk/gcloud/reference)

---

**Status:** ✅ Production-Ready
**Cost:** Free (within GCP free tier)
**Integration Time:** ~75 minutes

**You're all set for Google-based monitoring!** 🚀
