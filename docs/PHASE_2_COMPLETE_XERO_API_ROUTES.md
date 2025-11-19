# Phase 2 Complete: Xero API Routes & Cost Tracking Integration

**Completed**: 2025-11-19
**Status**: ✅ Ready for Testing (pending npm install and .env setup)

---

## What Was Built

### 1. Xero OAuth API Routes ✅

Created 4 complete API endpoints following CLAUDE.md authentication patterns:

#### `/api/integrations/xero/connect` (POST)
**Purpose**: Initiate Xero OAuth 2.0 flow

**Features**:
- Gets authenticated user from Supabase
- Fetches user's organization
- Generates authorization URL
- Includes CSRF protection via state parameter
- Returns authorization URL for redirect

**Usage**:
```typescript
// Client-side call
const response = await fetch('/api/integrations/xero/connect', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
});

const { authUrl } = await response.json();
window.location.href = authUrl; // Redirect to Xero
```

---

#### `/api/integrations/xero/callback` (GET)
**Purpose**: Handle OAuth callback from Xero

**Features**:
- Validates code and state parameters
- Verifies state timestamp (10-minute window)
- Exchanges code for access/refresh tokens
- Saves tokens to database
- Tests connection to get organization name
- Redirects back to dashboard with success/error message

**Flow**:
```
User authorizes on Xero
  ↓
Xero redirects to /api/integrations/xero/callback?code=...&state=...
  ↓
Exchange code for tokens
  ↓
Save to xero_tokens table
  ↓
Test connection
  ↓
Redirect to /dashboard/settings/integrations?success=true&org=CompanyName
```

---

#### `/api/integrations/xero/disconnect` (POST)
**Purpose**: Revoke Xero connection

**Features**:
- Revokes OAuth tokens with Xero API
- Deletes tokens from database
- Returns success confirmation

**Usage**:
```typescript
await fetch('/api/integrations/xero/disconnect', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
  },
});
```

---

#### `/api/integrations/xero/status` (GET)
**Purpose**: Check Xero connection status

**Features**:
- Returns connection state (connected/disconnected)
- Shows organization name
- Shows token expiry information
- Tests live connection
- Returns detailed error if connection failed

**Response Example**:
```json
{
  "connected": true,
  "organization": "Unite Group Pty Ltd",
  "tenantId": "abc-123",
  "connectedAt": "2025-11-19T10:30:00Z",
  "lastUpdated": "2025-11-19T10:30:00Z",
  "tokenExpiresIn": "24 hours",
  "message": "Connected to Unite Group Pty Ltd"
}
```

---

### 2. AI Wrapper Cost Tracking ✅

Updated both AI API wrappers to automatically track costs when org/workspace IDs provided.

#### OpenRouter Intelligence (`src/lib/ai/openrouter-intelligence.ts`)

**Changes**:
- Added optional `trackingParams` to `callOpenRouter()` method
- Extracts usage data from OpenRouter response
- Calculates cost using existing `calculateCost()` method
- Calls `CostTracker.trackExpense()` with full metadata
- **CRITICAL**: Never throws errors (graceful degradation)

**Updated Method Signature**:
```typescript
async generateSocialContent(params: {
  platform: 'youtube' | 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'x' | 'reddit' | 'pinterest';
  contentType: 'post' | 'caption' | 'description' | 'script' | 'hashtags';
  topic: string;
  brandVoice?: string;
  targetAudience?: string;
  keywords?: string[];
  // NEW: Cost tracking (optional)
  organizationId?: string;
  workspaceId?: string;
  clientId?: string;
}): Promise<string>
```

**Usage Example**:
```typescript
const content = await openRouter.generateSocialContent({
  platform: 'linkedin',
  contentType: 'post',
  topic: 'stainless steel balustrades',
  organizationId: 'org-123',  // ← Enables cost tracking
  workspaceId: 'ws-456',      // ← Enables cost tracking
  clientId: 'client-789'       // ← Optional: tracks cost to specific client
});

// Cost automatically tracked to operational_expenses table
```

**What Gets Tracked**:
```typescript
{
  organization_id: 'org-123',
  workspace_id: 'ws-456',
  client_id: 'client-789',
  expense_type: 'openrouter',
  description: 'anthropic/claude-3.5-sonnet - 2450 tokens',
  amount: 0.0367,  // Calculated from usage
  tokens_used: 2450,
  api_endpoint: '/chat/completions',
  metadata: {
    model: 'anthropic/claude-3.5-sonnet',
    promptTokens: 450,
    completionTokens: 2000,
    responseTime: 1234
  }
}
```

---

#### Perplexity Sonar (`src/lib/ai/perplexity-sonar.ts`)

**Changes**:
- Added optional `organizationId`, `workspaceId`, `clientId` to `search()` method
- Tracks response time
- Calculates cost based on model (sonar vs sonar-pro)
- Calls `CostTracker.trackExpense()` with citation count
- **CRITICAL**: Never throws errors (graceful degradation)

**Updated Method Signature**:
```typescript
async search(
  query: string,
  options: SonarSearchOptions & {
    organizationId?: string;  // ← NEW
    workspaceId?: string;     // ← NEW
    clientId?: string;        // ← NEW
  } = {}
): Promise<SonarResponse>
```

**Usage Example**:
```typescript
const result = await perplexity.search(
  'Latest SEO trends for balustrade companies',
  {
    model: 'sonar-pro',
    recencyFilter: 'month',
    organizationId: 'org-123',  // ← Enables cost tracking
    workspaceId: 'ws-456',      // ← Enables cost tracking
    clientId: 'client-789'       // ← Optional: tracks cost to specific client
  }
);

// Cost automatically tracked to operational_expenses table
```

**What Gets Tracked**:
```typescript
{
  organization_id: 'org-123',
  workspace_id: 'ws-456',
  client_id: 'client-789',
  expense_type: 'perplexity',
  description: 'sonar-pro - 1234 tokens - 8 citations',
  amount: 0.0185,  // Calculated from usage
  tokens_used: 1234,
  api_endpoint: '/chat/completions',
  metadata: {
    model: 'sonar-pro',
    query: 'Latest SEO trends for balustrade companies',
    citationCount: 8,
    responseTime: 987
  }
}
```

---

## Architecture Following CLAUDE.md ✅

### 1. Authentication Pattern
All API routes use CLAUDE.md authentication:
```typescript
const supabase = await getSupabaseServer();
const { data: { user }, error: authError } = await supabase.auth.getUser();

if (authError || !user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### 2. Workspace Isolation
All queries scoped to user's organization:
```typescript
const { data: userOrg } = await supabase
  .from('user_organizations')
  .select('org_id')
  .eq('user_id', user.id)
  .single();
```

### 3. Graceful Error Handling
Cost tracking NEVER breaks the app:
```typescript
try {
  await CostTracker.trackExpense({...});
} catch (trackingError) {
  // Log but don't throw
  console.error('❌ Cost tracking failed (non-critical):', trackingError);
}
```

### 4. Clear Error Messages
All errors include helpful context:
```typescript
if (!tokens) {
  return NextResponse.json(
    { error: 'Xero not connected for this organization' },
    { status: 404 }
  );
}
```

---

## Files Created/Modified

### Created Files (7):
1. `src/app/api/integrations/xero/connect/route.ts` (75 lines)
2. `src/app/api/integrations/xero/callback/route.ts` (118 lines)
3. `src/app/api/integrations/xero/disconnect/route.ts` (54 lines)
4. `src/app/api/integrations/xero/status/route.ts` (82 lines)
5. `docs/PHASE_2_COMPLETE_XERO_API_ROUTES.md` (this file)

### Modified Files (3):
6. `src/lib/ai/openrouter-intelligence.ts` (+90 lines for cost tracking)
7. `src/lib/ai/perplexity-sonar.ts` (+38 lines for cost tracking)
8. `docs/XERO_IMPLEMENTATION_PROGRESS.md` (updated checklist)

### Fixed Files (1):
9. `supabase/migrations/050_xero_integration.sql` (fixed column names to match schema)

**Total**: 9 files, ~457 lines of production-ready code

---

## Next Steps (Before Testing)

### 1. Install Dependencies
```bash
npm install xero-node
npm install --save-dev @types/xero-node
```

### 2. Add Environment Variables
Add to `.env.local`:
```env
# Xero OAuth 2.0
XERO_CLIENT_ID=your-xero-client-id
XERO_CLIENT_SECRET=your-xero-client-secret
XERO_REDIRECT_URI=http://localhost:3008/api/integrations/xero/callback
XERO_WEBHOOK_KEY=your-webhook-signing-key
```

### 3. Run Database Migration
```bash
# Go to Supabase Dashboard → SQL Editor
# Copy/paste contents of supabase/migrations/050_xero_integration.sql
# Run the migration
# Wait 1-5 minutes for schema cache refresh
```

### 4. Test OAuth Flow
```typescript
// 1. Call connect endpoint
const { authUrl } = await fetch('/api/integrations/xero/connect', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// 2. Visit authUrl in browser
window.location.href = authUrl;

// 3. Authorize on Xero
// 4. Callback endpoint handles token exchange automatically
// 5. Check status
const status = await fetch('/api/integrations/xero/status', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

console.log(status.connected); // true
console.log(status.organization); // "Your Xero Org Name"
```

### 5. Test Cost Tracking
```typescript
// With tracking
const content = await openRouter.generateSocialContent({
  platform: 'linkedin',
  topic: 'test',
  organizationId: 'your-org-id',
  workspaceId: 'your-workspace-id'
});

// Check database
const { data: expenses } = await supabase
  .from('operational_expenses')
  .select('*')
  .eq('organization_id', 'your-org-id')
  .order('created_at', { ascending: false })
  .limit(1);

console.log(expenses[0]); // Latest expense record
```

---

## Success Criteria ✅

**Phase 2 is complete when**:
- [x] 4 OAuth API routes created (connect, callback, disconnect, status)
- [x] All routes follow CLAUDE.md authentication patterns
- [x] OpenRouter wrapper updated with cost tracking
- [x] Perplexity wrapper updated with cost tracking
- [x] Cost tracking is optional (backward compatible)
- [x] Cost tracking never throws errors (graceful degradation)
- [x] Migration 050 uses correct column names
- [x] Documentation updated

**Phase 2 is TESTED when**:
- [ ] npm install xero-node completed
- [ ] .env variables configured
- [ ] Migration 050 run in Supabase
- [ ] OAuth flow works end-to-end
- [ ] Tokens saved to database
- [ ] Status endpoint returns connection details
- [ ] Disconnect endpoint revokes tokens
- [ ] OpenRouter tracks costs to operational_expenses
- [ ] Perplexity tracks costs to operational_expenses

---

## Real-World Example

After Phase 2 is tested, here's what happens when you generate content for a client:

```typescript
// Generate LinkedIn post for balustrade client
const content = await openRouter.generateSocialContent({
  platform: 'linkedin',
  contentType: 'post',
  topic: 'Custom stainless steel balustrades for residential projects',
  brandVoice: 'Professional, trustworthy, local focus',
  targetAudience: 'Homeowners, builders, architects in Sydney',
  keywords: ['balustrades', 'stainless steel', 'Sydney'],
  organizationId: 'unite-group-org-id',
  workspaceId: 'marketing-workspace-id',
  clientId: 'balustrade-company-client-id'
});

// AUTOMATIC COST TRACKING:
// ✅ Recorded in operational_expenses table
// ✅ Model: anthropic/claude-3.5-sonnet
// ✅ Cost: $0.0245 (2450 tokens × $0.000010/token)
// ✅ Linked to: Unite Group → Marketing Workspace → Balustrade Client
// ✅ Metadata: { model, tokens, responseTime }

// Later, check profitability:
const profitability = await CostTracker.getClientProfitability(
  'balustrade-company-client-id',
  'unite-group-org-id'
);

console.log(`
  Revenue: $${profitability.revenue}
  Costs:   $${profitability.costs}
  Profit:  $${profitability.profit}
  Margin:  ${profitability.margin}%
  API Calls: ${profitability.apiCalls}
`);

// Example output:
// Revenue: $895.00  (Growth tier)
// Costs:   $26.25   (Real costs for this month)
// Profit:  $868.75
// Margin:  97.1%
// API Calls: 142
```

---

## Phase 3 Preview

With Phase 2 complete, we can now move to Phase 3: Automated Invoicing

**What Phase 3 will build**:
1. `src/lib/accounting/xero-invoicing.ts` - Invoice automation
2. Auto-create invoices in Xero when clients sign up
3. Auto-create bills in Xero for monthly expenses
4. Daily cron job to sync unsynced expenses
5. Webhook handling for invoice payment updates

**Phase 3 Timeline**: 8-12 hours of work

---

**Last Updated**: 2025-11-19
**Status**: Phase 2 Complete ✅
**Ready For**: npm install + .env setup + migration + testing
**Next**: Phase 3 - Automated Invoicing
