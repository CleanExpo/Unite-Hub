# Bookkeeper Workbench — Design Document

**Date:** 10/03/2026
**Status:** Approved
**Route:** `/founder/bookkeeper`
**Linear:** UNI-1553 (Bookkeeper CRON) + UNI-1512 (Xero)

---

## Summary

Full-scope bookkeeping workbench for the Unite-Group founder dashboard. Single-page with tabbed navigation covering bank reconciliation, AR/AP, expense classification, BAS preparation, P&L reporting, and nightly run monitoring. Bi-directional Xero sync writes reconciliation status back to Xero. Rolling 12-month historical depth.

## Architecture

**Pattern:** Single-page tabbed navigation (lazy-loaded tabs)
**Page:** Server component wrapper → `BookkeeperWorkbench` client component
**Data:** Supabase (`bookkeeper_runs`, `bookkeeper_transactions`) + Xero API (live queries for AR/AP/P&L)

### Tabs

| Tab | Purpose | Data Source |
|-----|---------|-------------|
| Overview | KPIs + run health + alerts | `bookkeeper_runs` + aggregated txns |
| Reconciliation | Match bank feeds ↔ invoices | `bookkeeper_transactions` + Xero bank txns |
| Receivables | Outstanding/overdue invoices | Xero invoices (type=ACCREC) |
| Payables | Bills to pay | Xero invoices (type=ACCPAY) |
| Expenses | ATO deduction classification | `bookkeeper_transactions` where `is_deductible` |
| BAS | Quarterly GST prep (1A/1B/7/9/11) | BAS calculator output + `bookkeeper_runs` |
| P&L | Revenue vs expenses by business/period | Xero P&L report API |
| Run History | Nightly CRON logs | `bookkeeper_runs` |

## API Routes

Six new routes under `/api/bookkeeper/`:

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/bookkeeper/overview` | GET | Aggregated KPIs across businesses |
| `/api/bookkeeper/transactions` | GET | Paginated transactions with filters (status, business, date range) |
| `/api/bookkeeper/transactions/[id]/reconcile` | POST | Manual reconciliation → writes back to Xero |
| `/api/bookkeeper/transactions/[id]/approve` | POST | Approve flagged item |
| `/api/bookkeeper/bas` | GET | BAS summary by quarter |
| `/api/bookkeeper/runs` | GET | Run history with pagination |

Existing Xero client functions (`fetchInvoices`, `fetchBankTransactions`, `fetchAccounts`) serve Receivables/Payables/P&L tabs via thin API wrappers.

**Bi-directional sync:** `reconcileTransaction()` in `xero/client.ts` exists but is unwired. The `/transactions/[id]/reconcile` POST endpoint calls it to write status back to Xero.

## Component Architecture

```
src/components/founder/bookkeeper/
├── BookkeeperWorkbench.tsx    # Main container + tab state
├── tabs/
│   ├── OverviewTab.tsx        # KPI cards + run status + alerts
│   ├── ReconciliationTab.tsx  # Transaction matching table
│   ├── ReceivablesTab.tsx     # Outstanding invoices
│   ├── PayablesTab.tsx        # Bills to pay
│   ├── ExpensesTab.tsx        # Deduction classification
│   ├── BASTab.tsx             # Quarterly GST breakdown
│   ├── PLTab.tsx              # P&L charts
│   └── RunHistoryTab.tsx      # CRON run logs
├── shared/
│   ├── TransactionRow.tsx     # Reusable row with match/approve actions
│   ├── BusinessFilter.tsx     # Dropdown filter by business
│   ├── DateRangeFilter.tsx    # 12-month rolling selector
│   ├── StatusBadge.tsx        # auto_matched/suggested/unmatched/reconciled
│   └── BASLabel.tsx           # Formatted BAS label (1A, 1B, 7, 9, 11)
```

## UI Design

Scientific Luxury design tokens (consistent with existing pages):

- **Background:** `var(--surface-card)` on `#050505`
- **Borders:** `var(--color-border)` / `rgba(255,255,255,0.08)`
- **Active tab:** Cyan `#00F5FF` underline with `box-shadow: 0 0 4px #00F5FF`
- **Status badges:** Cyan = reconciled, amber = suggested, red = unmatched, grey = pending
- **Tables:** Minimal — no zebra striping, `border-b border-white/[0.04]` row separators
- **Hover:** `whileHover={{ y: -1 }}` on cards, `bg-white/[0.03]` on table rows
- **Animations:** Framer Motion `AnimatePresence` for tab transitions, `layout` prop on filter changes
- **Corners:** `rounded-sm` only

### Reconciliation Interaction

- Each unmatched transaction shows suggested matches ranked by confidence score
- Click to accept match → POST reconcile → writes to Xero → cyan "Reconciled" badge
- Bulk actions: select multiple → approve all / reconcile all

### BAS Tab

- Quarterly cards (Q1 Jul-Sep, Q2 Oct-Dec, Q3 Jan-Mar, Q4 Apr-Jun)
- Each card shows Labels 1A, 1B, 7, 9, 11 with calculated amounts
- "Due" indicator for upcoming BAS lodgement dates
- Drill-down: click a label to see contributing transactions

### P&L Tab

- Business selector (single or "All")
- Bar chart: monthly revenue vs expenses (12-month rolling)
- Summary: total revenue, total expenses, net profit, GST position
- Chart library: recharts or inline SVG

## Data Flow

```
Xero API ──(nightly CRON)──→ bookkeeper_transactions (Supabase)
                                    ↓
                            API routes (GET)
                                    ↓
                          BookkeeperWorkbench (client)
                                    ↓
                            User action (reconcile/approve)
                                    ↓
                            API route (POST)
                                    ↓
                     ┌──────────────┴──────────────┐
                     ↓                              ↓
            bookkeeper_transactions         Xero API (write-back)
            (update status)                 (reconcileTransaction)
```

## 12-Month Rolling Window

- Default view: last 12 months from today
- Date range filter allows narrowing (e.g., single quarter for BAS)
- Query filter: `transaction_date >= NOW() - INTERVAL '12 months'`
- BAS tab always shows last 4 complete quarters regardless of filter

## Out of Scope (YAGNI)

- No PDF export of BAS (use Xero native export)
- No bank feed connection management (existing `/founder/xero` page)
- No payroll
- No journal entries (Xero handles natively)
- No multi-currency (all AUD, single-tenant)

## Dependencies

### Existing (ready to use)

- `src/lib/integrations/xero/client.ts` — Full Xero API client (10 functions)
- `src/lib/integrations/xero/types.ts` — All TypeScript interfaces
- `src/lib/bookkeeper/orchestrator.ts` — Nightly pipeline
- `src/lib/bookkeeper/reconciliation.ts` — 3-pass matching engine
- `src/lib/bookkeeper/bas-calculator.ts` — BAS Labels 1A/1B/7/9/11
- `src/lib/bookkeeper/deduction-optimiser.ts` — ATO deduction categories
- `src/lib/bookkeeper/au-tax-codes.ts` — 8 AU tax codes
- `supabase/migrations/20260310000000_bookkeeper_tables.sql` — DB schema
- `src/lib/businesses.ts` — Business config (single source of truth)

### New (to build)

- 6 API routes
- 1 page component
- 8 tab components
- 5 shared components
- recharts dependency (if chosen for P&L charts)
