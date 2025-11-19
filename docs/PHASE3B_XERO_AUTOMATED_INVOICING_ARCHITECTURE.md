# Phase 3B – Xero Automated Invoicing Architecture

**Date**: 2025-11-19
**Status**: 📋 Design Complete
**Track**: B (Xero Financial Engine - 40% priority)

---

## Overview

This document describes the planned structure for automated invoicing and financial operations built on top of the existing multi-Xero account integration (Migrations 050 & 052).

---

## Inputs (Already Available)

**Database Tables**:
- `client_users` – Client-level identity
- `ideas` – Raw client ideas
- `proposal_scopes` – Structured scopes with pricing (Phase 3A)
- `projects` – Active projects
- `operational_expenses` – AI and operational costs (via CostTracker)
- `xero_tokens` – Connected Xero tenants per organization
- `xero_accounts_summary` – Account stats (expenses, revenue)

**Services**:
- `XeroService` – OAuth, token management, multi-account support
- `CostTracker` – Real-time expense tracking

---

## Planned Capabilities

### 1. Invoice Creation Triggers 📋

**When to Create Invoices**:

**A. New Client Onboarding**:
- Trigger: Client account created + subscription plan selected
- Invoice Type: Recurring subscription (monthly/annual)
- Line Items: Base subscription fee, add-ons

**B. Proposal Scope Approved**:
- Trigger: Client selects Good/Better/Best package + payment confirmed
- Invoice Type: One-off project invoice
- Line Items: Project scope deliverables, estimated hours × rate

**C. Project Milestone Reached**:
- Trigger: Staff marks milestone as complete
- Invoice Type: Milestone payment (if payment terms are milestone-based)
- Line Items: % of total project cost for this milestone

**D. Monthly Operational Costs** (Future):
- Trigger: End of month cron job
- Invoice Type: Pass-through costs (if client pays for their own AI usage)
- Line Items: OpenRouter, Perplexity, Anthropic costs from `operational_expenses`

---

### 2. Invoice Generation Logic 📋

**Data Flow**:
```
1. Trigger event (e.g., scope approved)
   ↓
2. Gather invoice context (client, project, pricing)
   ↓
3. Select correct Xero tenant (via xero_tenant_id or primary account)
   ↓
4. Build Xero invoice payload (JSON)
   ↓
5. Call Xero API: POST /invoices
   ↓
6. Save invoice ID to client_invoices table
   ↓
7. Return success/failure result
```

**Invoice Payload Example** (Xero API format):
```json
{
  "Type": "ACCREC",
  "Contact": {
    "ContactID": "contact-uuid-from-xero",
    "Name": "Client Name"
  },
  "LineItems": [
    {
      "Description": "Website Development - Better Package",
      "Quantity": 1,
      "UnitAmount": 11700.00,
      "AccountCode": "200"
    },
    {
      "Description": "SEO Optimization",
      "Quantity": 1,
      "UnitAmount": 2000.00,
      "AccountCode": "200"
    }
  ],
  "Date": "2025-11-19",
  "DueDate": "2025-12-19",
  "Reference": "PROJ-001",
  "Status": "DRAFT"
}
```

**Account Codes** (configured per organization):
- `200` - Sales (default for project invoices)
- `400` - Operating expenses (for cost pass-through)

---

### 3. Sync Process 📋

**Daily Expense Sync**:
1. Query `operational_expenses` where `synced_to_xero = false`
2. Group by `client_id` and `xero_tenant_id`
3. For each client:
   - Calculate total cost
   - Build Xero bill payload (if costs are passed through)
   - OR: Just mark as synced (if costs are absorbed)
4. Call Xero API
5. Update `operational_expenses.synced_to_xero = true`

**Database Schema Addition** (Planned):
```sql
-- Add sync tracking to operational_expenses
ALTER TABLE operational_expenses
  ADD COLUMN IF NOT EXISTS synced_to_xero BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS xero_bill_id TEXT,
  ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;
```

---

### 4. Financial Ops Dashboard 📋 (Phase 3 Step 5)

**URL**: `/dashboard/financial-ops`

**Metrics Displayed**:

**Revenue**:
- Total invoices sent (count + amount)
- Paid invoices (count + amount)
- Outstanding invoices (count + amount)
- Average invoice value

**Costs**:
- Total operational expenses (by service: OpenRouter, Perplexity, Anthropic)
- Cost per client
- Cost per project
- Monthly burn rate

**Profitability**:
- Revenue - Costs = Profit
- Profit margin %
- Profit per client
- Breakeven point

**Per-Account View** (Multi-Xero):
- Revenue by Xero tenant
- Costs by Xero tenant
- P&L by business entity

**Charts**:
- Revenue vs Costs (line chart, last 6 months)
- Cost Breakdown (pie chart: OpenRouter, Perplexity, Anthropic, Other)
- Client Profitability Table (sortable)

---

## Implementation Phases

### Phase 3 Step 1 ✅ (Complete)

**Created**:
- TypeScript stubs for invoice generation
- Type definitions for `InvoiceJobContext`, `InvoiceResult`
- Stub functions:
  - `createProjectInvoice()`
  - `createSubscriptionInvoice()`
  - `syncUnbilledExpenses()`
- Unit tests

**Files**:
- `src/lib/accounting/xero-invoicing.ts`
- `src/lib/__tests__/xero-invoicing.test.ts`

---

### Phase 3 Step 3 📋 (Planned: Real Invoice Generation)

**Goals**:
- Implement real Xero API calls in `createProjectInvoice()`
- Build invoice payload from ProposalScope
- Test with Xero sandbox
- Add retry logic for failed API calls

**Implementation**:
```typescript
import XeroService from './xero-client';
import { Invoice, LineItem } from 'xero-node';

export async function createProjectInvoice(
  context: InvoiceJobContext
): Promise<InvoiceResult> {
  try {
    // Initialize Xero client
    const xero = new XeroService();
    await xero.initialize(context.organizationId, context.xeroTenantId);
    const xeroClient = xero.getClient();

    // Build line items from project scope
    const lineItems: LineItem[] = await buildLineItemsFromProject(
      context.projectId
    );

    // Create invoice
    const invoice: Invoice = {
      type: Invoice.TypeEnum.ACCREC,
      contact: { contactID: await getXeroContactId(context.clientId) },
      lineItems,
      date: new Date().toISOString().split('T')[0],
      dueDate: calculateDueDate(30), // 30 days net
      reference: `PROJ-${context.projectId}`,
      status: Invoice.StatusEnum.DRAFT,
    };

    const response = await xeroClient.accountingApi.createInvoices(
      context.xeroTenantId,
      { invoices: [invoice] }
    );

    // Save to database
    await saveInvoiceToDatabase(response.body.invoices[0]);

    return {
      success: true,
      message: 'Invoice created successfully in Xero',
      externalInvoiceId: response.body.invoices[0].invoiceID,
    };
  } catch (error) {
    console.error('Invoice creation failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

---

### Phase 3 Step 5 📋 (Planned: Expense Sync)

**Goals**:
- Implement `syncUnbilledExpenses()`
- Group expenses by client
- Decide: Pass-through to client OR absorb internally
- Create Xero bills for pass-through costs

**Logic**:
```typescript
export async function syncUnbilledExpenses(
  organizationId: string
): Promise<{ success: boolean; message: string }> {
  // Get all unsynced expenses
  const { data: expenses } = await supabaseAdmin
    .from('operational_expenses')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('synced_to_xero', false);

  if (!expenses || expenses.length === 0) {
    return { success: true, message: 'No expenses to sync' };
  }

  // Group by client and xero_tenant_id
  const groupedExpenses = groupByClient(expenses);

  for (const [clientId, clientExpenses] of Object.entries(groupedExpenses)) {
    const totalCost = clientExpenses.reduce((sum, e) => sum + e.amount, 0);

    // If client is on pass-through pricing, create bill
    if (await isPassThroughClient(clientId)) {
      await createXeroBill({
        organizationId,
        clientId,
        xeroTenantId: clientExpenses[0].xero_tenant_id,
        lineItems: clientExpenses.map(e => ({
          description: e.description,
          amount: e.amount,
        })),
      });
    }

    // Mark as synced
    await supabaseAdmin
      .from('operational_expenses')
      .update({ synced_to_xero: true, synced_at: new Date().toISOString() })
      .in('id', clientExpenses.map(e => e.id));
  }

  return { success: true, message: `Synced ${expenses.length} expenses` };
}
```

---

### Phase 3 Step 7 📋 (Planned: Webhooks)

**Goals**:
- Implement Xero webhook endpoint
- Verify HMAC signatures
- Handle invoice status updates
- Update project status when invoice is paid

**Endpoint**: `POST /api/webhooks/xero`

**Events to Handle**:
- `INVOICE.UPDATE` - Invoice status changed (Draft → Sent → Paid)
- `INVOICE.CREATE` - New invoice created (external)
- `PAYMENT.CREATE` - Payment received

**Logic**:
```typescript
// src/app/api/webhooks/xero/route.ts
export async function POST(req: NextRequest) {
  const signature = req.headers.get('x-xero-signature');
  const payload = await req.text();

  // Verify HMAC signature
  if (!verifyXeroWebhook(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const events = JSON.parse(payload);

  for (const event of events) {
    if (event.eventType === 'INVOICE.UPDATE') {
      await handleInvoiceUpdate(event);
    }
  }

  return NextResponse.json({ success: true });
}

async function handleInvoiceUpdate(event: any) {
  const invoiceId = event.resourceId;
  const newStatus = event.status;

  if (newStatus === 'PAID') {
    // Find associated project
    const { data: invoice } = await supabaseAdmin
      .from('client_invoices')
      .select('project_id')
      .eq('xero_invoice_id', invoiceId)
      .single();

    if (invoice?.project_id) {
      // Update project status to "Funded"
      await supabaseAdmin
        .from('projects')
        .update({ status: 'funded', funded_at: new Date().toISOString() })
        .eq('id', invoice.project_id);

      // Notify staff via toast/email
      await notifyStaff({
        type: 'invoice_paid',
        projectId: invoice.project_id,
      });
    }
  }
}
```

---

## Data Structures

### InvoiceJobContext

```typescript
export interface InvoiceJobContext {
  organizationId: string;
  workspaceId?: string;
  clientId: string;
  projectId?: string;
  scopeId?: string;
  xeroTenantId: string;    // Which Xero account to use
  currency?: string;        // Default: 'USD'
  dueInDays?: number;      // Default: 30
}
```

### InvoiceResult

```typescript
export interface InvoiceResult {
  success: boolean;
  message: string;
  externalInvoiceId?: string;  // Xero invoice ID
  errorCode?: string;          // For retry logic
}
```

### InvoiceLineItem (Internal)

```typescript
interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitAmount: number;
  accountCode: string;  // Xero account code (e.g., "200" for Sales)
  taxType?: string;     // e.g., "OUTPUT2" for 10% GST
}
```

---

## Integration with Existing Systems

### With Multi-Xero Accounts ✅

**Tenant Selection Logic**:
1. If `xeroTenantId` provided → Use that specific account
2. If not provided → Use primary account (`is_primary = true`)
3. If no primary → Return error (require configuration)

**Example**:
```typescript
const tenantId = context.xeroTenantId || await getPrimaryTenantId(organizationId);
```

---

### With CostTracker ✅

**Expense Tracking**:
- CostTracker already tracks all AI costs in `operational_expenses`
- New field: `synced_to_xero` indicates if expense has been billed to client
- Expense sync job marks `synced_to_xero = true` after processing

---

### With Phase 3A (Client Portal) 📋

**Scope Approval → Invoice Creation**:
1. Client selects package at `/client/proposals`
2. Payment confirmed via Stripe
3. Trigger: `createProjectInvoice()` with scope details
4. Invoice created in Xero as DRAFT or AUTHORISED
5. Xero invoice ID saved to `client_invoices` table

---

## Success Criteria

**You'll know this is working when**:

✅ Invoices auto-created in Xero when client selects a scope package
✅ Invoice line items match scope deliverables exactly
✅ Correct Xero tenant selected (primary or specified)
✅ AI costs tracked in `operational_expenses` in real-time
✅ Daily expense sync runs without errors
✅ Financial Ops dashboard shows accurate P&L
✅ Webhooks update project status when invoice is paid
✅ Can answer: "What's our profit margin for Client X?"
✅ Can answer: "Which clients cost more than they pay?"

---

## Error Handling & Retry Logic

### Invoice Creation Failures

**Common Errors**:
- Token expired → Auto-refresh via XeroService
- Contact not found → Create contact first
- Invalid account code → Validate config
- Rate limit hit → Retry with exponential backoff

**Retry Strategy**:
```typescript
async function createInvoiceWithRetry(
  context: InvoiceJobContext,
  maxRetries = 3
): Promise<InvoiceResult> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await createProjectInvoice(context);
    } catch (error) {
      if (attempt === maxRetries) {
        // Log to error queue for manual review
        await logFailedInvoice(context, error);
        throw error;
      }

      // Exponential backoff
      await sleep(Math.pow(2, attempt) * 1000);
    }
  }
}
```

---

## Next Steps

**Immediate (Step 3)**:
- Implement real Xero API calls
- Test invoice creation with Xero sandbox
- Add retry logic and error handling

**Short-term (Step 5)**:
- Implement expense sync job
- Create Financial Ops dashboard
- Test with real client data

**Medium-term (Step 7)**:
- Implement Xero webhooks
- Auto-update project status
- Add reconciliation logs

---

**Last Updated**: 2025-11-19
**Status**: Design Complete, Ready for Step 3 Implementation
**References**:
- [PHASE3_OVERVIEW_DUAL_TRACK.md](./PHASE3_OVERVIEW_DUAL_TRACK.md)
- [PHASE3A_CLIENT_SCOPE_PIPELINE.md](./PHASE3A_CLIENT_SCOPE_PIPELINE.md)
- [XERO_MULTI_ACCOUNT_GUIDE.md](./XERO_MULTI_ACCOUNT_GUIDE.md)
- [XERO_IMPLEMENTATION_PROGRESS.md](./XERO_IMPLEMENTATION_PROGRESS.md)
