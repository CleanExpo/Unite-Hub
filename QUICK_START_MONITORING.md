# Quick Start: Google Monitoring Setup

**Get database health monitoring running in 10 minutes**

This guide shows you the fastest way to set up automated monitoring for Unite-Hub using Google products (all free tier).

---

## Prerequisites

- Development server running (`npm run dev`)
- Google Account
- Git Bash / Terminal access

---

## Step 1: Verify Setup (30 seconds)

Run the validation test to ensure all components are working:

```bash
./scripts/test-monitoring-setup.sh
```

**Expected output:**
```
✓ All critical tests passed!

Passed: 13
Warnings: 2
Failed: 0
```

If you see any failures, the script will tell you what needs to be fixed.

---

## Step 2: Choose Your Monitoring Level

Pick one based on your needs:

### Option A: Basic (Email Alerts Only) - 2 minutes

**What you get**: Email notifications when database health is critical

```bash
# 1. Copy configuration template
cp .env.monitoring.example ~/.unite-hub-monitoring.env

# 2. Edit and add your email
nano ~/.unite-hub-monitoring.env

# Set this line:
GMAIL_ALERT_EMAIL="your-email@gmail.com"

# 3. Test it
source ~/.unite-hub-monitoring.env
./scripts/monitor-database-health.sh
```

**Note**: Requires `mail` or `sendmail` installed. On Ubuntu/Debian:
```bash
sudo apt-get install mailutils
```

---

### Option B: Team Notifications (Google Chat) - 5 minutes

**What you get**: Real-time alerts in your team's Google Chat space

**Setup:**

1. Go to [Google Chat](https://chat.google.com)
2. Click **"+ Create a space"** → Name: "Unite-Hub Alerts"
3. Click space name → **"Apps & integrations"** → **"+ Add webhooks"**
4. Name: "Database Monitor" → **Save**
5. **Copy the webhook URL**

```bash
# Edit your monitoring config
nano ~/.unite-hub-monitoring.env

# Set this line with your webhook URL:
GOOGLE_CHAT_WEBHOOK_URL="https://chat.googleapis.com/v1/spaces/AAAA.../messages?key=...&token=..."

# Test it
source ~/.unite-hub-monitoring.env
./scripts/monitor-database-health.sh
```

Check your Google Chat space - you should see a test message!

---

### Option C: Full Metrics (Google Cloud Monitoring) - 10 minutes

**What you get**: Time-series metrics, dashboards, and alerting policies

**Setup:**

1. Install gcloud CLI:
   - **macOS**: `brew install --cask google-cloud-sdk`
   - **Linux**: `curl https://sdk.cloud.google.com | bash`
   - **Windows**: Download from https://cloud.google.com/sdk/docs/install

2. Authenticate:
```bash
gcloud init
gcloud auth login
```

3. Create/select project and enable API:
```bash
gcloud config set project YOUR_PROJECT_ID
gcloud services enable monitoring.googleapis.com
```

4. Configure monitoring:
```bash
nano ~/.unite-hub-monitoring.env

# Set this line:
GCP_PROJECT_ID="your-gcp-project-id"

# Test it
source ~/.unite-hub-monitoring.env
./scripts/monitor-database-health.sh
```

5. View metrics in [GCP Console](https://console.cloud.google.com):
   - Go to **Monitoring** → **Metrics Explorer**
   - Search: `custom.googleapis.com/database/pool/success_rate`

---

## Step 3: Set Up Automated Monitoring (2 minutes)

Run the health check automatically every 6 hours:

```bash
# Edit crontab
crontab -e

# Add this line (replace /path/to with actual path):
0 */6 * * * source ~/.unite-hub-monitoring.env && /path/to/Unite-Hub/scripts/monitor-database-health.sh

# Save and exit
```

**To find your path:**
```bash
pwd  # Run this inside Unite-Hub directory
```

---

## Step 4: Test Alert Conditions (Optional)

Want to see what a critical alert looks like?

The monitoring agent triggers alerts when:
- Success Rate < 90% → **CRITICAL**
- Average Latency > 1000ms → **CRITICAL**
- Circuit Breaker = OPEN → **CRITICAL**

To test alerts, you would need to simulate database issues (not recommended in production).

---

## What Happens Next?

### Monitoring Reports

All health checks are saved to:
```
monitoring/reports/health_YYYYMMDD_HHMMSS.json
```

View the latest report:
```bash
ls -lht monitoring/reports/ | head -5
cat monitoring/reports/health_*.json | tail -1
```

### Google Chat Alerts

When the database status is **critical**, you'll receive a card message like this:

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
└─────────────────────────────────────┘
```

### Gmail Alerts

Critical alerts send an email with:
- Status summary
- List of alerts with recommendations
- Report file location
- Timestamp

### GCP Metrics

Metrics are sent to Google Cloud Monitoring:
- `custom.googleapis.com/database/pool/success_rate`
- `custom.googleapis.com/database/pool/latency`
- `custom.googleapis.com/database/pool/circuit_state`

Create dashboards to visualize trends over time.

---

## Troubleshooting

### "Health endpoint not responding"

**Solution**: Make sure dev server is running:
```bash
npm run dev
```

### "mail: command not found"

**Solution**: Install mailutils:
```bash
# Ubuntu/Debian
sudo apt-get install mailutils

# macOS
brew install mailutils
```

### "gcloud: command not found"

**Solution**: Install gcloud CLI (see Option C above)

### "Permission denied" on scripts

**Solution**: Make scripts executable:
```bash
chmod +x scripts/monitor-database-health.sh
chmod +x scripts/test-monitoring-setup.sh
```

---

## Cost

**All Google monitoring is FREE within these limits:**

- **Google Chat**: Free for Google Workspace users
- **Gmail**: Free for standard Gmail accounts
- **Google Cloud Monitoring**:
  - First 150 MB logs/month: Free
  - First 150 time series: Free
  - Our usage (~3 metrics × 6 checks/day): **$0/month**

---

## Next Steps

Once basic monitoring is working:

1. **Create Dashboards** - See [GOOGLE_INTEGRATIONS_SETUP.md](GOOGLE_INTEGRATIONS_SETUP.md#step-6-create-dashboards)
2. **Set Up Alerting Policies** - See [GOOGLE_INTEGRATIONS_SETUP.md](GOOGLE_INTEGRATIONS_SETUP.md#step-7-set-up-alerts)
3. **Customize Thresholds** - Edit [.claude/agents/monitoring-agent.json](.claude/agents/monitoring-agent.json)

---

## Full Documentation

- **[GOOGLE_INTEGRATIONS_SETUP.md](GOOGLE_INTEGRATIONS_SETUP.md)** - Complete setup guide (Google Chat, Gmail, GCP)
- **[DYNAMIC_AGENT_MONITORING_GUIDE.md](DYNAMIC_AGENT_MONITORING_GUIDE.md)** - Dynamic agent architecture
- **[.claude/agents/README.md](.claude/agents/README.md)** - Agent usage and examples

---

## Summary

You now have:
- ✅ Automated database health monitoring
- ✅ Real-time alerts (Google Chat / Gmail)
- ✅ Historical metrics (Google Cloud Monitoring)
- ✅ Scheduled checks every 6 hours
- ✅ Production-ready monitoring infrastructure

**Total setup time**: 10 minutes
**Total cost**: $0/month (free tier)

---

**Happy monitoring!** 🚀
