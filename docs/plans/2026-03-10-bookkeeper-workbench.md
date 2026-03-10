# Bookkeeper Workbench Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-scope bookkeeping workbench at `/founder/bookkeeper` with 8-tab UI, 6 API routes, bi-directional Xero sync, and 12-month rolling data.

**Architecture:** Server component page wrapping a `BookkeeperWorkbench` client component with lazy-loaded tabs. Each tab fetches data from new API routes under `/api/bookkeeper/`. Reconciliation and approval POST routes write back to both Supabase and Xero.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase (bookkeeper_runs + bookkeeper_transactions tables), Xero API client (`src/lib/integrations/xero/client.ts`), Framer Motion, recharts (new dep for P&L charts), Tailwind CSS.

**Design doc:** `docs/plans/2026-03-10-bookkeeper-workbench-design.md`

---

## Task 1: Install recharts + add shared types

**Files:**
- Modify: `package.json` (root)
- Create: `src/lib/bookkeeper/types.ts`

**Step 1: Install recharts**

```bash
pnpm add recharts
```

**Step 2: Create shared bookkeeper UI types**

Create `src/lib/bookkeeper/types.ts`:

```typescript
// src/lib/bookkeeper/types.ts
// Shared types for the Bookkeeper Workbench UI + API routes.

import type { BusinessKey } from '@/lib/businesses'

// ── Overview ─────────────────────────────────────────────────────────────────

export interface BookkeeperOverview {
  lastRun: {
    id: string
    status: 'running' | 'completed' | 'partial' | 'failed'
    startedAt: string
    completedAt: string | null
    totalTransactions: number
    autoReconciled: number
    flaggedForReview: number
    failedCount: number
    gstCollectedCents: number
    gstPaidCents: number
    netGstCents: number
  } | null
  totals: {
    pendingReconciliation: number
    pendingApproval: number
    totalTransactions12m: number
    totalDeductibleCents: number
  }
  alertCount: number
}

// ── Transactions ────────────────────────────────────────────────────────────

export interface BookkeeperTransaction {
  id: string
  runId: string
  businessKey: BusinessKey
  xeroTransactionId: string
  transactionDate: string
  description: string | null
  amountCents: number
  reconciliationStatus: 'auto_matched' | 'suggested_match' | 'unmatched' | 'manual_review' | 'reconciled'
  confidenceScore: number
  matchedInvoiceId: string | null
  matchedBillId: string | null
  taxCode: string | null
  gstAmountCents: number
  taxCategory: string | null
  isDeductible: boolean
  deductionCategory: string | null
  deductionNotes: string | null
  approvedAt: string | null
  createdAt: string
}

export interface TransactionsResponse {
  transactions: BookkeeperTransaction[]
  total: number
  page: number
  pageSize: number
}

export interface TransactionFilters {
  business?: BusinessKey
  status?: BookkeeperTransaction['reconciliationStatus']
  from?: string
  to?: string
  page?: number
  pageSize?: number
}

// ── BAS ─────────────────────────────────────────────────────────────────────

export interface BASQuarterSummary {
  label: string
  startDate: string
  endDate: string
  label1A_totalSalesCents: number
  label1B_gstOnSalesCents: number
  label7_totalPurchasesCents: number
  label9_gstOnPurchasesCents: number
  label11_gstPayableCents: number
  transactionCount: number
}

export interface BASResponse {
  quarters: BASQuarterSummary[]
}

// ── Run History ─────────────────────────────────────────────────────────────

export interface BookkeeperRun {
  id: string
  status: 'running' | 'completed' | 'partial' | 'failed'
  startedAt: string
  completedAt: string | null
  businessesProcessed: Array<{
    businessKey: string
    businessName: string
    status: 'success' | 'skipped' | 'error'
    error?: string
    transactionCount: number
    autoReconciled: number
    flaggedForReview: number
  }>
  totalTransactions: number
  autoReconciled: number
  flaggedForReview: number
  failedCount: number
  gstCollectedCents: number
  gstPaidCents: number
  netGstCents: number
  errorLog: Array<{ businessKey: string; error: string }> | null
}

export interface RunsResponse {
  runs: BookkeeperRun[]
  total: number
  page: number
  pageSize: number
}
```

**Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml src/lib/bookkeeper/types.ts
git commit -m "feat(bookkeeper): add recharts dep + shared UI types"
```

---

## Task 2: API route — GET /api/bookkeeper/runs

**Files:**
- Create: `src/app/api/bookkeeper/runs/route.ts`

**Step 1: Create the route**

```typescript
// src/app/api/bookkeeper/runs/route.ts
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import type { RunsResponse, BookkeeperRun } from '@/lib/bookkeeper/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)))

  const supabase = await createClient()

  // Count total
  const { count } = await supabase
    .from('bookkeeper_runs')
    .select('id', { count: 'exact', head: true })
    .eq('founder_id', user.id)

  // Fetch page
  const { data, error } = await supabase
    .from('bookkeeper_runs')
    .select('*')
    .eq('founder_id', user.id)
    .order('started_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const runs: BookkeeperRun[] = (data ?? []).map((r) => ({
    id: r.id,
    status: r.status,
    startedAt: r.started_at,
    completedAt: r.completed_at,
    businessesProcessed: r.businesses_processed ?? [],
    totalTransactions: r.total_transactions,
    autoReconciled: r.auto_reconciled,
    flaggedForReview: r.flagged_for_review,
    failedCount: r.failed_count,
    gstCollectedCents: r.gst_collected_cents,
    gstPaidCents: r.gst_paid_cents,
    netGstCents: r.net_gst_cents,
    errorLog: r.error_log,
  }))

  const response: RunsResponse = { runs, total: count ?? 0, page, pageSize }
  return NextResponse.json(response)
}
```

**Step 2: Commit**

```bash
git add src/app/api/bookkeeper/runs/route.ts
git commit -m "feat(bookkeeper): add GET /api/bookkeeper/runs endpoint"
```

---

## Task 3: API route — GET /api/bookkeeper/transactions

**Files:**
- Create: `src/app/api/bookkeeper/transactions/route.ts`

**Step 1: Create the route**

```typescript
// src/app/api/bookkeeper/transactions/route.ts
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import type { TransactionsResponse, BookkeeperTransaction } from '@/lib/bookkeeper/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '50', 10)))
  const business = searchParams.get('business')
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const supabase = await createClient()

  // Build query
  let query = supabase
    .from('bookkeeper_transactions')
    .select('*', { count: 'exact' })
    .eq('founder_id', user.id)

  if (business) query = query.eq('business_key', business)
  if (status) query = query.eq('reconciliation_status', status)
  if (from) query = query.gte('transaction_date', from)
  if (to) query = query.lte('transaction_date', to)

  // Default: last 12 months
  if (!from) {
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    query = query.gte('transaction_date', twelveMonthsAgo.toISOString().slice(0, 10))
  }

  query = query
    .order('transaction_date', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const transactions: BookkeeperTransaction[] = (data ?? []).map((t) => ({
    id: t.id,
    runId: t.run_id,
    businessKey: t.business_key,
    xeroTransactionId: t.xero_transaction_id,
    transactionDate: t.transaction_date,
    description: t.description,
    amountCents: t.amount_cents,
    reconciliationStatus: t.reconciliation_status,
    confidenceScore: parseFloat(t.confidence_score),
    matchedInvoiceId: t.matched_invoice_id,
    matchedBillId: t.matched_bill_id,
    taxCode: t.tax_code,
    gstAmountCents: t.gst_amount_cents,
    taxCategory: t.tax_category,
    isDeductible: t.is_deductible,
    deductionCategory: t.deduction_category,
    deductionNotes: t.deduction_notes,
    approvedAt: t.approved_at,
    createdAt: t.created_at,
  }))

  const response: TransactionsResponse = { transactions, total: count ?? 0, page, pageSize }
  return NextResponse.json(response)
}
```

**Step 2: Commit**

```bash
git add src/app/api/bookkeeper/transactions/route.ts
git commit -m "feat(bookkeeper): add GET /api/bookkeeper/transactions endpoint"
```

---

## Task 4: API route — POST /api/bookkeeper/transactions/[id]/reconcile

**Files:**
- Create: `src/app/api/bookkeeper/transactions/[id]/reconcile/route.ts`

**Step 1: Create the route**

This is the bi-directional sync route: updates Supabase AND writes back to Xero via `reconcileTransaction()`.

```typescript
// src/app/api/bookkeeper/transactions/[id]/reconcile/route.ts
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { reconcileTransaction } from '@/lib/integrations/xero/client'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const body = await request.json() as { invoiceId?: string }

  const supabase = await createClient()

  // Fetch the transaction to get business_key and xero_transaction_id
  const { data: txn, error: fetchError } = await supabase
    .from('bookkeeper_transactions')
    .select('business_key, xero_transaction_id, xero_tenant_id')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (fetchError || !txn) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  try {
    // Write back to Xero
    await reconcileTransaction(
      user.id,
      txn.business_key,
      txn.xero_transaction_id,
      body.invoiceId
    )

    // Update Supabase record
    const { error: updateError } = await supabase
      .from('bookkeeper_transactions')
      .update({
        reconciliation_status: 'reconciled',
        matched_invoice_id: body.invoiceId ?? null,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('founder_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reconciliation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/bookkeeper/transactions/\[id\]/reconcile/route.ts
git commit -m "feat(bookkeeper): add POST /api/bookkeeper/transactions/[id]/reconcile with Xero write-back"
```

---

## Task 5: API route — POST /api/bookkeeper/transactions/[id]/approve

**Files:**
- Create: `src/app/api/bookkeeper/transactions/[id]/approve/route.ts`

**Step 1: Create the route**

```typescript
// src/app/api/bookkeeper/transactions/[id]/approve/route.ts
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from('bookkeeper_transactions')
    .update({
      reconciliation_status: 'reconciled',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('founder_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
```

**Step 2: Commit**

```bash
git add src/app/api/bookkeeper/transactions/\[id\]/approve/route.ts
git commit -m "feat(bookkeeper): add POST /api/bookkeeper/transactions/[id]/approve endpoint"
```

---

## Task 6: API route — GET /api/bookkeeper/overview

**Files:**
- Create: `src/app/api/bookkeeper/overview/route.ts`

**Step 1: Create the route**

```typescript
// src/app/api/bookkeeper/overview/route.ts
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import type { BookkeeperOverview } from '@/lib/bookkeeper/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()

  // Last run
  const { data: lastRunData } = await supabase
    .from('bookkeeper_runs')
    .select('*')
    .eq('founder_id', user.id)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // 12-month window
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  const cutoff = twelveMonthsAgo.toISOString().slice(0, 10)

  // Pending reconciliation count
  const { count: pendingReconciliation } = await supabase
    .from('bookkeeper_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('founder_id', user.id)
    .in('reconciliation_status', ['unmatched', 'suggested_match'])
    .gte('transaction_date', cutoff)

  // Pending approval count
  const { count: pendingApproval } = await supabase
    .from('bookkeeper_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('founder_id', user.id)
    .eq('reconciliation_status', 'manual_review')
    .gte('transaction_date', cutoff)

  // Total transactions 12m
  const { count: totalTransactions12m } = await supabase
    .from('bookkeeper_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('founder_id', user.id)
    .gte('transaction_date', cutoff)

  // Total deductible amount
  const { data: deductibleData } = await supabase
    .from('bookkeeper_transactions')
    .select('amount_cents')
    .eq('founder_id', user.id)
    .eq('is_deductible', true)
    .gte('transaction_date', cutoff)

  const totalDeductibleCents = (deductibleData ?? []).reduce(
    (sum, r) => sum + Math.abs(Number(r.amount_cents)),
    0
  )

  // Alert count = flagged items from latest run
  const alertCount = lastRunData?.flagged_for_review ?? 0

  const overview: BookkeeperOverview = {
    lastRun: lastRunData ? {
      id: lastRunData.id,
      status: lastRunData.status,
      startedAt: lastRunData.started_at,
      completedAt: lastRunData.completed_at,
      totalTransactions: lastRunData.total_transactions,
      autoReconciled: lastRunData.auto_reconciled,
      flaggedForReview: lastRunData.flagged_for_review,
      failedCount: lastRunData.failed_count,
      gstCollectedCents: lastRunData.gst_collected_cents,
      gstPaidCents: lastRunData.gst_paid_cents,
      netGstCents: lastRunData.net_gst_cents,
    } : null,
    totals: {
      pendingReconciliation: pendingReconciliation ?? 0,
      pendingApproval: pendingApproval ?? 0,
      totalTransactions12m: totalTransactions12m ?? 0,
      totalDeductibleCents,
    },
    alertCount,
  }

  return NextResponse.json(overview)
}
```

**Step 2: Commit**

```bash
git add src/app/api/bookkeeper/overview/route.ts
git commit -m "feat(bookkeeper): add GET /api/bookkeeper/overview endpoint"
```

---

## Task 7: API route — GET /api/bookkeeper/bas

**Files:**
- Create: `src/app/api/bookkeeper/bas/route.ts`

**Step 1: Create the route**

This route aggregates transaction data into BAS quarterly summaries by re-using the existing `calculateBAS` and `generateBASPeriods` functions.

```typescript
// src/app/api/bookkeeper/bas/route.ts
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { generateBASPeriods } from '@/lib/bookkeeper/bas-calculator'
import type { BASResponse, BASQuarterSummary } from '@/lib/bookkeeper/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()

  // Generate last 4 complete quarters
  const now = new Date()
  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  const periods = generateBASPeriods(twelveMonthsAgo, now)

  const quarters: BASQuarterSummary[] = []

  for (const period of periods) {
    const startDate = period.startDate.toISOString().slice(0, 10)
    const endDate = period.endDate.toISOString().slice(0, 10)

    // Aggregate from bookkeeper_transactions directly
    const { data: txns } = await supabase
      .from('bookkeeper_transactions')
      .select('amount_cents, gst_amount_cents, tax_code')
      .eq('founder_id', user.id)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)

    let label1A = 0, label1B = 0, label7 = 0, label9 = 0
    const items = txns ?? []

    for (const t of items) {
      const absAmount = Math.abs(Number(t.amount_cents))
      const gst = Math.abs(Number(t.gst_amount_cents))

      switch (t.tax_code) {
        case 'OUTPUT':
          label1A += absAmount
          label1B += gst
          break
        case 'EXEMPTOUTPUT':
        case 'EXEMPTEXPORT':
          label1A += absAmount
          break
        case 'INPUT':
        case 'GSTONIMPORTS':
          label7 += absAmount
          label9 += gst
          break
        case 'EXEMPTINPUT':
        case 'INPUTTAXED':
          label7 += absAmount
          break
      }
    }

    quarters.push({
      label: period.label,
      startDate,
      endDate,
      label1A_totalSalesCents: label1A,
      label1B_gstOnSalesCents: label1B,
      label7_totalPurchasesCents: label7,
      label9_gstOnPurchasesCents: label9,
      label11_gstPayableCents: label1B - label9,
      transactionCount: items.length,
    })
  }

  const response: BASResponse = { quarters }
  return NextResponse.json(response)
}
```

**Step 2: Commit**

```bash
git add src/app/api/bookkeeper/bas/route.ts
git commit -m "feat(bookkeeper): add GET /api/bookkeeper/bas endpoint"
```

---

## Task 8: Shared components — StatusBadge, BASLabel, BusinessFilter, DateRangeFilter

**Files:**
- Create: `src/components/founder/bookkeeper/shared/StatusBadge.tsx`
- Create: `src/components/founder/bookkeeper/shared/BASLabel.tsx`
- Create: `src/components/founder/bookkeeper/shared/BusinessFilter.tsx`
- Create: `src/components/founder/bookkeeper/shared/DateRangeFilter.tsx`
- Create: `src/components/founder/bookkeeper/shared/formatters.ts`

**Step 1: Create formatters utility**

`src/components/founder/bookkeeper/shared/formatters.ts` — shared AUD formatting:

```typescript
export function formatAUD(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
```

**Step 2: Create StatusBadge**

`src/components/founder/bookkeeper/shared/StatusBadge.tsx`:

```tsx
'use client'

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  auto_matched:    { label: 'Auto',       color: '#00F5FF', bg: 'rgba(0,245,255,0.08)', border: 'rgba(0,245,255,0.2)' },
  suggested_match: { label: 'Suggested',  color: '#eab308', bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)' },
  unmatched:       { label: 'Unmatched',  color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  manual_review:   { label: 'Review',     color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' },
  reconciled:      { label: 'Reconciled', color: '#00F5FF', bg: 'rgba(0,245,255,0.12)', border: 'rgba(0,245,255,0.3)' },
}

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, color: '#555', bg: 'rgba(85,85,85,0.08)', border: 'rgba(85,85,85,0.2)' }
  return (
    <span
      className="text-[10px] font-medium tracking-widest uppercase px-2 py-0.5 rounded-sm"
      style={{ color: config.color, backgroundColor: config.bg, border: `1px solid ${config.border}` }}
    >
      {config.label}
    </span>
  )
}
```

**Step 3: Create BASLabel**

`src/components/founder/bookkeeper/shared/BASLabel.tsx`:

```tsx
'use client'

import { formatAUD } from './formatters'

const LABEL_DESCRIPTIONS: Record<string, string> = {
  '1A': 'Total sales',
  '1B': 'GST on sales',
  '7':  'Total purchases',
  '9':  'GST on purchases',
  '11': 'GST payable',
}

export function BASLabel({ label, amountCents }: { label: string; amountCents: number }) {
  const isPayable = label === '11'
  const isRefund = isPayable && amountCents < 0
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span className="text-[11px] font-mono text-white/40 w-6">{label}</span>
        <span className="text-[12px] text-white/60">{LABEL_DESCRIPTIONS[label] ?? label}</span>
      </div>
      <span
        className="text-[13px] font-medium tabular-nums"
        style={{ color: isRefund ? 'var(--color-success)' : isPayable ? 'var(--color-danger)' : 'var(--color-text-primary)' }}
      >
        {formatAUD(Math.abs(amountCents))}
        {isRefund && <span className="text-[10px] ml-1 text-white/40">refund</span>}
      </span>
    </div>
  )
}
```

**Step 4: Create BusinessFilter**

`src/components/founder/bookkeeper/shared/BusinessFilter.tsx`:

```tsx
'use client'

import { BUSINESSES, type BusinessKey } from '@/lib/businesses'

// Businesses that connect to Xero
const XERO_BUSINESSES = BUSINESSES.filter(b =>
  ['dr', 'dr_qld', 'carsi', 'nrpg', 'ccw'].includes(b.key)
)

interface BusinessFilterProps {
  value: BusinessKey | 'all'
  onChange: (value: BusinessKey | 'all') => void
}

export function BusinessFilter({ value, onChange }: BusinessFilterProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as BusinessKey | 'all')}
      className="text-[12px] bg-transparent border rounded-sm px-2 py-1.5 appearance-none cursor-pointer focus:outline-none focus:border-[#00F5FF]/40"
      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
    >
      <option value="all">All businesses</option>
      {XERO_BUSINESSES.map(b => (
        <option key={b.key} value={b.key}>{b.name}</option>
      ))}
    </select>
  )
}
```

**Step 5: Create DateRangeFilter**

`src/components/founder/bookkeeper/shared/DateRangeFilter.tsx`:

```tsx
'use client'

interface DateRangeFilterProps {
  from: string
  to: string
  onChange: (from: string, to: string) => void
}

export function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={from}
        onChange={(e) => onChange(e.target.value, to)}
        className="text-[12px] bg-transparent border rounded-sm px-2 py-1.5 focus:outline-none focus:border-[#00F5FF]/40"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', colorScheme: 'dark' }}
      />
      <span className="text-[11px] text-white/30">to</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onChange(from, e.target.value)}
        className="text-[12px] bg-transparent border rounded-sm px-2 py-1.5 focus:outline-none focus:border-[#00F5FF]/40"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)', colorScheme: 'dark' }}
      />
    </div>
  )
}
```

**Step 6: Commit**

```bash
git add src/components/founder/bookkeeper/shared/
git commit -m "feat(bookkeeper): add shared components — StatusBadge, BASLabel, BusinessFilter, DateRangeFilter, formatters"
```

---

## Task 9: Tab components — OverviewTab + RunHistoryTab

**Files:**
- Create: `src/components/founder/bookkeeper/tabs/OverviewTab.tsx`
- Create: `src/components/founder/bookkeeper/tabs/RunHistoryTab.tsx`

**Step 1: Create OverviewTab**

`src/components/founder/bookkeeper/tabs/OverviewTab.tsx` — fetches from `/api/bookkeeper/overview`, displays KPI cards for last run status, pending reconciliation, pending approval, total deductibles, GST position, and alerts.

Key points:
- 6 KPI metric cards in a 3x2 grid
- Last run status card with elapsed time
- Colour coding: cyan for healthy, amber for warnings, red for failures
- Uses `motion.div` with `whileHover={{ y: -1 }}` on cards
- Falls back to "No runs yet" empty state

**Step 2: Create RunHistoryTab**

`src/components/founder/bookkeeper/tabs/RunHistoryTab.tsx` — fetches from `/api/bookkeeper/runs`, shows a table of runs with expandable rows showing per-business breakdown.

Key points:
- Paginated table (20 per page)
- Status badge per run (completed/partial/failed)
- Expand row to see per-business results from `businesses_processed` JSONB
- Error log display for failed businesses

**Step 3: Commit**

```bash
git add src/components/founder/bookkeeper/tabs/OverviewTab.tsx src/components/founder/bookkeeper/tabs/RunHistoryTab.tsx
git commit -m "feat(bookkeeper): add OverviewTab + RunHistoryTab components"
```

---

## Task 10: Tab components — ReconciliationTab

**Files:**
- Create: `src/components/founder/bookkeeper/tabs/ReconciliationTab.tsx`

**Step 1: Create ReconciliationTab**

The most complex tab. Fetches from `/api/bookkeeper/transactions` with status filters.

Key points:
- BusinessFilter + DateRangeFilter + status filter (unmatched/suggested/all)
- Transaction table with: date, description, amount, status badge, confidence, actions
- "Reconcile" button on unmatched/suggested rows → POST to `/transactions/[id]/reconcile`
- "Approve" button on manual_review rows → POST to `/transactions/[id]/approve`
- Bulk select with "Approve All" action
- Optimistic UI: update row status immediately, roll back on error
- Framer Motion `layout` prop on rows for smooth reorder on status change

**Step 2: Commit**

```bash
git add src/components/founder/bookkeeper/tabs/ReconciliationTab.tsx
git commit -m "feat(bookkeeper): add ReconciliationTab with bulk actions + Xero write-back"
```

---

## Task 11: Tab components — ReceivablesTab + PayablesTab

**Files:**
- Create: `src/components/founder/bookkeeper/tabs/ReceivablesTab.tsx`
- Create: `src/components/founder/bookkeeper/tabs/PayablesTab.tsx`

**Step 1: Create ReceivablesTab**

Fetches directly from `/api/xero/invoices?type=ACCREC` (new thin wrapper needed around `fetchInvoices`).

Key points:
- OR: fetch from bookkeeper_transactions where matched_invoice_id is set
- Shows outstanding invoices: contact, amount, amount due, due date, status
- Overdue highlighting (red for past due date)
- Sorted by due date ascending

**Step 2: Create PayablesTab**

Same pattern as Receivables but for `type=ACCPAY` (bills to pay).

**Step 3: Create thin Xero invoice API route**

Create `src/app/api/xero/invoices/route.ts`:

```typescript
// src/app/api/xero/invoices/route.ts
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { fetchInvoices, isXeroConfigured } from '@/lib/integrations/xero'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!isXeroConfigured()) return NextResponse.json({ error: 'Xero not configured' }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const business = searchParams.get('business') ?? 'dr'
  const type = searchParams.get('type') as 'ACCREC' | 'ACCPAY' | undefined

  try {
    const result = await fetchInvoices(user.id, business, { type })
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}
```

**Step 4: Commit**

```bash
git add src/components/founder/bookkeeper/tabs/ReceivablesTab.tsx src/components/founder/bookkeeper/tabs/PayablesTab.tsx src/app/api/xero/invoices/route.ts
git commit -m "feat(bookkeeper): add ReceivablesTab + PayablesTab + Xero invoices API"
```

---

## Task 12: Tab components — ExpensesTab

**Files:**
- Create: `src/components/founder/bookkeeper/tabs/ExpensesTab.tsx`

**Step 1: Create ExpensesTab**

Fetches from `/api/bookkeeper/transactions?deductible=true` (add `deductible` filter param to existing transactions route).

Key points:
- Filter by deduction category (from `deduction-optimiser.ts` categories)
- Shows: date, description, amount, deduction category, notes, tax code
- Summary card at top: total deductible amount, breakdown by category
- ATO S.328-180 instant asset write-off callout for qualifying items

**Step 2: Add `deductible` filter to transactions route**

Modify `src/app/api/bookkeeper/transactions/route.ts` to accept `deductible=true` query param:

```typescript
// Add after the existing status filter:
const deductible = searchParams.get('deductible')
if (deductible === 'true') query = query.eq('is_deductible', true)
```

**Step 3: Commit**

```bash
git add src/components/founder/bookkeeper/tabs/ExpensesTab.tsx src/app/api/bookkeeper/transactions/route.ts
git commit -m "feat(bookkeeper): add ExpensesTab + deductible filter on transactions API"
```

---

## Task 13: Tab components — BASTab

**Files:**
- Create: `src/components/founder/bookkeeper/tabs/BASTab.tsx`

**Step 1: Create BASTab**

Fetches from `/api/bookkeeper/bas`.

Key points:
- Grid of quarterly cards (max 4 visible, last 4 quarters)
- Each card: period label, BASLabel components for 1A/1B/7/9/11
- "Due" badge on upcoming lodgement quarter
- Click quarter → expand to show contributing transactions (fetch from transactions API filtered by date range)
- Current quarter highlighted with cyan border
- Framer Motion `AnimatePresence` for expand/collapse

**Step 2: Commit**

```bash
git add src/components/founder/bookkeeper/tabs/BASTab.tsx
git commit -m "feat(bookkeeper): add BASTab with quarterly GST breakdown"
```

---

## Task 14: Tab components — PLTab (P&L)

**Files:**
- Create: `src/components/founder/bookkeeper/tabs/PLTab.tsx`

**Step 1: Create PLTab**

Fetches from bookkeeper_transactions, aggregated by month.

Key points:
- BusinessFilter (single or "All")
- recharts `BarChart` with 12 monthly bars
- Two bar series: revenue (cyan) and expenses (red/amber)
- Summary row below chart: total revenue, total expenses, net profit, GST position
- `ResponsiveContainer` from recharts for fluid width
- Custom tooltip styled to Scientific Luxury theme
- Dark theme colours: `fill="#00F5FF"` for revenue, `fill="#ef4444"` for expenses

**Step 2: Commit**

```bash
git add src/components/founder/bookkeeper/tabs/PLTab.tsx
git commit -m "feat(bookkeeper): add PLTab with recharts bar chart"
```

---

## Task 15: Main container — BookkeeperWorkbench + page route

**Files:**
- Create: `src/components/founder/bookkeeper/BookkeeperWorkbench.tsx`
- Create: `src/app/(founder)/founder/bookkeeper/page.tsx`

**Step 1: Create BookkeeperWorkbench**

`src/components/founder/bookkeeper/BookkeeperWorkbench.tsx`:

Key points:
- Tab bar with 8 tabs, horizontal scroll on mobile
- Active tab: cyan underline with glow `box-shadow: 0 0 4px #00F5FF`
- Lazy rendering: only mount the active tab component
- Framer Motion `AnimatePresence` with fade transition between tabs
- Tab state stored in URL search params (`?tab=reconciliation`) for shareability
- `useSearchParams()` + `useRouter()` for tab navigation

**Step 2: Create page route**

`src/app/(founder)/founder/bookkeeper/page.tsx`:

```typescript
export const dynamic = 'force-dynamic'

import { BookkeeperWorkbench } from '@/components/founder/bookkeeper/BookkeeperWorkbench'

export default function BookkeeperPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          Bookkeeper
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-disabled)' }}>
          Reconciliation · BAS · P&L · Expenses · Xero sync
        </p>
      </div>
      <BookkeeperWorkbench />
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/founder/bookkeeper/BookkeeperWorkbench.tsx src/app/\(founder\)/founder/bookkeeper/page.tsx
git commit -m "feat(bookkeeper): add BookkeeperWorkbench container + page route"
```

---

## Task 16: Add sidebar navigation entry

**Files:**
- Modify: `src/components/layout/SidebarNav.tsx` (add bookkeeper link)

**Step 1: Add bookkeeper to sidebar**

Add a nav item for `/founder/bookkeeper` with a ledger/book icon. Place it after Dashboard and before Xero in the nav order.

**Step 2: Commit**

```bash
git add src/components/layout/SidebarNav.tsx
git commit -m "feat(bookkeeper): add sidebar navigation entry"
```

---

## Task 17: Type-check + lint

**Step 1: Run type-check**

```bash
pnpm run type-check
```

Fix any TypeScript errors.

**Step 2: Run lint**

```bash
pnpm run lint
```

Fix any lint errors.

**Step 3: Commit fixes if any**

```bash
git add -A
git commit -m "fix(bookkeeper): resolve type-check + lint errors"
```

---

## Task 18: Visual verification + final commit

**Step 1: Start dev server**

```bash
pnpm dev
```

**Step 2: Navigate to /founder/bookkeeper**

Verify:
- Page loads without errors
- Tab bar renders with all 8 tabs
- Overview tab shows empty state (no run data yet)
- Tabs switch correctly
- Console has no errors

**Step 3: Final commit if needed**

```bash
git add -A
git commit -m "feat(bookkeeper): complete workbench UI — all tabs + API routes"
```

---

## Execution Order Summary

| Task | What | Depends On |
|------|------|-----------|
| 1 | Types + recharts dep | — |
| 2 | API: runs | 1 |
| 3 | API: transactions | 1 |
| 4 | API: reconcile (POST) | 1 |
| 5 | API: approve (POST) | 1 |
| 6 | API: overview | 1 |
| 7 | API: BAS | 1 |
| 8 | Shared components | 1 |
| 9 | OverviewTab + RunHistoryTab | 6, 2, 8 |
| 10 | ReconciliationTab | 3, 4, 5, 8 |
| 11 | ReceivablesTab + PayablesTab | 8 |
| 12 | ExpensesTab | 3, 8 |
| 13 | BASTab | 7, 8 |
| 14 | PLTab | 3, 8 |
| 15 | Workbench + page | 9-14 |
| 16 | Sidebar nav | 15 |
| 17 | Type-check + lint | all |
| 18 | Visual verification | 17 |

**Parallelisable groups:**
- Tasks 2-7 (all API routes) can run in parallel
- Tasks 8 (shared) can run alongside API routes
- Tasks 9-14 (tab components) can run in parallel after their API deps
- Tasks 15-18 must be sequential
