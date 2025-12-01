# Health Check Examples

Quick reference for using the enhanced health check system.

---

## Basic Health Check

```bash
# Check local server
curl http://localhost:3008/api/health | jq

# Check production server
curl https://production-url.com/api/health | jq
```

**Response**:
```json
{
  "status": "healthy",
  "deployment": "blue",
  "graceful_shutdown": {
    "enabled": true,
    "accepting_requests": true,
    "active_connections": 5
  },
  "readiness": true,
  "checks": {
    "redis": { "status": "healthy", "latency": 3 },
    "database": { "status": "healthy", "latency": 8 }
  }
}
```

---

## Test Health Check with Retry

```bash
# Test with default options (5 retries, 30s timeout)
npm run health:test

# Test specific URL
node scripts/test-health-check.mjs http://localhost:3008/api/health

# Test production
node scripts/test-health-check.mjs https://production-url.com/api/health
```

---

## Test Graceful Shutdown

```bash
# Terminal 1: Start server
npm start

# Terminal 2: Check health (should show accepting_requests: true)
curl http://localhost:3008/api/health | jq '.graceful_shutdown'

# Terminal 3: Send shutdown signal
kill -SIGTERM $(pgrep -f "node.*next")

# Terminal 2: Check health during shutdown (should show accepting_requests: false)
curl http://localhost:3008/api/health | jq '.graceful_shutdown'
```

---

## Deployment Script Usage

```typescript
import { validateHealthCheck } from '@/lib/deployment/health-check-validator';

// Validate health with retry
const result = await validateHealthCheck('http://green-instance/api/health', {
  timeout: 30000,        // 30s timeout per attempt
  maxRetries: 10,        // Max 10 attempts
  backoffMultiplier: 1.5, // 1.5x backoff
  initialDelay: 1000,    // Start with 1s delay
});

if (!result.healthy) {
  throw new Error(`Health check failed: ${result.lastError}`);
}

console.log('Health check passed');
console.log('Deployment:', result.deployment);
console.log('Response time:', result.responseTime);
console.log('Active connections:', result.gracefulShutdown?.activeConnections);
```

---

## Monitor Active Connections

```bash
# Watch active connections in real-time
watch -n 1 'curl -s http://localhost:3008/api/health | jq ".graceful_shutdown.active_connections"'
```

---

## Load Balancer Health Check

**Configuration**:
- **Path**: `/api/health`
- **Method**: GET
- **Interval**: 10 seconds
- **Timeout**: 5 seconds
- **Success codes**: 200
- **Healthy threshold**: 2 consecutive successes
- **Unhealthy threshold**: 3 consecutive failures

**Check Readiness**:
```bash
# Extract readiness status
curl -s http://localhost:3008/api/health | jq '.readiness'

# true = ready to accept traffic
# false = shutting down or too many connections
```

---

## Blue-Green Deployment

```bash
# 1. Deploy green instance
export DEPLOYMENT_ENV=green
npm run start:production

# 2. Validate green health
npm run health:test http://green-instance/api/health

# 3. Switch traffic to green
# (load balancer configuration)

# 4. Shutdown blue instance
kill -SIGTERM $(pgrep -f "blue-instance")

# 5. Monitor blue connections drain
watch -n 1 'curl -s http://blue-instance/api/health | jq ".graceful_shutdown"'
```

---

## Troubleshooting

### Health check returns 503

**Possible causes**:
1. Server is shutting down (`accepting_requests: false`)
2. Redis is down
3. Database is down

**Check**:
```bash
curl -s http://localhost:3008/api/health | jq '.checks'
```

---

### Active connections not draining

**Check current connections**:
```bash
curl -s http://localhost:3008/api/health | jq '.graceful_shutdown.active_connections'
```

**Force check**:
```bash
# Get process ID
ps aux | grep "node.*server"

# Check network connections
lsof -i :3008
```

---

### Health check timeout

**Test with longer timeout**:
```bash
node scripts/test-health-check.mjs http://localhost:3008/api/health
```

**Increase timeout in code**:
```typescript
const result = await validateHealthCheck(url, {
  timeout: 60000, // 60 seconds
  maxRetries: 10,
});
```

---

## Environment Variables

```bash
# Set deployment environment
export DEPLOYMENT_ENV=blue   # or 'green'

# Start server
npm run start:production
```

---

## Quick Commands

```bash
# Start production server with graceful shutdown
npm run start:production

# Test health check
npm run health:test

# View graceful shutdown instructions
npm run shutdown:test

# Check health in loop
while true; do curl -s http://localhost:3008/api/health | jq '.status, .graceful_shutdown'; sleep 1; done
```
