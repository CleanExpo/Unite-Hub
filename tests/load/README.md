# Unite-Hub Load Testing Guide

Comprehensive load testing suite using [k6](https://k6.io/) for API endpoints, WebSocket connections, and system performance validation.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Test Scenarios](#test-scenarios)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Interpreting Results](#interpreting-results)
- [Performance Targets](#performance-targets)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

1. **k6 installed** (v0.40.0 or higher)
2. **Unite-Hub server running** (local or staging)
3. **Valid authentication token** (or test user credentials)
4. **Redis and PostgreSQL** running (for full system testing)

---

## Installation

### Install k6

**macOS (Homebrew):**
```bash
brew install k6
```

**Windows (Chocolatey):**
```bash
choco install k6
```

**Linux (Debian/Ubuntu):**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Docker:**
```bash
docker pull grafana/k6:latest
```

### Verify Installation

```bash
k6 version
# Expected output: k6 v0.xx.x (go1.xx.x, linux/amd64)
```

---

## Quick Start

### 1. Start Unite-Hub Server

```bash
npm run dev
# Server should be running on http://localhost:3008
```

### 2. Get Authentication Token

**Option A: Use existing token**
```bash
# Extract from browser localStorage after login
# key: 'supabase.auth.token'
```

**Option B: Create test user**
```bash
# Create test user via Supabase dashboard or API
# Email: test@unite-hub.com
# Password: test-password-123
```

### 3. Run Smoke Test

```bash
k6 run tests/load/k6-load-test.js \
  --env AUTH_TOKEN=your-token-here
```

### 4. View Results

k6 will output real-time metrics and a summary at the end:
```
✓ health check status 200
✓ list contacts status 200
✗ create contact status 200 or 201

checks.........................: 95.00% ✓ 190  ✗ 10
data_received..................: 1.2 MB 40 kB/s
http_req_duration..............: avg=245ms min=12ms med=180ms max=1.2s p(95)=450ms p(99)=890ms
```

---

## Test Scenarios

The load test includes 5 distinct scenarios:

### 1. Smoke Test

**Purpose:** Verify basic functionality with minimal load

**Configuration:**
- VUs (Virtual Users): 1
- Duration: 30 seconds
- Use case: Pre-deployment sanity check

**Run:**
```bash
k6 run tests/load/k6-load-test.js \
  --env SCENARIO=smoke \
  --env AUTH_TOKEN=your-token
```

### 2. Average Load Test

**Purpose:** Simulate typical production traffic

**Configuration:**
- VUs: Ramps from 0 → 50 → 0
- Duration: 7 minutes (1m ramp-up, 5m steady, 1m ramp-down)
- Use case: Daily operations validation

**Run:**
```bash
k6 run tests/load/k6-load-test.js \
  --env SCENARIO=average_load \
  --env AUTH_TOKEN=your-token
```

### 3. Stress Test

**Purpose:** Test system limits and breaking points

**Configuration:**
- VUs: Ramps from 0 → 100 → 200 → 0
- Duration: 4 minutes
- Use case: Capacity planning, bottleneck identification

**Run:**
```bash
k6 run tests/load/k6-load-test.js \
  --env SCENARIO=stress_test \
  --env AUTH_TOKEN=your-token
```

### 4. Spike Test

**Purpose:** Test system behavior under sudden traffic surge

**Configuration:**
- VUs: Spikes from 0 → 500 in 30 seconds
- Duration: 2 minutes
- Use case: Marketing campaign, viral event simulation

**Run:**
```bash
k6 run tests/load/k6-load-test.js \
  --env SCENARIO=spike_test \
  --env AUTH_TOKEN=your-token
```

### 5. WebSocket Load Test

**Purpose:** Test real-time alert system with concurrent connections

**Configuration:**
- VUs: 100 concurrent connections
- Duration: 3 minutes
- Use case: Real-time alert infrastructure validation

**Run:**
```bash
k6 run tests/load/k6-load-test.js \
  --env SCENARIO=websocket_load \
  --env AUTH_TOKEN=your-token \
  --env WS_URL=ws://localhost:3008
```

---

## Configuration

### Environment Variables

Configure tests via environment variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BASE_URL` | API base URL | `http://localhost:3008` | No |
| `WS_URL` | WebSocket URL | `ws://localhost:3008` | No |
| `AUTH_TOKEN` | JWT authentication token | None | Yes* |
| `TEST_EMAIL` | Test user email | `test@unite-hub.com` | No* |
| `TEST_PASSWORD` | Test user password | `test-password-123` | No* |
| `WORKSPACE_ID` | Target workspace ID | `default-workspace` | No |
| `SCENARIO` | Specific scenario to run | All scenarios | No |

**\*Note:** Either `AUTH_TOKEN` OR (`TEST_EMAIL` + `TEST_PASSWORD`) required.

### Example: Full Configuration

```bash
k6 run tests/load/k6-load-test.js \
  --env BASE_URL=https://staging.unite-hub.com \
  --env WS_URL=wss://staging.unite-hub.com \
  --env AUTH_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \
  --env WORKSPACE_ID=550e8400-e29b-41d4-a716-446655440000
```

---

## Running Tests

### Local Development

```bash
# Start server
npm run dev

# In another terminal, run load test
k6 run tests/load/k6-load-test.js \
  --env AUTH_TOKEN=your-token
```

### Staging Environment

```bash
k6 run tests/load/k6-load-test.js \
  --env BASE_URL=https://staging.unite-hub.com \
  --env WS_URL=wss://staging.unite-hub.com \
  --env AUTH_TOKEN=your-staging-token
```

### Custom VUs and Duration

Override scenario configuration:

```bash
# 100 VUs for 10 minutes
k6 run tests/load/k6-load-test.js \
  --vus 100 \
  --duration 10m \
  --env AUTH_TOKEN=your-token
```

### Output to File

```bash
# JSON output for analysis
k6 run tests/load/k6-load-test.js \
  --env AUTH_TOKEN=your-token \
  --out json=results.json

# CSV output
k6 run tests/load/k6-load-test.js \
  --env AUTH_TOKEN=your-token \
  --out csv=results.csv
```

### Docker Execution

```bash
docker run --rm -i \
  -e AUTH_TOKEN=your-token \
  -e BASE_URL=http://host.docker.internal:3008 \
  grafana/k6:latest run - <tests/load/k6-load-test.js
```

---

## Interpreting Results

### Key Metrics

**http_req_duration:** Total request time (waiting + receiving)
- **Target:** p(95) < 500ms, p(99) < 1000ms
- **Good:** Consistent low values across percentiles
- **Bad:** High p(95) or spikes in p(99)

**http_req_waiting:** Time to first byte (TTFB)
- **Target:** p(95) < 300ms
- **Indicator:** Backend processing speed

**checks:** Percentage of successful assertions
- **Target:** > 99%
- **Critical:** Any check below 95% indicates issues

**errors:** Error rate across all requests
- **Target:** < 1%
- **Alert:** > 5% indicates system instability

**ws_connection_time:** WebSocket connection establishment
- **Target:** p(95) < 200ms
- **Indicator:** Network/server handshake efficiency

**rate_limit_429_errors:** Rate limiting rejections
- **Normal:** < 10 in average load scenarios
- **Alert:** High count indicates aggressive rate limits

### Sample Output Interpretation

```
✓ health check status 200            100.00% ✓ 1000  ✗ 0
✓ list contacts status 200            98.50% ✓ 985   ✗ 15
✗ create contact status 200 or 201    94.00% ✓ 940   ✗ 60

checks.........................: 97.33% ✓ 2925  ✗ 75
data_received..................: 12 MB  40 kB/s
data_sent......................: 3.2 MB 10 kB/s
errors.........................: 0.02%  ✓ 60    ✗ 2940
http_req_duration..............: avg=245ms min=12ms med=180ms max=1.2s p(95)=450ms p(99)=890ms
http_req_waiting...............: avg=220ms min=10ms med=160ms max=1.1s p(95)=400ms p(99)=800ms
http_reqs......................: 3000   100/s
vus............................: 50     min=1   max=50
vus_max........................: 50     min=50  max=50
ws_connection_time.............: avg=85ms  p(95)=150ms
ws_messages_received...........: 15000
```

**Analysis:**
- ✅ Health check: 100% success (excellent)
- ✅ List contacts: 98.5% success (acceptable, investigate 15 failures)
- ⚠️ Create contacts: 94% success (below target, needs investigation)
- ✅ Overall error rate: 0.02% (well under 1% target)
- ✅ p(95) response time: 450ms (under 500ms target)
- ✅ WebSocket connections: 85ms avg (excellent)

---

## Performance Targets

### API Endpoints

| Metric | Target | Critical |
|--------|--------|----------|
| p(95) response time | < 500ms | < 1000ms |
| p(99) response time | < 1000ms | < 2000ms |
| Error rate | < 1% | < 5% |
| Throughput | > 100 req/s | > 50 req/s |

### WebSocket Connections

| Metric | Target | Critical |
|--------|--------|----------|
| Connection time (p95) | < 200ms | < 500ms |
| Concurrent connections | > 1000 | > 500 |
| Message latency | < 50ms | < 100ms |

### System Health

| Metric | Target | Critical |
|--------|--------|----------|
| CPU utilization | < 70% | < 90% |
| Memory usage | < 80% | < 95% |
| Database connections | < 80% pool | < 95% pool |
| Redis hit rate | > 80% | > 50% |

---

## Troubleshooting

### Issue: Authentication Failures

**Symptoms:**
```
auth_failures: 100+
✗ login successful: 0%
```

**Solutions:**
1. Verify `AUTH_TOKEN` is valid and not expired
2. Check test user credentials (`TEST_EMAIL`, `TEST_PASSWORD`)
3. Ensure auth endpoint is `/api/v1/auth/login`
4. Verify Supabase auth is working in dashboard

```bash
# Test auth manually
curl -X POST http://localhost:3008/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@unite-hub.com","password":"test-password-123"}'
```

### Issue: High Error Rate (> 5%)

**Symptoms:**
```
errors: 8.5%
rate_limit_429_errors: 200+
```

**Solutions:**
1. Check server logs for error messages
2. Verify database is running and accessible
3. Check Redis connection (for rate limiting)
4. Reduce VUs if overwhelming server

```bash
# Check server health
curl http://localhost:3008/api/v1/health

# Check Redis
redis-cli ping

# Check Postgres
psql -U postgres -c "SELECT 1"
```

### Issue: WebSocket Connection Failures

**Symptoms:**
```
✗ websocket connected: 0%
ws_connection_time: N/A
```

**Solutions:**
1. Verify WebSocket URL is correct (`ws://` for local, `wss://` for HTTPS)
2. Check WebSocket server is initialized in Next.js
3. Verify auth token is included in connection URL
4. Test WebSocket manually with browser dev tools

```javascript
// Test in browser console
const ws = new WebSocket('ws://localhost:3008/ws/alerts?token=your-token');
ws.onopen = () => console.log('Connected');
ws.onerror = (e) => console.error('Error', e);
```

### Issue: Slow Response Times (p95 > 1s)

**Symptoms:**
```
http_req_duration: p(95)=2500ms p(99)=5000ms
```

**Solutions:**
1. Enable database connection pooling (Supabase Pooler)
2. Check Redis cache hit rate
3. Review slow query logs in PostgreSQL
4. Enable Anthropic API retry logic
5. Optimize N+1 queries

```sql
-- Find slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### Issue: Rate Limiting Too Aggressive

**Symptoms:**
```
rate_limit_429_errors: 500+
✗ create contact status 200 or 201: 20%
```

**Solutions:**
1. Adjust rate limit thresholds in `src/lib/rateLimit/`
2. Implement token bucket algorithm instead of fixed window
3. Add tier-based rate limits (higher for paid users)

```typescript
// Example: Increase limits in src/lib/rateLimit/config.ts
export const RATE_LIMITS = {
  default: {
    windowMs: 60000,
    max: 100, // Increase from 60 to 100
  },
};
```

### Issue: Memory Leak During Test

**Symptoms:**
```
# Server memory grows continuously
# Test eventually crashes server
```

**Solutions:**
1. Check for unclosed database connections
2. Verify Redis connections are properly pooled
3. Look for event listener leaks in WebSocket code
4. Use `--gc` flag to force garbage collection

```bash
# Run server with memory profiling
node --max-old-space-size=4096 --expose-gc server.js

# Monitor memory usage
watch -n 1 'ps aux | grep node'
```

---

## Advanced Usage

### Integration with CI/CD

**GitHub Actions Example:**

```yaml
# .github/workflows/load-test.yml
name: Load Test

on:
  push:
    branches: [main, staging]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install k6
        run: |
          curl https://github.com/grafana/k6/releases/download/v0.45.0/k6-v0.45.0-linux-amd64.tar.gz -L | tar xvz
          sudo mv k6-v0.45.0-linux-amd64/k6 /usr/local/bin/

      - name: Run Load Test
        run: |
          k6 run tests/load/k6-load-test.js \
            --env BASE_URL=${{ secrets.STAGING_URL }} \
            --env AUTH_TOKEN=${{ secrets.LOAD_TEST_TOKEN }} \
            --out json=results.json

      - name: Upload Results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.json
```

### Grafana Integration

Export metrics to Grafana for visualization:

```bash
k6 run tests/load/k6-load-test.js \
  --env AUTH_TOKEN=your-token \
  --out influxdb=http://localhost:8086/k6
```

### Cloud Execution

Run tests from multiple geographic locations using [k6 Cloud](https://k6.io/cloud/):

```bash
k6 cloud tests/load/k6-load-test.js
```

---

## Performance Optimization Tips

### 1. Database Connection Pooling

Enable Supabase Pooler for 60-80% latency reduction:

```typescript
// src/lib/supabase/config.ts
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL + ':6543'; // Pooler port
```

### 2. Redis Caching

Implement caching for frequently accessed data:

```typescript
// Cache contact lists for 5 minutes
const cacheKey = `contacts:${workspaceId}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const contacts = await db.getContacts(workspaceId);
await redis.setex(cacheKey, 300, JSON.stringify(contacts));
```

### 3. Anthropic API Retry Logic

Add exponential backoff for resilience:

```typescript
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

const result = await callAnthropicWithRetry(async () => {
  return await anthropic.messages.create({ /* ... */ });
});
```

### 4. Optimize N+1 Queries

Use `select()` with joins instead of multiple queries:

```typescript
// ❌ Bad: N+1 query
const contacts = await db.getContacts();
for (const contact of contacts) {
  contact.campaigns = await db.getCampaigns(contact.id);
}

// ✅ Good: Single query with join
const contacts = await db.query(`
  SELECT c.*, array_agg(cp.*) as campaigns
  FROM contacts c
  LEFT JOIN campaign_participants cp ON c.id = cp.contact_id
  GROUP BY c.id
`);
```

---

## References

- [k6 Documentation](https://k6.io/docs/)
- [k6 Performance Testing Best Practices](https://k6.io/docs/testing-guides/load-testing-websites/)
- [Unite-Hub Production Grade Assessment](../../PRODUCTION_GRADE_ASSESSMENT.md)
- [Anthropic API Best Practices](../../docs/ANTHROPIC_PRODUCTION_PATTERNS.md)

---

## Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review k6 error messages
3. Examine server logs (`npm run dev` output)
4. Create GitHub issue with test results

---

**Last Updated:** 2025-11-29
**Version:** 1.0.0
**Maintainer:** Unite-Hub Platform Team
