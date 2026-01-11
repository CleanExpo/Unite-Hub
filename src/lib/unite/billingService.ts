/**
 * Billing Service
 * Phase: D66 - Billing & Invoicing Integration Layer
 */

import { supabaseAdmin } from '@/lib/supabase';

// ============================================================================
// BILLING PROVIDERS
// ============================================================================

export interface BillingProvider {
  id: string;
  key: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function createProvider(
  input: Omit<BillingProvider, 'id' | 'created_at' | 'updated_at'>
): Promise<BillingProvider> {
  const { data, error } = await supabaseAdmin
    .from('unite_billing_providers')
    .insert(input)
    .select()
    .single();
  if (error) throw new Error(`Failed to create provider: ${error.message}`);
  return data as BillingProvider;
}

export async function listProviders(filters?: {
  type?: string;
  is_active?: boolean;
}): Promise<BillingProvider[]> {
  let query = supabaseAdmin.from('unite_billing_providers').select('*').order('name');

  if (filters?.type) query = query.eq('type', filters.type);
  if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list providers: ${error.message}`);
  return data as BillingProvider[];
}

export async function getProviderByKey(key: string): Promise<BillingProvider | null> {
  const { data, error } = await supabaseAdmin
    .from('unite_billing_providers')
    .select('*')
    .eq('key', key)
    .single();

  if (error && error.code !== 'PGRST116')
    throw new Error(`Failed to get provider: ${error.message}`);
  return data as BillingProvider | null;
}

// ============================================================================
// INVOICES
// ============================================================================

export interface Invoice {
  id: string;
  tenant_id: string;
  billing_provider_id?: string;
  external_invoice_id?: string;
  number?: string;
  status: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  issue_date?: string;
  due_date?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  paid_at?: string;
  canceled_at?: string;
}

export async function createInvoice(
  tenantId: string,
  input: Omit<Invoice, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>
): Promise<Invoice> {
  const { data, error } = await supabaseAdmin
    .from('unite_invoices')
    .insert({ tenant_id: tenantId, ...input })
    .select()
    .single();
  if (error) throw new Error(`Failed to create invoice: ${error.message}`);
  return data as Invoice;
}

export async function listInvoices(
  tenantId: string,
  filters?: {
    status?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }
): Promise<Invoice[]> {
  let query = supabaseAdmin
    .from('unite_invoices')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('issue_date', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.start_date) query = query.gte('issue_date', filters.start_date);
  if (filters?.end_date) query = query.lte('issue_date', filters.end_date);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list invoices: ${error.message}`);
  return data as Invoice[];
}

export async function updateInvoice(invoiceId: string, updates: Partial<Invoice>): Promise<Invoice> {
  const { data, error } = await supabaseAdmin
    .from('unite_invoices')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', invoiceId)
    .select()
    .single();
  if (error) throw new Error(`Failed to update invoice: ${error.message}`);
  return data as Invoice;
}

export async function markInvoicePaid(invoiceId: string): Promise<Invoice> {
  return updateInvoice(invoiceId, {
    status: 'paid',
    paid_at: new Date().toISOString(),
  });
}

// ============================================================================
// INVOICE LINE ITEMS
// ============================================================================

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  metadata?: Record<string, unknown>;
}

export async function addLineItem(
  invoiceId: string,
  input: Omit<InvoiceLineItem, 'id' | 'invoice_id'>
): Promise<InvoiceLineItem> {
  const { data, error } = await supabaseAdmin
    .from('unite_invoice_line_items')
    .insert({ invoice_id: invoiceId, ...input })
    .select()
    .single();
  if (error) throw new Error(`Failed to add line item: ${error.message}`);
  return data as InvoiceLineItem;
}

export async function getLineItems(invoiceId: string): Promise<InvoiceLineItem[]> {
  const { data, error } = await supabaseAdmin
    .from('unite_invoice_line_items')
    .select('*')
    .eq('invoice_id', invoiceId);

  if (error) throw new Error(`Failed to get line items: ${error.message}`);
  return data as InvoiceLineItem[];
}

// ============================================================================
// PAYMENT EVENTS
// ============================================================================

export interface PaymentEvent {
  id: string;
  tenant_id: string;
  invoice_id?: string;
  billing_provider_id?: string;
  external_event_id?: string;
  event_type: string;
  amount?: number;
  currency?: string;
  metadata?: Record<string, unknown>;
  occurred_at: string;
  ingested_at: string;
}

export async function logPaymentEvent(
  tenantId: string,
  input: Omit<PaymentEvent, 'id' | 'tenant_id' | 'ingested_at'>
): Promise<PaymentEvent> {
  const { data, error } = await supabaseAdmin
    .from('unite_payment_events')
    .insert({ tenant_id: tenantId, ...input })
    .select()
    .single();
  if (error) throw new Error(`Failed to log payment event: ${error.message}`);
  return data as PaymentEvent;
}

export async function listPaymentEvents(
  tenantId: string,
  filters?: {
    event_type?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }
): Promise<PaymentEvent[]> {
  let query = supabaseAdmin
    .from('unite_payment_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('occurred_at', { ascending: false });

  if (filters?.event_type) query = query.eq('event_type', filters.event_type);
  if (filters?.start_date) query = query.gte('occurred_at', filters.start_date);
  if (filters?.end_date) query = query.lte('occurred_at', filters.end_date);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to list payment events: ${error.message}`);
  return data as PaymentEvent[];
}

// ============================================================================
// STRIPE INTEGRATION (EXAMPLE)
// ============================================================================

/**
 * Sync invoice from Stripe
 * Note: This is a generic abstraction - actual Stripe SDK calls would go here
 */
export async function syncFromStripe(
  tenantId: string,
  externalInvoiceId: string
): Promise<Invoice> {
  // In production, this would:
  // 1. Call Stripe API to fetch invoice
  // 2. Map Stripe invoice to our schema
  // 3. Create/update invoice + line items
  // 4. Log sync event

  // Placeholder implementation
  throw new Error('Stripe sync not yet implemented - configure STRIPE_SECRET_KEY');
}

/**
 * Handle Stripe webhook
 */
export async function handleStripeWebhook(
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  // In production, this would:
  // 1. Verify webhook signature
  // 2. Parse event type
  // 3. Update invoice/payment status
  // 4. Log event

  console.log(`[Stripe Webhook] ${eventType}`, payload);
  throw new Error('Stripe webhook handler not yet implemented');
}
