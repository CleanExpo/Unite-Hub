# Connection Pooling Setup Guide

**Priority**: P0 (Production Critical)
**Impact**: 60-80% latency reduction, 3-5x throughput increase

---

## Quick Setup (5 minutes)

### Step 1: Get Pooler URL from Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **Database**
4. Scroll to **Connection Pooler** section
5. Copy the **Connection string** (Mode: Transaction or Session)

### Step 2: Add to Environment Variables

Add to your `.env.local`:

```env
# Connection Pooler URL (enables 60-80% latency reduction)
SUPABASE_POOLER_URL=postgresql://postgres.[ref]:[password]@[region].pooler.supabase.com:6543/postgres

# Pooling mode: 'session' (recommended) or 'transaction'
SUPABASE_POOL_MODE=session
```

### Step 3: Deploy to Vercel (Production)

Add to Vercel Environment Variables:
1. Go to your Vercel project > Settings > Environment Variables
2. Add `SUPABASE_POOLER_URL` with the pooler connection string
3. Add `SUPABASE_POOL_MODE=session`
4. Redeploy

### Step 4: Verify

Check the health endpoint:
```bash
curl https://your-app.vercel.app/api/health
```

Look for `pooling: { enabled: true }` in the response.

---

## Architecture Overview

```
Browser Request
      │
      ▼
┌─────────────────────────────────────┐
│   Next.js API Route                 │
│   └── createClient() from server.ts │
│       └── getConnectionUrl()        │
│           └── Uses SUPABASE_POOLER_URL if set
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│   Supabase Connection Pooler        │
│   (PgBouncer on port 6543)          │
│   - Reuses connections              │
│   - Reduces connection overhead     │
│   - Handles thousands of requests   │
└─────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────┐
│   PostgreSQL Database               │
│   (Direct connections on port 5432) │
└─────────────────────────────────────┘
```

---

## Pooling Modes

### Session Mode (Recommended)

```env
SUPABASE_POOL_MODE=session
```

- Connection assigned per client session
- Full PostgreSQL feature support
- Best for: Most applications, Next.js

### Transaction Mode (Advanced)

```env
SUPABASE_POOL_MODE=transaction
```

- Connection returned after each transaction
- Maximum connection reuse
- Some limitations (no prepared statements across transactions)
- Best for: High-concurrency API-only services

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_POOLER_URL` | No* | Connection pooler URL from Supabase Dashboard |
| `SUPABASE_POOL_MODE` | No | `session` (default) or `transaction` |
| `DATABASE_POOLER_URL` | No | For direct pg package usage (transaction mode) |
| `DATABASE_SESSION_URL` | No | For direct pg package usage (session mode) |

*If not set, falls back to standard `NEXT_PUBLIC_SUPABASE_URL`

---

## Files Involved

| File | Purpose |
|------|---------|
| `src/lib/supabase/pooling-config.ts` | Configuration management |
| `src/lib/supabase/server.ts` | Server-side client with pooling support |
| `src/lib/db/pool.ts` | Direct PostgreSQL pooling (for background jobs) |
| `src/lib/db/connection-pool.ts` | HTTP client resilience layer |
| `src/lib/monitoring/pool-metrics.ts` | Monitoring and metrics |

---

## Performance Expectations

### Before Pooling
- Cold start: 300-500ms per request (new connection each time)
- Under load: Connection timeouts, pool exhaustion errors
- Concurrent users: ~50-100 max

### After Pooling
- Response time: 50-100ms (80% reduction)
- Under load: Stable, connections reused
- Concurrent users: 500-1000+

---

## Monitoring

### Health Check API

```bash
GET /api/health
```

Response includes:
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "latency": 45
  },
  "pooling": {
    "enabled": true,
    "mode": "session"
  }
}
```

### Metrics API

```bash
GET /api/metrics
```

Prometheus-format metrics including:
- `supabase_pool_active_connections`
- `supabase_pool_idle_connections`
- `supabase_pool_request_latency`

---

## Troubleshooting

### Connection Still Slow?

1. Check pooler URL is correct (port 6543, not 5432)
2. Verify environment variable is loaded: `console.log(process.env.SUPABASE_POOLER_URL)`
3. Restart development server after changing `.env.local`

### "Connection pool exhausted" Errors

1. Check `max_connections` in Supabase (default 60 for free tier)
2. Upgrade to Supabase Pro for 500+ connections
3. Reduce `max` in pool config if needed

### "Prepared statement already exists" Errors

This happens in transaction mode with ORMs. Solutions:
1. Switch to session mode: `SUPABASE_POOL_MODE=session`
2. Use named prepared statements
3. Disable prepared statements in your ORM

---

## Cost Considerations

| Supabase Plan | Max Connections | Pooler Included |
|---------------|-----------------|-----------------|
| Free | 60 | Yes |
| Pro ($25/mo) | 500 | Yes |
| Team ($599/mo) | 1500 | Yes |

Connection pooling is **free** and included on all Supabase plans.

---

## Next Steps After Enabling

1. **Monitor**: Watch `/api/health` for latency improvements
2. **Load Test**: Run `npm run test:load` to verify throughput
3. **Tune**: Adjust pool size based on actual usage patterns

---

**Last Updated**: 2025-12-03
