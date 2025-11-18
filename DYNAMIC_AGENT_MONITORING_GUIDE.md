# Dynamic Agent Configuration for Production Monitoring

**Integrating Expert AI Agents into Your DevOps Workflow**

This guide implements the dynamic agent configuration methodology outlined in the expert report, specifically tailored for monitoring and optimizing the Unite-Hub connection pool system.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture & Concepts](#architecture--concepts)
3. [Agent Definitions](#agent-definitions)
4. [Usage Examples](#usage-examples)
5. [Automation & Scheduling](#automation--scheduling)
6. [Integration with Monitoring Tools](#integration-with-monitoring-tools)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### What Are Dynamic Agents?

Dynamic agents are **specialized, temporary Claude configurations** loaded at runtime via JSON files. They provide:

- ✅ **Precision**: Exact control over AI behavior via system prompts
- ✅ **Security**: Least-privilege tool access (read-only, specific commands)
- ✅ **Reproducibility**: Consistent outputs for automation
- ✅ **Structured Data**: JSON output for programmatic integration

### Why Use This Approach?

Traditional interactive Claude sessions are conversational and unpredictable. Dynamic agents transform Claude into a **reliable, automated workflow tool** for:

- Database performance monitoring
- Query optimization recommendations
- Alert generation based on thresholds
- Structured reporting for Datadog/Prometheus

---

## Architecture & Concepts

### The JSON Configuration Structure

Dynamic agents are defined using a JSON array with four key fields:

```json
[
  {
    "description": "When to invoke this agent (routing logic)",
    "prompt": "System prompt defining behavior and constraints",
    "tools": ["Allowed tool names with granular permissions"],
    "model": "claude model to use (opus | sonnet | haiku)"
  }
]
```

### How Claude Routes Requests

1. **Description Matching**: Claude's router reads the `description` field to determine if this agent should handle the request
2. **Agent Activation**: Upon match, the agent loads with the specified `prompt` as its system instruction
3. **Tool Authorization**: Only tools in the `tools` array are accessible during execution
4. **Model Selection**: The specified `model` processes the request

### Security Model: Least Privilege

The agents follow the **principle of least privilege**:

- ✅ **monitoring-agent**: Read-only access (curl, Read)
- ✅ **optimization-agent**: Analysis tools only (Read, Grep, curl)
- ❌ **No destructive operations**: No Write, Edit, or unrestricted Bash

---

## Agent Definitions

### 1. Monitoring Agent

**File:** `.claude/agents/monitoring-agent.json`

**Purpose:** Real-time health monitoring and alerting

**Capabilities:**
- Fetches `/api/health` and `/api/metrics` endpoints
- Analyzes success rates, latency, circuit breaker state
- Generates alerts when thresholds are exceeded
- Provides actionable recommendations

**Alert Thresholds:**
```
Success Rate < 95%     → WARNING
Success Rate < 90%     → CRITICAL
Avg Latency > 500ms    → WARNING
Avg Latency > 1000ms   → CRITICAL
Circuit State = OPEN   → CRITICAL
Circuit State = HALF_OPEN → WARNING
```

**Output Schema:**
```json
{
  "timestamp": "2025-01-18T14:30:00Z",
  "status": "healthy | degraded | critical",
  "metrics": {
    "successRate": "98.5%",
    "averageLatency": 145,
    "circuitState": "CLOSED"
  },
  "alerts": [
    {
      "severity": "warning",
      "message": "Average latency above 500ms",
      "recommendation": "Review slow queries in contacts table"
    }
  ],
  "recommendations": [
    "Add index on contacts(workspace_id, ai_score)",
    "Enable query caching for hot leads endpoint"
  ]
}
```

### 2. Optimization Agent

**File:** `.claude/agents/optimization-agent.json`

**Purpose:** Database performance optimization and index recommendations

**Capabilities:**
- Analyzes query patterns from codebase
- Identifies slow queries and missing indexes
- Recommends caching strategies
- Provides copy-paste SQL statements

**Output Schema:**
```json
{
  "timestamp": "2025-01-18T14:30:00Z",
  "analysis": {
    "slowQueries": [
      {
        "table": "contacts",
        "estimatedLatency": "750ms",
        "frequency": "high"
      }
    ],
    "currentIndexes": ["contacts_pkey", "contacts_workspace_id_idx"],
    "cachingOpportunities": ["hot leads query", "campaign stats"]
  },
  "recommendations": [
    {
      "priority": "P0",
      "type": "index",
      "description": "Add composite index on contacts for lead scoring queries",
      "expectedImprovement": "60-70% faster queries",
      "implementation": {
        "sql": "CREATE INDEX idx_contacts_workspace_score ON contacts(workspace_id, ai_score DESC) WHERE status = 'lead';",
        "estimatedTime": "5 minutes",
        "riskLevel": "low"
      }
    }
  ],
  "quickWins": [
    "Enable Supabase PostgREST query result caching",
    "Use React Query for client-side data caching"
  ]
}
```

---

## Usage Examples

### Example 1: Manual Health Check

**Command:**
```bash
claude -p "Check the current health status of the database connection pool" \
  --agents @.claude/agents/monitoring-agent.json \
  --output-format json > health-report.json
```

**What This Does:**
1. Loads the monitoring agent configuration
2. Fetches `/api/health` and `/api/metrics`
3. Analyzes metrics against thresholds
4. Outputs structured JSON report

**Output File:** `health-report.json`
```json
{
  "timestamp": "2025-01-18T14:35:22Z",
  "status": "healthy",
  "metrics": {
    "successRate": "100.00%",
    "averageLatency": 65,
    "circuitState": "CLOSED"
  },
  "alerts": [],
  "recommendations": []
}
```

### Example 2: Database Optimization Analysis

**Command:**
```bash
claude -p "Analyze the Unite-Hub codebase and recommend database optimizations focusing on the contacts and campaigns tables" \
  --agents @.claude/agents/optimization-agent.json \
  --output-format json > optimization-report.json
```

**What This Does:**
1. Loads the optimization agent configuration
2. Scans codebase for query patterns
3. Identifies frequently accessed tables
4. Generates index recommendations with SQL

**Output File:** `optimization-report.json`
```json
{
  "timestamp": "2025-01-18T14:40:15Z",
  "analysis": {
    "slowQueries": [
      {
        "table": "contacts",
        "estimatedLatency": "450ms",
        "frequency": "high"
      }
    ],
    "currentIndexes": ["contacts_pkey"],
    "cachingOpportunities": [
      "Hot leads query (SELECT * FROM contacts WHERE ai_score >= 80)"
    ]
  },
  "recommendations": [
    {
      "priority": "P1",
      "type": "index",
      "description": "Add index on contacts for lead scoring",
      "expectedImprovement": "60-75% faster",
      "implementation": {
        "sql": "CREATE INDEX idx_contacts_score ON contacts(ai_score DESC) WHERE status = 'lead';",
        "estimatedTime": "3 minutes",
        "riskLevel": "low"
      }
    }
  ],
  "quickWins": [
    "Cache hot leads query results for 5 minutes"
  ]
}
```

### Example 3: Scheduled Monitoring (Cron Job)

**Create a monitoring script:** `scripts/monitor-health.sh`

```bash
#!/bin/bash
# Daily health check automation

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_DIR="./monitoring/reports"
mkdir -p $REPORT_DIR

# Run monitoring agent
claude -p "Perform daily health check on the database connection pool" \
  --agents @.claude/agents/monitoring-agent.json \
  --output-format json > "$REPORT_DIR/health_$TIMESTAMP.json"

# Parse results
STATUS=$(jq -r '.status' "$REPORT_DIR/health_$TIMESTAMP.json")

# Send alerts if critical
if [ "$STATUS" == "critical" ]; then
  # Example: Send Slack notification
  curl -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"🚨 CRITICAL: Database health degraded. Check $REPORT_DIR/health_$TIMESTAMP.json\"}" \
    $SLACK_WEBHOOK_URL
fi

echo "Health check complete: $STATUS"
```

**Schedule with cron:**
```bash
# Run every 6 hours
0 */6 * * * /path/to/scripts/monitor-health.sh
```

---

## Automation & Scheduling

### Recommended Monitoring Schedule

| Task | Frequency | Agent | Output |
|------|-----------|-------|--------|
| Health Check | Every 6 hours | monitoring-agent | Alert on critical |
| Optimization Review | Weekly | optimization-agent | Jira ticket with recommendations |
| Performance Audit | Monthly | optimization-agent | Full report for team review |

### Integration with CI/CD

**GitHub Actions Example:** `.github/workflows/db-health.yml`

```yaml
name: Database Health Check

on:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Claude CLI
        run: npm install -g @anthropic-ai/claude-code

      - name: Run Health Check
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          claude -p "Check database health" \
            --agents @.claude/agents/monitoring-agent.json \
            --output-format json > health.json

      - name: Parse Results
        id: health
        run: |
          STATUS=$(jq -r '.status' health.json)
          echo "status=$STATUS" >> $GITHUB_OUTPUT

      - name: Create Issue on Critical
        if: steps.health.outputs.status == 'critical'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = fs.readFileSync('health.json', 'utf8');

            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🚨 Database Health Critical',
              body: `\`\`\`json\n${report}\n\`\`\``,
              labels: ['critical', 'database', 'monitoring']
            });
```

---

## Integration with Monitoring Tools

### Datadog Integration

**Send metrics to Datadog:**

```bash
#!/bin/bash
# Extract metrics and send to Datadog

REPORT=$(claude -p "Check database health" \
  --agents @.claude/agents/monitoring-agent.json \
  --output-format json)

SUCCESS_RATE=$(echo $REPORT | jq -r '.metrics.successRate' | tr -d '%')
LATENCY=$(echo $REPORT | jq -r '.metrics.averageLatency')
CIRCUIT_STATE=$(echo $REPORT | jq -r '.metrics.circuitState')

# Send to Datadog
curl -X POST "https://api.datadoghq.com/api/v1/series" \
  -H "DD-API-KEY: ${DD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @- << EOF
{
  "series": [
    {
      "metric": "database.pool.success_rate",
      "points": [[$(date +%s), $SUCCESS_RATE]],
      "type": "gauge",
      "tags": ["env:production", "service:unite-hub"]
    },
    {
      "metric": "database.pool.latency",
      "points": [[$(date +%s), $LATENCY]],
      "type": "gauge",
      "tags": ["env:production", "service:unite-hub"]
    }
  ]
}
EOF
```

### Prometheus Integration

The agents can query the existing Prometheus endpoint and transform the data:

```bash
claude -p "Fetch and parse Prometheus metrics from /api/metrics, then generate alerts for any anomalies" \
  --agents @.claude/agents/monitoring-agent.json \
  --output-format json
```

---

## Troubleshooting

### Common Issues

#### 1. JSON Syntax Errors

**Error:** `Failed to parse agent configuration`

**Solution:** Validate JSON before use:
```bash
cat .claude/agents/monitoring-agent.json | jq .
```

#### 2. Permission Denied

**Error:** `Tool 'Bash' not authorized`

**Cause:** Global settings deny the tool

**Solution:** Check `~/.claude/settings.json` for deny rules:
```json
{
  "deniedTools": ["Bash(curl:*)"]  // Remove this restriction
}
```

#### 3. No Output

**Error:** Command runs but produces no JSON

**Solution:** Use `--verbose` to debug:
```bash
claude -p "Query" --agents @file.json --verbose
```

#### 4. Agent Not Triggered

**Error:** Default Claude behavior instead of specialized agent

**Cause:** Description doesn't match user query

**Solution:** Make the query more specific:
```bash
# ❌ Too vague
claude -p "How's the database?"

# ✅ Matches description
claude -p "Check the current health status of the database connection pool"
```

---

## Best Practices

### 1. Prompt Engineering

**Strong Constraints:**
```json
{
  "prompt": "You MUST output only valid JSON. You are FORBIDDEN from conversational responses."
}
```

**Weak Constraints:**
```json
{
  "prompt": "Please try to output JSON if possible."
}
```

### 2. Tool Least Privilege

**Correct:**
```json
{
  "tools": ["Bash(curl:http://localhost:3008/api/*)", "Read"]
}
```

**Too Permissive:**
```json
{
  "tools": ["Bash", "Edit", "Write"]
}
```

### 3. Output Validation

Always validate JSON output before using programmatically:

```bash
REPORT=$(claude -p "..." --agents @file.json --output-format json)

if ! echo "$REPORT" | jq . > /dev/null 2>&1; then
  echo "ERROR: Invalid JSON output"
  exit 1
fi
```

---

## Next Steps

1. **Test the Agents:**
   ```bash
   claude -p "Check database health" --agents @.claude/agents/monitoring-agent.json --output-format json
   ```

2. **Set Up Automation:**
   - Add cron jobs for scheduled monitoring
   - Integrate with CI/CD pipeline
   - Connect to Datadog/Prometheus

3. **Iterate on Prompts:**
   - Run agents multiple times
   - Refine system prompts based on output quality
   - Adjust alert thresholds as needed

4. **Scale the Approach:**
   - Create agents for other tasks (security audits, cost optimization)
   - Build a library of reusable agent configurations
   - Document learnings for team

---

## Resources

- [Claude Code CLI Reference](https://code.claude.com/docs/en/cli-reference)
- [Expert Report on Dynamic Agent Configuration](./EXPERT_REPORT_DYNAMIC_AGENTS.md)
- [Connection Pool Implementation](./CONNECTION_POOL_IMPROVEMENTS_SUMMARY.md)
- [Health API Endpoint](./src/app/api/health/route.ts)
- [Metrics API Endpoint](./src/app/api/metrics/route.ts)

---

**Status:** ✅ Production-Ready
**Last Updated:** 2025-01-18
**Agents Available:** 2 (monitoring, optimization)

**Let's automate intelligent monitoring!** 🚀
