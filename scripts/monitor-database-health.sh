#!/bin/bash
#
# Database Health Monitoring Script
# Uses dynamic Claude agents to monitor connection pool health
#
# Usage:
#   ./scripts/monitor-database-health.sh
#
# Environment Variables:
#   SLACK_WEBHOOK_URL - Optional: Send alerts to Slack
#   DD_API_KEY - Optional: Send metrics to Datadog
#

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
REPORT_DIR="$PROJECT_ROOT/monitoring/reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
AGENT_CONFIG="$PROJECT_ROOT/.claude/agents/monitoring-agent.json"

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Create report directory
mkdir -p "$REPORT_DIR"

echo "========================================="
echo " Database Health Monitoring"
echo "========================================="
echo "Timestamp: $(date)"
echo "Agent: monitoring-agent.json"
echo ""

# Check if Claude CLI is installed
if ! command -v claude &> /dev/null; then
    echo -e "${RED}ERROR: Claude CLI not found${NC}"
    echo "Install with: npm install -g @anthropic-ai/claude-code"
    exit 1
fi

# Check if agent config exists
if [ ! -f "$AGENT_CONFIG" ]; then
    echo -e "${RED}ERROR: Agent config not found${NC}"
    echo "Expected: $AGENT_CONFIG"
    exit 1
fi

# Run health check
echo "Running health check agent..."
REPORT_FILE="$REPORT_DIR/health_$TIMESTAMP.json"

claude -p "Perform a comprehensive health check on the database connection pool. Analyze /api/health and /api/metrics endpoints and provide structured alerts." \
  --agents "@$AGENT_CONFIG" \
  --output-format json > "$REPORT_FILE" 2>&1

# Validate JSON output
if ! jq . "$REPORT_FILE" > /dev/null 2>&1; then
    echo -e "${RED}ERROR: Invalid JSON output${NC}"
    echo "Check report file: $REPORT_FILE"
    exit 1
fi

# Parse results
STATUS=$(jq -r '.status' "$REPORT_FILE")
SUCCESS_RATE=$(jq -r '.metrics.successRate' "$REPORT_FILE" | tr -d '%')
LATENCY=$(jq -r '.metrics.averageLatency' "$REPORT_FILE")
CIRCUIT_STATE=$(jq -r '.metrics.circuitState' "$REPORT_FILE")
ALERT_COUNT=$(jq '.alerts | length' "$REPORT_FILE")

# Display results
echo ""
echo "========================================="
echo " Health Check Results"
echo "========================================="
echo -e "Status: ${STATUS}"
echo -e "Success Rate: ${SUCCESS_RATE}%"
echo -e "Average Latency: ${LATENCY}ms"
echo -e "Circuit Breaker: ${CIRCUIT_STATE}"
echo -e "Alerts: ${ALERT_COUNT}"
echo ""

# Color-coded status
case "$STATUS" in
    "healthy")
        echo -e "${GREEN}✅ System is HEALTHY${NC}"
        ;;
    "degraded")
        echo -e "${YELLOW}⚠️  System is DEGRADED${NC}"
        ;;
    "critical")
        echo -e "${RED}🚨 System is CRITICAL${NC}"
        ;;
esac

# Display alerts if any
if [ "$ALERT_COUNT" -gt 0 ]; then
    echo ""
    echo "========================================="
    echo " Alerts"
    echo "========================================="
    jq -r '.alerts[] | "[\(.severity | ascii_upcase)] \(.message)\n  → \(.recommendation)"' "$REPORT_FILE"
fi

# Display recommendations if any
REC_COUNT=$(jq '.recommendations | length' "$REPORT_FILE")
if [ "$REC_COUNT" -gt 0 ]; then
    echo ""
    echo "========================================="
    echo " Recommendations"
    echo "========================================="
    jq -r '.recommendations[] | "• \(.)"' "$REPORT_FILE"
fi

echo ""
echo "Report saved: $REPORT_FILE"
echo ""

# Send Slack notification if critical
if [ "$STATUS" == "critical" ] && [ -n "$SLACK_WEBHOOK_URL" ]; then
    echo "Sending Slack notification..."

    ALERTS_TEXT=$(jq -r '.alerts[] | "• [\(.severity | ascii_upcase)] \(.message)"' "$REPORT_FILE" | head -5)

    curl -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-Type: application/json' \
      -d @- << EOF
{
  "text": "🚨 *Database Health CRITICAL*",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🚨 Unite-Hub Database Alert"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Status:*\n${STATUS}"
        },
        {
          "type": "mrkdwn",
          "text": "*Success Rate:*\n${SUCCESS_RATE}%"
        },
        {
          "type": "mrkdwn",
          "text": "*Latency:*\n${LATENCY}ms"
        },
        {
          "type": "mrkdwn",
          "text": "*Circuit:*\n${CIRCUIT_STATE}"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Alerts:*\n${ALERTS_TEXT}"
      }
    },
    {
      "type": "context",
      "elements": [
        {
          "type": "mrkdwn",
          "text": "Report: \`$REPORT_FILE\` | Timestamp: $(date)"
        }
      ]
    }
  ]
}
EOF

    echo "✅ Slack notification sent"
fi

# Send metrics to Datadog if configured
if [ -n "$DD_API_KEY" ]; then
    echo "Sending metrics to Datadog..."

    curl -X POST "https://api.datadoghq.com/api/v1/series" \
      -H "DD-API-KEY: ${DD_API_KEY}" \
      -H "Content-Type: application/json" \
      -d @- << EOF
{
  "series": [
    {
      "metric": "unitehub.database.pool.success_rate",
      "points": [[$(date +%s), $SUCCESS_RATE]],
      "type": "gauge",
      "tags": ["env:production", "service:unite-hub", "component:connection-pool"]
    },
    {
      "metric": "unitehub.database.pool.latency",
      "points": [[$(date +%s), $LATENCY]],
      "type": "gauge",
      "unit": "millisecond",
      "tags": ["env:production", "service:unite-hub", "component:connection-pool"]
    },
    {
      "metric": "unitehub.database.pool.circuit_state",
      "points": [[$(date +%s), $([ "$CIRCUIT_STATE" == "CLOSED" ] && echo 0 || ([ "$CIRCUIT_STATE" == "HALF_OPEN" ] && echo 1 || echo 2))]],
      "type": "gauge",
      "tags": ["env:production", "service:unite-hub", "component:connection-pool", "state:$CIRCUIT_STATE"]
    }
  ]
}
EOF

    echo "✅ Metrics sent to Datadog"
fi

# Exit with appropriate code
case "$STATUS" in
    "healthy")
        exit 0
        ;;
    "degraded")
        exit 1
        ;;
    "critical")
        exit 2
        ;;
    *)
        exit 3
        ;;
esac
