# Phase 19 - Soft Launch Activation Report

**Date**: 2025-11-21
**Status**: Implementation Ready
**Branch**: `feature/phase19-soft-launch-activation`

## Executive Summary

Unite-Hub is ready for controlled soft launch. This phase implements billing gates, user capacity limits, feature gating, safety layers, and stability monitoring to ensure a safe, controlled rollout before public release.

## Soft Launch Configuration

### User Limits

| Parameter | Value | Notes |
|-----------|-------|-------|
| Max Testers | 10 | Hard limit for soft launch |
| Invite Strategy | Manual Only | No self-signup |
| Current Stage | Stage 1 | Internal staff only |

### Release Stages

```
Stage 1: Internal staff only (current)
   ↓
Stage 2: Internal & trusted partners
   ↓
Stage 3: 5 external testers
   ↓
Stage 4: 10 external testers max
   ↓
Public Launch (Phase 20+)
```

### Allowed Domains

```typescript
const allowedDomains = [
  'disasterrecovery.com.au',
  'carsi.com.au',
  'unite-group.au',
];
```

### Auto-Rejection Rules

| Rule | Status | Description |
|------|--------|-------------|
| Shared Emails | ✅ Enabled | Block gmail, yahoo, hotmail for signups |
| Temp Domains | ✅ Enabled | Block disposable email services |
| VPN High-Risk | ✅ Enabled | Block signups from high-risk countries |

## Billing Activation

### Stripe Configuration

```typescript
// Stripe setup
const stripeConfig = {
  publicKey: process.env.NEXT_PUBLIC_STRIPE_KEY,
  secretKey: process.env.STRIPE_SECRET_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  modes: ['monthly', 'annual'],
};
```

### Pricing Tiers

| Plan | Monthly | Annual | Audits/Month | Features |
|------|---------|--------|--------------|----------|
| Starter | $29 | $290 | 1 | Basic audit only |
| Growth | $79 | $790 | 4 | Delta, basic competitor |
| Pro | $149 | $1,490 | 10 | Backlinks, entities |
| Enterprise | $299 | $2,990 | Unlimited | All features, priority |

### Onboarding Rules

```typescript
const onboardingRules = {
  freeAuditEnabled: true,
  freeAuditDelayHours: 72,        // 3-day wait after signup
  snapshotEnabledAfterPayment: true,
  geoRadiusLocks: true,           // Locked to tier limits
};
```

### Stripe Webhook Events

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Activate subscription, unlock features |
| `customer.subscription.updated` | Update tier limits |
| `customer.subscription.deleted` | Revoke access, lock features |
| `invoice.payment_failed` | Send warning, grace period |

## Feature Gating System

### Gated Features

| Feature | Gating Status | Unlock Tier |
|---------|---------------|-------------|
| Basic Audit | Gated | Starter+ |
| Delta Analysis | Gated | Growth+ |
| Competitor Basic | Gated | Growth+ |
| Backlink Engine | Gated | Pro+ |
| Entity Alignment | Gated | Pro+ |
| GEO Expansion | Gated | Enterprise |
| Velocity Engine | Gated | Enterprise |
| Priority Queue | Gated | Enterprise |
| Auto-Expand GEO | Gated | Enterprise |

### Tier Unlocks

```typescript
const tierUnlocks: Record<string, string[]> = {
  starter: ['basic_audit'],
  growth: ['delta_analysis', 'competitor_basic'],
  pro: ['backlinks', 'entity_alignment'],
  enterprise: ['all_features', 'priority_queue', 'auto_expand_geo'],
};

// Feature check middleware
export function canAccessFeature(userId: string, feature: string): boolean {
  const userTier = getUserTier(userId);
  const tierFeatures = tierUnlocks[userTier] || [];

  if (tierFeatures.includes('all_features')) return true;
  return tierFeatures.includes(feature);
}
```

### Enforcement Points

```typescript
// API route protection
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);

  if (!canAccessFeature(userId, 'backlinks')) {
    return NextResponse.json(
      { error: 'Feature locked. Upgrade to Pro plan.' },
      { status: 403 }
    );
  }

  // Continue with feature...
}
```

## Safety Layer

### Manual Approval Requirements

| Action | Approval Required | Reason |
|--------|-------------------|--------|
| Website Write Operations | ✅ Yes | Direct site changes |
| Large Meta Updates | ✅ Yes | >5 pages affected |
| Content Pushes | ✅ Yes | >5 pages |
| GEO Radius >10km | ✅ Yes | Significant scope change |
| Multi-Client Bulk | ✅ Yes | High impact |

### Approval Flow

```typescript
// Check if action requires approval
async function processAutonomyAction(action: Action) {
  const requiresApproval =
    action.type === 'website_write' ||
    action.affectedPages > 5 ||
    action.geoRadiusChange > 10 ||
    action.isMultiClient;

  if (requiresApproval) {
    await queueForApproval(action);
    await notifyAdmin(action);
    return { status: 'pending_approval' };
  }

  return executeAction(action);
}
```

### Undo History

```typescript
const undoConfig = {
  retentionDays: 30,
  auditTrail: 'immutable',
  clientConsentRequired: true,
};

// Store undo state before action
await saveUndoState({
  actionId: action.id,
  beforeState: currentState,
  timestamp: Date.now(),
  expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000),
});
```

### Client Consent

```typescript
// Consent verification
interface ConsentRecord {
  clientId: string;
  actionType: string;
  consentedAt: Date;
  expiresAt: Date;
  scope: string[];
}

// Verify consent before action
async function verifyConsent(clientId: string, actionType: string): Promise<boolean> {
  const consent = await getConsent(clientId, actionType);
  return consent && consent.expiresAt > new Date();
}
```

## Stability Monitoring

### Analyzers

| Analyzer | Metric | Status |
|----------|--------|--------|
| API Latency | Response time | ✅ Active |
| GSC Rate Limit | API quota usage | ✅ Active |
| DataForSEO Credit | Daily spend | ✅ Active |
| Cronjob Failure | Job success rate | ✅ Active |
| Redis Queue Depth | Pending jobs | ✅ Active |

### Thresholds

```typescript
const monitoringThresholds = {
  maxLatencyMs: 800,
  maxQueueDepth: 100,
  maxFailedJobs: 5,
  maxDataforseoDaily: 25, // USD
};
```

### Violation Actions

```typescript
const violationActions = {
  async onThresholdViolation(metric: string, value: number) {
    // Immediate actions
    await disableNewSignups();
    await reduceConcurrency(0.5); // 50% reduction
    await pauseBackgroundJobs();
    await notifyAdmin({
      type: 'threshold_violation',
      metric,
      value,
      threshold: monitoringThresholds[metric],
    });

    // Log to audit trail
    await logViolation(metric, value);
  },
};
```

### Dashboard Alerts

| Alert Level | Color | Action |
|-------------|-------|--------|
| Normal | Green | Continue operations |
| Warning | Yellow | Investigate, prepare mitigation |
| Critical | Red | Execute violation actions |

## Database Migrations

### Migration 077: Soft Launch Gate

```sql
-- 077_soft_launch_gate.sql

-- Soft launch configuration
CREATE TABLE IF NOT EXISTS soft_launch_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_testers INT DEFAULT 10,
  current_stage INT DEFAULT 1,
  allowed_domains TEXT[] DEFAULT ARRAY['disasterrecovery.com.au', 'carsi.com.au', 'unite-group.au'],
  auto_rejection_rules JSONB DEFAULT '{"shared_emails": true, "temp_domains": true, "vpn_highrisk": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invite tracking
CREATE TABLE IF NOT EXISTS soft_launch_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  stage INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Feature gates
CREATE TABLE IF NOT EXISTS feature_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL UNIQUE,
  min_tier TEXT NOT NULL, -- starter, growth, pro, enterprise
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default feature gates
INSERT INTO feature_gates (feature_key, min_tier) VALUES
  ('basic_audit', 'starter'),
  ('delta_analysis', 'growth'),
  ('competitor_basic', 'growth'),
  ('backlinks', 'pro'),
  ('entity_alignment', 'pro'),
  ('geo_expansion', 'enterprise'),
  ('velocity_engine', 'enterprise'),
  ('priority_queue', 'enterprise'),
  ('auto_expand_geo', 'enterprise')
ON CONFLICT (feature_key) DO NOTHING;

-- RLS policies
ALTER TABLE soft_launch_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE soft_launch_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_gates ENABLE ROW LEVEL SECURITY;

-- Admin-only access for config
CREATE POLICY "admin_soft_launch_config" ON soft_launch_config
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));
```

### Migration 078: Billing Activation

```sql
-- 078_billing_activation.sql

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL, -- starter, growth, pro, enterprise
  billing_cycle TEXT DEFAULT 'monthly', -- monthly, annual
  status TEXT DEFAULT 'active', -- active, past_due, canceled
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plan limits
CREATE TABLE IF NOT EXISTS plan_limits (
  plan TEXT PRIMARY KEY,
  audits_per_month INT NOT NULL,
  max_keywords INT NOT NULL,
  max_competitors INT NOT NULL,
  max_geo_radius INT NOT NULL,
  features TEXT[] NOT NULL
);

-- Insert plan limits
INSERT INTO plan_limits (plan, audits_per_month, max_keywords, max_competitors, max_geo_radius, features) VALUES
  ('starter', 1, 50, 3, 25, ARRAY['basic_audit']),
  ('growth', 4, 200, 10, 100, ARRAY['basic_audit', 'delta_analysis', 'competitor_basic']),
  ('pro', 10, 500, 25, 250, ARRAY['basic_audit', 'delta_analysis', 'competitor_basic', 'backlinks', 'entity_alignment']),
  ('enterprise', -1, 1000, 50, -1, ARRAY['all_features'])
ON CONFLICT (plan) DO UPDATE SET
  audits_per_month = EXCLUDED.audits_per_month,
  max_keywords = EXCLUDED.max_keywords,
  max_competitors = EXCLUDED.max_competitors,
  max_geo_radius = EXCLUDED.max_geo_radius,
  features = EXCLUDED.features;

-- Usage tracking
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  audits_used INT DEFAULT 0,
  keywords_tracked INT DEFAULT 0,
  competitors_analyzed INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (org_id, period_start)
);

-- RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "users_view_own_subscription" ON subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can view their org's usage
CREATE POLICY "users_view_org_usage" ON usage_tracking
  FOR SELECT TO authenticated
  USING (org_id IN (SELECT org_id FROM user_organizations WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(org_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_org_period ON usage_tracking(org_id, period_start);
```

## Environment Variables

### Required for Soft Launch

```env
# Stripe Billing
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# DataForSEO
DATAFORSEO_API_LOGIN=your_login
DATAFORSEO_API_PASSWORD=your_password

# Jina AI (for content analysis)
JINA_API_KEY=jina_...

# Existing (verify present)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
REDIS_URL=...
```

## API Endpoints

### Billing Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/billing/create-checkout` | POST | Create Stripe checkout session |
| `/api/billing/portal` | POST | Create billing portal session |
| `/api/billing/webhook` | POST | Handle Stripe webhooks |
| `/api/billing/usage` | GET | Get current usage stats |
| `/api/billing/plans` | GET | Get available plans |

### Soft Launch Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/invites` | POST | Send invite (admin only) |
| `/api/admin/invites` | GET | List invites (admin only) |
| `/api/admin/stage` | PUT | Update release stage |
| `/api/admin/monitoring` | GET | Get monitoring dashboard |

## Post-Launch Tasks

### Daily Tasks

- [ ] Review diagnostics report
- [ ] Check stability metrics
- [ ] Review approval queue
- [ ] Monitor DataForSEO spend

### Feedback Collection

```typescript
// In-app feedback widget
const feedbackConfig = {
  enabled: true,
  trigger: 'after_audit_complete',
  questions: [
    'How accurate were the recommendations?',
    'What features would you like to see?',
    'Any issues encountered?',
  ],
};
```

### Behavior Tracking

```typescript
// Track key user behaviors
const trackBehavior = async (userId: string, action: string, metadata: object) => {
  await analytics.track({
    userId,
    action,
    metadata,
    timestamp: Date.now(),
  });
};

// Key events to track
// - First audit completed
// - Feature gate hit
// - Upgrade initiated
// - Export generated
// - Recommendation accepted/rejected
```

## Success Metrics

### Week 1 Targets

- [ ] 0 critical errors
- [ ] <5% feature gate hits
- [ ] All 10 invites utilized
- [ ] 80%+ audit completion rate
- [ ] Average latency <500ms

### Month 1 Targets

- [ ] 50%+ upgrade rate (free → paid)
- [ ] 90%+ client retention
- [ ] <$500 total DataForSEO spend
- [ ] NPS score >50
- [ ] 0 data breaches

## Rollback Procedures

### Emergency Shutdown

```bash
# Disable all soft launch features
curl -X POST https://unite-hub.vercel.app/api/admin/emergency-shutdown \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"reason": "Critical issue detected"}'
```

### Graceful Degradation

1. Disable new signups
2. Pause background jobs
3. Lock high-impact features
4. Notify all active users
5. Generate incident report

## Next Phase Preview

### Phase 20: Controlled Growth & License-Ready Architecture

- Agency licensing system
- White-label options
- Multi-tenant improvements
- Public launch preparation
- Marketing site activation

**Note**: Phase 20 requires human approval before public expansion.

---

*Phase 19 - Soft Launch Activation Complete*
*Unite-Hub Status: CONTROLLED SOFT LAUNCH*
