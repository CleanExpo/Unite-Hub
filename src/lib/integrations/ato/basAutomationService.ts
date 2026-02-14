/**
 * BAS Lodgement Automation Service
 *
 * Automates Business Activity Statement (BAS) lodgement:
 * - Calculates BAS periods (quarterly/monthly)
 * - Aggregates transaction data
 * - Calculates GST (G1, G11, net GST)
 * - Auto-generates BAS submissions
 * - Schedules lodgements
 *
 * Related to: UNI-177 [ATO] BAS Lodgement Automation
 */

import { createClient } from '@/lib/supabase/server';
import { createATOClient, BASData, BASPeriod } from './ato-client';
// GST calculation is handled inline - financialTrackingEngine was moved to Synthex app

export interface BASPeriodConfig {
  type: 'quarterly' | 'monthly';
  year: number;
  quarter?: number; // 1-4 for quarterly
  month?: number; // 1-12 for monthly
}

export interface TransactionSummary {
  totalSales: number;
  totalPurchases: number;
  gstOnSales: number; // G1
  gstOnPurchases: number; // G11
  netGst: number; // 1A = G1 - G11
  paygWithheld: number; // W1
  paygInstallment: number; // W2
  transactionCount: number;
}

export interface BASCalculationResult {
  period: BASPeriod;
  summary: TransactionSummary;
  basData: BASData;
  isDraft: boolean;
}

/**
 * Calculate BAS period dates
 */
export function calculatePeriodDates(config: BASPeriodConfig): {
  startDate: Date;
  endDate: Date;
  dueDate: Date;
} {
  const { year, type, quarter, month } = config;

  if (type === 'quarterly' && quarter) {
    // Quarterly BAS periods
    const quarterStartMonth = (quarter - 1) * 3; // 0, 3, 6, 9
    const startDate = new Date(year, quarterStartMonth, 1);
    const endDate = new Date(year, quarterStartMonth + 3, 0); // Last day of quarter

    // BAS due date: 28 days after quarter end
    const dueDate = new Date(endDate);
    dueDate.setDate(dueDate.getDate() + 28);

    return { startDate, endDate, dueDate };
  }

  if (type === 'monthly' && month) {
    // Monthly BAS periods
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month

    // Monthly BAS due date: 21 days after month end
    const dueDate = new Date(endDate);
    dueDate.setDate(dueDate.getDate() + 21);

    return { startDate, endDate, dueDate };
  }

  throw new Error('Invalid BAS period configuration');
}

/**
 * Get current BAS period
 */
export function getCurrentBASPeriod(type: 'quarterly' | 'monthly'): BASPeriodConfig {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-12

  if (type === 'quarterly') {
    const quarter = Math.ceil(month / 3); // 1-4
    return { type: 'quarterly', year, quarter };
  }

  return { type: 'monthly', year, month };
}

/**
 * Get previous BAS period
 */
export function getPreviousBASPeriod(type: 'quarterly' | 'monthly'): BASPeriodConfig {
  const current = getCurrentBASPeriod(type);

  if (type === 'quarterly') {
    if (current.quarter === 1) {
      return { type: 'quarterly', year: current.year - 1, quarter: 4 };
    }
    return { type: 'quarterly', year: current.year, quarter: current.quarter! - 1 };
  }

  if (current.month === 1) {
    return { type: 'monthly', year: current.year - 1, month: 12 };
  }
  return { type: 'monthly', year: current.year, month: current.month! - 1 };
}

/**
 * Aggregate transactions for BAS period
 * Calculates GST from transaction data
 */
export async function aggregateTransactionsForPeriod(
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<TransactionSummary> {
  const supabase = await createClient();

  // Fetch all transactions in period
  const { data: transactions } = await supabase
    .from('synthex_transactions')
    .select('*')
    .eq('tenant_id', workspaceId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  if (!transactions || transactions.length === 0) {
    return {
      totalSales: 0,
      totalPurchases: 0,
      gstOnSales: 0,
      gstOnPurchases: 0,
      netGst: 0,
      paygWithheld: 0,
      paygInstallment: 0,
      transactionCount: 0,
    };
  }

  let totalSales = 0;
  let totalPurchases = 0;

  for (const txn of transactions) {
    // Sales = subscription charges, job charges
    if (['subscription_charge', 'job_charge'].includes(txn.transaction_type)) {
      totalSales += txn.amount;
    }

    // Purchases = refunds, credits (treated as expenses for GST purposes)
    if (['refund', 'credit'].includes(txn.transaction_type)) {
      totalPurchases += txn.amount;
    }
  }

  // Calculate GST (amounts are in cents, GST is 10%)
  const gstOnSales = Math.round(totalSales * 0.1); // G1
  const gstOnPurchases = Math.round(totalPurchases * 0.1); // G11
  const netGst = gstOnSales - gstOnPurchases; // 1A

  return {
    totalSales,
    totalPurchases,
    gstOnSales,
    gstOnPurchases,
    netGst,
    paygWithheld: 0, // TODO: Calculate from payroll data when available
    paygInstallment: 0, // TODO: Calculate from business income
    transactionCount: transactions.length,
  };
}

/**
 * Calculate BAS for a period
 */
export async function calculateBAS(
  workspaceId: string,
  abn: string,
  businessName: string,
  config: BASPeriodConfig
): Promise<BASCalculationResult> {
  const { startDate, endDate, dueDate } = calculatePeriodDates(config);

  // Aggregate transaction data
  const summary = await aggregateTransactionsForPeriod(workspaceId, startDate, endDate);

  // Build BAS period structure
  const period: BASPeriod = {
    year: config.year,
    quarter: config.quarter,
    month: config.month,
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };

  // Build BAS data
  const basData: BASData = {
    period,
    abn,
    businessName,
    gstOnSales: summary.gstOnSales,
    gstOnPurchases: summary.gstOnPurchases,
    netGst: summary.netGst,
    paygWithheld: summary.paygWithheld,
    paygInstallment: summary.paygInstallment,
    totalAmount: summary.netGst + summary.paygWithheld + summary.paygInstallment,
    dueDate: dueDate.toISOString().split('T')[0],
  };

  return {
    period,
    summary,
    basData,
    isDraft: true,
  };
}

/**
 * Auto-submit BAS to ATO
 */
export async function autoSubmitBAS(
  workspaceId: string,
  abn: string,
  businessName: string,
  config: BASPeriodConfig
): Promise<{
  success: boolean;
  submissionReference?: string;
  receiptId?: string;
  lodgedAt?: string;
  error?: string;
}> {
  try {
    // Calculate BAS
    const calculation = await calculateBAS(workspaceId, abn, businessName, config);

    // Initialize ATO client
    const atoClient = createATOClient();
    await atoClient.initialize(workspaceId);

    // Submit to ATO
    const result = await atoClient.lodgeBAS(calculation.basData);

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error('BAS auto-submit error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if BAS is due for a period
 */
export async function isBASOverdue(
  workspaceId: string,
  config: BASPeriodConfig
): Promise<boolean> {
  const { dueDate } = calculatePeriodDates(config);
  const now = new Date();

  if (now <= dueDate) {
    return false; // Not due yet
  }

  // Check if already lodged
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from('bas_lodgements')
    .select('status')
    .eq('workspace_id', workspaceId)
    .eq('period_year', config.year)
    .eq('period_quarter', config.quarter || null)
    .eq('period_month', config.month || null)
    .in('status', ['submitted', 'acknowledged', 'assessed'])
    .single();

  return !existing; // Overdue if not lodged
}

/**
 * Get all overdue BAS periods for a workspace
 */
export async function getOverdueBASPeriods(
  workspaceId: string,
  type: 'quarterly' | 'monthly'
): Promise<BASPeriodConfig[]> {
  const overdue: BASPeriodConfig[] = [];
  const now = new Date();
  const currentYear = now.getFullYear();

  // Check last 2 years of periods
  for (let year = currentYear - 2; year <= currentYear; year++) {
    if (type === 'quarterly') {
      for (let quarter = 1; quarter <= 4; quarter++) {
        const config: BASPeriodConfig = { type: 'quarterly', year, quarter };
        const isOverdue = await isBASOverdue(workspaceId, config);
        if (isOverdue) {
          overdue.push(config);
        }
      }
    } else {
      for (let month = 1; month <= 12; month++) {
        const config: BASPeriodConfig = { type: 'monthly', year, month };
        const isOverdue = await isBASOverdue(workspaceId, config);
        if (isOverdue) {
          overdue.push(config);
        }
      }
    }
  }

  return overdue;
}

/**
 * Schedule BAS lodgement reminder
 * Returns number of days until due date
 */
export function getDaysUntilDue(config: BASPeriodConfig): number {
  const { dueDate } = calculatePeriodDates(config);
  const now = new Date();
  const diffMs = dueDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format BAS period for display
 */
export function formatBASPeriod(config: BASPeriodConfig): string {
  if (config.type === 'quarterly') {
    return `Q${config.quarter} ${config.year}`;
  }
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${monthNames[config.month! - 1]} ${config.year}`;
}
