# Synthex Client Portal - Tier-Based Feature Access

**Phase 4 of Unite-Hub Rebuild**

This document describes the tier-based feature access system for the Synthex client portal.

---

## Architecture Overview

### File Structure

```
src/
├── app/(synthex)/
│   ├── layout.tsx                    # Main layout with auth + tier provider
│   └── synthex/
│       └── page.tsx                  # Dashboard with feature cards
├── contexts/
│   └── TierContext.tsx               # Tier context provider + hooks
└── components/synthex/
    ├── SynthexHeader.tsx             # Header with tier badge
    ├── SynthexFooter.tsx             # Footer component
    ├── FeatureCard.tsx               # Tier-gated feature card
    └── UsageStats.tsx                # Usage vs. limits display
```

---

## Tier System

Based on migration `401_synthex_tier_management.sql`, the system supports three tiers:

| Tier | Price | Contacts | Campaigns | Emails/mo | Features |
|------|-------|----------|-----------|-----------|----------|
| **Starter** | $29/mo | 500 | 3 | 2,000 | Basic AI, 500MB storage |
| **Professional** | $99/mo | 5,000 | 15 | 15,000 | + SEO reports, Extended Thinking, API access, 2GB storage |
| **Elite** | $299/mo | Unlimited | Unlimited | Unlimited | + Competitor analysis, White label, Custom domain, Priority support, 10GB storage |

---

## Database Schema

### Tables

**`synthex_tier_limits`** - Tier configuration (read-only)
```sql
- tier (TEXT): 'starter', 'professional', 'elite'
- contacts_limit (INTEGER): -1 = unlimited
- campaigns_limit (INTEGER)
- emails_per_month (INTEGER)
- drip_campaigns_limit (INTEGER)
- seo_reports (BOOLEAN)
- competitor_analysis (BOOLEAN)
- api_access (BOOLEAN)
- priority_support (BOOLEAN)
- white_label (BOOLEAN)
- custom_domain (BOOLEAN)
- ai_content_generation (BOOLEAN)
- ai_extended_thinking (BOOLEAN)
- ai_agent_access (BOOLEAN)
- storage_limit_mb (INTEGER)
```

**`workspaces`** - Workspace subscription status
```sql
- current_tier (TEXT): Current subscription tier
- subscription_status (TEXT): 'active', 'trial', 'past_due', 'cancelled'
- trial_ends_at (TIMESTAMPTZ): Trial expiration date
- stripe_customer_id (TEXT)
- stripe_subscription_id (TEXT)
```

**`synthex_usage_tracking`** - Monthly usage tracking
```sql
- workspace_id (UUID)
- period_start (DATE)
- period_end (DATE)
- contacts_count (INTEGER)
- campaigns_count (INTEGER)
- emails_sent (INTEGER)
- drip_campaigns_count (INTEGER)
- storage_used_mb (INTEGER)
- ai_tokens_used (INTEGER)
- ai_requests_count (INTEGER)
```

### Database Functions

**`workspace_has_tier(workspace_id, required_tier)`**
- Returns: BOOLEAN
- Checks if workspace tier >= required tier
- Example: `SELECT workspace_has_tier('uuid', 'professional');`

**`workspace_has_feature(workspace_id, feature_name)`**
- Returns: BOOLEAN
- Checks if workspace can access specific feature
- Example: `SELECT workspace_has_feature('uuid', 'seo_reports');`

**`get_workspace_limit(workspace_id, limit_name)`**
- Returns: INTEGER (-1 = unlimited)
- Gets limit value for resource
- Example: `SELECT get_workspace_limit('uuid', 'contacts_limit');`

**`workspace_within_limit(workspace_id, limit_name, current_count)`**
- Returns: BOOLEAN
- Checks if usage is within limit
- Example: `SELECT workspace_within_limit('uuid', 'contacts_limit', 450);`

---

## Usage Guide

### 1. Layout Implementation (`layout.tsx`)

The layout handles:
1. ✅ CLIENT role authentication
2. ✅ Workspace tier fetching
3. ✅ TierProvider initialization
4. ✅ Header with tier badge
5. ✅ Subscription status warnings

```typescript
export default async function SynthexLayout({ children }: SynthexLayoutProps) {
  const session = await getClientSession();

  if (!session) {
    redirect('/client/login');
  }

  // Fetch workspace and tier info
  const workspace = await fetchWorkspace(userId);

  return (
    <TierProvider workspaceId={workspace.id}>
      <SynthexHeader currentTier={workspace.current_tier} />
      <main>{children}</main>
      <SynthexFooter />
    </TierProvider>
  );
}
```

### 2. Tier Context (`TierContext.tsx`)

Provides tier information and feature access control.

**Available Hooks:**

**`useTier()`** - Main hook
```typescript
const {
  tierInfo,              // WorkspaceTierInfo | null
  loading,               // boolean
  error,                 // string | null
  canAccessFeature,      // (feature: FeatureName) => boolean
  getLimit,              // (limit: LimitName) => number
  isUnlimited,           // (limit: LimitName) => boolean
  hasTier,               // (tier: TierLevel) => boolean
  refreshTierInfo,       // () => Promise<void>
  getUpgradeMessage,     // (feature: FeatureName) => string | null
} = useTier();
```

**`useFeatureGate(feature)`** - Simplified feature check
```typescript
const { allowed, message } = useFeatureGate('seo_reports');

if (!allowed) {
  return <UpgradePrompt message={message} />;
}
```

**`useLimit(limit, currentUsage)`** - Usage vs. limit tracking
```typescript
const {
  limit,        // number (-1 = unlimited)
  isUnlimited,  // boolean
  remaining,    // number (Infinity if unlimited)
  percentage,   // number (0-100)
} = useLimit('contacts_limit', 450);
```

### 3. Feature Gating in Components

**Method A: Using `useFeatureGate` hook**
```typescript
import { useFeatureGate } from '@/contexts/TierContext';

function SEOReportsButton() {
  const { allowed, message } = useFeatureGate('seo_reports');

  if (!allowed) {
    return (
      <Tooltip content={message}>
        <Button disabled>
          <Lock className="mr-2" />
          SEO Reports (Locked)
        </Button>
      </Tooltip>
    );
  }

  return <Button onClick={openSEOReports}>SEO Reports</Button>;
}
```

**Method B: Using `canAccessFeature` from `useTier`**
```typescript
import { useTier } from '@/contexts/TierContext';

function CompetitorAnalysis() {
  const { canAccessFeature, getUpgradeMessage } = useTier();

  if (!canAccessFeature('competitor_analysis')) {
    return <UpgradePrompt message={getUpgradeMessage('competitor_analysis')} />;
  }

  return <CompetitorDashboard />;
}
```

### 4. Usage Tracking

**Display usage statistics:**
```typescript
import { useLimit } from '@/contexts/TierContext';

function ContactsUsage() {
  const { limit, remaining, percentage } = useLimit('contacts_limit', currentContacts);

  return (
    <Card>
      <Progress value={percentage} />
      <p>{currentContacts} / {limit === -1 ? 'Unlimited' : limit}</p>
      {percentage > 90 && <Alert>Approaching limit!</Alert>}
    </Card>
  );
}
```

### 5. API Route Guards

**Server-side tier checking:**
```typescript
// /api/synthex/seo/route.ts
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');

  // Check feature access using database function
  const { data: hasAccess } = await supabase
    .rpc('workspace_has_feature', {
      workspace_id_param: workspaceId,
      feature_name: 'seo_reports'
    });

  if (!hasAccess) {
    return NextResponse.json(
      { error: 'Upgrade to Professional to access SEO reports' },
      { status: 403 }
    );
  }

  // Proceed with SEO report generation
}
```

---

## Feature Reference

### Feature Names (for `canAccessFeature`)

| Feature | Tier Required | Description |
|---------|---------------|-------------|
| `ai_content_generation` | Starter | Basic AI content generation |
| `seo_reports` | Professional | Technical SEO audits and reports |
| `ai_extended_thinking` | Professional | Advanced AI analysis (5k-10k tokens) |
| `api_access` | Professional | Programmatic API access |
| `competitor_analysis` | Elite | Deep competitive intelligence |
| `white_label` | Elite | Custom branding for reports |
| `custom_domain` | Elite | Host portal on custom domain |
| `priority_support` | Elite | Priority email/chat support |
| `ai_agent_access` | Elite | Full AI agent orchestration |

### Limit Names (for `getLimit`, `useLimit`)

| Limit | Description |
|-------|-------------|
| `contacts_limit` | Max contacts allowed |
| `campaigns_limit` | Max campaigns allowed |
| `emails_per_month` | Monthly email sending limit |
| `drip_campaigns_limit` | Max drip campaigns |
| `storage_limit_mb` | Storage quota in MB |

---

## Component Examples

### Feature Card with Gate

```typescript
<FeatureCard
  icon={TrendingUp}
  title="SEO Reports"
  description="Technical audits and keyword tracking"
  href="/synthex/seo"
  requiredFeature="seo_reports"
/>
```

**Behavior:**
- ✅ Accessible: Card is clickable, shows "Active" badge
- 🔒 Locked: Card shows lock overlay with upgrade prompt

### Usage Stats Display

```typescript
<UsageStats />
```

**Displays:**
- Contacts: 150 / 500 (30%)
- Campaigns: 2 / 3 (67%)
- Emails: 450 / 2,000 (22%)
- Storage: 120 MB / 500 MB (24%)

**Warning levels:**
- 🟢 Normal: 0-74%
- 🟡 Warning: 75-89%
- 🔴 Danger: 90-100%

---

## Testing Checklist

### Layout Tests
- [ ] Redirects to `/client/login` if not authenticated
- [ ] Displays tier badge in header (Starter, Professional, Elite)
- [ ] Shows trial warning banner if in trial period
- [ ] Shows subscription warning if past_due or cancelled
- [ ] TierContext provides correct tier info to children

### Feature Gate Tests
- [ ] Locked features show upgrade prompt
- [ ] Accessible features are clickable
- [ ] Correct upgrade messages per tier (Starter → Pro, Starter → Elite, Pro → Elite)
- [ ] Database functions return correct values

### Usage Tracking Tests
- [ ] Displays correct usage statistics
- [ ] Shows warning when approaching limits (75%+)
- [ ] Shows danger alert at 90%+ usage
- [ ] Handles unlimited correctly (shows "Unlimited")

### API Route Guards
- [ ] Returns 403 for gated features
- [ ] Allows access for valid tiers
- [ ] Checks subscription_status (active or trial only)

---

## Upgrade Flow (To Be Implemented)

**Path:** `/synthex/billing`

**Requirements:**
1. Display current tier
2. Show tier comparison table
3. Stripe checkout integration
4. Update `workspaces.current_tier` on successful payment
5. Webhook handler for subscription changes

**Database update on upgrade:**
```sql
UPDATE workspaces
SET current_tier = 'professional',
    subscription_status = 'active',
    stripe_subscription_id = 'sub_xyz',
    updated_at = NOW()
WHERE id = 'workspace-uuid';
```

---

## Troubleshooting

**Issue:** `useTier must be used within a TierProvider`
- **Solution:** Ensure component is nested inside `(synthex)` route group

**Issue:** Feature gate always shows locked
- **Solution:** Check `workspaces.subscription_status` is 'active' or 'trial'

**Issue:** Database functions return false
- **Solution:** Verify migration 401 was applied, check RLS policies

**Issue:** Usage stats not displaying
- **Solution:** Implement `/api/synthex/usage` endpoint to fetch real data

---

## Future Enhancements

1. **Real-time usage tracking** - WebSocket updates for usage stats
2. **Auto-upgrade prompts** - Show modal when hitting limit
3. **Usage predictions** - "You'll hit limit in X days"
4. **Granular permissions** - Per-user feature access within workspace
5. **Custom tiers** - Enterprise pricing with custom limits
6. **Overage charges** - Pay-per-use for exceeding limits

---

**Last Updated:** 2025-11-29
**Migration:** `401_synthex_tier_management.sql`
**Status:** ✅ Complete - Ready for testing
