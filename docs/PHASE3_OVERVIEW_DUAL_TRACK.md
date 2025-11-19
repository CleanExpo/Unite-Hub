# Phase 3 – Dual-Track Development Overview (Option C)

**Date**: 2025-11-19
**Status**: 🚧 Foundation Stage
**Strategy**: 60% Client Portal / 40% Xero Financial Engine

---

## Overview

This document describes Phase 3 of Unite-Hub under **Option C**: building both the **Client Portal** (Track A) and the **Xero Financial Engine** (Track B) in parallel, with a 60/40 priority split in favour of client-facing functionality.

---

## Tracks

### Track A – Client Portal & Project Flow (60%)

**Focus**: Turn client ideas into structured projects with clear scopes, pricing, and progress visibility.

**Planned Capabilities**:
- ✅ Structured idea intake (voice/text → structured idea)
- 📋 AI-assisted scope generation
- 📋 Good / Better / Best packages
- 📋 Timeline estimation
- 📋 Stripe payment integration (subscriptions + one-off)
- 📋 Automatic project creation and task assignment
- 📋 Client-facing project dashboard
- 📋 Visual mindmap of project structure
- 📋 Automated status updates for clients

**Key Components**:
- `scope-planner` - Transforms raw ideas into structured proposals
- `project-manager` - Creates projects from approved scopes
- `client-dashboard` - Shows project progress and milestones

---

### Track B – Xero Financial Engine (40%)

**Focus**: Tie Unite-Hub operations to financial reality through multi-Xero integration.

**Planned Capabilities**:
- 📋 Automated invoicing for new clients and approved scopes
- ✅ Expense tracking for AI usage (OpenRouter, Perplexity, etc.)
- 📋 Daily / scheduled sync with Xero tenants
- 📋 Financial Ops dashboard (P&L, revenue vs costs, profitability)
- 📋 Webhooks for invoice/payment updates
- 📋 Reconciliation logs and retry queues

**Key Components**:
- `xero-invoicing` - Creates invoices in Xero based on scopes/projects
- `expense-sync` - Syncs operational_expenses to Xero bills
- `financial-ops` - Dashboard for revenue, costs, profitability

---

## Principles

### Safety First ✅
- All changes are additive and reversible
- No modifications to existing runtime code
- Feature-flagged when connected to live UI

### Consistent with CLAUDE.md ✅
- Uses `getSupabaseServer()` for server-side operations
- Uses `supabaseAdmin` for system operations
- Workspace isolation on all queries
- Graceful error handling

### Test-First Mindset ✅
- Each new capability will have tests as it becomes active
- Skeleton tests created in Step 1
- Real tests implemented before production use

### Progressive Disclosure ✅
- Build stubs first (Phase 3 Step 1)
- Wire to staff tools (internal testing)
- Wire to client UI (behind feature flags)
- Enable in production after validation

---

## Phase 3 Step 1 Deliverables

**Documentation** ✅:
- `PHASE3_OVERVIEW_DUAL_TRACK.md` (this document)
- `PHASE3A_CLIENT_SCOPE_PIPELINE.md` - Client portal design
- `PHASE3B_XERO_AUTOMATED_INVOICING_ARCHITECTURE.md` - Xero engine design

**TypeScript Stubs** ✅:
- `src/lib/projects/scope-planner.ts` - Scope planning logic
- `src/lib/accounting/xero-invoicing.ts` - Invoice creation logic

**Tests** ✅:
- `src/lib/__tests__/scope-planner.test.ts`
- `src/lib/__tests__/xero-invoicing.test.ts`

---

## Future Phase 3 Steps

### Step 2: Track A - Scope Planner UI (Staff Tools)
- Create `/staff/scope-review` page
- Wire `planScopeFromIdea()` to staff UI
- Allow manual editing of generated scopes
- Preview scope before client sees it

### Step 3: Track B - Invoice Generation
- Implement real Xero API calls in `xero-invoicing`
- Create invoice templates
- Test with Xero sandbox
- Add retry logic for failed syncs

### Step 4: Track A - Client Scope Selection
- Create `/client/proposals` page
- Display Good/Better/Best packages
- Allow client to select a package
- Create project and tasks automatically

### Step 5: Track B - Expense Sync & Dashboard
- Implement `syncUnbilledExpenses()`
- Create `/dashboard/financial-ops` page
- Display revenue vs costs
- Show profitability per client

### Step 6: Track A - Stripe Integration
- Add Stripe checkout for scope packages
- Handle subscription setup
- Process one-off payments
- Update project status after payment

### Step 7: Track B - Webhooks & Reconciliation
- Implement Xero webhooks
- Handle invoice status updates
- Auto-update project status when invoices are paid
- Add reconciliation logs

---

## Data Flow (Full Implementation)

### Client Idea → Project Flow

```
1. Client submits idea via /client/ideas
   ↓
2. Idea stored in `ideas` table
   ↓
3. Staff triggers scope planning
   ↓
4. scope-planner.planScopeFromIdea() generates ProposalScope
   ↓
5. Staff reviews and edits scope
   ↓
6. Scope saved to `proposal_scopes` table
   ↓
7. Client views /client/proposals
   ↓
8. Client selects Good/Better/Best package
   ↓
9. Stripe checkout for payment
   ↓
10. Payment confirmed
    ↓
11. Project created in `projects` table
    ↓
12. Tasks created and assigned to staff
    ↓
13. Client sees project in /client/projects
```

### Xero Financial Flow

```
1. Project approved (scope selected + paid)
   ↓
2. xero-invoicing.createProjectInvoice() triggered
   ↓
3. Invoice created in Xero with line items from scope
   ↓
4. Invoice ID saved to `client_invoices` table
   ↓
5. AI usage tracked via CostTracker.trackExpense()
   ↓
6. Daily cron: syncUnbilledExpenses() runs
   ↓
7. Expenses grouped by client and synced to Xero bills
   ↓
8. Financial Ops dashboard shows real P&L data
   ↓
9. Xero webhook: invoice paid
   ↓
10. Project status updated to "Funded"
```

---

## Architecture Alignment

### With Phase 2 ✅

**Interactive Features (Step 7)**:
- Toast notifications for scope actions
- Form validation for scope inputs
- Error boundaries for scope planner

**Testing Foundation (Step 8)**:
- E2E tests for scope flow
- API tests for invoice endpoints
- Component tests for scope UI

**Xero Integration (Step 9)**:
- Multi-account support ready
- Cost tracking already wired
- Invoice creation builds on existing foundation

### With CLAUDE.md ✅

**Authentication**:
- Server-side: `getSupabaseServer()`
- Admin ops: `supabaseAdmin`
- Client-side: `supabase` (browser)

**Workspace Isolation**:
- All queries filtered by `organization_id`
- Optional `workspace_id` filtering

**Error Handling**:
- CostTracker: Never throws (logs and continues)
- XeroInvoicing: Throws with clear messages
- Scope Planner: Returns errors in result objects

---

## Success Criteria

**You'll know Phase 3 is working when**:

**Track A (Client Portal)**:
✅ Clients can submit ideas
✅ Staff can generate scopes with AI assistance
✅ Clients see Good/Better/Best packages
✅ Clients can select and pay for a package
✅ Projects are auto-created with tasks
✅ Clients see project progress in dashboard

**Track B (Xero Engine)**:
✅ Invoices auto-created in Xero when scopes are approved
✅ AI costs tracked in real-time
✅ Expenses synced to Xero daily
✅ Financial Ops dashboard shows accurate P&L
✅ Webhooks update project status when invoices are paid
✅ Can answer: "What's our profit margin per client?"

---

## Next Actions

**Immediate (Step 1 Complete)** ✅:
- Run `npm test` to verify new tests pass
- Review stub implementations
- Plan Step 2 (Scope Planner UI)

**Short-term (Steps 2-3)**:
- Implement staff scope review UI
- Wire real Xero API calls
- Test with Xero sandbox

**Medium-term (Steps 4-5)**:
- Build client proposal selection UI
- Implement expense sync
- Create Financial Ops dashboard

**Long-term (Steps 6-7)**:
- Integrate Stripe payments
- Implement Xero webhooks
- Add reconciliation and retry logic

---

**Last Updated**: 2025-11-19
**Status**: Phase 3 Step 1 Complete
**Next**: Step 2 - Scope Planner UI (Staff Tools)

This overview is the umbrella document for Phase 3. Detailed design for each track is captured in:
- [`PHASE3A_CLIENT_SCOPE_PIPELINE.md`](./PHASE3A_CLIENT_SCOPE_PIPELINE.md)
- [`PHASE3B_XERO_AUTOMATED_INVOICING_ARCHITECTURE.md`](./PHASE3B_XERO_AUTOMATED_INVOICING_ARCHITECTURE.md)
