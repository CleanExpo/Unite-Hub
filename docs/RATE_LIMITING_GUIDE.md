# Rate Limiting Guide

Complete guide to the Unite-Hub rate limiting infrastructure.

## Overview

Unite-Hub implements a **two-tier rate limiting system**:

1. **In-Memory Rate Limiting** (`src/core/security/rate-limiter.ts`)
   - Fast, lightweight checks using in-memory storage
   - Sliding window algorithm
   - Automatic cleanup of expired entries
   - No database overhead for rate limit checks

2. **Database Integration** (`src/lib/services/rate-limit-service.ts`)
   - Persistent logging for analytics
   - IP blocking for security incidents
   - Custom rate limit overrides per client/endpoint
   - Historical data for monitoring

## Rate Limit Tiers

| Tier      | Limit      | Use Case                           |
|-----------|------------|------------------------------------|
| `public`  | 10/min     | Health checks, login pages         |
| `webhook` | 1000/min   | External webhooks (Stripe, Gmail)  |
| `client`  | 50/min     | Synthex client API routes          |
| `staff`   | 100/min    | Unite-Hub staff dashboard routes   |
| `agent`   | 200/min    | AI agent internal operations       |
| `admin`   | 500/min    | Admin panel operations             |

## Automatic Tier Detection

The middleware automatically assigns tiers based on endpoint patterns:

```typescript
/api/health              → public (10/min)
/api/webhooks/*          → webhook (1000/min)
/api/auth/*              → public (10/min)
/api/agents/*            → agent (200/min)
/api/admin/*             → admin (500/min)
/api/client/*            → client (50/min)
/api/staff/*             → staff (100/min)
/api/* (default)         → client (50/min)
```

## Usage

### 1. Using withApiHandler (Recommended)

The easiest way to add rate limiting:

```typescript
import { withApiHandler } from '@/app/api/_middleware';
import { successResponse } from '@/app/api/_middleware/response';

export const GET = withApiHandler(
  async (request, context) => {
    return successResponse({ message: 'Hello World' });
  },
  {
    rateLimit: 'staff', // 100/min
  }
);
```

### 2. Using withRateLimitMiddleware

For standalone rate limiting:

```typescript
import { withRateLimitMiddleware } from '@/app/api/_middleware/rate-limit';

export const POST = withRateLimitMiddleware(
  async (request) => {
    return NextResponse.json({ success: true });
  },
  'client' // 50/min
);
```

### 3. Manual Rate Limiting

For custom logic:

```typescript
import { applyRateLimit } from '@/app/api/_middleware/rate-limit';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await applyRateLimit(request, 'staff');
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // Your handler logic
  return NextResponse.json({ success: true });
}
```

## Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 100        # Max requests per window
X-RateLimit-Remaining: 95     # Remaining requests
X-RateLimit-Reset: 1732876800 # Unix timestamp when limit resets
X-RateLimit-Tier: staff       # Applied tier
```

When rate limited, response is:

```json
{
  "error": {
    "code": "SECURITY_RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60,
    "tier": "staff",
    "limit": 100
  }
}
```

## Database Features

### 1. Rate Limit Logging

All requests are logged to `rate_limit_logs`:

```sql
SELECT * FROM rate_limit_logs
WHERE client_key = '192.168.1.1'
ORDER BY created_at DESC
LIMIT 10;
```

### 2. IP Blocking

Block malicious IPs:

```typescript
import { blockIp, unblockIp } from '@/lib/services/rate-limit-service';

// Block IP for 24 hours
await blockIp('192.168.1.1', 'Suspicious activity', userId, 86400);

// Permanent block
await blockIp('192.168.1.1', 'Confirmed attack', userId);

// Unblock IP
await unblockIp('192.168.1.1');
```

Or via API:

```bash
# Block IP
curl -X POST https://app.unite-hub.com/api/admin/rate-limits/block-ip \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"ip": "192.168.1.1", "reason": "Brute force attempt", "duration": 86400}'

# Unblock IP
curl -X DELETE "https://app.unite-hub.com/api/admin/rate-limits/block-ip?ip=192.168.1.1" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Rate Limit Overrides

Create custom limits for specific clients/endpoints:

```typescript
import { createRateLimitOverride } from '@/lib/services/rate-limit-service';

// Override for specific user
await createRateLimitOverride({
  clientKey: 'user-uuid',
  maxRequests: 500,
  windowSeconds: 60,
  reason: 'Premium customer - increased limits',
  expiresAt: new Date('2024-12-31'),
  createdBy: adminUserId,
});

// Override for endpoint pattern
await createRateLimitOverride({
  endpointPattern: '/api/agents/*',
  maxRequests: 1000,
  windowSeconds: 60,
  reason: 'Increased agent capacity',
});

// Override for workspace
await createRateLimitOverride({
  workspaceId: 'workspace-uuid',
  maxRequests: 200,
  windowSeconds: 60,
  reason: 'Enterprise plan',
});
```

Or via API:

```bash
curl -X POST https://app.unite-hub.com/api/admin/rate-limits \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "clientKey": "user-uuid",
    "maxRequests": 500,
    "windowSeconds": 60,
    "reason": "Premium customer"
  }'
```

### 4. Analytics

View rate limit analytics:

```typescript
import { getRateLimitAnalytics } from '@/lib/services/rate-limit-service';

const analytics = await getRateLimitAnalytics(
  new Date('2024-01-01'),
  new Date('2024-12-31'),
  'staff',
  '/api/staff/tasks'
);
```

Or via API:

```bash
curl "https://app.unite-hub.com/api/admin/rate-limits?startDate=2024-01-01&tier=staff" \
  -H "Authorization: Bearer $TOKEN"
```

View in database:

```sql
SELECT * FROM rate_limit_analytics
WHERE tier = 'staff'
AND date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY total_requests DESC;
```

## Database Schema

### Tables

1. **rate_limit_logs** - Request logs
   - `client_key` - IP or user ID
   - `endpoint` - API route
   - `tier` - Applied tier
   - `allowed` - Whether request was allowed
   - `remaining` - Remaining requests
   - `reset_at` - When limit resets

2. **rate_limit_overrides** - Custom limits
   - `client_key` - Override for specific IP/user
   - `endpoint_pattern` - Override for endpoints (supports wildcards)
   - `workspace_id` - Override for workspace
   - `max_requests` - Custom limit
   - `window_seconds` - Custom window
   - `expires_at` - When override expires

3. **blocked_ips** - Blocked IP addresses
   - `ip_address` - INET type (validates IP format)
   - `reason` - Why IP was blocked
   - `blocked_until` - NULL = permanent

### Helper Functions

```sql
-- Check if IP is blocked
SELECT public.is_ip_blocked('192.168.1.1');

-- Get override for client/endpoint
SELECT * FROM public.get_rate_limit_override(
  'user-uuid',
  '/api/staff/tasks',
  'workspace-uuid'
);

-- Log rate limit event (called from application)
SELECT public.log_rate_limit(
  'user-uuid',
  '/api/staff/tasks',
  'staff',
  true,
  95,
  NOW() + INTERVAL '1 minute',
  'GET',
  200
);

-- Clean up old logs
SELECT public.cleanup_rate_limit_logs(7); -- Keep 7 days
```

## Monitoring

### Check Rate Limit Health

```bash
# View recent rate limits
curl "https://app.unite-hub.com/api/admin/rate-limits?startDate=$(date -d '1 day ago' +%Y-%m-%d)" \
  -H "Authorization: Bearer $TOKEN"
```

### Database Queries

```sql
-- Top rate-limited endpoints (last 24h)
SELECT endpoint, tier, SUM(CASE WHEN allowed THEN 0 ELSE 1 END) as blocked_count
FROM rate_limit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY endpoint, tier
ORDER BY blocked_count DESC
LIMIT 10;

-- Blocked IPs
SELECT * FROM blocked_ips
WHERE blocked_until IS NULL OR blocked_until > NOW()
ORDER BY created_at DESC;

-- Active overrides
SELECT * FROM rate_limit_overrides
WHERE expires_at IS NULL OR expires_at > NOW()
ORDER BY created_at DESC;
```

### Cleanup Old Logs

Run periodically via cron or scheduled job:

```sql
SELECT public.cleanup_rate_limit_logs(7); -- Keep 7 days
```

Or in application code:

```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
await supabase.rpc('cleanup_rate_limit_logs', { days_to_keep: 7 });
```

## Testing

### Test Rate Limiting

```bash
# Test endpoint (10 requests should succeed, 11th should fail)
for i in {1..11}; do
  curl -w "\nStatus: %{http_code}\n" \
    https://app.unite-hub.com/api/test-rate-limit
  sleep 0.1
done
```

### Test IP Blocking

```bash
# Block your own IP (for testing)
curl -X POST https://app.unite-hub.com/api/admin/rate-limits/block-ip \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"ip": "YOUR_IP", "reason": "Test", "duration": 60}'

# Try to access API (should get 403)
curl https://app.unite-hub.com/api/test-rate-limit

# Unblock
curl -X DELETE "https://app.unite-hub.com/api/admin/rate-limits/block-ip?ip=YOUR_IP" \
  -H "Authorization: Bearer $TOKEN"
```

## Best Practices

1. **Choose the right tier**
   - Use `public` for unauthenticated endpoints
   - Use `webhook` for external integrations (they may spike)
   - Use `client`/`staff` based on user role
   - Use `agent` for internal AI operations

2. **Monitor analytics**
   - Check `rate_limit_analytics` weekly
   - Look for endpoints hitting limits frequently
   - Adjust tiers or create overrides as needed

3. **Handle 429 responses**
   - Parse `Retry-After` header
   - Implement exponential backoff in clients
   - Display friendly error to users

4. **Clean up logs**
   - Run cleanup weekly or monthly
   - Keep 7-30 days for analytics
   - Archive to cold storage if needed

5. **Security incidents**
   - Block IPs showing suspicious patterns
   - Set temporary blocks (24h) for first offense
   - Permanent blocks for confirmed attacks
   - Document reasons in `blocked_ips.reason`

## Migration

The rate limiting infrastructure was added in migration 403:

```bash
# In Supabase SQL Editor, run:
supabase/migrations/403_rate_limiting_infrastructure.sql
```

Tables created:
- `rate_limit_logs`
- `rate_limit_overrides`
- `blocked_ips`

Functions created:
- `is_ip_blocked(ip_param TEXT)`
- `get_rate_limit_override(client_key_param TEXT, endpoint_param TEXT, workspace_id_param UUID)`
- `log_rate_limit(...)`
- `cleanup_rate_limit_logs(days_to_keep INTEGER)`

## Troubleshooting

### Rate limits not working

1. Check middleware is applied:
   ```typescript
   // Should have rateLimit option
   withApiHandler(handler, { rateLimit: 'staff' })
   ```

2. Check database functions exist:
   ```sql
   SELECT proname FROM pg_proc WHERE proname LIKE 'rate%';
   ```

### Database logging not working

1. Check function permissions:
   ```sql
   SELECT has_function_privilege('authenticated', 'public.log_rate_limit(TEXT, TEXT, TEXT, BOOLEAN, INTEGER, TIMESTAMPTZ, TEXT, INTEGER)', 'EXECUTE');
   ```

2. Check for errors in application logs

### IP blocking not working

1. Verify IP format in database:
   ```sql
   SELECT ip_address FROM blocked_ips;
   ```

2. Check function returns correct result:
   ```sql
   SELECT public.is_ip_blocked('192.168.1.1');
   ```

## Future Enhancements

- [ ] Redis integration for distributed rate limiting
- [ ] Burst allowance (allow temporary spikes)
- [ ] Rate limit by user tier (basic/pro/enterprise)
- [ ] Automatic IP blocking based on patterns
- [ ] Real-time dashboard for rate limit monitoring
- [ ] Webhook notifications for rate limit events
- [ ] Integration with CloudFlare rate limiting

---

**Last Updated**: 2025-11-29
**Migration**: 403
**Version**: 1.0.0
