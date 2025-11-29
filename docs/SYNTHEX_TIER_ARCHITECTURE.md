# Synthex Tier System - Architecture Diagram

**Phase 4 of Unite-Hub Rebuild**

---

## System Architecture Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT USER REQUEST                         │
│                      (Accesses /synthex/*)                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SYNTHEX LAYOUT (Server)                          │
│                  src/app/(synthex)/layout.tsx                       │
│                                                                     │
│  1. getClientSession() → Check authentication                       │
│     ├─ Not authenticated → Redirect /client/login                  │
│     └─ Authenticated → Continue                                     │
│                                                                     │
│  2. Check profiles.role === 'CLIENT'                                │
│     ├─ Not CLIENT → Redirect /client/login                         │
│     └─ Is CLIENT → Continue                                         │
│                                                                     │
│  3. Fetch workspace + tier info                                     │
│     SELECT id, current_tier, subscription_status, trial_ends_at     │
│     FROM workspaces                                                 │
│     WHERE id = (SELECT workspace_id FROM user_organizations         │
│                 WHERE user_id = userId)                             │
│                                                                     │
│  4. Initialize TierProvider                                         │
│     <TierProvider workspaceId={workspaceId}>                        │
│       <SynthexHeader currentTier={tier} />                          │
│       <main>{children}</main>                                       │
│     </TierProvider>                                                 │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    TIER CONTEXT (Client)                            │
│                  src/contexts/TierContext.tsx                       │
│                                                                     │
│  React Context Provider:                                            │
│  • Fetches tier limits from synthex_tier_limits table              │
│  • Stores tierInfo state (tier, limits, subscription status)       │
│  • Provides hooks:                                                  │
│    - useTier()                                                      │
│    - useFeatureGate(feature)                                        │
│    - useLimit(limit, usage)                                         │
│                                                                     │
│  API:                                                               │
│  • canAccessFeature(featureName) → boolean                          │
│  • getLimit(limitName) → number                                     │
│  • hasTier(requiredTier) → boolean                                  │
│  • getUpgradeMessage(feature) → string | null                       │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    CHILD COMPONENTS                                 │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  FEATURE CARD (src/components/synthex/FeatureCard.tsx)     │   │
│  │                                                             │   │
│  │  const { allowed, message } = useFeatureGate('seo_reports');│   │
│  │                                                             │   │
│  │  if (!allowed) {                                            │   │
│  │    return <LockedCard upgradeMessage={message} />;          │   │
│  │  }                                                           │   │
│  │                                                             │   │
│  │  return <ActiveCard href="/synthex/seo" />;                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  USAGE STATS (src/components/synthex/UsageStats.tsx)       │   │
│  │                                                             │   │
│  │  const { limit, remaining, percentage } =                   │   │
│  │    useLimit('contacts_limit', currentContacts);             │   │
│  │                                                             │   │
│  │  return (                                                    │   │
│  │    <Card>                                                    │   │
│  │      <Progress value={percentage} />                         │   │
│  │      <p>{currentContacts} / {limit}</p>                      │   │
│  │      {percentage > 90 && <Alert>Limit reached!</Alert>}      │   │
│  │    </Card>                                                   │   │
│  │  );                                                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Flow

```
┌────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                             │
└────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐     ┌──────────────────────────────┐
│    workspaces table      │────▶│  synthex_tier_limits table   │
├──────────────────────────┤     ├──────────────────────────────┤
│ id (UUID)                │     │ tier (TEXT) PK               │
│ current_tier (TEXT)      │     │   - 'starter'                │
│ subscription_status      │     │   - 'professional'           │
│   - 'active'             │     │   - 'elite'                  │
│   - 'trial'              │     ├──────────────────────────────┤
│   - 'past_due'           │     │ contacts_limit (INT)         │
│   - 'cancelled'          │     │ campaigns_limit (INT)        │
│ trial_ends_at (TIMESTAMPTZ)    │ emails_per_month (INT)       │
│ stripe_customer_id       │     │ storage_limit_mb (INT)       │
│ stripe_subscription_id   │     ├──────────────────────────────┤
└──────────────────────────┘     │ Feature Flags (BOOLEAN):     │
                                 │ • seo_reports                │
                                 │ • competitor_analysis        │
                                 │ • api_access                 │
                                 │ • white_label                │
                                 │ • ai_extended_thinking       │
                                 │ • ai_agent_access            │
                                 └──────────────────────────────┘

                                 ┌──────────────────────────────┐
                                 │ synthex_usage_tracking table │
                                 ├──────────────────────────────┤
                                 │ workspace_id (UUID) FK       │
                                 │ period_start (DATE)          │
                                 │ period_end (DATE)            │
                                 ├──────────────────────────────┤
                                 │ contacts_count (INT)         │
                                 │ campaigns_count (INT)        │
                                 │ emails_sent (INT)            │
                                 │ storage_used_mb (INT)        │
                                 │ ai_tokens_used (INT)         │
                                 └──────────────────────────────┘
```

---

## Feature Gate Decision Tree

```
User attempts to access feature (e.g., "SEO Reports")
│
├─ Step 1: Check subscription status
│   │
│   ├─ Status = 'cancelled' → ❌ DENY (redirect to billing)
│   ├─ Status = 'past_due' → ❌ DENY (redirect to billing)
│   └─ Status = 'active' or 'trial' → Continue
│
├─ Step 2: Get workspace tier
│   │
│   ├─ Tier = 'starter' → Check if feature requires 'starter'
│   ├─ Tier = 'professional' → Check if feature requires 'professional' or below
│   └─ Tier = 'elite' → ✅ ALLOW (all features)
│
└─ Step 3: Query synthex_tier_limits table
    │
    ├─ SELECT seo_reports FROM synthex_tier_limits WHERE tier = current_tier
    │
    ├─ Result = true → ✅ ALLOW
    └─ Result = false → ❌ DENY (show upgrade prompt)
```

**Example:**
```
User: Tier = 'starter', Feature = 'seo_reports'
→ SELECT seo_reports FROM synthex_tier_limits WHERE tier = 'starter'
→ Result: false
→ Action: Show upgrade prompt "Upgrade to Professional ($99/mo)"
```

---

## Tier Comparison Matrix

```
┌──────────────────────────────────────────────────────────────────┐
│                         TIER FEATURES                            │
├────────────────────┬─────────┬───────────────┬──────────────────┤
│ Feature            │ Starter │ Professional  │ Elite            │
├────────────────────┼─────────┼───────────────┼──────────────────┤
│ Contacts           │ 500     │ 5,000         │ Unlimited        │
│ Campaigns          │ 3       │ 15            │ Unlimited        │
│ Emails/month       │ 2,000   │ 15,000        │ Unlimited        │
│ Storage            │ 500 MB  │ 2 GB          │ 10 GB            │
├────────────────────┼─────────┼───────────────┼──────────────────┤
│ AI Content         │ ✅      │ ✅            │ ✅               │
│ SEO Reports        │ ❌      │ ✅            │ ✅               │
│ Extended Thinking  │ ❌      │ ✅            │ ✅               │
│ API Access         │ ❌      │ ✅            │ ✅               │
│ Competitor         │ ❌      │ ❌            │ ✅               │
│ White Label        │ ❌      │ ❌            │ ✅               │
│ Custom Domain      │ ❌      │ ❌            │ ✅               │
│ Priority Support   │ ❌      │ ❌            │ ✅               │
│ AI Agents          │ ❌      │ ❌            │ ✅               │
└────────────────────┴─────────┴───────────────┴──────────────────┘
```

---

## Component Hierarchy

```
(synthex)/layout.tsx
│
├─ TierProvider
│   ├─ tierInfo { tier, limits, status }
│   ├─ canAccessFeature()
│   ├─ getLimit()
│   └─ hasTier()
│
├─ SynthexHeader
│   ├─ Tier badge (Starter/Professional/Elite)
│   ├─ Navigation links
│   ├─ User menu
│   └─ Warning banners (trial/past_due)
│
├─ Main Content
│   │
│   ├─ synthex/page.tsx (Dashboard)
│   │   ├─ UsageStats
│   │   │   ├─ Contacts usage
│   │   │   ├─ Campaigns usage
│   │   │   ├─ Emails usage
│   │   │   └─ Storage usage
│   │   │
│   │   └─ Feature Grid
│   │       ├─ FeatureCard (AI Content) - ✅ All tiers
│   │       ├─ FeatureCard (SEO Reports) - 🔒 Professional+
│   │       ├─ FeatureCard (Extended Thinking) - 🔒 Professional+
│   │       ├─ FeatureCard (Competitor) - 🔒 Elite
│   │       ├─ FeatureCard (White Label) - 🔒 Elite
│   │       └─ FeatureCard (Custom Domain) - 🔒 Elite
│   │
│   ├─ synthex/seo/page.tsx
│   │   └─ useFeatureGate('seo_reports')
│   │       ├─ allowed=true → Show SEO dashboard
│   │       └─ allowed=false → Show upgrade prompt
│   │
│   └─ synthex/competitors/page.tsx
│       └─ useFeatureGate('competitor_analysis')
│           ├─ allowed=true → Show competitor dashboard
│           └─ allowed=false → Show upgrade prompt
│
└─ SynthexFooter
    ├─ Copyright
    ├─ Legal links
    └─ Support links
```

---

## API Route Guard Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│  /api/synthex/seo/route.ts (Server-side)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  export async function GET(req: NextRequest) {                  │
│    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
│                                                                 │
│    // Check feature access using database function             │
│    const { data: hasAccess } = await supabase                  │
│      .rpc('workspace_has_feature', {                            │
│        workspace_id_param: workspaceId,                         │
│        feature_name: 'seo_reports'                              │
│      });                                                        │
│                                                                 │
│    if (!hasAccess) {                                            │
│      return NextResponse.json(                                  │
│        { error: 'Upgrade to Professional' },                    │
│        { status: 403 }                                          │
│      );                                                         │
│    }                                                            │
│                                                                 │
│    // Generate report                                           │
│    return NextResponse.json(report);                            │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Feature Access Check

```
1. User clicks "SEO Reports" card
   │
   ├─ Component: <FeatureCard requiredFeature="seo_reports" />
   │
   ▼
2. Hook: useFeatureGate('seo_reports')
   │
   ├─ Reads tierInfo from TierContext
   │   ├─ currentTier: 'starter'
   │   ├─ subscriptionStatus: 'active'
   │   └─ limits: { seo_reports: false, ... }
   │
   ▼
3. Check: canAccessFeature('seo_reports')
   │
   ├─ subscriptionStatus === 'active' ? ✅ Continue : ❌ Deny
   │
   ├─ limits.seo_reports === true ? ✅ Allow : ❌ Deny
   │
   ▼
4. Result: { allowed: false, message: "Upgrade to Professional" }
   │
   ▼
5. Render: <LockedCard with upgrade prompt />
```

---

## Subscription Status Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     SUBSCRIPTION LIFECYCLE                      │
└─────────────────────────────────────────────────────────────────┘

┌──────────┐    Sign Up    ┌──────────┐   Payment   ┌──────────┐
│   New    │──────────────▶│  Trial   │────────────▶│  Active  │
│  User    │               │  (14d)   │   Success   │          │
└──────────┘               └──────────┘             └──────────┘
                                │                         │
                                │ Trial Expires           │ Payment
                                │ No Payment              │ Failed
                                ▼                         ▼
                           ┌──────────┐             ┌──────────┐
                           │ Cancelled│             │ Past Due │
                           │          │◀────────────│          │
                           └──────────┘  Grace      └──────────┘
                                         Period           │
                                         Expired          │
                                                          │ Payment
                                                          │ Updated
                                                          ▼
                                                     ┌──────────┐
                                                     │  Active  │
                                                     │          │
                                                     └──────────┘

Access Rules:
• Trial → Full access to tier features
• Active → Full access to tier features
• Past Due → Show warning, allow 7 days grace period
• Cancelled → Block access, redirect to billing
```

---

## Usage Tracking Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   USAGE TRACKING SYSTEM                         │
└─────────────────────────────────────────────────────────────────┘

Action Taken (e.g., Create Contact)
│
├─ Step 1: Increment usage counter
│   UPDATE synthex_usage_tracking
│   SET contacts_count = contacts_count + 1
│   WHERE workspace_id = ? AND period_start = current_month
│
├─ Step 2: Check if within limit
│   SELECT workspace_within_limit(
│     workspace_id,
│     'contacts_limit',
│     current_contacts_count
│   );
│
├─ Step 3: Decision
│   ├─ Within limit → ✅ Allow action
│   └─ Exceeded limit → ❌ Block action
│       └─ Show: "Upgrade to increase limit" prompt
│
└─ Step 4: Update UI
    └─ Refresh usage stats in UsageStats component
```

---

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                            │
└─────────────────────────────────────────────────────────────────┘

Layer 1: Authentication (getClientSession)
├─ Check: User has valid session
├─ Check: User has CLIENT role in profiles table
└─ Redirect if unauthorized

Layer 2: Workspace Validation
├─ Check: User belongs to workspace (user_organizations)
├─ Check: Workspace exists and is active
└─ Redirect if no workspace access

Layer 3: Subscription Status
├─ Check: subscription_status IN ('active', 'trial')
├─ Check: Trial not expired (trial_ends_at > NOW())
└─ Show warning if past_due, block if cancelled

Layer 4: Feature Access (Client-side)
├─ Check: tier supports feature (synthex_tier_limits)
├─ Show lock overlay if not accessible
└─ Provide upgrade path

Layer 5: API Route Guards (Server-side)
├─ Check: workspace_has_feature(workspace_id, feature)
├─ Return 403 if not accessible
└─ Audit log access attempts

Layer 6: Database RLS Policies
├─ Workspace isolation (workspace_id = auth.uid())
├─ Prevent cross-tenant data access
└─ Automatic enforcement at DB level
```

---

## File Dependencies

```
src/app/(synthex)/layout.tsx
├─ Imports:
│   ├─ getClientSession from '@/lib/auth/supabase'
│   ├─ createClient from '@/lib/supabase/server'
│   ├─ TierProvider from '@/contexts/TierContext'
│   ├─ SynthexHeader from '@/components/synthex/SynthexHeader'
│   └─ SynthexFooter from '@/components/synthex/SynthexFooter'
│
└─ Exports:
    └─ SynthexLayout (default)

src/contexts/TierContext.tsx
├─ Imports:
│   └─ createClient from '@/lib/supabase/client'
│
└─ Exports:
    ├─ TierProvider (component)
    ├─ useTier (hook)
    ├─ useFeatureGate (hook)
    └─ useLimit (hook)

src/components/synthex/FeatureCard.tsx
├─ Imports:
│   ├─ useFeatureGate from '@/contexts/TierContext'
│   └─ UI components (Card, Button, Badge)
│
└─ Exports:
    └─ FeatureCard (component)

src/components/synthex/UsageStats.tsx
├─ Imports:
│   ├─ useLimit from '@/contexts/TierContext'
│   └─ UI components (Card, Progress, Badge, Alert)
│
└─ Exports:
    └─ UsageStats (component)
```

---

**End of Architecture Documentation**

**Date:** 2025-11-29
**Phase:** 4 of Unite-Hub Rebuild
**Status:** ✅ Complete
