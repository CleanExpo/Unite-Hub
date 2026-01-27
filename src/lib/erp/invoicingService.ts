/**
 * ERP Invoicing Service
 *
 * Handles invoice generation, calculations, and payment tracking:
 * - Invoice number generation (INV-YYYY-NNN)
 * - Line item calculations with tax
 * - Payment recording and status updates
 * - Overdue invoice detection
 *
 * Related to: UNI-173 [CCW-ERP/CRM] Invoicing & Financial Module
 */

import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Types
// ============================================================================

export type CustomerType = 'individual' | 'company';
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'cheque' | 'paypal' | 'stripe' | 'other';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Customer {
  id: string;
  workspace_id: string;
  customer_type: CustomerType;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  abn?: string;
  email?: string;
  phone?: string;
  billing_address_line1?: string;
  billing_city?: string;
  billing_state?: string;
  billing_postcode?: string;
  payment_terms_days: number;
  current_balance: number;
  gst_registered: boolean;
  is_active: boolean;
}

export interface InvoiceLineItem {
  line_number: number;
  description: string;
  quantity: number;
  unit_price: number; // Cents
  discount_percent?: number;
  product_code?: string;
}

export interface Invoice {
  id: string;
  workspace_id: string;
  customer_id: string;
  invoice_number: string;
  invoice_date: Date;
  due_date: Date;
  subtotal: number; // Cents
  tax_amount: number; // Cents
  discount_amount: number; // Cents
  total_amount: number; // Cents
  status: InvoiceStatus;
  amount_paid: number; // Cents
  amount_due: number; // Cents
  payment_terms_days: number;
  tax_rate: number; // e.g., 0.1 for 10%
}

export interface Payment {
  id: string;
  workspace_id: string;
  invoice_id: string;
  customer_id: string;
  payment_date: Date;
  amount: number; // Cents
  payment_method: PaymentMethod;
  reference?: string;
  status: PaymentStatus;
}

export interface CreateInvoiceInput {
  workspace_id: string;
  customer_id: string;
  invoice_date?: Date;
  reference?: string;
  line_items: InvoiceLineItem[];
  notes?: string;
  terms_and_conditions?: string;
  payment_terms_days?: number; // Override customer default
}

export interface RecordPaymentInput {
  workspace_id: string;
  invoice_id: string;
  payment_date: Date;
  amount: number; // Dollars
  payment_method: PaymentMethod;
  reference?: string;
  notes?: string;
}

// ============================================================================
// Constants
// ============================================================================

export const GST_RATE = 0.10; // 10% Australian GST
export const DEFAULT_PAYMENT_TERMS = 30; // Net 30 days
export const INVOICE_PREFIX = 'INV';

// ============================================================================
// Invoice Number Generation
// ============================================================================

/**
 * Generate next invoice number for workspace
 * Format: INV-YYYY-NNN (e.g., INV-2026-001)
 */
export async function generateInvoiceNumber(workspaceId: string): Promise<string> {
  const supabase = await createClient();
  const year = new Date().getFullYear();

  // Get or create sequence for this year
  const { data: sequence, error: seqError } = await supabase
    .from('erp_invoice_sequences')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('prefix', INVOICE_PREFIX)
    .eq('year', year)
    .single();

  let nextNumber: number;

  if (!sequence) {
    // Create new sequence for this year
    nextNumber = 1;
    await supabase
      .from('erp_invoice_sequences')
      .insert({
        workspace_id: workspaceId,
        prefix: INVOICE_PREFIX,
        year,
        last_number: 1,
      });
  } else {
    // Increment existing sequence
    nextNumber = sequence.last_number + 1;
    await supabase
      .from('erp_invoice_sequences')
      .update({ last_number: nextNumber })
      .eq('id', sequence.id);
  }

  // Format: INV-2026-001
  const paddedNumber = String(nextNumber).padStart(3, '0');
  return `${INVOICE_PREFIX}-${year}-${paddedNumber}`;
}

// ============================================================================
// Line Item Calculations
// ============================================================================

/**
 * Calculate line item totals
 * Returns all amounts in cents
 */
export function calculateLineItem(
  quantity: number,
  unitPrice: number, // Cents
  discountPercent: number = 0,
  taxRate: number = GST_RATE
): {
  line_subtotal: number;
  line_discount: number;
  line_tax: number;
  line_total: number;
} {
  // Subtotal = quantity * unit price
  const line_subtotal = Math.round(quantity * unitPrice);

  // Discount = subtotal * discount%
  const line_discount = Math.round(line_subtotal * (discountPercent / 100));

  // Taxable amount = subtotal - discount
  const taxable_amount = line_subtotal - line_discount;

  // Tax = taxable * tax rate
  const line_tax = Math.round(taxable_amount * taxRate);

  // Total = taxable + tax
  const line_total = taxable_amount + line_tax;

  return {
    line_subtotal,
    line_discount,
    line_tax,
    line_total,
  };
}

/**
 * Calculate invoice totals from line items
 */
export function calculateInvoiceTotals(
  lineItems: Array<{
    quantity: number;
    unit_price: number;
    discount_percent?: number;
  }>,
  taxRate: number = GST_RATE
): {
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
} {
  let subtotal = 0;
  let tax_amount = 0;
  let discount_amount = 0;

  for (const item of lineItems) {
    const calculated = calculateLineItem(
      item.quantity,
      item.unit_price,
      item.discount_percent || 0,
      taxRate
    );

    subtotal += calculated.line_subtotal;
    discount_amount += calculated.line_discount;
    tax_amount += calculated.line_tax;
  }

  const total_amount = subtotal - discount_amount + tax_amount;

  return {
    subtotal,
    tax_amount,
    discount_amount,
    total_amount,
  };
}

// ============================================================================
// Database Operations
// ============================================================================

/**
 * Get customer by ID
 */
export async function getCustomer(
  workspaceId: string,
  customerId: string
): Promise<Customer | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('erp_customers')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', customerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw new Error(`Failed to get customer: ${error.message}`);
  }

  return data as Customer;
}

/**
 * List all customers
 */
export async function listCustomers(
  workspaceId: string,
  activeOnly: boolean = true
): Promise<Customer[]> {
  const supabase = await createClient();

  let query = supabase
    .from('erp_customers')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('company_name', { ascending: true });

  if (error) throw new Error(`Failed to list customers: ${error.message}`);
  return (data as Customer[]) || [];
}

/**
 * Create customer
 */
export async function createCustomer(
  workspaceId: string,
  customer: Omit<Customer, 'id' | 'workspace_id' | 'current_balance' | 'is_active' | 'created_at' | 'updated_at'>
): Promise<Customer> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('erp_customers')
    .insert({
      workspace_id: workspaceId,
      ...customer,
      current_balance: 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create customer: ${error.message}`);
  return data as Customer;
}

/**
 * Create invoice with line items
 */
export async function createInvoice(input: CreateInvoiceInput): Promise<{
  invoice: Invoice;
  line_items: any[];
}> {
  const supabase = await createClient();

  // Get customer
  const customer = await getCustomer(input.workspace_id, input.customer_id);
  if (!customer) {
    throw new Error('Customer not found');
  }

  // Generate invoice number
  const invoice_number = await generateInvoiceNumber(input.workspace_id);

  // Calculate totals
  const totals = calculateInvoiceTotals(
    input.line_items.map(item => ({
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent || 0,
    }))
  );

  // Determine payment terms
  const payment_terms_days = input.payment_terms_days || customer.payment_terms_days;

  // Calculate due date
  const invoice_date = input.invoice_date || new Date();
  const due_date = new Date(invoice_date);
  due_date.setDate(due_date.getDate() + payment_terms_days);

  // Create invoice
  const { data: invoice, error: invoiceError } = await supabase
    .from('erp_invoices')
    .insert({
      workspace_id: input.workspace_id,
      customer_id: input.customer_id,
      invoice_number,
      reference: input.reference,
      invoice_date: invoice_date.toISOString().split('T')[0],
      due_date: due_date.toISOString().split('T')[0],
      subtotal: totals.subtotal,
      tax_amount: totals.tax_amount,
      discount_amount: totals.discount_amount,
      total_amount: totals.total_amount,
      status: 'draft',
      amount_paid: 0,
      amount_due: totals.total_amount,
      payment_terms_days,
      payment_terms_text: `Net ${payment_terms_days}`,
      tax_rate: GST_RATE,
      notes: input.notes,
      terms_and_conditions: input.terms_and_conditions,
    })
    .select()
    .single();

  if (invoiceError) throw new Error(`Failed to create invoice: ${invoiceError.message}`);

  // Create line items
  const lineItemsToInsert = input.line_items.map((item, index) => {
    const calculated = calculateLineItem(
      item.quantity,
      item.unit_price,
      item.discount_percent || 0
    );

    return {
      invoice_id: invoice.id,
      line_number: index + 1,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_percent: item.discount_percent || 0,
      product_code: item.product_code,
      ...calculated,
    };
  });

  const { data: line_items, error: lineError } = await supabase
    .from('erp_invoice_line_items')
    .insert(lineItemsToInsert)
    .select();

  if (lineError) throw new Error(`Failed to create line items: ${lineError.message}`);

  return {
    invoice: invoice as Invoice,
    line_items: line_items || [],
  };
}

/**
 * Get invoice by ID with line items
 */
export async function getInvoice(
  workspaceId: string,
  invoiceId: string
): Promise<{ invoice: Invoice; line_items: any[] } | null> {
  const supabase = await createClient();

  const { data: invoice, error: invoiceError } = await supabase
    .from('erp_invoices')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', invoiceId)
    .single();

  if (invoiceError) {
    if (invoiceError.code === 'PGRST116') return null;
    throw new Error(`Failed to get invoice: ${invoiceError.message}`);
  }

  const { data: line_items, error: itemsError } = await supabase
    .from('erp_invoice_line_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('line_number', { ascending: true });

  if (itemsError) throw new Error(`Failed to get line items: ${itemsError.message}`);

  return {
    invoice: invoice as Invoice,
    line_items: line_items || [],
  };
}

/**
 * List invoices with filters
 */
export async function listInvoices(
  workspaceId: string,
  filters?: {
    customer_id?: string;
    status?: InvoiceStatus;
    from_date?: Date;
    to_date?: Date;
  }
): Promise<Invoice[]> {
  const supabase = await createClient();

  let query = supabase
    .from('erp_invoices')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (filters?.customer_id) {
    query = query.eq('customer_id', filters.customer_id);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.from_date) {
    query = query.gte('invoice_date', filters.from_date.toISOString().split('T')[0]);
  }

  if (filters?.to_date) {
    query = query.lte('invoice_date', filters.to_date.toISOString().split('T')[0]);
  }

  const { data, error } = await query.order('invoice_date', { ascending: false });

  if (error) throw new Error(`Failed to list invoices: ${error.message}`);
  return (data as Invoice[]) || [];
}

/**
 * Record payment against invoice
 */
export async function recordPayment(input: RecordPaymentInput): Promise<Payment> {
  const supabase = await createClient();

  // Get invoice
  const invoiceData = await getInvoice(input.workspace_id, input.invoice_id);
  if (!invoiceData) {
    throw new Error('Invoice not found');
  }

  const { invoice } = invoiceData;
  const amountCents = Math.round(input.amount * 100);

  // Validate payment amount
  if (amountCents > invoice.amount_due) {
    throw new Error('Payment amount exceeds outstanding balance');
  }

  // Create payment record
  const { data: payment, error: paymentError } = await supabase
    .from('erp_invoice_payments')
    .insert({
      workspace_id: input.workspace_id,
      invoice_id: input.invoice_id,
      customer_id: invoice.customer_id,
      payment_date: input.payment_date.toISOString().split('T')[0],
      amount: amountCents,
      payment_method: input.payment_method,
      reference: input.reference,
      notes: input.notes,
      status: 'completed',
    })
    .select()
    .single();

  if (paymentError) throw new Error(`Failed to record payment: ${paymentError.message}`);

  // Update invoice
  const newAmountPaid = invoice.amount_paid + amountCents;
  const newAmountDue = invoice.total_amount - newAmountPaid;
  const newStatus: InvoiceStatus = newAmountDue === 0 ? 'paid' : 'partially_paid';
  const paidDate = newAmountDue === 0 ? input.payment_date.toISOString().split('T')[0] : null;

  await supabase
    .from('erp_invoices')
    .update({
      amount_paid: newAmountPaid,
      amount_due: newAmountDue,
      status: newStatus,
      paid_date: paidDate,
    })
    .eq('id', input.invoice_id);

  // Update customer balance
  const { data: customer } = await supabase
    .from('erp_customers')
    .select('current_balance')
    .eq('id', invoice.customer_id)
    .single();

  if (customer) {
    await supabase
      .from('erp_customers')
      .update({
        current_balance: customer.current_balance - amountCents,
      })
      .eq('id', invoice.customer_id);
  }

  return payment as Payment;
}

/**
 * Mark invoice as sent
 */
export async function markInvoiceSent(
  workspaceId: string,
  invoiceId: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('erp_invoices')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      sent_by: userId,
    })
    .eq('workspace_id', workspaceId)
    .eq('id', invoiceId)
    .eq('status', 'draft'); // Only update if draft

  if (error) throw new Error(`Failed to mark invoice as sent: ${error.message}`);
}

/**
 * Update overdue invoices
 * Run daily to check for overdue invoices
 */
export async function updateOverdueInvoices(workspaceId: string): Promise<number> {
  const supabase = await createClient();

  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('erp_invoices')
    .update({ status: 'overdue' })
    .eq('workspace_id', workspaceId)
    .lt('due_date', today)
    .in('status', ['sent', 'viewed', 'partially_paid'])
    .select('id');

  if (error) throw new Error(`Failed to update overdue invoices: ${error.message}`);
  return data?.length || 0;
}
