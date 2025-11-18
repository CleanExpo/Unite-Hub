#!/bin/bash
#
# Test Monitoring Setup
# Quick validation script to verify all monitoring components are working
#
# Usage: ./scripts/test-monitoring-setup.sh

echo "========================================="
echo "Unite-Hub Monitoring Setup Test"
echo "========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
WARNINGS=0

# Function to print test results
test_result() {
    local name="$1"
    local status="$2"
    local message="$3"

    if [ "$status" == "PASS" ]; then
        echo -e "${GREEN}✓${NC} $name"
        ((PASSED++))
    elif [ "$status" == "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $name - $message"
        ((WARNINGS++))
    else
        echo -e "${RED}✗${NC} $name - $message"
        ((FAILED++))
    fi
}

echo "1. Testing API Endpoints..."
echo "-------------------------------------------"

# Test health endpoint
if curl -sf http://localhost:3008/api/health > /dev/null 2>&1; then
    HEALTH=$(curl -s http://localhost:3008/api/health)

    # Extract status using sed (works on all platforms)
    STATUS=$(echo "$HEALTH" | sed 's/.*"status":"\([^"]*\)".*/\1/')

    if [ "$STATUS" == "healthy" ]; then
        test_result "Health endpoint" "PASS"
    elif [ "$STATUS" == "degraded" ]; then
        test_result "Health endpoint" "WARN" "Status: degraded (Redis may be unhealthy)"
    else
        test_result "Health endpoint" "FAIL" "Status: $STATUS"
    fi
else
    test_result "Health endpoint" "FAIL" "Not responding (is dev server running?)"
fi

# Test metrics endpoint (JSON format)
if curl -sf "http://localhost:3008/api/metrics?format=json" > /dev/null 2>&1; then
    test_result "Metrics endpoint (JSON)" "PASS"
else
    test_result "Metrics endpoint (JSON)" "FAIL" "Not responding"
fi

# Test metrics endpoint (Prometheus format)
if curl -sf "http://localhost:3008/api/metrics" > /dev/null 2>&1; then
    test_result "Metrics endpoint (Prometheus)" "PASS"
else
    test_result "Metrics endpoint (Prometheus)" "FAIL" "Not responding"
fi

echo ""
echo "2. Testing Directory Structure..."
echo "-------------------------------------------"

# Test monitoring directory exists
if [ -d "monitoring/reports" ]; then
    test_result "Monitoring reports directory" "PASS"
else
    test_result "Monitoring reports directory" "FAIL" "Directory does not exist"
fi

# Test agent configuration files exist
if [ -f ".claude/agents/monitoring-agent.json" ]; then
    test_result "Monitoring agent config" "PASS"
else
    test_result "Monitoring agent config" "FAIL" "File not found"
fi

if [ -f ".claude/agents/optimization-agent.json" ]; then
    test_result "Optimization agent config" "PASS"
else
    test_result "Optimization agent config" "FAIL" "File not found"
fi

# Test monitoring script exists and is executable
if [ -f "scripts/monitor-database-health.sh" ]; then
    if [ -x "scripts/monitor-database-health.sh" ]; then
        test_result "Monitoring script" "PASS"
    else
        chmod +x scripts/monitor-database-health.sh
        test_result "Monitoring script" "WARN" "Made executable"
    fi
else
    test_result "Monitoring script" "FAIL" "File not found"
fi

echo ""
echo "3. Testing Optional Dependencies..."
echo "-------------------------------------------"

# Check for curl
if command -v curl &> /dev/null; then
    test_result "curl" "PASS"
else
    test_result "curl" "FAIL" "Required for API calls"
fi

# Check for mail command (optional)
if command -v mail &> /dev/null; then
    test_result "mail command" "PASS"
else
    test_result "mail command" "WARN" "Optional: Install mailutils for Gmail alerts"
fi

# Check for gcloud CLI (optional)
if command -v gcloud &> /dev/null; then
    test_result "gcloud CLI" "PASS"
else
    test_result "gcloud CLI" "WARN" "Optional: Install for Google Cloud Monitoring"
fi

echo ""
echo "4. Testing Environment Configuration..."
echo "-------------------------------------------"

# Check if example env file exists
if [ -f ".env.monitoring.example" ]; then
    test_result "Example environment file" "PASS"
else
    test_result "Example environment file" "WARN" "Template not found"
fi

# Check if user has configured monitoring
if [ -f "$HOME/.unite-hub-monitoring.env" ]; then
    test_result "User monitoring config" "PASS"

    # Check if any integrations are configured
    source "$HOME/.unite-hub-monitoring.env" 2>/dev/null || true

    if [ -n "$GOOGLE_CHAT_WEBHOOK_URL" ]; then
        test_result "Google Chat integration" "PASS"
    else
        test_result "Google Chat integration" "WARN" "Not configured"
    fi

    if [ -n "$GMAIL_ALERT_EMAIL" ]; then
        test_result "Gmail alerts" "PASS"
    else
        test_result "Gmail alerts" "WARN" "Not configured"
    fi

    if [ -n "$GCP_PROJECT_ID" ]; then
        test_result "Google Cloud Monitoring" "PASS"
    else
        test_result "Google Cloud Monitoring" "WARN" "Not configured"
    fi
else
    test_result "User monitoring config" "WARN" "Not configured (copy .env.monitoring.example)"
fi

echo ""
echo "5. Testing Documentation..."
echo "-------------------------------------------"

# Check documentation files
if [ -f "GOOGLE_INTEGRATIONS_SETUP.md" ]; then
    test_result "Google integrations guide" "PASS"
else
    test_result "Google integrations guide" "FAIL" "Documentation missing"
fi

if [ -f "DYNAMIC_AGENT_MONITORING_GUIDE.md" ]; then
    test_result "Dynamic agent guide" "PASS"
else
    test_result "Dynamic agent guide" "FAIL" "Documentation missing"
fi

if [ -f ".claude/agents/README.md" ]; then
    test_result "Agent README" "PASS"
else
    test_result "Agent README" "FAIL" "Documentation missing"
fi

# Summary
echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure monitoring: cp .env.monitoring.example ~/.unite-hub-monitoring.env"
    echo "2. Edit configuration: nano ~/.unite-hub-monitoring.env"
    echo "3. Test monitoring: source ~/.unite-hub-monitoring.env && ./scripts/monitor-database-health.sh"
    echo "4. Set up cron job for automated monitoring"
    echo ""
    echo "See GOOGLE_INTEGRATIONS_SETUP.md for detailed setup instructions."
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please fix the issues above.${NC}"
    exit 1
fi
