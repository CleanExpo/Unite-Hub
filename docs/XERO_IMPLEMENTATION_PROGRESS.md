# Xero Integration - Implementation Progress

**Started**: 2025-11-19
**Current Status**: Phase 1 Complete ✅
**Following**: CLAUDE.md patterns + Anthropic best practices

---

## ✅ What's Been Implemented

### Phase 1: Foundation (COMPLETE)

**1. Database Schema** ✅
- **File**: `supabase/migrations/050_xero_integration.sql`
- **Tables Created**:
  - `xero_tokens` - OAuth token storage per organization
  - `operational_expenses` - Real-time API cost tracking
  - `client_invoices` - Xero invoice sync
  - `client_profitability` (view) - Real-time P&L calculation
  - `client_profitability_mv` (materialized view) - Performance-optimized P&L

**Key Features**:
- ✅ RLS policies enabled (workspace isolation)
- ✅ Auto-refresh triggers for updated_at timestamps
- ✅ Materialized view for fast dashboard queries
- ✅ Idempotent policies (safe to re-run)
- ✅ Service role permissions for system operations

**To Apply**:
```bash
# Go to Supabase Dashboard → SQL Editor
# Copy/paste migration 050 and run
# Wait 1-5 min for schema cache refresh
```

---

**2. XeroService Client** ✅
- **File**: `src/lib/accounting/xero-client.ts`
- **Implements**:
  - OAuth 2.0 authorization flow
  - Automatic token refresh
  - Multi-tenant support
  - Connection testing
  - Token revocation (disconnect)

**Usage Example**:
```typescript
import XeroService from '@/lib/accounting/xero-client';

const xero = new XeroService();

// Get OAuth URL
const authUrl = xero.getAuthorizationUrl();

// After OAuth callback
const tokens = await xero.exchangeCodeForToken(code);
await xero.saveTokenSet(organizationId, tokens);

// Use in API routes
await xero.initialize(organizationId);
const tenantId = await xero.getTenantId();
const client = xero.getClient();

// Test connection
const test = await xero.testConnection(organizationId);
console.log(test.success ? `Connected to ${test.orgName}` : test.error);
```

**Following CLAUDE.md**:
- ✅ Uses `getSupabaseServer()` for server-side ops
- ✅ Uses `supabaseAdmin` for system ops (bypasses RLS)
- ✅ Graceful error handling with clear messages
- ✅ TypeScript types from xero-node SDK

---

**3. CostTracker** ✅
- **File**: `src/lib/accounting/cost-tracker.ts`
- **Implements**:
  - Real-time expense tracking
  - Client profitability calculation
  - Platform-wide cost summaries
  - Xero sync preparation
  - AI cost calculation helpers

**Usage Example**:
```typescript
import { CostTracker } from '@/lib/accounting/cost-tracker';

// Track every API call
await CostTracker.trackExpense({
  organizationId,
  workspaceId,
  clientId,
  expenseType: 'openrouter',
  description: 'Claude 3.5 Sonnet - content generation',
  amount: 0.0245,
  tokensUsed: 1234,
  metadata: { model: 'claude-3.5-sonnet', responseTime: 2300 }
});

// Get client profitability
const profitability = await CostTracker.getClientProfitability(
  clientId,
  organizationId
);
console.log(`Profit: $${profitability.profit} (${profitability.margin}% margin)`);

// Get unsynced expenses for Xero
const expenses = await CostTracker.getUnsyncedExpenses(organizationId);
```

**Following CLAUDE.md**:
- ✅ Uses `supabaseAdmin` for system operations
- ✅ Workspace isolation on all queries
- ✅ **CRITICAL**: Does not throw errors (logs and continues)
- ✅ Detailed TypeScript types
- ✅ Helper functions for AI cost calculation

---

## 📦 Required Dependencies

**Add to `package.json`**:
```bash
npm install xero-node
npm install --save-dev @types/xero-node
```

**Environment Variables** (`.env.local`):
```env
# Xero OAuth 2.0
XERO_CLIENT_ID=your-xero-client-id
XERO_CLIENT_SECRET=your-xero-client-secret
XERO_REDIRECT_URI=http://localhost:3008/api/integrations/xero/callback
XERO_WEBHOOK_KEY=your-webhook-signing-key
```

---

## 🎯 Next Steps (Phases 2-5)

### Phase 2: API Routes & UI (COMPLETE ✅)
- [x] `POST /api/integrations/xero/connect` - OAuth initiation
- [x] `GET /api/integrations/xero/callback` - OAuth callback
- [x] `POST /api/integrations/xero/disconnect` - Revoke tokens
- [x] `GET /api/integrations/xero/status` - Connection status
- [x] Update existing AI API wrappers to call `CostTracker.trackExpense()`
- [x] Create settings/integrations page Xero UI

**Files Created/Updated**:
- ✅ `src/app/api/integrations/xero/connect/route.ts` - OAuth initiation
- ✅ `src/app/api/integrations/xero/callback/route.ts` - OAuth callback handler
- ✅ `src/app/api/integrations/xero/disconnect/route.ts` - Token revocation
- ✅ `src/app/api/integrations/xero/status/route.ts` - Connection status
- ✅ `src/lib/ai/openrouter-intelligence.ts` - Cost tracking integrated
- ✅ `src/lib/ai/perplexity-sonar.ts` - Cost tracking integrated
- ✅ `src/app/dashboard/settings/integrations/page.tsx` - Xero UI added

**Ready for Testing**: See `docs/XERO_UI_COMPLETE.md` for test checklist

---

### Phase 3: Automated Invoicing (Pending)
- [ ] Create `src/lib/accounting/xero-invoicing.ts`
- [ ] Implement `createClientInvoice()` - Auto-create when client signs up
- [ ] Implement `syncExpensesToXero()` - Monthly bill sync
- [ ] Create cron job to run daily expense sync

---

### Phase 4: Owner Dashboard (Pending)
- [ ] Create `src/app/dashboard/financial-ops/page.tsx`
- [ ] Create `src/app/api/dashboard/financial-ops/route.ts`
- [ ] Build charts: Revenue vs Costs, Cost Breakdown, Client Profitability Table
- [ ] Add navigation link in dashboard sidebar

---

### Phase 5: Webhooks (Pending)
- [ ] Create `src/app/api/webhooks/xero/route.ts`
- [ ] Implement HMAC signature verification
- [ ] Handle invoice update events
- [ ] Auto-update invoice status when paid

---

## 📊 Example Real Data (After Full Implementation)

```
Client: Balustrade Company
Tier: Growth ($895/month)

NOVEMBER 2025 COSTS:
┌─────────────┬───────────┬────────┐
│ Service     │ API Calls │ Cost   │
├─────────────┼───────────┼────────┤
│ OpenRouter  │ 324       │ $12.45 │
│ Perplexity  │ 64        │ $3.20  │
│ Anthropic   │ 12        │ $8.90  │
│ Vercel      │ -         │ $0.50  │
│ SendGrid    │ 48        │ $1.20  │
├─────────────┼───────────┼────────┤
│ TOTAL       │ 448       │ $26.25 │
└─────────────┴───────────┴────────┘

PROFITABILITY:
  Revenue:        $895.00
  Costs:          $26.25
  Profit:         $868.75
  Margin:         97.1%
  Status:         ✅ HIGHLY PROFITABLE

ACTIONS:
  ✅ Keep this client
  ✅ Upsell video package ($495/mo)
  ❌ Don't adjust pricing
```

---

## 🏗️ Architecture Following CLAUDE.md

### Pattern 1: Supabase Client Usage ✅

**Client-side** (React components):
```typescript
import { supabase } from '@/lib/supabase'; // supabaseBrowser
```

**Server-side** (API routes):
```typescript
import { getSupabaseServer } from '@/lib/supabase';
const supabase = await getSupabaseServer();
```

**System operations** (bypassing RLS):
```typescript
import { supabaseAdmin } from '@/lib/supabase';
// Used in CostTracker, XeroService
```

---

### Pattern 2: Workspace Isolation ✅

**All queries scoped to workspace**:
```typescript
const { data } = await supabase
  .from('operational_expenses')
  .select('*')
  .eq('organization_id', organizationId)
  .eq('workspace_id', workspaceId); // ← CRITICAL
```

---

### Pattern 3: Error Handling ✅

**CostTracker never throws** (graceful degradation):
```typescript
static async trackExpense(params: CostTrackingParams): Promise<void> {
  try {
    await supabaseAdmin.from('operational_expenses').insert({...});
  } catch (error) {
    console.error('❌ Cost tracking error:', error);
    // Don't throw - continue execution
    // We don't want expense tracking to break the app
  }
}
```

**XeroService throws with clear messages**:
```typescript
if (!tokens) {
  throw new Error(`Xero not connected for organization ${organizationId}. Please connect via OAuth.`);
}
```

---

### Pattern 4: TypeScript Types ✅

**Strict typing from external SDKs**:
```typescript
import { XeroClient, TokenSet, Tenant } from 'xero-node';
```

**Custom interfaces for internal use**:
```typescript
export interface CostTrackingParams {
  organizationId: string;
  workspaceId: string;
  clientId?: string;
  expenseType: ExpenseType;
  description: string;
  amount: number;
  // ...
}
```

---

## 🚀 Quick Start (After Phases 2-5)

### 1. Setup Xero OAuth
```bash
# 1. Register app at developer.xero.com
# 2. Add credentials to .env.local
# 3. Run migration: supabase/migrations/050_xero_integration.sql
```

### 2. Connect Xero
```bash
# In browser: /dashboard/settings/integrations
# Click "Connect Xero"
# Authorize OAuth
# See "✅ Connected to [Your Xero Org]"
```

### 3. Start Tracking Costs
```typescript
// Costs are tracked automatically on every AI API call
// No manual intervention required
```

### 4. View Profitability
```bash
# In browser: /dashboard/financial-ops
# See real-time P&L dashboard
# See client profitability table
```

---

## 📁 File Structure

```
d:\Unite-Hub\
├── supabase/
│   └── migrations/
│       └── 050_xero_integration.sql ✅
│
├── src/
│   ├── lib/
│   │   └── accounting/
│   │       ├── xero-client.ts ✅
│   │       ├── cost-tracker.ts ✅
│   │       └── xero-invoicing.ts (Phase 3)
│   │
│   └── app/
│       ├── api/
│       │   ├── integrations/
│       │   │   └── xero/
│       │   │       ├── connect/ (Phase 2)
│       │   │       ├── callback/ (Phase 2)
│       │   │       ├── disconnect/ (Phase 2)
│       │   │       └── status/ (Phase 2)
│       │   │
│       │   ├── dashboard/
│       │   │   └── financial-ops/ (Phase 4)
│       │   │
│       │   └── webhooks/
│       │       └── xero/ (Phase 5)
│       │
│       └── dashboard/
│           └── financial-ops/
│               └── page.tsx (Phase 4)
│
└── docs/
    ├── XERO_INTEGRATION_FINANCIAL_OPS.md ✅
    └── XERO_IMPLEMENTATION_PROGRESS.md ✅ (this file)
```

---

## ✅ Checklist for Going Live

### Phase 1 (Complete) ✅
- [x] Database migration created
- [x] XeroService client implemented
- [x] CostTracker implemented
- [x] Following CLAUDE.md patterns
- [x] TypeScript types defined

### Phase 2 (Implementation Complete ✅ - Testing Pending)
- [ ] npm install xero-node (USER ACTION REQUIRED)
- [ ] Add .env variables (USER ACTION REQUIRED)
- [x] Fix migration 050 (correct column names to match schema)
- [ ] Run migration 050 in Supabase (USER ACTION REQUIRED)
- [x] Create OAuth API routes (connect, callback, disconnect, status)
- [x] Create settings/integrations page Xero UI
- [x] Update AI wrappers with CostTracker
  - [x] OpenRouter Intelligence wrapper
  - [x] Perplexity Sonar wrapper
- [ ] Test OAuth flow end-to-end (pending npm install + .env + migration)
- [ ] Test expense tracking (pending migration run)

### Phase 3 (Pending)
- [ ] Implement XeroInvoicing class
- [ ] Test invoice creation
- [ ] Test expense sync
- [ ] Set up daily cron job

### Phase 4 (Pending)
- [ ] Build financial ops dashboard
- [ ] Test real-time P&L
- [ ] Add navigation link
- [ ] User testing

### Phase 5 (Pending)
- [ ] Implement Xero webhooks
- [ ] Test signature verification
- [ ] Test real-time updates
- [ ] Monitor webhook logs

---

## 🎯 Success Criteria

**You'll know it's working when**:
✅ Every AI API call creates an expense record
✅ Dashboard shows REAL costs (not theoretical)
✅ Client profitability table shows accurate margins
✅ Xero invoices auto-created when clients sign up
✅ Xero bills auto-created for monthly expenses
✅ You can answer: "Which clients are profitable?"
✅ You can answer: "What's my actual cost per client?"

---

**Next Action**: Install xero-node, configure .env, run migration 050, test OAuth flow! 🚀

---

**Last Updated**: 2025-11-19
**Status**: Phase 2 Implementation Complete (2/5 phases) - Ready for Testing
**Ready For**: npm install xero-node + .env setup + migration + testing

**See**: `docs/XERO_UI_COMPLETE.md` for complete testing checklist
