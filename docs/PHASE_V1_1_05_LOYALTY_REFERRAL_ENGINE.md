# Phase v1_1_05: Loyalty & Referral Pivot Engine

**Status**: IN DEVELOPMENT (10% → 100% in progress)
**Start Date**: 2025-11-25
**Estimated Completion**: 2025-11-27
**Total Effort**: ~23 hours

---

## Overview

v1_1_05 implements the complete **Loyalty Credits System** with **Referral Tracking** and **Reward Catalog**. This phase creates a foundational rewards infrastructure that:

1. **Tracks credit issuance, redemption, and monthly caps** (soft caps for AI tokens, hard caps for generation limits)
2. **Manages referral codes and fraud detection** (70+ fraud score = founder approval)
3. **Provides founder-controlled reward catalog** with redemption requests and approval gates
4. **Logs all events to Living Intelligence Archive** for complete audit trail
5. **Integrates with Trial Mode** - trial users earn capped credits (25% of production capacity)
6. **Truth-layer compliant** - transparent messaging, no dark patterns, founder-managed everything

---

## Phase Objectives

- [x] Create loyalty_credits table (migration 157)
- [x] Create referral_tracking tables (migration 158)
- [x] Create reward_catalog tables (migration 159)
- [x] Implement loyaltyEngine.ts business logic
- [x] Implement referralEngine.ts business logic
- [x] Implement rewardCatalog.ts business logic
- [x] Implement loyaltyArchiveBridge.ts for event logging
- [x] Create 6 API endpoints
- [x] Create 5 React UI components
- [ ] Integrate with Trial Mode, Analytics, and Founder Ops Hub

---

## Architecture

### Database Schema

#### loyalty_credits Table (Migration 157)
```sql
-- User loyalty account with balance and monthly cap tracking
loyalty_credits {
  id: uuid,
  workspace_id: uuid,
  user_id: uuid,
  balance: bigint (default 0),
  lifetime_earned: bigint,
  lifetime_redeemed: bigint,
  monthly_cap: bigint (default 5000),
  monthly_earned: bigint,
  monthly_redeemed: bigint,
  first_earned_at: timestamp,
  last_earned_at: timestamp,
  last_redeemed_at: timestamp,
}
```

**Helper Functions**:
- `issue_loyalty_credits()` - Issue credits with monthly cap enforcement
- `redeem_loyalty_credits()` - Redeem credits with balance check
- `get_loyalty_monthly_progress()` - Check monthly remaining

#### referral_codes Table (Migration 158)
```sql
-- Unique referral codes for each user
referral_codes {
  id: uuid,
  workspace_id: uuid,
  user_id: uuid,
  code: varchar(20) UNIQUE,
  campaign: varchar(100),
  times_used: bigint,
  referrals_accepted: bigint,
  total_credits_issued: bigint,
  is_active: boolean,
  expires_at: timestamp,
}
```

#### referral_events Table (Migration 158)
```sql
-- Every referral event with fraud scoring
referral_events {
  id: uuid,
  workspace_id: uuid,
  referrer_id: uuid,
  referral_code_id: uuid,
  event_type: enum (code_created, code_shared, invite_sent, code_used, signup_completed, etc),
  referred_user_id: uuid,
  referred_email: varchar,
  fraud_score: float (0-100),
  fraud_signals: jsonb,
  attribution_confidence: enum (high, medium, low),
  is_valid: boolean,
  verified_at: timestamp,
}
```

**Fraud Scoring**:
- Multiple codes from same referrer: +20 points
- Rapid code usage (10+ in 1 hour): +20 points
- High volume referrals (20+ invites/month): +30 points
- **Score ≥ 70**: Requires founder approval before credit issuance

#### referral_attribution Table (Migration 158)
```sql
-- Final link between referrer and referred user
referral_attribution {
  id: uuid,
  workspace_id: uuid,
  referrer_id: uuid,
  referred_user_id: uuid,
  referral_code_id: uuid,
  referral_event_id: uuid,
  referrer_credit_amount: bigint (100),
  referred_user_credit_amount: bigint (50),
  status: enum (pending, verified, credited, rejected),
  requires_founder_approval: boolean,
  approved_by: uuid,
  approved_at: timestamp,
}
```

#### reward_catalog Table (Migration 159)
```sql
-- Founder-managed reward definitions
reward_catalog {
  id: uuid,
  workspace_id: uuid,
  name: varchar(255),
  description: text,
  category: enum (feature_unlock, discount, priority_support, custom, credit_bundle),
  credit_cost: bigint,
  is_active: boolean,
  daily_redemption_limit: bigint,
  daily_redeemed_count: bigint,
  total_redeemed_count: bigint,
  metadata: jsonb,
}
```

#### reward_redemption_requests Table (Migration 159)
```sql
-- User redemption requests requiring founder approval
reward_redemption_requests {
  id: uuid,
  workspace_id: uuid,
  user_id: uuid,
  reward_id: uuid,
  credit_amount_requested: bigint,
  status: enum (pending, approved, redeemed, rejected, cancelled),
  founder_notes: text,
  founder_action_at: timestamp,
  founder_action_by: uuid,
  redemption_id: uuid (links to ledger),
  transparency_message: text,
}
```

---

## Business Logic Files

### loyaltyEngine.ts
**Location**: `src/lib/loyalty/loyaltyEngine.ts`

**Key Functions**:
- `issueCredits()` - Award credits with monthly cap enforcement
- `redeemCredits()` - Deduct credits with balance validation
- `getBalance()` - Fetch current balance
- `getCreditHistory()` - Get transaction history with filtering
- `getMonthlyProgress()` - Check monthly remaining
- `canEarnMoreCredits()` - Boolean check for monthly limit
- `getWorkspaceStats()` - Founder analytics (total issued, redeemed, top users)

**Monthly Cap Strategy**:
- Trial users: 5,000 credits/month (25% of 20,000)
- Production users: 20,000 credits/month
- Soft cap: Issues warning but allows transactions
- Hard cap: Blocks additional issuance

### referralEngine.ts
**Location**: `src/lib/loyalty/referralEngine.ts`

**Key Functions**:
- `generateReferralCode()` - Create unique code (REF-WORKSPACE-RANDOM)
- `getUserReferralCodes()` - List all codes for a user
- `recordReferralEvent()` - Log event with fraud scoring
- `getReferrerEvents()` - Get user's referral history
- `createAttribution()` - Link referrer to referred user
- `getReferrerAttributions()` - Get attributions by status
- `getPendingAttributions()` - Get founder approval queue
- `getUserReferralStats()` - Summary stats

**Referral Flow**:
1. User generates code → `generateReferralCode()`
2. Friend signs up with code → `recordReferralEvent('code_used')`
3. Fraud check performed → `fraud_score` calculated
4. If score < 70 → Auto-approve, issue credits
5. If score ≥ 70 → Create pending attribution, wait for founder approval
6. Founder reviews → `handleReferralApproval()`
7. Credits issued → Both users get credited

**Credit Amounts**:
- Referrer: 100 credits
- Referred user: 50 credits

### rewardCatalog.ts
**Location**: `src/lib/loyalty/rewardCatalog.ts`

**Key Functions**:
- `getAvailableRewards()` - List active rewards with affordability check
- `getAllRewards()` - Founder: list all rewards
- `createReward()` - Founder: add new reward
- `updateReward()` - Founder: modify reward
- `submitRedemptionRequest()` - User: request reward
- `getUserRedemptionRequests()` - User: view own requests
- `getPendingRedemptionRequests()` - Founder: approval queue
- `handleRedemptionRequest()` - Founder: approve/reject
- `getRedemptionStats()` - Founder: analytics

**Redemption Workflow**:
1. User views available rewards (checks balance)
2. User submits redemption request → Creates pending request
3. Founder reviews request (optional notes/transparency message)
4. Founder approves → Credits redeemed, reward marked completed
5. User notified → Can see status in dashboard

### loyaltyArchiveBridge.ts
**Location**: `src/lib/loyalty/loyaltyArchiveBridge.ts`

**Key Functions**:
- `logLoyaltyEvent()` - Record credit issuance/redemption to aiMemory
- `logReferralEvent()` - Record referral activity to aiMemory
- `logFraudDetection()` - Record fraud alerts to auditLogs
- `logRedemptionEvent()` - Record reward redemption
- `getLoyaltyEventHistory()` - Query event history
- `getReferralEventHistory()` - Query referral history
- `getFraudAlerts()` - Query fraud alerts
- `batchLogEvents()` - Log multiple events atomically

**Archive Structure**:
- Logs to `aiMemory` table with type='loyalty_event' or 'referral_event'
- Fraud alerts logged to `auditLogs` with action='fraud_detection'
- Complete audit trail for Living Intelligence

---

## API Endpoints (6 Total)

All endpoints require authentication (Bearer token) and workspace scoping.

### 1. GET /api/loyalty/credit
**Get current credit balance**

```typescript
// Query params
workspaceId: string (required)

// Response
{
  balance: string,
  lifetimeEarned: string,
  lifetimeRedeemed: string,
  monthlyCap: string,
  monthlyEarned: string,
  monthlyRemaining: string,
  canEarnMore: boolean
}
```

### 2. GET /api/loyalty/history
**Get credit transaction history**

```typescript
// Query params
workspaceId: string (required)
transactionType?: string (optional - filter by type)
limit?: number (default: 50)
offset?: number (default: 0)

// Response
{
  transactions: [
    {
      id: string,
      type: string,
      amount: string,
      relatedEntityType?: string,
      relatedEntityId?: string,
      details?: object,
      createdAt: string
    }
  ],
  limit: number,
  offset: number
}
```

### 3. GET /api/loyalty/rewards & POST /api/loyalty/rewards
**Get available rewards or submit redemption**

**GET** - List available rewards:
```typescript
// Query params
workspaceId: string (required)

// Response
{
  rewards: [
    {
      id: string,
      name: string,
      description: string,
      category: string,
      creditCost: string,
      isActive: boolean,
      dailyLimit?: string,
      metadata: object
    }
  ],
  userBalance: string
}
```

**POST** - Submit redemption request:
```typescript
// Body
{
  workspaceId: string,
  rewardId: string
}

// Response
{
  success: boolean,
  requestId: string,
  status: string,
  message: string
}
```

### 4. POST /api/loyalty/referral/create
**Generate new referral code**

```typescript
// Body
{
  workspaceId: string,
  campaign?: string (default: 'default')
}

// Response
{
  success: boolean,
  code: string,
  campaign: string,
  message: string
}
```

### 5. POST /api/loyalty/referral/claim
**Claim a referral code after signup**

```typescript
// Body
{
  workspaceId: string,
  referralCode: string,
  referredEmail?: string
}

// Response (if fraud score < 70)
{
  success: boolean,
  attributionId: string,
  status: 'credited',
  referrerCredits: 100,
  referredUserCredits: 50,
  message: string
}

// Response (if fraud score ≥ 70)
{
  success: boolean,
  attributionId: string,
  status: 'pending_approval',
  fraudScore: number,
  message: string
}
```

### 6. POST /api/loyalty/redeem
**Manual redemption (founder only)**

```typescript
// Body
{
  workspaceId: string,
  userId: string,
  amount: number,
  rewardId?: string
}

// Response
{
  success: boolean,
  amountRedeemed: string,
  newBalance: string,
  lifetimeRedeemed: string,
  message: string
}
```

---

## UI Components (5 Total)

### 1. LoyaltyStatusBanner.tsx
**Displays current credit balance and monthly progress**

```typescript
interface LoyaltyStatusBannerProps {
  workspaceId: string;
  accessToken: string;
  compact?: boolean; // Compact version for navbar
}
```

**Features**:
- Current balance display
- Monthly progress bar
- Lifetime earned/redeemed stats
- Warning if monthly cap reached
- Compact variant for tight spaces

### 2. ReferralInviteWidget.tsx
**Generate and manage referral codes**

```typescript
interface ReferralInviteWidgetProps {
  workspaceId: string;
  accessToken: string;
  onCodeGenerated?: (code: string) => void;
}
```

**Features**:
- Generate new referral codes
- Display all user's codes
- Copy code to clipboard
- Show code statistics (usage, accepted, credits)

### 3. RewardCatalogList.tsx
**Browse and redeem available rewards**

```typescript
interface RewardCatalogListProps {
  workspaceId: string;
  accessToken: string;
  onRewardSelected?: (rewardId: string) => void;
}
```

**Features**:
- List all active rewards
- Show user's balance
- Affordability check (disable if insufficient credits)
- Category badges
- Daily limit indicators
- Submit redemption request

### 4. RewardRedemptionModal.tsx
**Detailed redemption confirmation dialog**

```typescript
interface RewardRedemptionModalProps {
  isOpen: boolean;
  reward: Reward | null;
  userBalance: string;
  workspaceId: string;
  accessToken: string;
  onClose: () => void;
  onSuccess?: (requestId: string) => void;
}
```

**Features**:
- Reward details view
- Balance check
- Submit redemption with confirmation
- Success state with request ID
- Error handling with suggestions

### 5. LoyaltyHistoryPanel.tsx
**Display recent credit transactions**

```typescript
interface LoyaltyHistoryPanelProps {
  workspaceId: string;
  accessToken: string;
  limit?: number; // Default: 10
}
```

**Features**:
- Recent transaction list
- Transaction type icons
- Time-relative timestamps (e.g., "2 hours ago")
- Color-coded badges (earned vs redeemed)
- Responsive card layout

---

## Integration Points (In Progress)

### Trial Mode Integration
- Trial users earn capped credits (5,000/month = 25% of 20,000)
- Monthly reset on trial anniversary
- Restricted to enabled/limited modules only

### Analytics Integration
- Loyalty metrics in dashboard
- Referral performance charts
- Top earners/redeemers
- Monthly trend analysis

### Founder Ops Hub Integration
- Manage reward catalog
- Review pending attributions
- Approve/reject redemptions
- View fraud alerts
- Generate loyalty reports

---

## Technical Decisions

### Decision 1: Soft vs Hard Caps
- **AI Tokens**: Soft cap (warn but allow)
  - Rationale: Generous, encourages exploration
  - Cost: Small, can afford overages
- **VIF/Blueprints**: Hard cap (block after limit)
  - Rationale: Resource-intensive, need strict control
  - Cost: Large, can't afford unlimited overages

### Decision 2: Fraud Scoring Threshold
- **Score < 70**: Auto-approve (low risk)
- **Score ≥ 70**: Founder approval (review required)
- **Rationale**: Balance friction vs risk

### Decision 3: Redemption Approval Gates
- All reward redemptions require founder approval
- **Rationale**: Truth-layer compliance, founder control, prevent abuse
- **UX Impact**: Users see redemption as "pending" until approved

### Decision 4: Event Logging
- All loyalty/referral events logged to `aiMemory` (Living Intelligence Archive)
- Fraud detection events logged to `auditLogs`
- **Rationale**: Complete audit trail, compliance, historical analysis

---

## Test Coverage (To Be Added)

### Unit Tests
- Credit issuance with monthly cap
- Credit redemption with balance check
- Fraud scoring calculation
- Referral code generation (uniqueness)
- Attribution creation (auto-approve vs pending)

### Integration Tests
- Complete referral flow (code → claim → attribute → credit)
- Redemption workflow (request → approve → credit)
- Fraud detection (score calculation and approval gate)
- Monthly reset (credits roll over correctly)

### E2E Tests
- User generates referral code, shares, friend signs up, credits issued
- User redeems reward, founder approves, credits deducted
- Trial user hits monthly cap, receives warning
- Fraud case: Multiple codes from same user, flagged for review

---

## Known Limitations & Future Work

### V1 Limitations
- Referral codes don't expire automatically (founder must deactivate)
- No bulk import for rewards from templates
- No A/B testing for referral campaigns
- No email notifications for pending actions

### V2 Enhancements
- Automatic code expiration after 90 days
- Reward tier system (bronze/silver/gold)
- Referral campaign analytics dashboard
- Email notifications for founders and users
- Webhook integration for custom rewards

---

## Deployment Checklist

- [ ] Run migrations 157-159 in Supabase
- [ ] Verify RLS policies on all loyalty tables
- [ ] Create seed data (optional: default rewards)
- [ ] Test all 6 API endpoints (with/without auth)
- [ ] Render all 5 UI components in storybook
- [ ] Integration test: Complete referral flow
- [ ] Integration test: Complete redemption flow
- [ ] Load test: 100 concurrent users checking balance
- [ ] Enable loyalty panels in main dashboard
- [ ] Enable loyalty features in trial mode
- [ ] Create founder ops pages for loyalty management

---

## Files Delivered

### Migrations (3)
- `supabase/migrations/157_loyalty_credits.sql`
- `supabase/migrations/158_referral_tracking.sql`
- `supabase/migrations/159_reward_catalog.sql`

### Business Logic (4)
- `src/lib/loyalty/loyaltyEngine.ts`
- `src/lib/loyalty/referralEngine.ts`
- `src/lib/loyalty/rewardCatalog.ts`
- `src/lib/loyalty/loyaltyArchiveBridge.ts`

### API Endpoints (6)
- `src/app/api/loyalty/credit/route.ts`
- `src/app/api/loyalty/history/route.ts`
- `src/app/api/loyalty/rewards/route.ts`
- `src/app/api/loyalty/referral/create/route.ts`
- `src/app/api/loyalty/referral/claim/route.ts`
- `src/app/api/loyalty/redeem/route.ts`

### UI Components (5)
- `src/components/loyalty/LoyaltyStatusBanner.tsx`
- `src/components/loyalty/ReferralInviteWidget.tsx`
- `src/components/loyalty/RewardCatalogList.tsx`
- `src/components/loyalty/RewardRedemptionModal.tsx`
- `src/components/loyalty/LoyaltyHistoryPanel.tsx`

### Documentation (This file)
- `docs/PHASE_V1_1_05_LOYALTY_REFERRAL_ENGINE.md`

---

## Effort Breakdown

| Component | Hours | Status |
|-----------|-------|--------|
| Database Migrations (3) | 5 | ✅ Complete |
| Business Logic (4 files) | 6 | ✅ Complete |
| API Endpoints (6) | 3 | ✅ Complete |
| UI Components (5) | 6 | ✅ Complete |
| Integration Work | 3 | 🔄 In Progress |
| **Total** | **23** | **10%** |

---

## Next Steps

1. **Complete Integration Work** (2-3 hours remaining)
   - Add loyalty panels to dashboard
   - Add referral widget to settings
   - Wire up founder ops pages
   - Create admin panel for reward management

2. **Testing & QA** (4-5 hours)
   - Unit tests for all engines
   - Integration tests for complete workflows
   - E2E tests for user journeys
   - Load testing (100+ concurrent users)

3. **Documentation & Deployment** (2-3 hours)
   - API documentation
   - User guide for loyalty program
   - Founder operations guide
   - Deployment runbook

---

**Last Updated**: 2025-11-25
**Phase Lead**: Orchestrator Agent
**Status**: 🚀 In Active Development
