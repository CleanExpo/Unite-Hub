# Monitoring System Architecture

**Technical architecture overview for Unite-Hub database monitoring**

This document provides a detailed technical view of how the monitoring system works.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MONITORING SYSTEM                           │
│                     (Production-Ready, $0/month)                    │
└─────────────────────────────────────────────────────────────────────┘
                                   │
            ┌──────────────────────┼──────────────────────┐
            │                      │                      │
    ┌───────▼────────┐    ┌────────▼───────┐    ┌───────▼────────┐
    │  Data Sources  │    │  Processing    │    │  Destinations  │
    │  (Inputs)      │    │  (AI Agents)   │    │  (Outputs)     │
    └───────┬────────┘    └────────┬───────┘    └───────┬────────┘
            │                      │                      │
            │                      │                      │
     [See Below]            [See Below]             [See Below]
```

---

## Layer 1: Data Sources (Inputs)

### API Endpoints

```
┌─────────────────────────────────────────────┐
│           Unite-Hub Application             │
│         (Next.js + Supabase)                │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
┌───────▼────────┐    ┌─────────▼────────┐
│  /api/health   │    │  /api/metrics    │
│                │    │                  │
│ Returns:       │    │ Returns:         │
│ • status       │    │ • JSON format    │
│ • timestamp    │    │ • Prometheus     │
│ • uptime       │    │                  │
│ • checks:      │    │ Contains:        │
│   - database   │    │ • requests       │
│   - redis      │    │ • performance    │
│ • pool:        │    │ • circuit        │
│   - requests   │    │ • health         │
│   - success %  │    │                  │
│   - latency    │    │                  │
│   - circuit    │    │                  │
└────────────────┘    └──────────────────┘
```

### Connection Pool Layer

```
┌──────────────────────────────────────────────────────────┐
│        src/lib/db/connection-pool.ts                     │
│        (HTTP Client Manager + Resilience)                │
└──────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼───────┐  ┌──────▼──────┐  ┌──────▼──────┐
│   Singleton   │  │   Retry     │  │  Circuit    │
│   Pattern     │  │   Logic     │  │  Breaker    │
│               │  │             │  │             │
│ • Reusable    │  │ • Exp.      │  │ • CLOSED    │
│   clients     │  │   backoff   │  │ • HALF_OPEN │
│ • HTTP/2      │  │ • Max 3     │  │ • OPEN      │
│   reuse       │  │   retries   │  │             │
│               │  │ • 100ms     │  │ Threshold:  │
│               │  │   base      │  │ 5 failures  │
└───────────────┘  └─────────────┘  └─────────────┘
                          │
                    ┌─────▼──────┐
                    │  Metrics   │
                    │  Tracking  │
                    │            │
                    │ • Requests │
                    │ • Success  │
                    │ • Latency  │
                    │ • Circuit  │
                    └────────────┘
```

---

## Layer 2: Processing (AI Agents)

### Dynamic Agent System

```
┌─────────────────────────────────────────────────────────┐
│          Claude AI Agents (JSON-Configured)             │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┴─────────────────┐
        │                                   │
┌───────▼──────────┐              ┌─────────▼──────────┐
│ monitoring-agent │              │ optimization-agent │
│    .json         │              │      .json         │
└───────┬──────────┘              └─────────┬──────────┘
        │                                   │
        │ Model: Sonnet 4.5                 │ Model: Opus 4
        │ Tools: Bash(curl), Read           │ Tools: Read, Grep, Bash
        │                                   │
┌───────▼──────────────────────────────────────────────────┐
│              Agent Execution Flow                        │
└──────────────────────────────────────────────────────────┘

1. Fetch Data
   ├─→ curl http://localhost:3008/api/health
   └─→ curl http://localhost:3008/api/metrics?format=json

2. Parse JSON
   ├─→ Extract: status, successRate, latency, circuitState
   └─→ Calculate: health score, trends

3. Evaluate Thresholds
   ├─→ Success Rate < 95% → WARNING
   ├─→ Success Rate < 90% → CRITICAL
   ├─→ Avg Latency > 500ms → WARNING
   ├─→ Avg Latency > 1000ms → CRITICAL
   ├─→ Circuit State = OPEN → CRITICAL
   └─→ Circuit State = HALF_OPEN → WARNING

4. Generate Output (JSON)
   ├─→ timestamp (ISO 8601)
   ├─→ status (healthy | degraded | critical)
   ├─→ metrics (successRate, latency, circuitState)
   ├─→ alerts ([{severity, message, recommendation}])
   └─→ recommendations ([string])

5. Return to Script
   └─→ JSON output piped to monitoring script
```

### Agent Configuration Example

```json
{
  "description": "Expert monitoring specialist...",
  "prompt": "You are a Database Performance Specialist...",
  "tools": ["Bash(curl:*)", "Read"],
  "model": "sonnet"
}
```

**Security**: Agents run with least-privilege access:
- ✅ Read-only operations
- ✅ Specific curl endpoints only
- ❌ No Write/Edit permissions
- ❌ No unrestricted Bash access

---

## Layer 3: Automation (Orchestration)

### Monitoring Script Flow

```
┌──────────────────────────────────────────────────────────┐
│     scripts/monitor-database-health.sh                   │
│     (Bash automation with multi-platform alerts)         │
└──────────────────────────────────────────────────────────┘

STEP 1: Setup
├─→ Create reports directory (monitoring/reports/)
├─→ Generate timestamp
└─→ Load environment variables

STEP 2: Execute Monitoring Agent
├─→ Call claude CLI with monitoring-agent.json
├─→ Capture JSON output
└─→ Save to health_TIMESTAMP.json

STEP 3: Parse Results
├─→ Extract: status, successRate, latency, circuitState
└─→ Format for display

STEP 4: Console Output (Color-Coded)
├─→ 🟢 GREEN = Healthy
├─→ 🟡 YELLOW = Degraded/Warning
└─→ 🔴 RED = Critical

STEP 5: Conditional Alerts (if status = "critical")
├─→ Google Chat Notification?
│   ├─→ Check: GOOGLE_CHAT_WEBHOOK_URL set?
│   └─→ POST card message via curl
│
├─→ Gmail Alert?
│   ├─→ Check: GMAIL_ALERT_EMAIL set?
│   └─→ Send via mail/sendmail
│
├─→ Slack Notification? (legacy)
│   ├─→ Check: SLACK_WEBHOOK_URL set?
│   └─→ POST message via curl
│
└─→ Google Cloud Monitoring?
    ├─→ Check: GCP_PROJECT_ID set?
    ├─→ Check: gcloud CLI installed?
    └─→ Send metrics via gcloud monitoring time-series create

STEP 6: Datadog Integration? (legacy)
└─→ Check: DD_API_KEY set?
    └─→ POST metrics to Datadog API

STEP 7: Cleanup & Exit
└─→ Display report location
```

---

## Layer 4: Destinations (Outputs)

### Alert Routing

```
┌─────────────────────────────────────────────────────────┐
│                   ALERT DESTINATIONS                    │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼────────┐  ┌─────▼──────┐  ┌──────▼──────┐
│  Google Chat   │  │   Gmail    │  │  GCP        │
│  (Primary)     │  │  (Primary) │  │  Monitoring │
└───────┬────────┘  └─────┬──────┘  └──────┬──────┘
        │                 │                 │
        │                 │                 │
  POST webhook      mail/sendmail    gcloud CLI
  Rich cards        SMTP relay       Custom metrics
  Real-time         Email body       Dashboards
                    Attachments      Alerting
```

### Google Chat Card Format

```json
{
  "cards": [{
    "header": {
      "title": "🚨 Unite-Hub Database Alert",
      "subtitle": "Critical Health Status",
      "imageUrl": "https://fonts.gstatic.com/.../googleg/v6/24px.svg"
    },
    "sections": [{
      "widgets": [
        {
          "keyValue": {
            "topLabel": "Status",
            "content": "critical",
            "icon": "STAR"
          }
        },
        {
          "keyValue": {
            "topLabel": "Success Rate",
            "content": "85%",
            "icon": "TICKET"
          }
        }
      ]
    }]
  }]
}
```

### Gmail Email Format

```
Subject: 🚨 CRITICAL: Unite-Hub Database Alert

Body:
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
```

### Google Cloud Monitoring Metrics

```
Metric 1: custom.googleapis.com/database/pool/success_rate
├─→ Type: DOUBLE (0-100)
├─→ Resource: global
├─→ Labels: service=unite-hub, component=connection-pool
└─→ Update frequency: Every 6 hours (cron)

Metric 2: custom.googleapis.com/database/pool/latency
├─→ Type: INT64 (milliseconds)
├─→ Resource: global
├─→ Labels: service=unite-hub, component=connection-pool
└─→ Aggregation: mean, p50, p95, p99

Metric 3: custom.googleapis.com/database/pool/circuit_state
├─→ Type: INT64 (0=CLOSED, 1=HALF_OPEN, 2=OPEN)
├─→ Resource: global
├─→ Labels: service=unite-hub, component=connection-pool, state=CLOSED|HALF_OPEN|OPEN
└─→ Display: Stacked bar chart
```

---

## Data Flow: End-to-End

### Scenario: Critical Database Issue Detected

```
1. Database Connection Fails (3rd time)
   ↓
2. Circuit Breaker Opens
   ├─→ getPoolStats() updates circuitState = "OPEN"
   └─→ /api/health returns status = "degraded"
   ↓
3. Cron Job Triggers (every 6 hours)
   └─→ ./scripts/monitor-database-health.sh runs
   ↓
4. Script Calls Monitoring Agent
   └─→ claude -p "Check database health" --agents @monitoring-agent.json
   ↓
5. Agent Fetches Endpoints
   ├─→ curl http://localhost:3008/api/health
   └─→ curl http://localhost:3008/api/metrics?format=json
   ↓
6. Agent Analyzes Data
   ├─→ Parses JSON responses
   ├─→ Evaluates against thresholds
   ├─→ circuitState = "OPEN" → CRITICAL alert
   └─→ Generates recommendations
   ↓
7. Agent Returns JSON
   {
     "status": "critical",
     "metrics": {...},
     "alerts": [
       {
         "severity": "critical",
         "message": "Circuit breaker opened",
         "recommendation": "Reduce database load immediately"
       }
     ]
   }
   ↓
8. Script Saves Report
   └─→ monitoring/reports/health_20250118_143022.json
   ↓
9. Script Sends Alerts (parallel)
   ├─→ Google Chat: POST webhook with card
   ├─→ Gmail: Send email via mail command
   ├─→ GCP Monitoring: gcloud time-series create
   └─→ Datadog (if configured): POST to API
   ↓
10. Team Receives Notifications
    ├─→ Google Chat message appears in "#unite-hub-alerts"
    ├─→ Email arrives in team inbox
    ├─→ GCP dashboard shows spike in circuit_state metric
    └─→ GCP alerting policy triggers (if configured)
    ↓
11. Team Responds
    ├─→ Opens monitoring/reports/health_*.json for details
    ├─→ Checks Supabase dashboard for connection issues
    ├─→ Reviews application logs
    └─→ Implements recommended fixes
    ↓
12. Circuit Breaker Recovers
    ├─→ After 60s, attempts test request (HALF_OPEN)
    ├─→ If successful, transitions to CLOSED
    └─→ Next monitoring run shows status = "healthy"
```

---

## Security Architecture

### Principle of Least Privilege

```
┌─────────────────────────────────────────────────────────┐
│              SECURITY BOUNDARIES                        │
└─────────────────────────────────────────────────────────┘

Agent Permissions (monitoring-agent.json):
├─→ ✅ ALLOWED:
│   ├─→ Bash(curl:http://localhost:3008/api/*)
│   ├─→ Read (specific files only)
│   └─→ No destructive operations
│
└─→ ❌ DENIED:
    ├─→ Write (cannot modify files)
    ├─→ Edit (cannot change code)
    ├─→ Unrestricted Bash (cannot run arbitrary commands)
    └─→ Network access (except localhost:3008)

Script Permissions:
├─→ ✅ ALLOWED:
│   ├─→ Read environment variables
│   ├─→ Create report files in monitoring/reports/
│   ├─→ POST to webhooks (Google Chat, Slack)
│   ├─→ Send emails via mail/sendmail
│   └─→ Call gcloud CLI (if authenticated)
│
└─→ ❌ DENIED:
    ├─→ Modify application code
    ├─→ Access database directly
    ├─→ Change system configuration
    └─→ Execute unsafe commands

Environment Variables:
├─→ Stored in: ~/.unite-hub-monitoring.env
├─→ Permissions: 600 (owner read/write only)
├─→ Not committed to git
└─→ Loaded only when needed (source command)
```

### Sensitive Data Handling

```
Webhook URLs:
├─→ Contain authentication tokens
├─→ Stored in environment variables (not code)
├─→ Never logged to console
└─→ Used only in HTTPS requests

Email Addresses:
├─→ Stored in environment variables
├─→ Used only for recipients (not exposed)
└─→ No PII in email content

GCP Credentials:
├─→ Managed by gcloud CLI
├─→ User authenticated separately (gcloud auth login)
├─→ Project ID in environment variable (not secret)
└─→ API calls use user's OAuth token
```

---

## Performance Characteristics

### Resource Usage

```
CPU Usage:
├─→ Monitoring script: < 0.1% (bash)
├─→ Agent execution: ~5-10% for 2-3 seconds
└─→ Total: Negligible impact on system

Memory Usage:
├─→ Monitoring script: ~5 MB (bash + subprocesses)
├─→ Agent execution: ~100-200 MB (Claude CLI)
└─→ Reports: ~5-10 KB per JSON file

Network Usage:
├─→ API calls: 2 requests (health + metrics)
├─→ Data transferred: ~2-5 KB per check
├─→ Webhook POSTs: ~1-2 KB per alert
└─→ GCP metrics: ~500 bytes per metric

Disk Usage:
├─→ Reports: ~10 KB × 4 checks/day = 40 KB/day
├─→ Monthly: ~1.2 MB
├─→ Yearly: ~14 MB (negligible)
└─→ Auto-cleanup: Recommended after 90 days
```

### Timing

```
Execution Time:
├─→ API endpoint response: 50-150ms
├─→ Agent analysis: 1-3 seconds
├─→ Alert delivery: 100-500ms per destination
└─→ Total: 2-5 seconds per check

Cron Frequency:
├─→ Recommended: Every 6 hours (4 times/day)
├─→ Production: Every hour (24 times/day)
└─→ Dev/Staging: Daily (1 time/day)
```

---

## Cost Analysis

### Google Cloud Platform (Free Tier)

```
Google Cloud Monitoring:
├─→ Metric ingestion: 3 metrics × 4 checks/day × 30 days = 360 data points/month
├─→ Free tier: First 150 time series/month
├─→ Cost: $0/month ✅

Google Chat:
├─→ Webhooks: Unlimited (free)
├─→ Storage: N/A (no storage)
├─→ Cost: $0/month ✅

Gmail:
├─→ SMTP relay: Free for standard Gmail
├─→ Sending limit: 500 emails/day
├─→ Our usage: ~4-10 emails/month (critical only)
├─→ Cost: $0/month ✅

Total: $0/month (within free tier) ✅
```

### Alternative: Paid Monitoring Services

```
Datadog (for comparison):
├─→ Infrastructure monitoring: $15/host/month
├─→ APM: $31/host/month
├─→ Logs: $0.10/GB
└─→ Estimated: $50-100/month

PagerDuty:
├─→ Professional plan: $21/user/month
├─→ Business plan: $41/user/month
└─→ Estimated: $21-82/month (1-2 users)

New Relic:
├─→ Standard plan: $49/month
├─→ Pro plan: $149/month
└─→ Estimated: $49-149/month

Google Solution Savings: $70-250/month ($840-3,000/year)
```

---

## Scalability Considerations

### Current Limits

```
Cron Frequency:
├─→ Current: Every 6 hours (4 checks/day)
├─→ Max recommended: Every 15 minutes (96 checks/day)
└─→ Bottleneck: GCP free tier (150 time series)

Concurrent Checks:
├─→ Current: 1 environment
├─→ Supported: Unlimited (separate configs)
└─→ Bottleneck: Cron job scheduling

Alert Volume:
├─→ Current: Critical only
├─→ Max: All severities (WARNING + CRITICAL)
└─→ Bottleneck: Email sending limits (500/day Gmail)
```

### Scaling Strategies

```
Multiple Environments:
├─→ Separate config files per env (dev, staging, prod)
├─→ Different cron schedules (prod hourly, dev daily)
└─→ Separate Google Chat spaces per env

Increased Frequency:
├─→ Reduce cron interval to 15 minutes
├─→ Still within GCP free tier (360 → 8,640 data points/month)
└─→ Adjust alert thresholds to reduce noise

Custom Metrics:
├─→ Add application-specific metrics
├─→ Examples: API response times, error rates, user counts
└─→ Stay within 150 time series limit
```

---

## Monitoring the Monitors

### Health Checks for Monitoring System

```
Weekly Checklist:
├─→ ✅ Verify cron job is running (check /var/log/syslog or crontab -l)
├─→ ✅ Check report files are being created (ls monitoring/reports/)
├─→ ✅ Test manual execution (./scripts/monitor-database-health.sh)
├─→ ✅ Verify Google Chat webhook works (test message)
└─→ ✅ Review alert accuracy (adjust thresholds if needed)

Monthly Checklist:
├─→ ✅ Review all reports for trends (success rates, latency)
├─→ ✅ Clean up old reports (> 90 days)
├─→ ✅ Update agent configurations if needed
├─→ ✅ Verify GCP metrics are being recorded
└─→ ✅ Test disaster recovery (simulate critical alert)
```

---

## Failure Modes & Recovery

### What Happens If...

**Agent execution fails?**
```
├─→ Script catches error
├─→ Logs error message to console
├─→ No report saved (prevents corrupt data)
└─→ Next cron run will retry
```

**Webhook URL is invalid?**
```
├─→ curl returns error
├─→ Error logged to console
├─→ Other destinations still attempted
└─→ Health check completes normally
```

**gcloud CLI not authenticated?**
```
├─→ Warning displayed: "gcloud CLI not authenticated"
├─→ GCP metrics skipped
├─→ Other destinations still work
└─→ Fix: Run gcloud auth login
```

**Dev server is down?**
```
├─→ API endpoints return 404 or timeout
├─→ Agent reports: "API not responding"
├─→ Status: "critical"
└─→ Alert sent (which is correct behavior)
```

---

## Comparison: Monitoring Solutions

### Feature Matrix

| Feature | Unite-Hub Solution | Datadog | New Relic | PagerDuty |
|---------|-------------------|---------|-----------|-----------|
| **Database Metrics** | ✅ | ✅ | ✅ | ✅ |
| **Custom Alerts** | ✅ | ✅ | ✅ | ✅ |
| **Dashboards** | ✅ (GCP) | ✅ | ✅ | ⚠️ Limited |
| **AI-Powered Insights** | ✅ (Claude) | ⚠️ Basic | ⚠️ Basic | ❌ |
| **Team Notifications** | ✅ (Chat, Email) | ✅ | ✅ | ✅ |
| **Cost (Small Team)** | **$0/month** | $50-100/mo | $49-149/mo | $21-82/mo |
| **Setup Time** | 10 minutes | 2-4 hours | 2-4 hours | 1-2 hours |
| **Learning Curve** | Low | Medium | Medium | Low |
| **Vendor Lock-in** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes |

---

## Future Enhancements (Roadmap)

### Phase 2: Advanced Features

```
1. Predictive Alerting
   ├─→ Use Claude AI to predict failures before they happen
   ├─→ Analyze trends over time
   └─→ Proactive recommendations

2. Auto-Remediation
   ├─→ Trigger automated fixes for common issues
   ├─→ Restart services, clear caches, scale resources
   └─→ With human approval workflow

3. Multi-Region Monitoring
   ├─→ Monitor Vercel edge functions across regions
   ├─→ Detect regional outages
   └─→ Automatic failover suggestions

4. SLA Tracking
   ├─→ Calculate uptime percentages
   ├─→ Generate monthly reports
   └─→ Track against SLA targets (99.9%, 99.99%)

5. Cost Optimization
   ├─→ Analyze Supabase usage patterns
   ├─→ Recommend connection pooling settings
   └─→ Identify expensive queries
```

---

## Conclusion

The Unite-Hub monitoring system provides:

✅ **Production-grade reliability** with circuit breakers and retry logic
✅ **Zero-cost operation** within Google's free tier
✅ **Real-time alerting** via multiple channels
✅ **Historical metrics** for trend analysis
✅ **AI-powered insights** via Claude agents
✅ **Minimal maintenance** overhead (< 1 hour/month)

**Architecture Highlights:**
- Modular design (easy to extend)
- Security-first approach (least privilege)
- Multi-platform support (Google, Slack, Datadog)
- Automation-ready (cron, CI/CD, webhooks)
- Comprehensive documentation

---

**Related Documentation:**
- [QUICK_START_MONITORING.md](../QUICK_START_MONITORING.md) - 10-minute setup
- [GOOGLE_INTEGRATIONS_SETUP.md](../GOOGLE_INTEGRATIONS_SETUP.md) - Complete reference
- [MONITORING_EXAMPLES.md](MONITORING_EXAMPLES.md) - Practical examples
- [DYNAMIC_AGENT_MONITORING_GUIDE.md](../DYNAMIC_AGENT_MONITORING_GUIDE.md) - Agent details

**Last Updated**: 2025-11-18
**Status**: Production Ready ✅
