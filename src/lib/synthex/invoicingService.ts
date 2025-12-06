/**
 * Synthex Invoicing Service
 * Handles invoice management, payment methods, and billing events
 * Phase B27: Billing, Invoicing & Subscription Engine
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { getUsage } from './billingService';
import type { UsageMetric } from './billingService';

// =====================================================
// TYPES
// =====================================================

export type InvoiceStatus = 'draft' | 'pending' | 'paid' | 'failed' | 'cancelled';

export interface Invoice {
  invoice_id: string;
  tenant_id: string;
  subscription_id: string | null;
  amount_cents: number;
  currency: string;
  status: InvoiceStatus;
  stripe_invoice_id: string | null;
  stripe_invoice_url: string | null;
  period_start: string; // date
  period_end: string; // date
  due_date: string; // date
  paid_at: string | null;
  line_items: InvoiceLineItem[];
  created_at: string;
  updated_at: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price_cents: number;
  amount_cents: number;
  metadata?: Record<string, any>;
}

export interface PaymentMethod {
  id: string;
  tenant_id: string;
  type: 'card' | 'bank';
  last_four: string;
  brand: string | null;
  is_default: boolean;
  stripe_payment_method_id: string;
  created_at: string;
}

export interface BillingEvent {
  id: string;
  tenant_id: string;
  event_type: string;
  payload: Record<string, any>;
  created_at: string;
}

export interface UpcomingCharges {
  total_cents: number;
  currency: string;
  period_start: string;
  period_end: string;
  line_items: InvoiceLineItem[];
  breakdown: {
    base_subscription: number;
    usage_charges: number;
    overage_charges: number;
  };
}

// =====================================================
// INVOICE MANAGEMENT
// =====================================================

/**
 * List all invoices for a tenant
 */
export async function listInvoices(
  tenantId: string,
  options?: {
    status?: InvoiceStatus;
    limit?: number;
    offset?: number;
  }
): Promise<Invoice[]> {
  let query = supabaseAdmin
    .from('synthex_invoices')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[InvoicingService] Error listing invoices:', error);
    throw new Error(`Failed to list invoices: ${error.message}`);
  }

  return data || [];
}

/**
 * Get a specific invoice
 */
export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_invoices')
    .select('*')
    .eq('invoice_id', invoiceId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[InvoicingService] Error fetching invoice:', error);
    throw new Error(`Failed to fetch invoice: ${error.message}`);
  }

  return data;
}

/**
 * Create an invoice draft
 */
export async function createInvoiceDraft(params: {
  tenantId: string;
  subscriptionId?: string;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  lineItems: InvoiceLineItem[];
  dueDate?: string; // YYYY-MM-DD
}): Promise<Invoice> {
  const { tenantId, subscriptionId, periodStart, periodEnd, lineItems, dueDate } = params;

  // Calculate total
  const amountCents = lineItems.reduce((sum, item) => sum + item.amount_cents, 0);

  // Default due date is 14 days from now
  const defaultDueDate = new Date();
  defaultDueDate.setDate(defaultDueDate.getDate() + 14);
  const dueDateStr = dueDate || defaultDueDate.toISOString().split('T')[0];

  const { data, error } = await supabaseAdmin
    .from('synthex_invoices')
    .insert({
      tenant_id: tenantId,
      subscription_id: subscriptionId || null,
      amount_cents: amountCents,
      currency: 'usd',
      status: 'draft',
      period_start: periodStart,
      period_end: periodEnd,
      due_date: dueDateStr,
      line_items: lineItems,
    })
    .select()
    .single();

  if (error) {
    console.error('[InvoicingService] Error creating invoice draft:', error);
    throw new Error(`Failed to create invoice draft: ${error.message}`);
  }

  // Record billing event
  await recordBillingEvent(tenantId, 'invoice.draft_created', {
    invoice_id: data.invoice_id,
    amount_cents: amountCents,
  });

  return data;
}

/**
 * Finalize an invoice (move from draft to pending)
 */
export async function finalizeInvoice(invoiceId: string): Promise<Invoice> {
  const { data, error } = await supabaseAdmin
    .from('synthex_invoices')
    .update({
      status: 'pending',
    })
    .eq('invoice_id', invoiceId)
    .eq('status', 'draft') // Only finalize drafts
    .select()
    .single();

  if (error) {
    console.error('[InvoicingService] Error finalizing invoice:', error);
    throw new Error(`Failed to finalize invoice: ${error.message}`);
  }

  // Record billing event
  await recordBillingEvent(data.tenant_id, 'invoice.finalized', {
    invoice_id: invoiceId,
  });

  return data;
}

/**
 * Mark invoice as paid
 */
export async function markInvoicePaid(
  invoiceId: string,
  stripeInvoiceId?: string,
  stripeInvoiceUrl?: string
): Promise<Invoice> {
  const updateData: any = {
    status: 'paid',
    paid_at: new Date().toISOString(),
  };

  if (stripeInvoiceId) {
    updateData.stripe_invoice_id = stripeInvoiceId;
  }

  if (stripeInvoiceUrl) {
    updateData.stripe_invoice_url = stripeInvoiceUrl;
  }

  const { data, error } = await supabaseAdmin
    .from('synthex_invoices')
    .update(updateData)
    .eq('invoice_id', invoiceId)
    .select()
    .single();

  if (error) {
    console.error('[InvoicingService] Error marking invoice as paid:', error);
    throw new Error(`Failed to mark invoice as paid: ${error.message}`);
  }

  // Record billing event
  await recordBillingEvent(data.tenant_id, 'invoice.paid', {
    invoice_id: invoiceId,
    amount_cents: data.amount_cents,
    stripe_invoice_id: stripeInvoiceId,
  });

  return data;
}

/**
 * Mark invoice as failed
 */
export async function markInvoiceFailed(invoiceId: string): Promise<Invoice> {
  const { data, error } = await supabaseAdmin
    .from('synthex_invoices')
    .update({
      status: 'failed',
    })
    .eq('invoice_id', invoiceId)
    .select()
    .single();

  if (error) {
    console.error('[InvoicingService] Error marking invoice as failed:', error);
    throw new Error(`Failed to mark invoice as failed: ${error.message}`);
  }

  // Record billing event
  await recordBillingEvent(data.tenant_id, 'invoice.payment_failed', {
    invoice_id: invoiceId,
  });

  return data;
}

/**
 * Cancel an invoice
 */
export async function cancelInvoice(invoiceId: string): Promise<Invoice> {
  const { data, error } = await supabaseAdmin
    .from('synthex_invoices')
    .update({
      status: 'cancelled',
    })
    .eq('invoice_id', invoiceId)
    .select()
    .single();

  if (error) {
    console.error('[InvoicingService] Error cancelling invoice:', error);
    throw new Error(`Failed to cancel invoice: ${error.message}`);
  }

  // Record billing event
  await recordBillingEvent(data.tenant_id, 'invoice.cancelled', {
    invoice_id: invoiceId,
  });

  return data;
}

// =====================================================
// PAYMENT METHODS
// =====================================================

/**
 * List payment methods for a tenant
 */
export async function listPaymentMethods(tenantId: string): Promise<PaymentMethod[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_payment_methods')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[InvoicingService] Error listing payment methods:', error);
    throw new Error(`Failed to list payment methods: ${error.message}`);
  }

  return data || [];
}

/**
 * Add a payment method
 */
export async function addPaymentMethod(params: {
  tenantId: string;
  type: 'card' | 'bank';
  lastFour: string;
  brand?: string;
  stripePaymentMethodId: string;
  isDefault?: boolean;
}): Promise<PaymentMethod> {
  const { tenantId, type, lastFour, brand, stripePaymentMethodId, isDefault } = params;

  const { data, error } = await supabaseAdmin
    .from('synthex_payment_methods')
    .insert({
      tenant_id: tenantId,
      type,
      last_four: lastFour,
      brand: brand || null,
      stripe_payment_method_id: stripePaymentMethodId,
      is_default: isDefault || false,
    })
    .select()
    .single();

  if (error) {
    console.error('[InvoicingService] Error adding payment method:', error);
    throw new Error(`Failed to add payment method: ${error.message}`);
  }

  // Record billing event
  await recordBillingEvent(tenantId, 'payment_method.added', {
    payment_method_id: data.id,
    type,
    last_four: lastFour,
  });

  return data;
}

/**
 * Set default payment method
 */
export async function setDefaultPaymentMethod(
  tenantId: string,
  paymentMethodId: string
): Promise<PaymentMethod> {
  const { data, error } = await supabaseAdmin
    .from('synthex_payment_methods')
    .update({
      is_default: true,
    })
    .eq('tenant_id', tenantId)
    .eq('id', paymentMethodId)
    .select()
    .single();

  if (error) {
    console.error('[InvoicingService] Error setting default payment method:', error);
    throw new Error(`Failed to set default payment method: ${error.message}`);
  }

  // Record billing event
  await recordBillingEvent(tenantId, 'payment_method.default_updated', {
    payment_method_id: paymentMethodId,
  });

  return data;
}

/**
 * Remove a payment method
 */
export async function removePaymentMethod(
  tenantId: string,
  paymentMethodId: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_payment_methods')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('id', paymentMethodId);

  if (error) {
    console.error('[InvoicingService] Error removing payment method:', error);
    throw new Error(`Failed to remove payment method: ${error.message}`);
  }

  // Record billing event
  await recordBillingEvent(tenantId, 'payment_method.removed', {
    payment_method_id: paymentMethodId,
  });
}

// =====================================================
// USAGE-BASED BILLING
// =====================================================

/**
 * Calculate upcoming charges based on current usage
 */
export async function calculateUpcomingCharges(tenantId: string): Promise<UpcomingCharges> {
  // Get current subscription
  const { data: subscription } = await supabaseAdmin
    .from('synthex_subscriptions')
    .select('*, plan:synthex_plans(*)')
    .eq('tenant_id', tenantId)
    .single();

  if (!subscription || !subscription.plan) {
    throw new Error('No active subscription found');
  }

  const plan = subscription.plan;
  const billingPeriod = subscription.billing_period;
  const periodStart = subscription.current_period_start;
  const periodEnd = subscription.current_period_end;

  // Base subscription cost
  const baseSubscriptionCents =
    billingPeriod === 'yearly' ? plan.yearly_price_cents : plan.monthly_price_cents;

  const lineItems: InvoiceLineItem[] = [
    {
      description: `${plan.name} - ${billingPeriod === 'yearly' ? 'Annual' : 'Monthly'} Subscription`,
      quantity: 1,
      unit_price_cents: baseSubscriptionCents,
      amount_cents: baseSubscriptionCents,
      metadata: {
        plan_code: plan.code,
        billing_period: billingPeriod,
      },
    },
  ];

  // Calculate usage-based charges (if any overages)
  const metrics: UsageMetric[] = ['emails_sent', 'contacts', 'ai_calls'];
  let usageChargesCents = 0;
  let overageChargesCents = 0;

  for (const metric of metrics) {
    const currentUsage = await getUsage(tenantId, metric);
    const limit = getMetricLimit(plan.limits, metric);

    // If unlimited or under limit, no overage
    if (limit === -1 || currentUsage <= limit) {
      continue;
    }

    // Calculate overage
    const overage = currentUsage - limit;
    const overageRate = getOverageRate(metric);
    const overageCost = overage * overageRate;

    overageChargesCents += overageCost;

    lineItems.push({
      description: `${getMetricDisplayName(metric)} overage (${overage.toLocaleString()} over limit)`,
      quantity: overage,
      unit_price_cents: overageRate,
      amount_cents: overageCost,
      metadata: {
        metric,
        limit,
        usage: currentUsage,
        overage,
      },
    });
  }

  const totalCents = baseSubscriptionCents + usageChargesCents + overageChargesCents;

  return {
    total_cents: totalCents,
    currency: 'usd',
    period_start: periodStart,
    period_end: periodEnd,
    line_items: lineItems,
    breakdown: {
      base_subscription: baseSubscriptionCents,
      usage_charges: usageChargesCents,
      overage_charges: overageChargesCents,
    },
  };
}

// =====================================================
// BILLING EVENTS
// =====================================================

/**
 * Record a billing event
 */
export async function recordBillingEvent(
  tenantId: string,
  eventType: string,
  payload: Record<string, any>
): Promise<void> {
  const { error } = await supabaseAdmin.from('synthex_billing_events').insert({
    tenant_id: tenantId,
    event_type: eventType,
    payload,
  });

  if (error) {
    console.error('[InvoicingService] Error recording billing event:', error);
    // Don't throw - billing events are non-critical
  }
}

/**
 * Get billing events for a tenant
 */
export async function getBillingEvents(
  tenantId: string,
  options?: {
    eventType?: string;
    limit?: number;
    offset?: number;
  }
): Promise<BillingEvent[]> {
  let query = supabaseAdmin
    .from('synthex_billing_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (options?.eventType) {
    query = query.eq('event_type', options.eventType);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[InvoicingService] Error fetching billing events:', error);
    return [];
  }

  return data || [];
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get metric limit from plan
 */
function getMetricLimit(limits: any, metric: UsageMetric): number {
  switch (metric) {
    case 'emails_sent':
      return limits.max_sends_per_month;
    case 'contacts':
      return limits.max_contacts;
    case 'ai_calls':
      return limits.max_ai_calls;
    case 'campaigns':
      return limits.max_campaigns;
    case 'automations':
      return limits.max_automations;
    case 'team_members':
      return limits.max_team_members;
    default:
      return 0;
  }
}

/**
 * Get overage rate per unit (in cents)
 */
function getOverageRate(metric: UsageMetric): number {
  // Overage pricing (in cents)
  const rates: Record<UsageMetric, number> = {
    emails_sent: 1, // $0.01 per email
    contacts: 10, // $0.10 per contact
    ai_calls: 5, // $0.05 per AI call
    campaigns: 0, // No overage for campaigns
    automations: 0, // No overage for automations
    team_members: 500, // $5.00 per team member
  };

  return rates[metric] || 0;
}

/**
 * Get friendly metric display name
 */
function getMetricDisplayName(metric: UsageMetric): string {
  const names: Record<UsageMetric, string> = {
    emails_sent: 'Emails Sent',
    contacts: 'Contacts',
    ai_calls: 'AI Calls',
    campaigns: 'Campaigns',
    automations: 'Automations',
    team_members: 'Team Members',
  };

  return names[metric] || metric;
}

/**
 * Format cents to dollars
 */
export function formatCurrency(cents: number, currency: string = 'usd'): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(dollars);
}
