# Zero-Downtime Deployment Guide

## Overview

This guide covers the **blue-green deployment strategy** implemented in Unite-Hub to achieve zero-downtime deployments with instant rollback capability.

**What is Blue-Green Deployment?**

Blue-green deployment is a release pattern that reduces downtime by running two identical production environments (Blue and Green). At any time, only one environment serves live production traffic while the other is idle. When deploying, you switch traffic from the active environment to the idle one.

**Benefits:**
- ✅ **Zero downtime** - Traffic switches instantly between environments
- ✅ **Instant rollback** - Switch back to previous version in <1 second
- ✅ **Safe deployments** - Test new version before switching traffic
- ✅ **No data loss** - Graceful connection draining prevents request failures
- ✅ **Easy validation** - Verify new deployment before going live

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [How Blue-Green Works](#how-blue-green-works)
4. [Graceful Shutdown Explained](#graceful-shutdown-explained)
5. [Deployment Workflow](#deployment-workflow)
6. [Rollback Procedure](#rollback-procedure)
7. [Monitoring During Deployment](#monitoring-during-deployment)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Production Checklist](#production-checklist)
10. [FAQ](#faq)

---

## 1. Quick Start

Deploy to production in 3 commands:

```bash
# 1. Validate pre-deployment requirements
npm run deploy:validate

# 2. Deploy new version to inactive environment
npm run deploy:blue-green

# 3. Monitor deployment health
npm run deploy:monitor
```

**What happens:**
1. Builds new Docker image
2. Starts new container in inactive environment (blue or green)
3. Waits for health checks to pass
4. Switches Nginx traffic to new environment
5. Gracefully drains old environment
6. Updates deployment state

**Time to deploy:** ~2-5 minutes (zero downtime during switch)

---

## 2. Architecture Overview

### System Components

```
                        ┌─────────────────┐
                        │   Nginx Proxy   │
                        │   (Port 80)     │
                        └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
        ┌──────────────────┐      ┌──────────────────┐
        │  Blue Container  │      │ Green Container  │
        │   (Port 3008)    │      │   (Port 3009)    │
        │                  │      │                  │
        │  Status: ACTIVE  │      │  Status: IDLE    │
        └──────────────────┘      └──────────────────┘
                │                         │
                └────────────┬────────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │   (Supabase)    │
                    └─────────────────┘
```

### Traffic Flow

**Before Deployment (Blue Active):**
```
User → Nginx → Blue Container (v1.0.0) → Database
                  ↑
                Active
```

**During Deployment:**
```
User → Nginx → Blue Container (v1.0.0) → Database
                  ↑              │
                Active         Draining

               Green Container (v1.0.1) → Database
                  ↑
               Warming Up
```

**After Switch:**
```
User → Nginx → Green Container (v1.0.1) → Database
                  ↑
                Active

               Blue Container (v1.0.0) → Database
                  ↑
               Standby (for rollback)
```

### File Structure

```
Unite-Hub/
├── docker-compose.yml          # Base configuration
├── docker-compose.prod.yml     # Production overrides
├── .deployment-state.json      # Current active deployment
├── nginx/
│   ├── nginx.conf              # Main Nginx config
│   └── active-upstream.conf    # Current upstream (blue/green)
└── scripts/
    └── deploy-blue-green.sh    # Deployment orchestration
```

---

## 3. How Blue-Green Works

### State Machine

```
┌─────────────────────────────────────────────────────────┐
│                   Deployment States                      │
└─────────────────────────────────────────────────────────┘

State 1: BOTH IDLE
Blue:  ⚫ Stopped
Green: ⚫ Stopped
Active: None

        ↓ [Start Blue]

State 2: BLUE ACTIVE
Blue:  🟢 Running (Active)
Green: ⚫ Stopped
Active: blue

        ↓ [Deploy to Green]

State 3: BOTH RUNNING (Pre-Switch)
Blue:  🟢 Running (Active)
Green: 🟡 Starting
Active: blue

        ↓ [Health Check Passes]

State 4: BOTH HEALTHY (Ready to Switch)
Blue:  🟢 Running (Active)
Green: 🟢 Running (Standby)
Active: blue

        ↓ [Switch Traffic]

State 5: SWITCHED (Green Active)
Blue:  🔵 Running (Standby)
Green: 🟢 Running (Active)
Active: green

        ↓ [Drain Blue]

State 6: GREEN ACTIVE
Blue:  ⚫ Stopped (or kept for rollback)
Green: 🟢 Running (Active)
Active: green
```

### Deployment State File

**Location:** `.deployment-state.json`

**Structure:**
```json
{
  "active": "green",
  "previous": "blue",
  "lastSwitch": "2025-12-03T10:30:00Z",
  "version": "1.0.1",
  "healthy": true
}
```

**Fields:**
- `active` - Currently serving traffic (`blue` or `green`)
- `previous` - Last active deployment (for rollback)
- `lastSwitch` - ISO timestamp of last traffic switch
- `version` - Application version running in active environment
- `healthy` - Boolean indicating if last health check passed

---

## 4. Graceful Shutdown Explained

### What is Graceful Shutdown?

Graceful shutdown ensures:
1. Server stops accepting **new** connections
2. Existing connections are allowed to **complete** their work
3. No requests are **dropped** or return errors
4. Server exits only when all connections are **drained**

### How It Works

**Signal Flow:**
```
1. Nginx sends SIGTERM → Container
2. Container handler triggered
3. Server stops accepting new requests
4. Active connections tracked
5. Wait for connections to complete
6. Server exits cleanly
```

**Code Implementation (Dockerfile):**
```dockerfile
# Signal handling in Next.js
STOPSIGNAL SIGTERM

# Graceful shutdown script
CMD ["node", "server.js"]
```

**Health Check API (`/api/health`):**
```typescript
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    deployment: process.env.DEPLOYMENT_ENV || 'blue',
    version: process.env.npm_package_version,
    uptime: process.uptime(),
  });
}
```

### Connection Draining Timeline

```
T+0s:  SIGTERM received
       ├─ Stop accepting new connections
       └─ Active connections: 45

T+2s:  Draining in progress
       └─ Active connections: 28

T+5s:  Draining continues
       └─ Active connections: 12

T+8s:  Almost complete
       └─ Active connections: 3

T+10s: Draining complete
       ├─ Active connections: 0
       └─ Server exits (code 0)

Maximum timeout: 30 seconds
If timeout exceeded: Force shutdown (SIGKILL)
```

### Testing Graceful Shutdown

```bash
# Start container
docker-compose up blue

# In another terminal, send SIGTERM
docker-compose kill -s SIGTERM blue

# Watch logs for graceful shutdown
docker-compose logs -f blue

# Expected output:
# [2025-12-03 10:30:00] Received SIGTERM
# [2025-12-03 10:30:00] Stopping new connections
# [2025-12-03 10:30:02] Draining 28 active connections
# [2025-12-03 10:30:08] All connections drained
# [2025-12-03 10:30:08] Server exiting gracefully
```

---

## 5. Deployment Workflow

### Full Deployment Process

**Step-by-Step:**

```bash
# ──────────────────────────────────────────────────────
# PHASE 1: PRE-DEPLOYMENT VALIDATION
# ──────────────────────────────────────────────────────

# 1. Check current deployment state
npm run deploy:health-check

# Expected output:
# ✓ Active: blue (v1.0.0)
# ✓ Health: OK
# ✓ Connections: 145
# ✓ Uptime: 72h 15m

# 2. Run pre-deployment checks
npm run deploy:validate

# Expected output:
# ✓ Docker daemon running
# ✓ Docker Compose installed
# ✓ Nginx configuration valid
# ✓ Environment variables set
# ✓ Database connection OK
# ✓ Disk space sufficient (>10GB)
# ✓ Memory available (>2GB)

# ──────────────────────────────────────────────────────
# PHASE 2: BUILD NEW VERSION
# ──────────────────────────────────────────────────────

# 3. Build Docker image for inactive environment
# (Automatically determined: blue active → build green)
npm run deploy:blue-green

# Expected output:
# [1/7] Determining inactive environment...
#       Active: blue → Building: green
#
# [2/7] Building Docker image...
#       Image: unite-hub-green:latest
#       Time: 120s
#
# [3/7] Starting container...
#       Container: unite-hub-green
#       Port: 3009
#
# [4/7] Waiting for health checks...
#       Attempt 1/30: Starting...
#       Attempt 2/30: Starting...
#       Attempt 3/30: Healthy ✓
#
# [5/7] Switching Nginx upstream...
#       Old: blue (3008)
#       New: green (3009)
#       Reloading Nginx...
#
# [6/7] Draining old environment...
#       Active connections: 12
#       Waiting for drain...
#       Connections drained ✓
#
# [7/7] Updating deployment state...
#       State: .deployment-state.json
#       Active: green
#       Version: 1.0.1
#
# ✅ Deployment complete!
#    Time: 3m 45s
#    Downtime: 0s

# ──────────────────────────────────────────────────────
# PHASE 3: POST-DEPLOYMENT MONITORING
# ──────────────────────────────────────────────────────

# 4. Monitor new deployment for 5 minutes
npm run deploy:monitor

# Expected output:
# [10:30:00] Health: OK | Errors: 0 | Latency: 45ms
# [10:30:10] Health: OK | Errors: 0 | Latency: 42ms
# [10:30:20] Health: OK | Errors: 0 | Latency: 48ms
# ...
# [10:35:00] ✓ Monitoring complete - No issues detected

# 5. Check deployment logs
npm run deploy:logs

# 6. If issues detected, rollback immediately
# (See section 6: Rollback Procedure)
```

### Automated Deployment Script

**File:** `scripts/deploy-blue-green.sh`

**Usage:**
```bash
# Standard deployment
./scripts/deploy-blue-green.sh

# With custom version tag
./scripts/deploy-blue-green.sh --version 1.0.1

# Dry run (simulate without deploying)
./scripts/deploy-blue-green.sh --dry-run

# Skip health checks (not recommended)
./scripts/deploy-blue-green.sh --skip-health
```

**Script Flow:**
```bash
#!/bin/bash
set -e

# 1. Determine active/inactive environments
ACTIVE=$(jq -r '.active' .deployment-state.json)
INACTIVE=$([[ "$ACTIVE" == "blue" ]] && echo "green" || echo "blue")

# 2. Build new image
docker-compose -f docker-compose.yml -f docker-compose.prod.yml \
  build $INACTIVE

# 3. Start new container
docker-compose -f docker-compose.yml -f docker-compose.prod.yml \
  up -d $INACTIVE

# 4. Wait for health check (max 5 minutes)
for i in {1..30}; do
  if curl -sf http://localhost:3009/api/health > /dev/null; then
    echo "Health check passed"
    break
  fi
  sleep 10
done

# 5. Switch Nginx upstream
echo "upstream app { server $INACTIVE:3008; }" > nginx/active-upstream.conf
docker-compose exec nginx nginx -s reload

# 6. Drain old environment
docker-compose kill -s SIGTERM $ACTIVE
sleep 30

# 7. Update state file
jq --arg active "$INACTIVE" \
   --arg previous "$ACTIVE" \
   --arg time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
   '.active = $active | .previous = $previous | .lastSwitch = $time' \
   .deployment-state.json > .deployment-state.json.tmp
mv .deployment-state.json.tmp .deployment-state.json

echo "✅ Deployment complete: $INACTIVE is now active"
```

---

## 6. Rollback Procedure

### Instant Rollback

**When to Rollback:**
- High error rates (>1%)
- Increased latency (>500ms p95)
- Failed health checks
- Database migration issues
- Critical bugs discovered

**How to Rollback:**

```bash
# ──────────────────────────────────────────────────────
# METHOD 1: Automated Rollback Script
# ──────────────────────────────────────────────────────

npm run deploy:rollback

# Expected output:
# [1/4] Reading current state...
#       Active: green (v1.0.1)
#       Previous: blue (v1.0.0)
#
# [2/4] Validating rollback target...
#       Container: unite-hub-blue
#       Status: Running ✓
#       Health: OK ✓
#
# [3/4] Switching traffic to blue...
#       Reloading Nginx...
#       Traffic switched ✓
#
# [4/4] Updating state...
#       Active: blue (v1.0.0)
#       Previous: green (v1.0.1)
#
# ✅ Rollback complete in 0.8s!

# ──────────────────────────────────────────────────────
# METHOD 2: Manual Rollback
# ──────────────────────────────────────────────────────

# 1. Check current state
cat .deployment-state.json
# {
#   "active": "green",
#   "previous": "blue",
#   "version": "1.0.1"
# }

# 2. Switch Nginx to previous deployment
echo "upstream app { server blue:3008; }" > nginx/active-upstream.conf
docker-compose exec nginx nginx -s reload

# 3. Update state file
jq '.active = "blue" | .previous = "green" | .lastSwitch = now | .version = "1.0.0"' \
  .deployment-state.json > .deployment-state.json.tmp
mv .deployment-state.json.tmp .deployment-state.json

# 4. Verify rollback
curl http://localhost/api/health
# {
#   "deployment": "blue",
#   "version": "1.0.0"
# }

# ──────────────────────────────────────────────────────
# METHOD 3: Emergency Rollback (Nginx Only)
# ──────────────────────────────────────────────────────

# If deployment state is corrupted, manually edit Nginx

# Edit nginx/active-upstream.conf
echo "upstream app { server blue:3008; }" > nginx/active-upstream.conf

# Reload Nginx
docker-compose exec nginx nginx -s reload

# Verify
curl http://localhost/api/health
```

### Rollback Validation

```bash
# After rollback, verify system health

# 1. Check active deployment
curl http://localhost/api/health | jq
# {
#   "status": "healthy",
#   "deployment": "blue",
#   "version": "1.0.0",
#   "uptime": 259200
# }

# 2. Check error rates
npm run deploy:monitor

# 3. Review logs for errors
docker-compose logs --tail=100 blue | grep ERROR

# 4. Test critical endpoints
curl http://localhost/api/contacts
curl http://localhost/api/campaigns

# 5. Monitor for 15 minutes
# If stable, deployment is safe
# If issues persist, investigate root cause
```

---

## 7. Monitoring During Deployment

### Health Check Monitoring

**Continuous Health Checks:**
```bash
# Monitor health endpoint every 5 seconds
while true; do
  curl -s http://localhost/api/health | jq '.deployment, .version, .status'
  sleep 5
done

# Expected output during deployment:
# "blue" "1.0.0" "healthy"
# "blue" "1.0.0" "healthy"
# "green" "1.0.1" "healthy"  ← Switch occurred
# "green" "1.0.1" "healthy"
```

### Error Rate Monitoring

**Track Nginx Access Logs:**
```bash
# Monitor HTTP status codes
docker-compose logs nginx -f | grep -E "(200|404|500)"

# Count errors in last minute
docker-compose logs nginx --since 1m | grep -c " 500 "

# Calculate error rate
TOTAL=$(docker-compose logs nginx --since 1m | grep -cE " (200|404|500) ")
ERRORS=$(docker-compose logs nginx --since 1m | grep -cE " (500|502|503) ")
ERROR_RATE=$(echo "scale=2; $ERRORS / $TOTAL * 100" | bc)
echo "Error rate: $ERROR_RATE%"
```

### Latency Monitoring

**Nginx Response Times:**
```bash
# Add to nginx.conf logging format:
log_format timed_combined '$remote_addr - $remote_user [$time_local] '
    '"$request" $status $body_bytes_sent '
    '"$http_referer" "$http_user_agent" '
    '$request_time';

# Monitor latency
docker-compose logs nginx -f | awk '{print $NF}' | grep -E '^[0-9]'

# Calculate p95 latency (requires processing)
docker-compose logs nginx --since 5m | \
  awk '{print $NF}' | \
  grep -E '^[0-9]' | \
  sort -n | \
  awk 'BEGIN {c=0} {a[c++]=$1} END {print a[int(c*0.95)]}'
```

### Automated Monitoring Script

**File:** `scripts/monitor-deployment.sh`

```bash
#!/bin/bash

DURATION=${1:-300}  # Default 5 minutes
INTERVAL=10

echo "Monitoring deployment for ${DURATION}s..."

for i in $(seq 1 $((DURATION / INTERVAL))); do
  # Health check
  HEALTH=$(curl -sf http://localhost/api/health)
  STATUS=$(echo $HEALTH | jq -r '.status')
  DEPLOYMENT=$(echo $HEALTH | jq -r '.deployment')
  VERSION=$(echo $HEALTH | jq -r '.version')

  # Error rate
  ERRORS=$(docker-compose logs nginx --since ${INTERVAL}s | grep -cE " (500|502|503) " || echo "0")

  # Output
  TIMESTAMP=$(date +"%H:%M:%S")
  echo "[$TIMESTAMP] Deployment: $DEPLOYMENT | Version: $VERSION | Status: $STATUS | Errors: $ERRORS"

  # Alert on issues
  if [[ "$STATUS" != "healthy" ]] || [[ $ERRORS -gt 5 ]]; then
    echo "⚠️  WARNING: Deployment issues detected!"
    echo "Consider rollback with: npm run deploy:rollback"
  fi

  sleep $INTERVAL
done

echo "✅ Monitoring complete"
```

---

## 8. Troubleshooting Guide

### Common Issues

#### Issue 1: Health Check Timeout

**Symptom:**
```
[4/7] Waiting for health checks...
      Attempt 28/30: Connection refused
      Attempt 29/30: Connection refused
      Attempt 30/30: Connection refused
❌ Health check failed after 5 minutes
```

**Causes:**
- Container failed to start
- Port conflict (3008/3009 already in use)
- Application crash during startup
- Database connection failure

**Solutions:**
```bash
# Check container status
docker-compose ps

# Check container logs
docker-compose logs green --tail=100

# Check port conflicts
lsof -i :3009

# Manually test health endpoint
curl http://localhost:3009/api/health

# Check environment variables
docker-compose exec green env | grep -E "(DATABASE|SUPABASE)"

# Restart container
docker-compose restart green
```

#### Issue 2: Nginx Won't Reload

**Symptom:**
```
[5/7] Switching Nginx upstream...
      Reloading Nginx...
nginx: [error] invalid upstream name "green:3008"
❌ Nginx reload failed
```

**Causes:**
- Container name mismatch
- Network connectivity issue
- Invalid nginx.conf syntax

**Solutions:**
```bash
# Test Nginx config
docker-compose exec nginx nginx -t

# Check container names
docker-compose ps --format "{{.Name}}"

# Verify network connectivity
docker-compose exec nginx ping -c 1 green

# Manually reload
docker-compose exec nginx nginx -s reload

# Restart Nginx if needed
docker-compose restart nginx
```

#### Issue 3: Deployment State Corruption

**Symptom:**
```
Error: .deployment-state.json is invalid JSON
```

**Solution:**
```bash
# Backup corrupted state
cp .deployment-state.json .deployment-state.json.backup

# Recreate with current active deployment
cat > .deployment-state.json <<EOF
{
  "active": "blue",
  "previous": "green",
  "lastSwitch": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "1.0.0",
  "healthy": true
}
EOF

# Verify current deployment
curl http://localhost/api/health | jq '.deployment'

# Update state file to match reality
```

#### Issue 4: Connection Draining Timeout

**Symptom:**
```
[6/7] Draining old environment...
      Active connections: 5
      Waiting for drain...
      (hangs for 30+ seconds)
```

**Causes:**
- Long-running requests (uploads, streaming)
- WebSocket connections not closing
- Stuck database transactions

**Solutions:**
```bash
# Check active connections
docker-compose exec blue sh -c "netstat -an | grep :3008 | grep ESTABLISHED | wc -l"

# Force shutdown after 30s (already configured)
# Or manually kill
docker-compose kill blue

# Investigate stuck connections
docker-compose exec blue sh -c "netstat -anp | grep :3008"

# Check for long-running requests in logs
docker-compose logs blue | grep "Request duration"
```

#### Issue 5: Rollback Fails

**Symptom:**
```
npm run deploy:rollback
❌ Previous deployment (blue) is not running
```

**Solution:**
```bash
# Start the previous deployment
docker-compose up -d blue

# Wait for health check
curl http://localhost:3008/api/health

# Retry rollback
npm run deploy:rollback

# If still failing, manual switch
echo "upstream app { server blue:3008; }" > nginx/active-upstream.conf
docker-compose exec nginx nginx -s reload
```

---

## 9. Production Checklist

### Pre-Deployment Checklist

- [ ] **1. Code Review Complete**
  - All PRs merged and approved
  - No outstanding critical bugs
  - Database migrations tested

- [ ] **2. Tests Passing**
  ```bash
  npm test
  npm run test:integration
  npm run test:e2e
  ```

- [ ] **3. Environment Variables Updated**
  - Verify `.env.production` is current
  - Check secrets are not expired
  - Confirm API keys are valid

- [ ] **4. Database Migrations Ready**
  ```bash
  # Test migrations locally
  npm run migrate:test

  # Backup production database
  npm run db:backup
  ```

- [ ] **5. Docker Images Built**
  ```bash
  docker-compose -f docker-compose.prod.yml build
  ```

- [ ] **6. Monitoring Configured**
  - Health check endpoint responding
  - Error tracking enabled (Sentry/Rollbar)
  - Log aggregation configured

- [ ] **7. Rollback Plan Documented**
  - Previous version identified
  - Rollback steps tested
  - Team notified of deployment window

- [ ] **8. Backup Verified**
  - Database backup created (<1 hour old)
  - Backup restoration tested
  - Backup location confirmed

- [ ] **9. Communication Sent**
  - Team notified in Slack
  - Stakeholders informed
  - On-call engineer identified

### Post-Deployment Checklist

- [ ] **1. Health Checks Passing**
  ```bash
  npm run deploy:health-check
  ```

- [ ] **2. Error Rates Normal**
  - <0.1% error rate
  - No 500 errors
  - Latency <200ms p95

- [ ] **3. Database Connections Healthy**
  - No connection pool exhaustion
  - Query performance normal

- [ ] **4. Critical Flows Tested**
  - User login/logout
  - Contact creation
  - Campaign sending
  - Payment processing (if applicable)

- [ ] **5. Monitoring for 15 Minutes**
  ```bash
  npm run deploy:monitor
  ```

- [ ] **6. Logs Reviewed**
  - No unexpected errors
  - No warnings about deprecated features
  - No security alerts

- [ ] **7. Performance Metrics Stable**
  - CPU usage <70%
  - Memory usage <80%
  - Disk I/O normal

- [ ] **8. Rollback Test**
  - Verify rollback capability
  - Confirm previous version still running

- [ ] **9. Documentation Updated**
  - CHANGELOG.md updated
  - Deployment notes added
  - Known issues documented

---

## 10. FAQ

### Q1: What happens if health checks never pass?

**A:** After 30 attempts (5 minutes), the deployment script exits with an error. The old environment remains active, so there's no downtime. Check container logs for startup errors.

### Q2: Can I deploy during high traffic periods?

**A:** Yes! Blue-green deployment is designed for zero-downtime switches. However, consider:
- Longer connection draining time during high traffic
- Database migration performance impact
- Slightly increased resource usage (both containers running)

**Best Practice:** Deploy during low-traffic windows when possible.

### Q3: How long should I keep both environments running?

**A:** Keep both environments running for at least 15 minutes after deployment to enable instant rollback. You can stop the old environment after verifying the new one is stable.

### Q4: What if I need to rollback after stopping the old environment?

**A:** If the old container is stopped:
1. Start it with `docker-compose up -d blue`
2. Wait for health checks to pass
3. Switch Nginx upstream
4. Redeploy the old version if the container was removed

**Prevention:** Keep old environment running for at least 1 hour.

### Q5: How do I handle database migrations during deployment?

**Two strategies:**

**Strategy 1: Backward-Compatible Migrations (Recommended)**
```bash
# 1. Deploy code that works with old AND new schema
# 2. Run migrations
# 3. Deploy code that uses new schema only
```

**Strategy 2: Maintenance Window**
```bash
# 1. Put site in maintenance mode
# 2. Run migrations
# 3. Deploy new code
# 4. Remove maintenance mode
```

### Q6: Can I run more than 2 environments?

**A:** The current implementation supports exactly 2 environments (blue and green). For more environments, consider:
- Kubernetes with rolling deployments
- Canary deployments (gradual traffic shift)
- Feature flags for gradual rollout

### Q7: What's the maximum deployment size supported?

**Current Limits:**
- Docker image size: <2GB recommended
- Build time: <10 minutes
- Health check timeout: 5 minutes
- Connection drain timeout: 30 seconds

For larger deployments, adjust timeouts in `deploy-blue-green.sh`.

### Q8: How do I monitor multiple deployments across environments?

**Use a monitoring dashboard:**
```bash
# Install monitoring tools
docker-compose --profile observability up -d

# Access dashboards:
# - Prometheus: http://localhost:9090
# - Grafana: http://localhost:3000
# - Loki: http://localhost:3100
```

### Q9: What happens if Nginx crashes during deployment?

**A:** Nginx crash causes complete outage. To prevent:
1. Use Nginx health checks in Docker
2. Run Nginx in HA mode (multiple instances)
3. Use a load balancer in front of Nginx

**Recovery:**
```bash
# Restart Nginx
docker-compose restart nginx

# Verify configuration
docker-compose exec nginx nginx -t

# Check logs
docker-compose logs nginx
```

### Q10: Can I automate deployments with CI/CD?

**A:** Yes! Example GitHub Actions workflow:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Validate deployment
        run: npm run deploy:validate

      - name: Deploy blue-green
        run: npm run deploy:blue-green

      - name: Monitor deployment
        run: npm run deploy:monitor

      - name: Rollback on failure
        if: failure()
        run: npm run deploy:rollback
```

---

## Additional Resources

- **Docker Compose Documentation:** https://docs.docker.com/compose/
- **Nginx Configuration Guide:** https://nginx.org/en/docs/
- **Blue-Green Deployment Pattern:** https://martinfowler.com/bliki/BlueGreenDeployment.html
- **Graceful Shutdown Guide:** https://cloud.google.com/blog/products/containers-kubernetes/kubernetes-best-practices-terminating-with-grace

---

## Support

For issues or questions:
1. Check this documentation
2. Review logs: `npm run deploy:logs`
3. Check deployment state: `cat .deployment-state.json`
4. Test health endpoint: `curl http://localhost/api/health`
5. Create GitHub issue with logs and error messages

---

**Document Version:** 1.0.0
**Last Updated:** 2025-12-03
**Maintained By:** DevOps Team
