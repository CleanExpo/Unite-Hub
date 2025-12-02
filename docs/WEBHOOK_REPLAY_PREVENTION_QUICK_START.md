# Webhook Replay Prevention - Quick Start Guide

**Status**: ✅ Production-Ready | **Time to Integrate**: 5 minutes per webhook

## 30-Second Integration

```typescript
import { checkAndMarkWebhook } from '@/lib/webhooks/replay-prevention';

export async function POST(req: NextRequest) {
  // 1. Verify signature (existing code)
  const event = await verifyWebhookSignature(req);

  // 2. ADD THIS - Check for replay
  const { processed } = await checkAndMarkWebhook(event.id, 'stripe');
  if (processed) {
    return NextResponse.json({
      received: true,
      status: 'already_processed'
    });
  }

  // 3. Process webhook (existing code)
  await handleWebhook(event);
  return NextResponse.json({ received: true });
}
```

## Source Identifiers

Use these source identifiers for different webhooks:

| Webhook Endpoint | Source Identifier |
|-----------------|-------------------|
| `/api/stripe/webhook` | `'stripe'` |
| `/api/webhooks/stripe/test` | `'stripe-test'` |
| `/api/webhooks/stripe/live` | `'stripe-live'` |
| `/api/webhooks/whatsapp` | `'whatsapp'` |
| `/api/founder/webhooks/stripe-managed-service` | `'stripe-managed'` |

## Environment Setup

```bash
# Add to .env.local
REDIS_URL=redis://localhost:6379

# Or use Upstash (free tier)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
```

**No Redis?** Works with in-memory fallback for development.

## Webhook Endpoints Needing Integration

| Endpoint | Status | Priority | Notes |
|----------|--------|----------|-------|
| `/api/stripe/webhook/route.ts` | ⚠️ Partial | P0 | Has database check, add Redis |
| `/api/webhooks/stripe/[mode]/route.ts` | ❌ None | P0 | No replay prevention |
| `/api/webhooks/whatsapp/route.ts` | ❌ None | P1 | No replay prevention |
| `/api/founder/webhooks/stripe-managed-service/route.ts` | ❌ None | P1 | No replay prevention |

## Testing

```bash
# Test with Stripe CLI
stripe listen --forward-to localhost:3008/api/stripe/webhook

# Trigger test event
stripe trigger customer.subscription.created

# Check logs for "already_processed" on replay
```

## Complete Documentation

See `docs/WEBHOOK_REPLAY_PREVENTION.md` for:
- Complete integration examples for each endpoint
- API reference
- Security considerations
- Monitoring and troubleshooting
- Performance benchmarks

## Key Features

✅ **24-hour TTL** - Automatic cleanup, no manual maintenance
✅ **<5ms latency** - Redis-based, minimal overhead
✅ **Atomic operations** - Race condition free
✅ **Source isolation** - Stripe/WhatsApp/etc. don't collide
✅ **Fallback support** - Works without Redis for dev
✅ **Production-ready** - Error handling, monitoring, stats

## Quick Stats

```typescript
import { getWebhookStats } from '@/lib/webhooks/replay-prevention';

const stats = await getWebhookStats();
console.log(stats);
// { totalProcessed: 1234, bySource: { stripe: 800, whatsapp: 434 } }
```

## Support

- **Module**: `src/lib/webhooks/replay-prevention.ts`
- **Full Docs**: `docs/WEBHOOK_REPLAY_PREVENTION.md`
- **Redis Client**: `src/lib/redis.ts`
