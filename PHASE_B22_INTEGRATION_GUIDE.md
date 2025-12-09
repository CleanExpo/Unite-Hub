# Phase B22: Quick Integration Guide

## 🚀 Getting Started (2 Steps)

### Step 1: Run Migration
```sql
-- In Supabase SQL Editor, paste and run:
\i supabase/migrations/428_synthex_billing_core.sql
```

### Step 2: Test UI
```
Navigate to: /synthex/settings → Billing tab
```

---

## 📝 Entitlement Integration (Copy-Paste Ready)

### Email Campaigns
```typescript
// src/lib/synthex/emailService.ts or campaign send function
import { canSendEmail, incrementUsage } from '@/lib/synthex/billingService';

async function sendCampaignEmails(tenantId: string, recipients: string[]) {
  // Check entitlement BEFORE sending
  const check = await canSendEmail(tenantId, recipients.length);
  if (!check.allowed) {
    throw new Error(`Cannot send emails: ${check.reason}`);
  }

  // Send your emails here...
  const results = await yourEmailSendFunction(recipients);

  // Track usage AFTER sending
  await incrementUsage(tenantId, 'emails_sent', recipients.length);

  return results;
}
```

### Contact Creation
```typescript
// src/app/api/synthex/contacts/route.ts
import { canAddContacts, recordUsage } from '@/lib/synthex/billingService';

export async function POST(request: NextRequest) {
  const { tenantId } = await request.json();

  // Check entitlement
  const check = await canAddContacts(tenantId, 1);
  if (!check.allowed) {
    return NextResponse.json(
      { error: check.reason },
      { status: 403 }
    );
  }

  // Create contact...
  const contact = await createContact(...);

  // Update usage (get current count)
  const totalContacts = await getContactCount(tenantId);
  await recordUsage(tenantId, 'contacts', totalContacts);

  return NextResponse.json({ success: true, contact });
}
```

### AI Content Generation
```typescript
// src/lib/synthex/aiService.ts or wherever you call Claude
import { canMakeAICall, incrementUsage } from '@/lib/synthex/billingService';

async function generateEmailContent(tenantId: string, prompt: string) {
  // Check AI quota
  const check = await canMakeAICall(tenantId);
  if (!check.allowed) {
    throw new Error(`AI limit reached: ${check.reason}`);
  }

  // Call Claude API...
  const response = await anthropic.messages.create({...});

  // Track usage
  await incrementUsage(tenantId, 'ai_calls', 1);

  return response.content[0].text;
}
```

### Campaign Creation
```typescript
// src/app/api/synthex/campaigns/route.ts
import { canCreateCampaign, recordUsage } from '@/lib/synthex/billingService';

export async function POST(request: NextRequest) {
  const { tenantId, campaignData } = await request.json();

  // Check campaign limit
  const check = await canCreateCampaign(tenantId);
  if (!check.allowed) {
    return NextResponse.json(
      { error: check.reason },
      { status: 403 }
    );
  }

  // Create campaign...
  const campaign = await createCampaign(campaignData);

  // Update usage count
  const activeCampaigns = await getCampaignCount(tenantId);
  await recordUsage(tenantId, 'campaigns', activeCampaigns);

  return NextResponse.json({ success: true, campaign });
}
```

---

## 🔍 Available Functions

### Entitlement Checks
```typescript
import {
  canSendEmail,
  canAddContacts,
  canMakeAICall,
  canCreateCampaign,
  canCreateAutomation,
  canAddTeamMember
} from '@/lib/synthex/billingService';

// All return: { allowed: boolean, reason?: string, remaining?: number }
const check = await canSendEmail(tenantId, emailCount);
if (check.allowed) {
  console.log(`Can send! ${check.remaining} emails remaining`);
} else {
  console.error(`Denied: ${check.reason}`);
}
```

### Usage Tracking
```typescript
import {
  recordUsage,
  incrementUsage,
  getUsage
} from '@/lib/synthex/billingService';

// Set absolute value
await recordUsage(tenantId, 'contacts', 150);

// Increment by amount
await incrementUsage(tenantId, 'emails_sent', 10);

// Get current usage
const emailsSent = await getUsage(tenantId, 'emails_sent');
```

### Plan Management
```typescript
import {
  getAvailablePlans,
  getTenantSubscription
} from '@/lib/synthex/billingService';

// Get all plans
const plans = await getAvailablePlans();

// Get tenant's subscription
const subscription = await getTenantSubscription(tenantId);
console.log(`Plan: ${subscription.plan.name}`);
console.log(`Status: ${subscription.status}`);
```

---

## 📊 Usage Metrics

| Metric | Description | Where to Track |
|--------|-------------|----------------|
| `emails_sent` | Emails sent this month | After campaign send |
| `contacts` | Total active contacts | After contact create/delete |
| `ai_calls` | AI interactions this month | After Claude API call |
| `campaigns` | Active campaigns | After campaign create/archive |
| `automations` | Active automations | After automation create/deactivate |
| `team_members` | Team member count | After invite accept/member remove |

---

## 🎯 Plan Limits Reference

| Feature | FREE | PRO | AGENCY |
|---------|------|-----|--------|
| Contacts | 100 | 5,000 | Unlimited (-1) |
| Emails/Month | 500 | 25,000 | 100,000+ |
| AI Calls/Month | 50 | 1,000 | 10,000 |
| Campaigns | 3 | Unlimited (-1) | Unlimited (-1) |
| Automations | 1 | 10 | Unlimited (-1) |
| Team Members | 1 | 5 | 25 |

**Note**: `-1` means unlimited

---

## ⚠️ Important Patterns

### Always Check Before Action
```typescript
// ❌ BAD - Don't do this
await sendEmail(...);
await incrementUsage(tenantId, 'emails_sent', 1);

// ✅ GOOD - Check first
const check = await canSendEmail(tenantId, 1);
if (!check.allowed) {
  throw new Error(check.reason);
}
await sendEmail(...);
await incrementUsage(tenantId, 'emails_sent', 1);
```

### Use Absolute Values for Counts
```typescript
// ❌ BAD - Don't increment indefinitely
await incrementUsage(tenantId, 'contacts', 1);

// ✅ GOOD - Set to actual count
const totalContacts = await getContactCount(tenantId);
await recordUsage(tenantId, 'contacts', totalContacts);
```

### Handle Errors Gracefully
```typescript
// ✅ User-friendly error messages
try {
  const check = await canSendEmail(tenantId, count);
  if (!check.allowed) {
    return {
      error: `Email limit reached. You've sent ${check.current}/${check.limit} emails this month. Upgrade to PRO for 25,000 emails/month.`
    };
  }
  // ... proceed
} catch (error) {
  console.error('[Billing] Entitlement check failed:', error);
  // Optionally allow action if billing service is down
}
```

---

## 🧪 Testing Checklist

### Manual Tests

1. **Migration**
   - [ ] Run migration 428 in Supabase SQL Editor
   - [ ] Verify 3 plans exist: `SELECT * FROM synthex_plans;`
   - [ ] Create new tenant and verify subscription created

2. **API**
   - [ ] GET /api/synthex/plans → Returns FREE, PRO, AGENCY
   - [ ] GET /api/synthex/subscription?tenantId=X → Returns subscription
   - [ ] GET /api/synthex/usage/summary?tenantId=X → Returns usage

3. **UI**
   - [ ] Navigate to /synthex/settings
   - [ ] Click Billing tab
   - [ ] Verify plan displays correctly
   - [ ] Check usage bars render
   - [ ] See upgrade CTA (if on FREE)

4. **Entitlements**
   - [ ] Try action within limit → Should succeed
   - [ ] Try action at limit → Should fail with clear message
   - [ ] Verify usage increments after action

---

## 🐛 Troubleshooting

### "No subscription found"
```typescript
// Check if subscription exists
const sub = await supabaseAdmin
  .from('synthex_subscriptions')
  .select('*')
  .eq('tenant_id', tenantId)
  .single();

// If not, create manually
await initialize_free_subscription(tenantId);
```

### Usage not updating
```typescript
// Check RLS policies allow service role
// Verify using supabaseAdmin, not user client
import { supabaseAdmin } from '@/lib/supabase/admin';

// Set usage directly
await supabaseAdmin
  .from('synthex_usage_records')
  .upsert({
    tenant_id: tenantId,
    metric: 'emails_sent',
    quantity: 100,
    period_start: '2025-12-01',
    period_end: '2025-12-31'
  });
```

### UI not loading
```typescript
// Check network tab for API errors
// Verify tenantId is being passed
// Check console for React errors
```

---

## 📚 Related Files

- **Service**: `src/lib/synthex/billingService.ts`
- **Migration**: `supabase/migrations/428_synthex_billing_core.sql`
- **UI**: `src/components/synthex/settings/PlanUsagePanel.tsx`
- **API**: `src/app/api/synthex/plans/route.ts`
- **API**: `src/app/api/synthex/subscription/route.ts`
- **API**: `src/app/api/synthex/usage/summary/route.ts`
- **Docs**: `docs/PHASE_B22_SYNTHEX_BILLING_FOUNDATION_STATUS.md`

---

**Phase B22 Complete** ✅
**Migration**: 428
**Date**: 2025-12-06
