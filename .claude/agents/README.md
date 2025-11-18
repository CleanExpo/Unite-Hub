# Dynamic Claude Agents for Unite-Hub

This directory contains **specialized AI agent configurations** for automated monitoring, optimization, and maintenance tasks.

## Available Agents

### 1. **monitoring-agent.json**
**Purpose:** Real-time database health monitoring and alerting

**Invoke with:**
```bash
claude -p "Check the current health status of the database connection pool" \
  --agents @.claude/agents/monitoring-agent.json \
  --output-format json
```

**Features:**
- ✅ Monitors /api/health and /api/metrics endpoints
- ✅ Alerts on success rate drops, high latency, circuit breaker issues
- ✅ Provides actionable recommendations
- ✅ Structured JSON output for automation

**Use Cases:**
- Cron jobs for scheduled monitoring
- CI/CD health checks
- Incident response automation
- Datadog/Prometheus integration

---

### 2. **optimization-agent.json**
**Purpose:** Database query optimization and index recommendations

**Invoke with:**
```bash
claude -p "Analyze the codebase and recommend database optimizations" \
  --agents @.claude/agents/optimization-agent.json \
  --output-format json
```

**Features:**
- ✅ Identifies slow queries
- ✅ Recommends specific database indexes
- ✅ Suggests caching strategies
- ✅ Provides copy-paste SQL statements

**Use Cases:**
- Weekly performance reviews
- Pre-deployment optimization checks
- Capacity planning
- Technical debt reduction

---

## Quick Start

### 1. Install Claude CLI
```bash
npm install -g @anthropic-ai/claude-code
```

### 2. Set API Key
```bash
export ANTHROPIC_API_KEY=sk-ant-your-key
```

### 3. Run an Agent
```bash
# Health check
claude -p "Check database health" \
  --agents @.claude/agents/monitoring-agent.json \
  --output-format json

# Optimization analysis
claude -p "Recommend database optimizations" \
  --agents @.claude/agents/optimization-agent.json \
  --output-format json
```

---

## Automation Examples

### Cron Job (Every 6 Hours)
```bash
# Add to crontab
0 */6 * * * /path/to/Unite-Hub/scripts/monitor-database-health.sh
```

### GitHub Actions
See `.github/workflows/db-health.yml` for CI/CD integration example

### Manual Execution
```bash
# Using the automation script
./scripts/monitor-database-health.sh
```

---

## Agent Architecture

### How Dynamic Agents Work

1. **Description Matching**: Claude reads the `description` field to determine if the agent should handle the request
2. **System Prompt Activation**: The `prompt` field defines the agent's behavior and constraints
3. **Tool Authorization**: Only tools in the `tools` array are accessible
4. **Model Selection**: The specified `model` (opus/sonnet/haiku) processes the request

### Security Model

All agents follow **least-privilege** principles:
- ✅ Read-only access (no Write, Edit)
- ✅ Specific tool permissions (curl to specific endpoints)
- ❌ No destructive operations
- ❌ No unrestricted shell access

---

## Output Schemas

### Monitoring Agent Output
```json
{
  "timestamp": "ISO 8601",
  "status": "healthy | degraded | critical",
  "metrics": {
    "successRate": "98.5%",
    "averageLatency": 145,
    "circuitState": "CLOSED"
  },
  "alerts": [
    {
      "severity": "warning | critical",
      "message": "Alert description",
      "recommendation": "Action to take"
    }
  ],
  "recommendations": ["optimization suggestions"]
}
```

### Optimization Agent Output
```json
{
  "timestamp": "ISO 8601",
  "analysis": {
    "slowQueries": [...],
    "currentIndexes": [...],
    "cachingOpportunities": [...]
  },
  "recommendations": [
    {
      "priority": "P0 | P1 | P2",
      "type": "index | cache | query-optimization",
      "description": "What to do",
      "expectedImprovement": "60-70% faster",
      "implementation": {
        "sql": "CREATE INDEX ...",
        "estimatedTime": "5 minutes",
        "riskLevel": "low"
      }
    }
  ],
  "quickWins": ["immediate optimizations"]
}
```

---

## Best Practices

### 1. Use Specific Queries
```bash
# ❌ Too vague
claude -p "How's the database?"

# ✅ Matches agent description
claude -p "Check the current health status of the database connection pool"
```

### 2. Always Validate JSON
```bash
REPORT=$(claude -p "..." --agents @file.json --output-format json)

if ! echo "$REPORT" | jq . > /dev/null 2>&1; then
  echo "ERROR: Invalid JSON"
  exit 1
fi
```

### 3. Use --verbose for Debugging
```bash
claude -p "Query" --agents @file.json --verbose
```

---

## Extending the System

### Creating New Agents

1. **Copy a template** (monitoring-agent.json or optimization-agent.json)
2. **Modify the fields:**
   - `description`: When to invoke this agent
   - `prompt`: Behavior constraints and output format
   - `tools`: Allowed operations (least privilege)
   - `model`: Reasoning level needed (opus > sonnet > haiku)
3. **Test thoroughly:**
   ```bash
   claude -p "Test query" --agents @your-new-agent.json --verbose
   ```

### Suggested Agent Ideas

- **security-audit-agent.json**: Scan for vulnerabilities, outdated dependencies
- **cost-optimization-agent.json**: Analyze Supabase/Vercel usage, suggest cost reductions
- **documentation-agent.json**: Generate/update documentation from code
- **test-coverage-agent.json**: Identify untested code paths, suggest test cases

---

## Troubleshooting

### Common Issues

| Error | Cause | Solution |
|-------|-------|----------|
| `Failed to parse agent configuration` | Invalid JSON syntax | Validate with `jq . file.json` |
| `Tool 'X' not authorized` | Global settings deny tool | Check `~/.claude/settings.json` |
| `No output` | Agent not triggered | Use `--verbose` to debug routing |
| `Invalid JSON output` | Prompt too weak | Strengthen system prompt constraints |

---

## Documentation

- **[Dynamic Agent Monitoring Guide](../../DYNAMIC_AGENT_MONITORING_GUIDE.md)** - Complete implementation guide
- **[Connection Pool Summary](../../CONNECTION_POOL_IMPROVEMENTS_SUMMARY.md)** - System architecture
- **[Automation Script](../../scripts/monitor-database-health.sh)** - Ready-to-use monitoring

---

## Resources

- [Claude Code CLI Reference](https://code.claude.com/docs/en/cli-reference)
- [Anthropic Messages API Docs](https://docs.claude.com/en/api/messages)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

**Status:** ✅ Production-Ready
**Agents:** 2 (monitoring, optimization)
**Last Updated:** 2025-01-18

**Automate intelligently!** 🚀
