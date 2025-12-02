# Webhook Replay Prevention - Integration Examples

**Quick copy-paste examples for each webhook endpoint**

## 1. Stripe Main Webhook (`/api/stripe/webhook/route.ts`)

**Add after signature verification, before database check:**

```typescript
import { checkAndMarkWebhook } from '@/lib/webhooks/replay-prevention';

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServer();

  try {
    // ... existing rate limit and signature verification code ...

    // ✅ ADD THIS BLOCK (after signature verification)
    const { processed } = await checkAndMarkWebhook(event.id, 'stripe');
    if (processed) {
      console.log(`✅ Stripe event ${event.id} already processed (replay prevented)`);
      return NextResponse.json({
        received: true,
        eventType: event.type,
        status: 'already_processed'
      });
    }

    // Existing database check (keep as backup)
    const { data: existingEvent } = await supabase
      .from("webhook_events")
      .select("id, status")
      .eq("stripe_event_id", event.id)
      .single();

    // ... rest of existing code ...
  }
}
```

---

## 2. Stripe Dual-Mode Webhook (`/api/webhooks/stripe/[mode]/route.ts`)

**Add after signature verification:**

```typescript
import { checkAndMarkWebhook } from '@/lib/webhooks/replay-prevention';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ mode: string }> }
) {
  const { mode: modeParam } = await params;
  const mode = modeParam as BillingMode;

  // ... existing validation and signature verification ...

  // ✅ ADD THIS BLOCK (after signature verification)
  // Use mode-specific source to prevent cross-mode replays
  const { processed } = await checkAndMarkWebhook(event.id, `stripe-${mode}`);
  if (processed) {
    console.log(`✅ Stripe ${mode} event ${event.id} already processed (replay prevented)`);
    return NextResponse.json({
      received: true,
      mode,
      status: 'already_processed'
    });
  }

  const supabase = await getSupabaseServer();

  try {
    // ... rest of existing webhook handling ...
  }
}
```

---

## 3. WhatsApp Webhook (`/api/webhooks/whatsapp/route.ts`)

**Add in `handleIncomingMessage` function:**

```typescript
import { checkAndMarkWebhook } from '@/lib/webhooks/replay-prevention';

async function handleIncomingMessage(
  message: any,
  phoneNumberId: string,
  workspaceId: string
) {
  try {
    const phoneNumber = message.from;
    const messageType = message.type;
    const whatsappMessageId = message.id;

    console.log(`📨 Incoming ${messageType} message from ${phoneNumber}`);

    // ✅ ADD THIS BLOCK (before processing)
    const { processed } = await checkAndMarkWebhook(whatsappMessageId, 'whatsapp');
    if (processed) {
      console.log(`✅ WhatsApp message ${whatsappMessageId} already processed (replay prevented)`);
      return; // Skip duplicate processing
    }

    // ... rest of existing message handling code ...

    // Extract message content
    let content = '';
    // ... existing content extraction ...

    // Find or create contact
    let contact = await db.contacts.getByEmail(phoneNumber, workspaceId);
    // ... rest of existing code ...
  }
}
```

---

## 4. Stripe Managed Service Webhook (`/api/founder/webhooks/stripe-managed-service/route.ts`)

**Add after signature verification:**

```typescript
import { checkAndMarkWebhook } from '@/lib/webhooks/replay-prevention';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  if (!signature) {
    logger.warn('❌ Missing stripe-signature header');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Verify webhook
  const event = verifyWebhookSignature(body, signature);
  if (!event) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // ✅ ADD THIS BLOCK (after signature verification)
  const { processed } = await checkAndMarkWebhook(event.id, 'stripe-managed');
  if (processed) {
    logger.info('✅ Webhook already processed (replay prevented)', { eventId: event.id });
    return NextResponse.json({
      success: true,
      eventId: event.id,
      status: 'already_processed'
    });
  }

  const supabase = getSupabaseAdmin();

  // ... rest of existing webhook handling ...
}
```

---

## Testing Each Integration

### Test Stripe Main Webhook

```bash
# Start Stripe CLI
stripe listen --forward-to localhost:3008/api/stripe/webhook

# Trigger test event
stripe trigger customer.subscription.created

# Check logs for "already processed (replay prevented)" on second delivery
```

### Test Stripe Dual-Mode Webhook

```bash
# Test mode
stripe listen --forward-to localhost:3008/api/webhooks/stripe/test

# Live mode (if configured)
stripe listen --forward-to localhost:3008/api/webhooks/stripe/live
```

### Test WhatsApp Webhook

```bash
# Use Meta's Webhook Testing Tool
# https://developers.facebook.com/tools/webhooks/

# Or use curl to simulate
curl -X POST http://localhost:3008/api/webhooks/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "123456",
      "changes": [{
        "field": "messages",
        "value": {
          "messages": [{
            "id": "wamid.test123",
            "from": "1234567890",
            "type": "text",
            "text": { "body": "Test message" },
            "timestamp": "1234567890"
          }]
        }
      }]
    }]
  }'

# Send same payload again - should be rejected as duplicate
```

### Test Stripe Managed Service Webhook

```bash
# Use Stripe CLI with managed service endpoint
stripe listen --forward-to localhost:3008/api/founder/webhooks/stripe-managed-service

stripe trigger customer.subscription.created
```

---

## Verification Checklist

After integrating each webhook:

- [ ] Import `checkAndMarkWebhook` from correct path
- [ ] Add check AFTER signature verification
- [ ] Use correct source identifier
- [ ] Return 200 OK with appropriate status on replay
- [ ] Test with webhook provider's tools
- [ ] Verify logs show "replay prevented" on duplicate
- [ ] Verify first delivery processes correctly
- [ ] Verify second delivery is rejected

---

## Common Issues

### Issue: Import Error

```
Error: Cannot find module '@/lib/webhooks/replay-prevention'
```

**Solution**: Verify file exists at `src/lib/webhooks/replay-prevention.ts`

---

### Issue: Redis Not Connected

```
⚠️ No REDIS_URL configured. Rate limiting will use in-memory fallback.
```

**Solution**:
1. For development: This is OK, in-memory fallback works
2. For production: Add `REDIS_URL` to environment variables

```bash
# .env.local or .env.production
REDIS_URL=redis://localhost:6379
# OR
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
```

---

### Issue: Webhook Still Processing Duplicates

**Possible causes**:
1. Integration not added correctly
2. Wrong source identifier
3. Redis not persisting data

**Debug steps**:
```typescript
// Add debug logging
const { processed } = await checkAndMarkWebhook(event.id, 'stripe');
console.log('Replay check result:', { eventId: event.id, processed });

// Check if webhook was marked
import { getWebhookProcessedAt } from '@/lib/webhooks/replay-prevention';
const timestamp = await getWebhookProcessedAt(event.id, 'stripe');
console.log('Webhook processed at:', timestamp);
```

---

## Integration Timeline

| Webhook | Priority | Time | Status |
|---------|----------|------|--------|
| `/api/stripe/webhook` | P0 | 5 min | ⚠️ To Do |
| `/api/webhooks/stripe/[mode]` | P0 | 5 min | ⚠️ To Do |
| `/api/webhooks/whatsapp` | P1 | 5 min | ⚠️ To Do |
| `/api/founder/webhooks/stripe-managed-service` | P1 | 5 min | ⚠️ To Do |

**Total estimated time**: 20-30 minutes

---

## Post-Integration

After integrating all webhooks:

1. **Monitor replay detection rate**:
   ```typescript
   import { getWebhookStats } from '@/lib/webhooks/replay-prevention';

   const stats = await getWebhookStats();
   console.log('Replay stats:', stats);
   ```

2. **Set up alerts**:
   - High replay rate (>10% in 1 hour)
   - Redis connection failures
   - Unusual webhook volume

3. **Review logs weekly**:
   - Check for replay patterns
   - Verify legitimate retries are handled
   - Look for potential attack attempts

---

## Support

- **Full Documentation**: `docs/WEBHOOK_REPLAY_PREVENTION.md`
- **Quick Start**: `docs/WEBHOOK_REPLAY_PREVENTION_QUICK_START.md`
- **Status**: `WEBHOOK_REPLAY_PREVENTION_STATUS.md`
- **Module**: `src/lib/webhooks/replay-prevention.ts`
- **Tests**: `tests/lib/webhooks/replay-prevention.test.ts`
