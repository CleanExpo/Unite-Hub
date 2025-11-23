/**
 * Xero Unified Bridge
 * Phase 51: Integration with Xero accounting for unified ledger
 */

import { getSupabaseServer } from '@/lib/supabase';
import { upsertMemoryNode } from '@/lib/services/founderMemoryService';

export interface XeroInvoice {
  id: string;
  contact_id: string;
  contact_name: string;
  invoice_number: string;
  status: string;
  date: string;
  due_date: string;
  subtotal: number;
  tax: number;
  total: number;
  amount_due: number;
  amount_paid: number;
  currency: string;
  line_items: any[];
}

export interface XeroContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  is_customer: boolean;
  is_supplier: boolean;
  balance_due: number;
}

// Sync invoices from Xero
export async function syncXeroInvoices(
  founderId: string,
  organizationId: string,
  xeroTenantId: string,
  accessToken: string
): Promise<{ synced: number; errors: number }> {
  const supabase = await getSupabaseServer();

  // Note: In production, this would call Xero API
  // For now, this is a placeholder that shows the structure

  try {
    // Placeholder: Would fetch from Xero API
    // const response = await fetch('https://api.xero.com/api.xro/2.0/Invoices', {
    //   headers: {
    //     'Authorization': `Bearer ${accessToken}`,
    //     'Xero-tenant-id': xeroTenantId,
    //   }
    // });
    // const data = await response.json();

    // For demonstration, return placeholder
    console.log('Xero sync initiated for tenant:', xeroTenantId);

    return { synced: 0, errors: 0 };
  } catch (error) {
    console.error('Error syncing Xero invoices:', error);
    return { synced: 0, errors: 1 };
  }
}

// Process Xero invoice and save to unified ledger
export async function processXeroInvoice(
  founderId: string,
  organizationId: string,
  invoice: XeroInvoice
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const documentType = invoice.amount_paid > 0 ? 'receipt' : 'invoice';

  // Save to financial extractions
  const { error } = await supabase.from('founder_financial_extractions').upsert(
    {
      founder_id: founderId,
      organization_id: organizationId,
      source_type: 'xero',
      xero_id: invoice.id,
      document_type: documentType,
      vendor_name: invoice.contact_name,
      document_number: invoice.invoice_number,
      document_date: invoice.date,
      due_date: invoice.due_date,
      subtotal: invoice.subtotal,
      tax_amount: invoice.tax,
      total_amount: invoice.total,
      currency: invoice.currency,
      line_items: invoice.line_items,
      synced_to_xero: true,
      synced_at: new Date().toISOString(),
    },
    {
      onConflict: 'xero_id',
    }
  );

  if (error) {
    console.error('Error saving Xero invoice:', error);
    return false;
  }

  // Add to memory graph
  await upsertMemoryNode(founderId, organizationId, {
    node_type: 'invoice',
    entity_id: invoice.id,
    title: `Invoice ${invoice.invoice_number} - ${invoice.contact_name}`,
    summary: `$${invoice.total} ${invoice.currency}, ${invoice.status}`,
    context_data: {
      amount: invoice.total,
      due: invoice.due_date,
      status: invoice.status,
      contact: invoice.contact_name,
    },
    importance_score: invoice.amount_due > 0 ? 75 : 50,
  });

  return true;
}

// Get unified financial summary
export async function getUnifiedFinancialSummary(
  founderId: string,
  options: {
    startDate?: string;
    endDate?: string;
    includeXero?: boolean;
  } = {}
): Promise<{
  invoices: { count: number; total: number; outstanding: number };
  receipts: { count: number; total: number };
  netPosition: number;
  bySource: Record<string, number>;
  byMonth: { month: string; invoices: number; receipts: number }[];
}> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('founder_financial_extractions')
    .select('document_type, total_amount, source_type, due_date, created_at')
    .eq('founder_id', founderId);

  if (options.startDate) {
    query = query.gte('document_date', options.startDate);
  }

  if (options.endDate) {
    query = query.lte('document_date', options.endDate);
  }

  const { data } = await query;

  if (!data || data.length === 0) {
    return {
      invoices: { count: 0, total: 0, outstanding: 0 },
      receipts: { count: 0, total: 0 },
      netPosition: 0,
      bySource: {},
      byMonth: [],
    };
  }

  // Calculate summaries
  const invoices = data.filter((d) => d.document_type === 'invoice');
  const receipts = data.filter((d) => d.document_type === 'receipt');

  const invoiceTotal = invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0);
  const receiptTotal = receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);

  // Outstanding (simplified - due date in future)
  const now = new Date();
  const outstanding = invoices
    .filter((i) => i.due_date && new Date(i.due_date) > now)
    .reduce((sum, i) => sum + (i.total_amount || 0), 0);

  // By source
  const bySource: Record<string, number> = {};
  data.forEach((d) => {
    const source = d.source_type || 'manual';
    bySource[source] = (bySource[source] || 0) + (d.total_amount || 0);
  });

  // By month (last 6 months)
  const byMonth: { month: string; invoices: number; receipts: number }[] = [];
  const months = new Map<string, { invoices: number; receipts: number }>();

  data.forEach((d) => {
    const date = new Date(d.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!months.has(monthKey)) {
      months.set(monthKey, { invoices: 0, receipts: 0 });
    }

    const entry = months.get(monthKey)!;
    if (d.document_type === 'invoice') {
      entry.invoices += d.total_amount || 0;
    } else {
      entry.receipts += d.total_amount || 0;
    }
  });

  // Sort and take last 6
  Array.from(months.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-6)
    .forEach(([month, data]) => {
      byMonth.push({ month, ...data });
    });

  return {
    invoices: { count: invoices.length, total: invoiceTotal, outstanding },
    receipts: { count: receipts.length, total: receiptTotal },
    netPosition: invoiceTotal - receiptTotal,
    bySource,
    byMonth,
  };
}

// Get overdue invoices
export async function getOverdueInvoices(founderId: string): Promise<any[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('founder_financial_extractions')
    .select('*')
    .eq('founder_id', founderId)
    .eq('document_type', 'invoice')
    .lt('due_date', new Date().toISOString().split('T')[0])
    .order('due_date', { ascending: true });

  return data || [];
}

// Get upcoming payments
export async function getUpcomingPayments(
  founderId: string,
  days: number = 7
): Promise<any[]> {
  const supabase = await getSupabaseServer();

  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data } = await supabase
    .from('founder_financial_extractions')
    .select('*')
    .eq('founder_id', founderId)
    .eq('document_type', 'invoice')
    .gte('due_date', new Date().toISOString().split('T')[0])
    .lte('due_date', futureDate.toISOString().split('T')[0])
    .order('due_date', { ascending: true });

  return data || [];
}

// Mark document as synced to Xero
export async function markSyncedToXero(
  founderId: string,
  documentId: string,
  xeroId: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('founder_financial_extractions')
    .update({
      xero_id: xeroId,
      synced_to_xero: true,
      synced_at: new Date().toISOString(),
    })
    .eq('id', documentId)
    .eq('founder_id', founderId);

  return !error;
}

// Get documents pending Xero sync
export async function getPendingXeroSync(founderId: string): Promise<any[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('founder_financial_extractions')
    .select('*')
    .eq('founder_id', founderId)
    .eq('synced_to_xero', false)
    .eq('verified', true)
    .order('created_at', { ascending: true });

  return data || [];
}

export default {
  syncXeroInvoices,
  processXeroInvoice,
  getUnifiedFinancialSummary,
  getOverdueInvoices,
  getUpcomingPayments,
  markSyncedToXero,
  getPendingXeroSync,
};
