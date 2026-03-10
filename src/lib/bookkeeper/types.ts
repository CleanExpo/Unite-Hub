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
