# Redis Production Setup Guide

**Status**: Production Ready
**Last Updated**: 2026-01-28
**Priority**: P1 (Pre-Launch Essential)

---

## Overview

Unite-Hub uses Redis for high-performance caching to reduce database load and improve response times. The system automatically falls back to in-memory caching if Redis is unavailable.

### Benefits
- **60-80% latency reduction** for cached queries
- **70% reduction in database load**
- **Better horizontal scaling** support
- **80%+ cache hit rate** (target)

---

## Production Options: Self-Hosted Redis

**Recommended Approach**: Use DigitalOcean Managed Redis or Docker-based Redis in your existing infrastructure.

### Why Self-Hosted?
- ✅ **No external dependencies**: Stays within your infrastructure
- ✅ **Cost-effective**: No per-operation pricing
- ✅ **Full control**: Configure exactly as needed
- ✅ **Privacy**: Data never leaves your infrastructure
- ✅ **Integration**: Works with existing DigitalOcean setup

---

## Setup Options

### Option 1: DigitalOcean Managed Redis (Recommended for Production)

**Best for**: Production deployments with high availability needs

#### Setup Steps

1. **Create Managed Database**:
   - Log in to DigitalOcean: https://cloud.digitalocean.com/
   - Navigate to: Databases → Create Database Cluster
   - Select: **Redis**
   - Configuration:
     - **Data center**: Same region as your app (e.g., NYC3)
     - **Size**: Basic (1 GB RAM, 1 vCPU) - sufficient for most apps
     - **Name**: `unite-hub-redis-prod`

2. **Configure Connection**:
   - After creation, go to database details
   - Copy **Connection String**
   - Format: `rediss://default:password@host:25061`
   - Note: `rediss://` (with double 's') indicates TLS/SSL

3. **Add Environment Variables**:
   ```bash
   # DigitalOcean Managed Redis
   REDIS_URL=rediss://default:YOUR_PASSWORD@your-redis-do-user-123456-0.db.ondigitalocean.com:25061
   REDIS_TLS_ENABLED=true
   REDIS_KEY_PREFIX=unite-hub:
   ```

4. **Verify Connection**:
   ```bash
   node scripts/test-redis.mjs
   ```

**Pricing** (as of 2026):
- Basic (1 GB): **$15/month**
- Professional (4 GB): **$60/month**
- Includes: Automatic backups, high availability, monitoring

---

### Option 2: Docker Redis (Local Development & Small Production)

**Best for**: Local development, staging, small production deployments

#### Using Docker Compose

Add to your `docker-compose.yml`:

```yaml
services:
  redis:
    image: redis:7-alpine
    container_name: unite-hub-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD:-your-secure-password}
    volumes:
      - redis_data:/data
    networks:
      - unite-hub-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  redis_data:

networks:
  unite-hub-network:
```

#### Environment Variables

```bash
# Docker Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-secure-password
REDIS_TLS_ENABLED=false
REDIS_KEY_PREFIX=unite-hub:
```

#### Start Redis

```bash
# Start Redis container
docker-compose up -d redis

# Verify it's running
docker ps | grep redis

# Test connection
node scripts/test-redis.mjs
```

---

### Option 3: Standalone Redis Server

**Best for**: Dedicated server deployments, VPS setups

#### Install Redis (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install Redis
sudo apt install redis-server -y

# Configure Redis
sudo nano /etc/redis/redis.conf
```

#### Configure Redis

Edit `/etc/redis/redis.conf`:

```conf
# Bind to localhost only (or your app server IP)
bind 127.0.0.1

# Set password
requirepass your-secure-password-here

# Enable persistence
save 900 1
save 300 10
save 60 10000

# Set max memory (e.g., 1GB)
maxmemory 1gb
maxmemory-policy allkeys-lru

# Enable AOF for durability
appendonly yes
appendfsync everysec
```

#### Start Redis

```bash
# Start Redis service
sudo systemctl start redis

# Enable on boot
sudo systemctl enable redis

# Check status
sudo systemctl status redis
```

#### Environment Variables

```bash
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-secure-password
REDIS_TLS_ENABLED=false
REDIS_KEY_PREFIX=unite-hub:
```

---

### Option 4: In-Memory Fallback (Development Only)

**Best for**: Quick local development without Redis installed

The system automatically uses in-memory caching if Redis is unavailable.

**Characteristics**:
- ✅ No setup required
- ✅ Fast for single-instance development
- ⚠️ Data lost on restart
- ⚠️ Not shared across multiple processes
- ❌ **NOT for production** (limited memory, no persistence)

**Usage**: Simply don't set any Redis environment variables.

---

## Environment Variable Configuration

### Production (.env or deployment platform)

```bash
# ====================================
# Redis Production Configuration
# ====================================

# Connection URL (choose based on your setup)
# DigitalOcean Managed: rediss://default:password@host:25061
# Docker/Local: redis://localhost:6379
REDIS_URL=redis://localhost:6379

# Password (if using requirepass)
REDIS_PASSWORD=your-secure-password-here

# Key prefix to avoid collisions with other apps
REDIS_KEY_PREFIX=unite-hub:

# TLS/SSL (true for DigitalOcean Managed, false for local Docker)
REDIS_TLS_ENABLED=false

# Connection settings (optional - defaults shown)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_MAX_RETRIES=3
REDIS_CONNECT_TIMEOUT=10000
```

### Development (.env.local)

```bash
# Local Docker Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS_ENABLED=false
REDIS_MAX_RETRIES=3
REDIS_CONNECT_TIMEOUT=10000
```

---

## Implementation Details

### Architecture

The caching layer has three implementations:

#### 1. Simple Redis Client (`src/lib/redis.ts`)
- Basic ioredis client with mock fallback
- Used by most API routes
- Automatic retry with exponential backoff

```typescript
import { getRedisClient } from '@/lib/redis';

const redis = getRedisClient();
await redis.set('key', 'value', 'EX', 300); // 5 min TTL
const value = await redis.get('key');
```

#### 2. Cache Manager (`src/lib/cache.ts`)
- High-level caching with cache-aside pattern
- Predefined cache keys for common entities
- TTL constants for different use cases

```typescript
import { getCache, CacheKeys, CacheTTL } from '@/lib/cache';

const cache = getCache();

// Cache-aside pattern (get or fetch)
const contact = await cache.getOrSet(
  CacheKeys.contact(contactId),
  async () => {
    // Fetch from database if not cached
    return await db.contact.findUnique({ where: { id: contactId } });
  },
  CacheTTL.MEDIUM // 5 minutes
);
```

#### 3. Advanced Cache Manager (`src/lib/cache/redis-client.ts`)
- Circuit breaker pattern for fault tolerance
- Comprehensive metrics tracking
- Used by real-time monitoring system

```typescript
import { cacheManager } from '@/lib/cache/redis-client';

// Get with circuit breaker protection
const data = await cacheManager.get<MyType>('key', { ttl: 3600 });

// Set with automatic failover
await cacheManager.set('key', data, { ttl: 3600, prefix: 'api' });

// Monitor health
const metrics = cacheManager.getMetrics();
console.log(`Hit rate: ${metrics.hit_rate}`);
```

### Cache Key Patterns

Predefined keys in `src/lib/cache.ts`:

```typescript
// User-related
CacheKeys.userProfile(userId)
CacheKeys.userOrganizations(userId)
CacheKeys.userWorkspaces(userId)

// Contact-related
CacheKeys.contact(contactId)
CacheKeys.contactsByWorkspace(workspaceId, page)
CacheKeys.contactScore(contactId)
CacheKeys.hotLeads(workspaceId)

// Campaign-related
CacheKeys.campaign(campaignId)
CacheKeys.campaignStats(campaignId)
CacheKeys.campaignsByWorkspace(workspaceId)

// Email-related
CacheKeys.emailThread(threadId)
CacheKeys.emailsByContact(contactId)

// AI-related
CacheKeys.aiSuggestion(nodeId)
CacheKeys.aiAnalysis(contactId)
CacheKeys.contentDraft(draftId)
```

### TTL Strategy

```typescript
export const CacheTTL = {
  SHORT: 60,      // 1 minute - Real-time data
  MEDIUM: 300,    // 5 minutes - Frequently changing
  LONG: 900,      // 15 minutes - Semi-static data
  HOUR: 3600,     // 1 hour - Rarely changing
  DAY: 86400,     // 24 hours - Static reference data
};
```

---

## Cache Invalidation Strategy

### When to Invalidate

| Event | Action | Example |
|-------|--------|---------|
| Contact updated | Delete `contact:{id}` | Edit contact details |
| Contact deleted | Delete `contact:{id}` and related | Remove contact |
| Campaign updated | Delete `campaign:{id}` + stats | Update campaign settings |
| Email received | Delete `emails:contact:{id}` | New email arrives |
| Score recalculated | Delete `contact:score:{id}` | Lead score changes |

### Implementation

```typescript
import { getCache } from '@/lib/cache';

// Update contact
async function updateContact(id: string, data: ContactUpdate) {
  const contact = await db.contact.update({ where: { id }, data });

  // Invalidate cache
  const cache = getCache();
  await cache.del(CacheKeys.contact(id));
  await cache.del(CacheKeys.contactScore(id));
  await cache.delPattern(`contacts:workspace:${contact.workspaceId}:*`);

  return contact;
}
```

### Pattern-Based Invalidation

```typescript
// Invalidate all contacts for a workspace
await cache.delPattern('contacts:workspace:abc123:*');

// Invalidate all campaign stats
await cache.delPattern('campaign:stats:*');

// Invalidate all AI suggestions
await cache.delPattern('ai:suggestion:*');
```

---

## Monitoring & Metrics

### Health Endpoint

Check cache status:

```bash
GET /api/health

# Response includes cache metrics:
{
  "cache": {
    "status": "connected",
    "provider": "redis",
    "hit_rate": "82.5%",
    "hits": 1250,
    "misses": 265,
    "total_operations": 1515,
    "circuit_breaker": {
      "state": "CLOSED",
      "failures": 0,
      "successes": 1515
    }
  }
}
```

### Key Metrics

| Metric | Target | Monitoring |
|--------|--------|------------|
| Hit Rate | 80%+ | Health endpoint |
| P95 Latency | <50ms | Application logs |
| Error Rate | <0.1% | Sentry alerts |
| Memory Usage | <80% | Redis INFO command |
| Evictions | <1% | Redis INFO command |

### Redis Monitoring Commands

```bash
# Connect to Redis
redis-cli -h localhost -p 6379 -a your-password

# Check memory usage
INFO memory

# Check hit rate
INFO stats

# Monitor commands in real-time
MONITOR

# Check connected clients
CLIENT LIST

# Get slow queries
SLOWLOG GET 10
```

---

## Fallback Behavior

### In-Memory Fallback

If Redis is unavailable, the system automatically falls back to in-memory caching:

```typescript
// src/lib/redis.ts - createMockRedisClient()
function createMockRedisClient(): Redis {
  const mockData = new Map<string, { value: string; expiry: number }>();

  return {
    get: async (key) => { /* in-memory get */ },
    set: async (key, value, mode, duration) => { /* in-memory set */ },
    // ... other methods
  };
}
```

**Characteristics**:
- ✅ No external dependencies
- ⚠️ Data lost on restart
- ⚠️ Not shared across instances
- ⚠️ Limited memory capacity

**Warning Message**:
```
⚠️  No REDIS_URL configured. Rate limiting will use in-memory fallback.
```

### Circuit Breaker

The advanced cache manager includes circuit breaker protection:

**States**:
- **CLOSED**: Normal operation, all requests pass through
- **OPEN**: Failing fast, rejecting all requests (uses fallback)
- **HALF_OPEN**: Testing recovery, allowing limited requests

**Configuration**:
```typescript
{
  failureThreshold: 5,        // Open after 5 failures
  resetTimeout: 60000,        // Wait 1 minute before retry
  successThreshold: 2,        // Need 2 successes to close
}
```

---

## Performance Optimization

### Connection Pooling

Already configured in `src/lib/redis.ts`:

```typescript
redisClient = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  lazyConnect: true,
});
```

### Batch Operations

For multiple keys, use pipelines:

```typescript
const redis = getRedisClient();

// Pipeline multiple operations
const pipeline = redis.pipeline();
pipeline.get('key1');
pipeline.get('key2');
pipeline.get('key3');
const results = await pipeline.exec();
```

### Compression

For large values, consider compression:

```typescript
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// Compress before caching
const compressed = await gzipAsync(Buffer.from(JSON.stringify(largeData)));
await redis.set('key', compressed.toString('base64'), 'EX', 3600);

// Decompress after retrieval
const raw = await redis.get('key');
const decompressed = await gunzipAsync(Buffer.from(raw, 'base64'));
const data = JSON.parse(decompressed.toString());
```

---

## Testing

### Local Development

For local development, use Docker Redis:

```bash
# Start Redis container
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Or with password
docker run -d -p 6379:6379 --name redis redis:7-alpine redis-server --requirepass your-password

# Set environment variable
export REDIS_URL=redis://localhost:6379

# Test connection
npm run dev
# Check: http://localhost:3008/api/health
```

### Test Script

Run the test script to verify Redis connection:

```bash
node scripts/test-redis.mjs
```

**Expected output**:
```
============================================================
  Redis Production Setup Test
============================================================

ℹ️  Provider: Redis
ℹ️  Connecting to: localhost:6379

Test 1: Connection
----------------------------------------
✅ Successfully connected to Redis

Test 2: PING Command
----------------------------------------
✅ PING successful: PONG

[... 8 tests total ...]

============================================================
  Test Summary
============================================================
Total Tests: 8
✅ Passed: 8
Failed: 0
============================================================

✅ ✨ All tests passed! Redis is configured correctly.
```

---

## Cost Optimization

### DigitalOcean Managed Redis Pricing (2026)

**Basic Plans**:
- 1 GB RAM: **$15/month**
- 2 GB RAM: **$30/month**
- 4 GB RAM: **$60/month**

**Professional Plans** (High Availability):
- 4 GB RAM (3 nodes): **$120/month**
- 8 GB RAM (3 nodes): **$240/month**

**Estimated Costs** (1,000 users):
- Development/Staging: **$15/month** (1 GB Basic)
- Production (small): **$30/month** (2 GB Basic)
- Production (medium): **$60/month** (4 GB Basic)
- Production (HA): **$120/month** (4 GB Professional)

### Self-Hosted Cost Comparison

**Docker on VPS**:
- Small Droplet (2 GB RAM): **$12/month**
- Medium Droplet (4 GB RAM): **$24/month**
- **Total with app server**: Shared cost

**Verdict**: Self-hosted is most cost-effective for small-medium deployments.

### Cost Reduction Tips

1. **Increase TTL** for static data (reduce cache churn)
2. **Batch operations** to reduce round trips
3. **Use pattern deletion** sparingly (expensive on large datasets)
4. **Monitor cache hit rate** (low hit rate = wasted memory)
5. **Compress large values** to reduce memory usage
6. **Set maxmemory-policy** to `allkeys-lru` for automatic eviction

---

## Troubleshooting

### Common Issues

#### 1. Connection Timeout
```
Error: Redis connection timeout
```

**Solutions**:
- Check Redis is running: `docker ps` or `systemctl status redis`
- Verify firewall allows port 6379
- Check REDIS_URL is correct
- Increase `REDIS_CONNECT_TIMEOUT` (default: 10000ms)

#### 2. Authentication Failed
```
Error: NOAUTH Authentication required
```

**Solutions**:
- Verify `REDIS_PASSWORD` matches Redis configuration
- Check `redis.conf` has `requirepass` set
- For Docker: Ensure `--requirepass` flag is used

#### 3. Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solutions**:
- Verify Redis is running on the specified host/port
- Check `bind` directive in `redis.conf` (should include your app IP)
- For Docker: Ensure port mapping is correct (`-p 6379:6379`)
- Check firewall rules

#### 4. Circuit Breaker Open
```
[Redis] Circuit breaker is OPEN. Failing fast.
```

**Solutions**:
- Check Redis availability
- Wait for automatic recovery (60 seconds)
- Manually reset: `cacheManager.resetCircuitBreaker()`
- Investigate root cause in logs

#### 5. Low Hit Rate
```
cache.hit_rate: 45% (target: 80%+)
```

**Solutions**:
- Increase TTL for frequently accessed data
- Pre-warm cache on deployment
- Review cache key patterns (too specific?)
- Check if invalidation is too aggressive
- Monitor eviction rate (too high = insufficient memory)

#### 6. Memory Exceeded
```
Error: OOM command not allowed when used memory > 'maxmemory'
```

**Solutions**:
- Increase `maxmemory` in `redis.conf`
- Set `maxmemory-policy` to `allkeys-lru`
- Reduce TTL for large objects
- Implement compression for large values
- Upgrade to larger Redis instance

---

## Security Best Practices

### Access Control

1. **Environment Variables**:
   - ✅ Never commit to Git
   - ✅ Use separate passwords for prod/staging/dev
   - ✅ Rotate passwords every 90 days

2. **Network Security**:
   - ✅ Bind Redis to specific IP (not 0.0.0.0)
   - ✅ Use firewall rules to restrict access
   - ✅ Enable TLS for managed Redis (DigitalOcean)
   - ✅ Use VPC/private networking when possible

3. **Redis Configuration**:
   ```conf
   # Require password
   requirepass your-strong-password-here

   # Bind to specific interface
   bind 127.0.0.1 10.0.0.5

   # Disable dangerous commands
   rename-command FLUSHDB ""
   rename-command FLUSHALL ""
   rename-command KEYS ""
   rename-command CONFIG ""
   ```

4. **Data Security**:
   - ❌ Never cache sensitive data (passwords, tokens, SSNs)
   - ⚠️ Encrypt PII before caching (if absolutely necessary)
   - ✅ Use short TTLs for user-specific data

### Key Naming Convention

Use prefixes to organize keys and avoid collisions:

```typescript
// Good: Namespaced and clear
unite-hub:contact:abc123
unite-hub:campaign:stats:xyz789

// Bad: Collision risk with other apps
contact123
stats
```

---

## Migration Checklist

### Pre-Launch

- [ ] Redis instance provisioned (DigitalOcean Managed or Docker)
- [ ] Environment variables configured in production
- [ ] Password authentication enabled
- [ ] Health endpoint returns cache metrics
- [ ] Cache hit rate monitoring enabled
- [ ] Circuit breaker tested and configured
- [ ] Fallback to in-memory tested
- [ ] Test script passes all checks
- [ ] Persistence enabled (RDB or AOF)
- [ ] Backup strategy defined

### Post-Launch Monitoring

**Week 1**:
- [ ] Monitor cache hit rate (target: 80%+)
- [ ] Check error rate (<0.1%)
- [ ] Verify latency improvements (60-80% reduction)
- [ ] Review memory usage

**Week 2**:
- [ ] Analyze cache key patterns
- [ ] Optimize TTL values based on usage
- [ ] Identify opportunities for pre-warming

**Month 1**:
- [ ] Review and optimize cache invalidation strategy
- [ ] Assess whether to scale Redis instance
- [ ] Document any production-specific learnings
- [ ] Review costs vs. budget

---

## References

- **Redis Official Docs**: https://redis.io/documentation
- **ioredis Client**: https://github.com/redis/ioredis
- **Redis Best Practices**: https://redis.io/docs/manual/patterns/
- **Circuit Breaker Pattern**: https://martinfowler.com/bliki/CircuitBreaker.html
- **DigitalOcean Managed Redis**: https://docs.digitalocean.com/products/databases/redis/

---

**Document Version**: 2.0 (Self-Hosted)
**Last Updated**: 2026-01-28
**Status**: Production Ready
**Next Review**: 2026-02-28 (monthly review after launch)
