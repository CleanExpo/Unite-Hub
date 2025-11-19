/**
 * Reports Service - Phase 3 Step 9
 *
 * Wraps query methods for financial dashboards
 * Provides simplified interface for React components to fetch reports
 */

import type {
  FinancialSummary,
  ProjectFinancials,
  ClientBilling,
  AICostBreakdown,
} from '@/lib/reports/financialReportEngine';
import type { ProfitAndLossStatement, ClientPnL } from '@/lib/reports/pnlGenerator';

// ============================================================================
// STAFF REPORTS SERVICE
// ============================================================================

/**
 * Fetch organization financial summary
 */
export async function fetchFinancialSummary(
  organizationId: string,
  startDate?: string,
  endDate?: string,
  token?: string
): Promise<{ success: boolean; data?: FinancialSummary; error?: string }> {
  try {
    const params = new URLSearchParams({ organizationId, type: 'summary' });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/reports/financial?${params.toString()}`, { headers });
    const result = await response.json();

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch organization P&L statement
 */
export async function fetchOrganizationPnL(
  organizationId: string,
  startDate?: string,
  endDate?: string,
  includePrevious = false,
  token?: string
): Promise<{ success: boolean; data?: ProfitAndLossStatement; error?: string }> {
  try {
    const params = new URLSearchParams({ organizationId, type: 'pnl' });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    if (includePrevious) params.append('includePrevious', 'true');

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/reports/financial?${params.toString()}`, { headers });
    const result = await response.json();

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch project financials
 */
export async function fetchProjectFinancials(
  organizationId: string,
  projectId?: string,
  token?: string
): Promise<{ success: boolean; data?: ProjectFinancials[]; error?: string }> {
  try {
    const params = new URLSearchParams({ organizationId, type: 'projects' });
    if (projectId) params.append('projectId', projectId);

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/reports/financial?${params.toString()}`, { headers });
    const result = await response.json();

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch AI cost breakdown
 */
export async function fetchAICostBreakdown(
  organizationId: string,
  startDate?: string,
  endDate?: string,
  token?: string
): Promise<{ success: boolean; data?: AICostBreakdown[]; error?: string }> {
  try {
    const params = new URLSearchParams({ organizationId, type: 'ai_costs' });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/reports/financial?${params.toString()}`, { headers });
    const result = await response.json();

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch monthly comparison
 */
export async function fetchMonthlyComparison(
  organizationId: string,
  months = 6,
  token?: string
): Promise<{ success: boolean; data?: ProfitAndLossStatement[]; error?: string }> {
  try {
    const params = new URLSearchParams({
      organizationId,
      type: 'monthly',
      months: months.toString(),
    });

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/reports/financial?${params.toString()}`, { headers });
    const result = await response.json();

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Refresh financial reports (materialized views)
 */
export async function refreshReports(
  organizationId: string,
  token?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch('/api/reports/financial/refresh', {
      method: 'POST',
      headers,
      body: JSON.stringify({ organizationId }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// CLIENT REPORTS SERVICE
// ============================================================================

/**
 * Fetch client billing summary
 */
export async function fetchClientBilling(
  contactId: string,
  token?: string
): Promise<{ success: boolean; data?: ClientBilling; error?: string }> {
  try {
    const params = new URLSearchParams({ contactId, type: 'billing' });

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/reports/client?${params.toString()}`, { headers });
    const result = await response.json();

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch client P&L
 */
export async function fetchClientPnL(
  contactId: string,
  startDate?: string,
  endDate?: string,
  token?: string
): Promise<{ success: boolean; data?: ClientPnL; error?: string }> {
  try {
    const params = new URLSearchParams({ contactId, type: 'pnl' });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/reports/client?${params.toString()}`, { headers });
    const result = await response.json();

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch client hours breakdown
 */
export async function fetchClientHours(
  contactId: string,
  startDate?: string,
  endDate?: string,
  token?: string
): Promise<{
  success: boolean;
  data?: { entries: any[]; summary: any };
  error?: string;
}> {
  try {
    const params = new URLSearchParams({ contactId, type: 'hours' });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/reports/client?${params.toString()}`, { headers });
    const result = await response.json();

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch client payment history
 */
export async function fetchClientPayments(
  contactId: string,
  startDate?: string,
  endDate?: string,
  token?: string
): Promise<{
  success: boolean;
  data?: { payments: any[]; summary: any };
  error?: string;
}> {
  try {
    const params = new URLSearchParams({ contactId, type: 'payments' });
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`/api/reports/client?${params.toString()}`, { headers });
    const result = await response.json();

    return result;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
