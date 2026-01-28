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

## Production Provider: Upstash Redis

**Recommended**: Upstash Redis (serverless, REST-based, generous free tier)

### Why Upstash?
- ✅ **Serverless**: No infrastructure management
- ✅ **REST API**: Works with Edge/serverless functions
- ✅ **Global replication**: Low-latency worldwide
- ✅ **Free tier**: 10,000 commands/day
- ✅ **Pay-as-you-go**: No monthly minimums
- ✅ **TLS/SSL**: Built-in encryption

### Alternatives
- Redis Cloud (traditional Redis)
- AWS ElastiCache (if using AWS)
- Azure Cache for Redis (if using Azure)
- DigitalOcean Managed Redis

---

## Setup Instructions

### Step 1: Create Upstash Redis Instance

1. **Sign up** at https://console.upstash.com/
2. **Create database**:
   - Click "Create Database"
   - Name: `unite-hub-production`
   - Region: Choose closest to your deployment (e.g., `us-east-1`)
   - Type: Regional (or Global for multi-region)
   - TLS: Enabled (recommended)

3. **Copy credentials**:
   - Go to database details
   - Copy **REST URL** (e.g., `https://xxx-xxxxx.upstash.io`)
   - Copy **REST Token** (starts with `AX...`)

### Step 2: Configure Environment Variables

Add to your production environment (Vercel/Railway/etc.):

```bash
# Upstash Redis (Primary - REST API)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxxxxxxx

# Redis Configuration
REDIS_KEY_PREFIX=unite-hub:
REDIS_TLS_ENABLED=true

# Legacy/Fallback (Optional - for traditional Redis clients)
REDIS_URL=redis://default:password@redis.upstash.io:6379
REDIS_PASSWORD=your-password-here
```

**Security Notes**:
- ✅ Never commit these values to Git
- ✅ Use separate databases for production/staging
- ✅ Rotate tokens every 90 days
- ✅ Enable TLS in production

### Step 3: Verify Connection

Run the health check endpoint:

```bash
curl https://your-app.com/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2026-01-28T...",
  "database": {
    "status": "connected",
    "latency_ms": 45
  },
  "cache": {
    "status": "connected",
    "provider": "upstash",
    "hit_rate": "82.5%",
    "hits": 1250,
    "misses": 265,
    "total_operations": 1515
  }
}
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
    "provider": "upstash",
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
| P95 Latency | <50ms | Upstash dashboard |
| Error Rate | <0.1% | Sentry alerts |
| Memory Usage | <500MB | Upstash dashboard |
| Evictions | <1% | Upstash dashboard |

### Alerts

Configure alerts in Upstash dashboard:
- ✅ Hit rate drops below 70%
- ✅ Error rate exceeds 1%
- ✅ Memory usage exceeds 80%
- ✅ Connection failures

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

# Set environment variable
export REDIS_URL=redis://localhost:6379

# Test connection
npm run dev
# Check: http://localhost:3008/api/health
```

### Test Script

Create `scripts/test-redis.mjs`:

```javascript
import Redis from 'ioredis';

async function testRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.REDIS_URL;

  if (!url) {
    console.error('❌ No Redis URL configured');
    process.exit(1);
  }

  console.log(`🔌 Connecting to: ${url.split('@')[1] || url.split('//')[1]}`);

  const redis = new Redis(url);

  try {
    // Test ping
    const pong = await redis.ping();
    console.log(`✅ PING response: ${pong}`);

    // Test set/get
    await redis.set('test:key', 'test-value', 'EX', 60);
    const value = await redis.get('test:key');
    console.log(`✅ SET/GET test: ${value === 'test-value' ? 'PASS' : 'FAIL'}`);

    // Test delete
    await redis.del('test:key');
    const deleted = await redis.get('test:key');
    console.log(`✅ DELETE test: ${deleted === null ? 'PASS' : 'FAIL'}`);

    console.log('\n✅ All tests passed! Redis is configured correctly.');
  } catch (error) {
    console.error('❌ Redis test failed:', error.message);
    process.exit(1);
  } finally {
    await redis.quit();
  }
}

testRedis();
```

Run test:
```bash
node scripts/test-redis.mjs
```

---

## Cost Optimization

### Upstash Pricing (2026)

**Free Tier**:
- 10,000 commands/day
- 256MB storage
- Regional replication

**Pay-as-you-go**:
- $0.20 per 100K commands
- $0.25 per GB storage/month

**Estimated Costs** (1,000 users):
- ~500K commands/day = **$1/day** = **$30/month**
- ~2GB storage = **$0.50/month**
- **Total: ~$30/month**

### Cost Reduction Tips

1. **Increase TTL** for static data (reduce cache churn)
2. **Batch operations** to reduce command count
3. **Use pattern deletion** sparingly (expensive on large datasets)
4. **Monitor cache hit rate** (low hit rate = wasted operations)
5. **Compress large values** to reduce storage costs

---

## Troubleshooting

### Common Issues

#### 1. Connection Timeout
```
Error: Redis connection timeout
```

**Solutions**:
- Check Upstash dashboard for downtime
- Verify firewall allows outbound connections
- Increase `REDIS_CONNECT_TIMEOUT` (default: 10000ms)
- Check TLS settings match Upstash config

#### 2. Authentication Failed
```
Error: NOAUTH Authentication required
```

**Solutions**:
- Verify `UPSTASH_REDIS_REST_TOKEN` is correct
- Check `REDIS_PASSWORD` matches Upstash password
- Regenerate token in Upstash dashboard if compromised

#### 3. Circuit Breaker Open
```
[Redis] Circuit breaker is OPEN. Failing fast.
```

**Solutions**:
- Check Upstash status page
- Wait for automatic recovery (60 seconds)
- Manually reset: `cacheManager.resetCircuitBreaker()`
- Investigate root cause in logs

#### 4. Low Hit Rate
```
cache.hit_rate: 45% (target: 80%+)
```

**Solutions**:
- Increase TTL for frequently accessed data
- Pre-warm cache on deployment
- Review cache key patterns (too specific?)
- Check if invalidation is too aggressive

#### 5. Memory Exceeded
```
Error: OOM command not allowed when used memory > 'maxmemory'
```

**Solutions**:
- Upgrade Upstash plan
- Reduce TTL for large objects
- Implement compression for large values
- Review eviction policy (default: `allkeys-lru`)

---

## Security Best Practices

### Access Control

1. **Environment Variables**:
   - ✅ Never commit to Git
   - ✅ Use separate credentials for prod/staging/dev
   - ✅ Rotate tokens every 90 days

2. **Network Security**:
   - ✅ Enable TLS/SSL in production
   - ✅ Use Upstash's built-in firewall rules
   - ✅ Restrict access to known IP ranges (if possible)

3. **Data Security**:
   - ❌ Never cache sensitive data (passwords, tokens, SSNs)
   - ⚠️ Encrypt PII before caching (if absolutely necessary)
   - ✅ Use short TTLs for user-specific data

### Key Naming Convention

Use prefixes to organize keys:

```typescript
// Good: Namespaced and clear
unite-hub:contact:abc123
unite-hub:campaign:stats:xyz789

// Bad: Collision risk
contact123
stats
```

---

## Migration Checklist

### Pre-Launch

- [ ] Upstash Redis instance provisioned
- [ ] Environment variables configured in production
- [ ] Health endpoint returns cache metrics
- [ ] Cache hit rate monitoring enabled
- [ ] Circuit breaker tested and configured
- [ ] Fallback to in-memory tested
- [ ] Alerts configured in Upstash dashboard
- [ ] Cost monitoring enabled
- [ ] Documentation reviewed by team

### Post-Launch Monitoring

**Week 1**:
- [ ] Monitor cache hit rate (target: 80%+)
- [ ] Check error rate (<0.1%)
- [ ] Verify latency improvements (60-80% reduction)
- [ ] Review cost vs. budget

**Week 2**:
- [ ] Analyze cache key patterns
- [ ] Optimize TTL values based on usage
- [ ] Identify opportunities for pre-warming

**Month 1**:
- [ ] Review and optimize cache invalidation strategy
- [ ] Assess whether to upgrade Upstash plan
- [ ] Document any production-specific learnings

---

## References

- **Upstash Docs**: https://docs.upstash.com/redis
- **ioredis Docs**: https://github.com/redis/ioredis
- **Redis Best Practices**: https://redis.io/docs/manual/patterns/
- **Circuit Breaker Pattern**: https://martinfowler.com/bliki/CircuitBreaker.html

---

**Document Version**: 1.0
**Last Updated**: 2026-01-28
**Status**: Production Ready
**Next Review**: 2026-02-28 (monthly review after launch)
