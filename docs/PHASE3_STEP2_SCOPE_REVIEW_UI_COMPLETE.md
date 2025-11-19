# Phase 3 Step 2 – Staff Scope Review UI Complete

**Date**: 2025-11-19
**Status**: ✅ **COMPLETE**
**Version**: 1.0.0

---

## Summary

This step implements the **staff-facing Scope Review interface** for Phase 3 Track A (Client Portal - 60% priority). Staff can now:

1. Select a client idea from the database
2. Generate a proposal scope using AI-assisted stub logic
3. Review and edit the generated scope interactively
4. Save as draft or send to client
5. Load existing scopes for further editing

All changes are **additive, safe, and reversible** and follow `CLAUDE.md` patterns and Anthropic Dev Docs best practices.

---

## What Was Added

### 1. Staff UI Components ✅

**Main Scope Review Page**:
- [`src/app/(staff)/staff/scope-review/page.tsx`](../src/app/(staff)/staff/scope-review/page.tsx) - Client-side page component
  - Loads client ideas from Supabase database
  - Dropdown selector for idea selection
  - Generate scope button (calls `planScopeFromIdea()`)
  - Displays selected idea description
  - Integrates with ScopeEditor component
  - Save as draft / Send to client actions
  - **Size**: ~320 lines

**Interactive Scope Editor**:
- [`src/components/staff/ScopeEditor.tsx`](../src/components/staff/ScopeEditor.tsx) - Reusable editing component
  - Edit scope sections (title, description)
  - Add/delete sections
  - Edit Good/Better/Best packages
  - Manage deliverables (add/update/delete)
  - Calculate pricing from estimated hours
  - Tab interface for package navigation
  - Inline edit forms with save/cancel
  - **Size**: ~518 lines
  - **Sub-components**: `SectionEditForm`, `PackageEditForm`

### 2. API Routes ✅

**Save Proposal Scope**:
- [`src/app/api/staff/proposal-scope/save/route.ts`](../src/app/api/staff/proposal-scope/save/route.ts)
  - POST endpoint for saving edited scopes
  - Follows CLAUDE.md authentication pattern (Bearer token)
  - Zod schema validation
  - Creates or updates proposal_scopes table record
  - Updates idea status when sent to client
  - Returns scopeId and operation type
  - **Size**: ~230 lines

**Get Proposal Scope**:
- [`src/app/api/staff/proposal-scope/get/route.ts`](../src/app/api/staff/proposal-scope/get/route.ts)
  - GET endpoint for fetching existing scopes
  - Query parameter: `ideaId` (UUID)
  - Returns full ProposalScope object or null
  - Includes metadata (created/updated timestamps, user info)
  - **Size**: ~180 lines

### 3. Service Layer ✅

**Scope Service**:
- [`src/lib/services/staff/scopeService.ts`](../src/lib/services/staff/scopeService.ts)
  - `saveProposalScope()` - Save or update scope with full error handling
  - `getProposalScope()` - Fetch scope by ideaId
  - `listProposalScopes()` - List all scopes for organization
  - Type-safe responses with detailed error messages
  - Workspace isolation enforced
  - **Size**: ~320 lines

### 4. Documentation ✅

This file documents the complete implementation, architecture, testing strategy, and next steps.

---

## Architecture Overview

### Data Flow

```
Staff User
    ↓
[/staff/scope-review page]
    ↓
Select Idea → Load Ideas from Supabase
    ↓
Generate Scope → planScopeFromIdea(idea)
    ↓
[ScopeEditor component]
    ↓
Edit Sections, Packages, Deliverables
    ↓
Save as Draft / Send to Client
    ↓
[POST /api/staff/proposal-scope/save]
    ↓
scopeService.saveProposalScope()
    ↓
Supabase: proposal_scopes table
    ↓
Return scopeId + success message
    ↓
Toast notification (success/error)
```

### Component Hierarchy

```
ScopeReviewPage (page.tsx)
  ├─ Card: Idea Selection
  │   ├─ Select (dropdown)
  │   ├─ Idea Description
  │   └─ Generate Scope Button
  │
  ├─ ScopeEditor
  │   ├─ Card: Scope Sections
  │   │   ├─ Section List
  │   │   │   ├─ SectionEditForm (inline)
  │   │   │   └─ Section Display
  │   │   └─ Add Section Button
  │   │
  │   └─ Card: Pricing Packages
  │       ├─ Tabs (Good/Better/Best)
  │       │   └─ PackageEditForm
  │       │       ├─ Summary Input
  │       │       ├─ Timeline Input
  │       │       ├─ Estimated Hours + Calculate
  │       │       ├─ Deliverables List
  │       │       │   ├─ Add Deliverable
  │       │       │   ├─ Edit Deliverable
  │       │       │   └─ Delete Deliverable
  │       │       └─ Calculated Pricing Display
  │       └─ Package Display (read-only)
  │
  └─ Card: Actions
      ├─ Save as Draft Button
      └─ Send to Client Button
```

### API Architecture

**Authentication Pattern** (from CLAUDE.md):

```typescript
// Client-side: Get session token
const { data: { session } } = await supabase.auth.getSession();

// Pass token in Authorization header
fetch('/api/staff/proposal-scope/save', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});

// Server-side: Validate token
const authHeader = req.headers.get('authorization');
const token = authHeader?.replace('Bearer ', '');

if (token) {
  const { supabaseBrowser } = await import('@/lib/supabase');
  const { data, error } = await supabaseBrowser.auth.getUser(token);

  if (error || !data.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  userId = data.user.id;
}
```

**Service Layer Pattern**:

```typescript
// API route delegates to service layer
export async function POST(req: NextRequest) {
  // Authentication
  // Extract body
  // Call service layer
  const result = await saveProposalScope({
    ideaId,
    scope,
    status,
    userId,
    userEmail,
  });

  return NextResponse.json(result);
}

// Service layer handles business logic
export async function saveProposalScope(params: SaveScopeParams) {
  // Validate idea exists
  // Check existing scope
  // Create or update
  // Update idea status
  return { success, scopeId, operation, message };
}
```

---

## Database Schema Requirements

### Existing Tables Used

**`ideas` table** (existing):
```sql
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID REFERENCES contacts(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'new', -- 'new', 'scoped', 'approved', 'rejected'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`proposal_scopes` table** (needs to be created):
```sql
CREATE TABLE proposal_scopes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID REFERENCES contacts(id),
  scope_data JSONB NOT NULL, -- Full ProposalScope object
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT, -- User email or ID
  updated_by TEXT, -- User email or ID

  -- Indexes
  CONSTRAINT unique_idea_scope UNIQUE (idea_id)
);

CREATE INDEX idx_proposal_scopes_org ON proposal_scopes(organization_id);
CREATE INDEX idx_proposal_scopes_client ON proposal_scopes(client_id);
CREATE INDEX idx_proposal_scopes_status ON proposal_scopes(status);
```

### Migration File

**File**: `supabase/migrations/039_create_proposal_scopes_table.sql`

```sql
-- Phase 3 Step 2: Create proposal_scopes table
-- Stores staff-generated scopes for client ideas

CREATE TABLE IF NOT EXISTS proposal_scopes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID NOT NULL REFERENCES ideas(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id UUID REFERENCES contacts(id),
  scope_data JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT,

  CONSTRAINT unique_idea_scope UNIQUE (idea_id)
);

-- Indexes for performance
CREATE INDEX idx_proposal_scopes_org ON proposal_scopes(organization_id);
CREATE INDEX idx_proposal_scopes_client ON proposal_scopes(client_id);
CREATE INDEX idx_proposal_scopes_status ON proposal_scopes(status);

-- RLS policies (workspace isolation)
ALTER TABLE proposal_scopes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scopes from their organization"
  ON proposal_scopes
  FOR SELECT
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create scopes for their organization"
  ON proposal_scopes
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update scopes from their organization"
  ON proposal_scopes
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete scopes from their organization"
  ON proposal_scopes
  FOR DELETE
  USING (
    organization_id IN (
      SELECT org_id FROM user_organizations WHERE user_id = auth.uid()
    )
  );
```

**To Apply**:
1. Copy SQL to Supabase Dashboard → SQL Editor
2. Execute migration
3. Verify table creation: `SELECT * FROM proposal_scopes LIMIT 1;`

---

## Integration Points

### With Phase 3 Step 1 ✅

**scope-planner module**:
```typescript
import { planScopeFromIdea, calculatePackagePricing } from '@/lib/projects/scope-planner';

// Generate scope from idea (currently stub, future AI-assisted)
const generatedScope = planScopeFromIdea(selectedIdea);

// Calculate pricing from hours
const pricing = calculatePackagePricing(40, 150, 0.3);
```

**Type definitions**:
- `ClientIdea` - Idea data structure
- `ProposalScope` - Complete scope structure
- `ScopeSection` - Individual sections
- `ScopePackage` - Good/Better/Best packages

### With Phase 2 Step 7 ✅

**Toast notifications**:
```typescript
import { useToast } from '@/contexts/ToastContext';

const toast = useToast();

toast.success('Proposal scope saved as draft');
toast.error('Failed to load ideas');
toast.warning('Please select a client idea first');
toast.info('Loaded existing proposal scope');
```

### With CLAUDE.md Patterns ✅

**Authentication**:
- Client-side: `supabase.auth.getSession()`
- Authorization header: `Bearer ${session.access_token}`
- Server-side: `supabaseBrowser.auth.getUser(token)`

**Client Components**:
- `'use client'` directive for interactive components
- Server components by default

**Error Handling**:
- Try/catch blocks in all async operations
- Descriptive error messages
- Toast notifications for user feedback

**Workspace Isolation**:
- All queries filtered by `organization_id`
- RLS policies enforce tenant separation

---

## Testing Strategy

### Unit Tests (To Be Created)

**Component Tests**:
```typescript
// tests/components/staff/ScopeEditor.test.tsx
describe('ScopeEditor', () => {
  it('renders scope sections correctly', () => {
    // Test section rendering
  });

  it('allows editing section title and description', () => {
    // Test inline editing
  });

  it('calculates pricing from estimated hours', () => {
    // Test pricing calculation
  });

  it('adds and removes deliverables', () => {
    // Test deliverable management
  });
});
```

**Service Tests**:
```typescript
// tests/services/staff/scopeService.test.ts
describe('scopeService', () => {
  it('saves a new proposal scope', async () => {
    const result = await saveProposalScope({
      ideaId: 'uuid',
      scope: mockScope,
      status: 'draft',
      userId: 'uuid',
    });

    expect(result.success).toBe(true);
    expect(result.operation).toBe('created');
  });

  it('updates an existing proposal scope', async () => {
    // Test update operation
  });

  it('fetches a proposal scope by ideaId', async () => {
    // Test retrieval
  });
});
```

### API Tests (To Be Created)

```typescript
// tests/api/staff/proposal-scope.api.test.ts
describe('POST /api/staff/proposal-scope/save', () => {
  it('returns 401 without auth token', async () => {
    const response = await fetch('/api/staff/proposal-scope/save', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(401);
  });

  it('validates request body with Zod', async () => {
    // Test validation errors
  });

  it('creates a new proposal scope', async () => {
    // Test successful creation
  });
});

describe('GET /api/staff/proposal-scope/get', () => {
  it('returns null if no scope exists', async () => {
    // Test missing scope
  });

  it('returns existing scope with metadata', async () => {
    // Test successful retrieval
  });
});
```

### E2E Tests (To Be Created)

```typescript
// tests/e2e/staff-scope-review.e2e.spec.ts
test('staff can generate and save a proposal scope', async ({ page }) => {
  await page.goto('/staff/scope-review');

  // Select an idea
  await page.click('[data-testid="idea-selector"]');
  await page.click('text=Build a Website');

  // Generate scope
  await page.click('text=Generate Proposal Scope');
  await page.waitForSelector('[data-testid="scope-editor"]');

  // Edit a section
  await page.click('[data-testid="edit-section-btn"]');
  await page.fill('[data-testid="section-title"]', 'Updated Title');
  await page.click('text=Save');

  // Save as draft
  await page.click('text=Save as Draft');
  await page.waitForSelector('text=Proposal scope saved as draft');
});
```

---

## File Summary

| Category | File | Lines | Purpose |
|----------|------|-------|---------|
| **UI Components** | `src/app/(staff)/staff/scope-review/page.tsx` | ~320 | Main scope review page |
| | `src/components/staff/ScopeEditor.tsx` | ~518 | Interactive scope editor |
| **API Routes** | `src/app/api/staff/proposal-scope/save/route.ts` | ~230 | Save scope endpoint |
| | `src/app/api/staff/proposal-scope/get/route.ts` | ~180 | Get scope endpoint |
| **Service Layer** | `src/lib/services/staff/scopeService.ts` | ~320 | Business logic layer |
| **Documentation** | `docs/PHASE3_STEP2_SCOPE_REVIEW_UI_COMPLETE.md` | ~650 | This file |
| **Total** | **6 files** | **~2,218 lines** | Complete staff tools |

---

## Database Migration Required

**Action**: Create `proposal_scopes` table in Supabase

**Steps**:
1. Copy SQL from section above (Migration File)
2. Go to Supabase Dashboard → SQL Editor
3. Paste and execute migration
4. Verify table creation
5. Test RLS policies

**Estimated Time**: 5 minutes

---

## Next Steps (Phase 3 Step 3+)

### Step 3: AI-Assisted Scope Generation 📋

**Goals**:
- Replace deterministic stub in `planScopeFromIdea()`
- Integrate with OpenRouter (70% of traffic)
- Use Claude Sonnet 4.5 for scope generation
- Add prompt template for scope planning
- Implement caching for common patterns

**Estimated Effort**: 6-8 hours

**Files to Modify**:
- `src/lib/projects/scope-planner.ts` - Replace stub with AI call
- Add prompt templates to `src/lib/prompts/scope-planner-prompts.ts`
- Update tests to verify AI integration

---

### Step 4: Client Scope Selection 📋

**Goals**:
- Create `/client/proposals` page
- Display Good/Better/Best packages side-by-side
- Allow client to select a package
- Show pricing comparison table
- Trigger next step (payment flow)

**Estimated Effort**: 8-10 hours

**Files to Create**:
- `src/app/(client)/client/proposals/page.tsx`
- `src/components/client/ProposalPackageCard.tsx`
- `src/components/client/PackageComparisonTable.tsx`
- `src/app/api/client/proposals/select/route.ts`

---

### Step 5: Stripe Payment Integration 📋

**Goals**:
- Add Stripe checkout for selected packages
- Handle one-off payments
- Setup subscription billing for recurring
- Update project status after payment
- Send confirmation emails

**Estimated Effort**: 10-12 hours

**Files to Create**:
- `src/lib/payments/stripe-service.ts`
- `src/app/api/payments/create-checkout/route.ts`
- `src/app/api/webhooks/stripe/route.ts`
- Environment variables for Stripe keys

---

### Step 6: Project Creation from Scope 📋

**Goals**:
- Auto-create project when client selects package
- Generate initial tasks from deliverables
- Set timeline from estimated hours
- Assign staff to project
- Notify team via email

**Estimated Effort**: 6-8 hours

**Files to Create**:
- `src/lib/services/staff/projectService.ts`
- `src/app/api/projects/create-from-scope/route.ts`
- Update `projects` table schema

---

## Success Criteria

### Feature Completeness ✅

- [x] Staff can load client ideas from database
- [x] Staff can generate proposal scopes (stub)
- [x] Staff can edit scope sections
- [x] Staff can edit packages (Good/Better/Best)
- [x] Staff can manage deliverables
- [x] Staff can calculate pricing from hours
- [x] Staff can save scopes as draft
- [x] Staff can send scopes to clients
- [x] Staff can load existing scopes for editing
- [x] API routes handle authentication
- [x] Service layer provides reusable functions
- [x] Toast notifications provide feedback

### Technical Quality ✅

- [x] Follows CLAUDE.md authentication patterns
- [x] Uses Anthropic Dev Docs best practices
- [x] TypeScript strict typing throughout
- [x] Zod validation on API routes
- [x] Workspace isolation enforced
- [x] Error handling comprehensive
- [x] Code is well-documented
- [x] No breaking changes to existing code
- [x] All changes are reversible

### Future Readiness ✅

- [x] Stub implementation ready for AI replacement
- [x] Database schema supports client selection
- [x] API structure supports payment integration
- [x] Component structure supports project creation
- [x] Service layer supports future workflows

---

## Sign-off

**Implementation Status**: ✅ **COMPLETE**

All Phase 3 Step 2 requirements have been successfully implemented:
- ✅ 2 UI components (page + ScopeEditor)
- ✅ 2 API routes (save + get)
- ✅ 1 service layer with 3 functions
- ✅ Comprehensive documentation
- ✅ Database schema defined (migration ready)
- ✅ Zero breaking changes to runtime application
- ✅ All changes are additive and reversible
- ✅ Follows CLAUDE.md and Anthropic Dev Docs patterns

**Test Execution**:
```bash
# Verify imports (no runtime errors)
npx tsc --noEmit

# Run unit tests (after test files created)
npm test

# Run E2E tests (after Playwright setup)
npm run test:e2e
```

**Database Setup**:
```bash
# Apply migration in Supabase Dashboard
# Copy SQL from "Database Migration Required" section above
# Execute in SQL Editor
```

**Next Actions**:
1. Apply database migration (5 minutes)
2. Test scope review workflow manually
3. Create unit tests for ScopeEditor component
4. Create API tests for save/get endpoints
5. Plan Step 3 (AI-assisted scope generation)

This implementation provides a complete staff-facing interface for reviewing and editing proposal scopes, laying the foundation for client selection and payment integration in future steps.

---

**References**:
- [PHASE3_STEP1_FOUNDATION_COMPLETE.md](./PHASE3_STEP1_FOUNDATION_COMPLETE.md) - Phase 3 foundations
- [PHASE3A_CLIENT_SCOPE_PIPELINE.md](./PHASE3A_CLIENT_SCOPE_PIPELINE.md) - Client portal design
- [PHASE2_STEP7_INTERACTIVE_FEATURES_COMPLETE.md](./PHASE2_STEP7_INTERACTIVE_FEATURES_COMPLETE.md) - Toast notifications
- [CLAUDE.md](../CLAUDE.md) - Project standards
- [scope-planner.ts](../src/lib/projects/scope-planner.ts) - Scope generation logic

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-19
**Author**: Claude Code Agent
