/**
 * FINANCIAL TRACKING SYSTEM - BUSINESS LOGIC LAYER
 * 
 * Implements core business logic for financial tracking and invoice management
 * with real database integration and validation.
 */

import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Local type definitions for immediate fix
interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issue_date: string;
  due_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface FinancialAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  outstandingInvoices: number;
  overdueInvoices: number;
  averageInvoiceValue: number;
  monthlyTrend: { month: string; revenue: number; invoices: number }[];
}

// Validation Schemas
export const InvoiceCreationSchema = z.object({
  client_id: z.string().uuid('Valid client ID required'),
  amount: z.number().min(0.01, 'Invoice amount must be greater than 0'),
  due_date: z.string().datetime('Valid due date required'),
  description: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(1),
    rate: z.number().min(0),
    amount: z.number().min(0),
  })).optional(),
  userId: z.string().uuid('Valid user ID required'),
});

export const InvoiceUpdateSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().min(0.01).optional(),
  due_date: z.string().datetime().optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  userId: z.string().uuid('Valid user ID required'),
});

export const PaymentRecordSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().min(0.01, 'Payment amount must be greater than 0'),
  payment_date: z.string().datetime().default(() => new Date().toISOString()),
  payment_method: z.enum(['cash', 'check', 'bank_transfer', 'credit_card', 'paypal', 'other']).default('bank_transfer'),
  notes: z.string().optional(),
  userId: z.string().uuid('Valid user ID required'),
});

export type InvoiceCreationInput = z.infer<typeof InvoiceCreationSchema>;
export type InvoiceUpdateInput = z.infer<typeof InvoiceUpdateSchema>;
export type PaymentRecordInput = z.infer<typeof PaymentRecordSchema>;

// Business Logic Classes
export class FinancialTracking {
  
  /**
   * Create a new invoice with proper validation and business rules
   */
  static async createInvoice(input: InvoiceCreationInput): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
    try {
      // Validate input
      const validated = InvoiceCreationSchema.parse(input);
      
      // Get server client
      const supabase = await createClient();
      
      // Check if client exists
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('id', validated.client_id)
        .single();
      
      if (clientError || !client) {
        return { success: false, error: 'Client not found' };
      }
      
      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();
      
      // Create invoice record
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          client_id: validated.client_id,
          amount: validated.amount,
          status: 'draft',
          issue_date: new Date().toISOString(),
          due_date: validated.due_date,
          description: validated.description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (invoiceError) {
        return { success: false, error: invoiceError.message };
      }
      
      // Create invoice items if provided
      if (validated.items && validated.items.length > 0) {
        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(
            validated.items.map(item => ({
              invoice_id: invoice.id,
              description: item.description,
              quantity: item.quantity,
              rate: item.rate,
              amount: item.amount,
            }))
          );
        
        if (itemsError) {
          console.error('Failed to create invoice items:', itemsError);
        }
      }
      
      // Log activity
      await this.logFinancialActivity(
        invoice.id,
        'invoice_created',
        `Invoice ${invoiceNumber} created for ${client.name}`,
        validated.userId
      );
      
      return { success: true, invoice };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      return { success: false, error: 'Failed to create invoice' };
    }
  }
  
  /**
   * Update invoice details
   */
  static async updateInvoice(input: InvoiceUpdateInput): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
    try {
      // Validate input
      const validated = InvoiceUpdateSchema.parse(input);
      
      // Get server client
      const supabase = await createClient();
      
      // Get current invoice
      const { data: currentInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', validated.invoiceId)
        .single();
      
      if (fetchError || !currentInvoice) {
        return { success: false, error: 'Invoice not found' };
      }
      
      // Prepare update data
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (validated.amount !== undefined) updateData.amount = validated.amount;
      if (validated.due_date !== undefined) updateData.due_date = validated.due_date;
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.status !== undefined) updateData.status = validated.status;
      
      // Update invoice
      const { data: updatedInvoice, error: updateError } = await supabase
        .from('invoices')
        .update(updateData)
        .eq('id', validated.invoiceId)
        .select()
        .single();
      
      if (updateError) {
        return { success: false, error: updateError.message };
      }
      
      // Log activity
      await this.logFinancialActivity(
        validated.invoiceId,
        'invoice_updated',
        `Invoice ${currentInvoice.invoice_number} updated`,
        validated.userId
      );
      
      return { success: true, invoice: updatedInvoice };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      return { success: false, error: 'Failed to update invoice' };
    }
  }
  
  /**
   * Record a payment for an invoice
   */
  static async recordPayment(input: PaymentRecordInput): Promise<{ success: boolean; payment?: any; error?: string }> {
    try {
      // Validate input
      const validated = PaymentRecordSchema.parse(input);
      
      // Get server client
      const supabase = await createClient();
      
      // Get invoice details
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', validated.invoiceId)
        .single();
      
      if (invoiceError || !invoice) {
        return { success: false, error: 'Invoice not found' };
      }
      
      // Get existing payments
      const { data: existingPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount')
        .eq('invoice_id', validated.invoiceId);
      
      if (paymentsError) {
        return { success: false, error: 'Failed to fetch existing payments' };
      }
      
      const totalPaid = existingPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0;
      const remainingAmount = invoice.amount - totalPaid;
      
      // Validate payment amount
      if (validated.amount > remainingAmount) {
        return { success: false, error: `Payment amount exceeds remaining balance of ${remainingAmount}` };
      }
      
      // Record payment
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: validated.invoiceId,
          amount: validated.amount,
          payment_date: validated.payment_date,
          payment_method: validated.payment_method,
          notes: validated.notes,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (paymentError) {
        return { success: false, error: paymentError.message };
      }
      
      // Update invoice status if fully paid
      const newTotalPaid = totalPaid + validated.amount;
      if (newTotalPaid >= invoice.amount) {
        await supabase
          .from('invoices')
          .update({
            status: 'paid',
            updated_at: new Date().toISOString(),
          })
          .eq('id', validated.invoiceId);
      }
      
      // Log activity
      await this.logFinancialActivity(
        validated.invoiceId,
        'payment_recorded',
        `Payment of ${validated.amount} recorded for invoice ${invoice.invoice_number}`,
        validated.userId
      );
      
      return { success: true, payment };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      return { success: false, error: 'Failed to record payment' };
    }
  }
  
  /**
   * Get invoices with filtering and analytics
   */
  static async getInvoices(filters?: {
    status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    client_id?: string;
    created_after?: string;
    created_before?: string;
    due_after?: string;
    due_before?: string;
  }): Promise<{
    success: boolean;
    invoices?: Invoice[];
    analytics?: {
      totalInvoices: number;
      totalAmount: number;
      paidAmount: number;
      outstandingAmount: number;
      overdueAmount: number;
      averageInvoiceValue: number;
    };
    error?: string;
  }> {
    try {
      // Get server client
      const supabase = await createClient();
      
      let query = supabase
        .from('invoices')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.created_after) {
        query = query.gte('created_at', filters.created_after);
      }
      if (filters?.created_before) {
        query = query.lte('created_at', filters.created_before);
      }
      if (filters?.due_after) {
        query = query.gte('due_date', filters.due_after);
      }
      if (filters?.due_before) {
        query = query.lte('due_date', filters.due_before);
      }
      
      const { data: invoices, error } = await query;
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Calculate analytics
      const analytics = await this.calculateInvoiceAnalytics(invoices || []);
      
      return { success: true, invoices: invoices || [], analytics };
      
    } catch (error) {
      return { success: false, error: 'Failed to fetch invoices' };
    }
  }
  
  /**
   * Get financial analytics and metrics
   */
  static async getFinancialMetrics(): Promise<{
    success: boolean;
    metrics?: FinancialAnalytics & {
      cashFlow: {
        monthly: { month: string; income: number; expenses: number }[];
        quarterly: { quarter: string; income: number; expenses: number }[];
      };
      paymentMethods: Record<string, number>;
      clientContribution: { client_name: string; total_revenue: number }[];
      growthRate: number;
      profitMargin: number;
    };
    error?: string;
  }> {
    try {
      // Get server client
      const supabase = await createClient();
      
      // Get all invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (name)
        `);
      
      if (invoicesError) {
        return { success: false, error: invoicesError.message };
      }
      
      // Get all payments
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('*');
      
      if (paymentsError) {
        return { success: false, error: paymentsError.message };
      }
      
      const allInvoices = invoices || [];
      const allPayments = payments || [];
      
      // Calculate basic metrics
      const totalRevenue = allPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalInvoiced = allInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);
      const paidInvoices = allInvoices.filter(inv => inv.status === 'paid');
      const outstandingInvoices = allInvoices.filter(inv => ['sent', 'overdue'].includes(inv.status));
      const overdueInvoices = allInvoices.filter(inv => 
        inv.status === 'overdue' || 
        (inv.status === 'sent' && new Date(inv.due_date) < new Date())
      );
      
      const outstandingInvoices_amount = outstandingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const overdueInvoices_amount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      const averageInvoiceValue = allInvoices.length > 0 ? totalInvoiced / allInvoices.length : 0;
      
      // Monthly revenue trend
      const monthlyTrend = this.calculateMonthlyRevenueTrend(allPayments);
      
      // Current month revenue
      const now = new Date();
      const currentMonth = now.toISOString().slice(0, 7);
      const monthlyRevenue = allPayments
        .filter(payment => payment.payment_date?.startsWith(currentMonth))
        .reduce((sum, payment) => sum + payment.amount, 0);
      
      // Payment methods distribution
      const paymentMethods = allPayments.reduce((acc, payment) => {
        const method = payment.payment_method || 'unknown';
        acc[method] = (acc[method] || 0) + payment.amount;
        return acc;
      }, {} as Record<string, number>);
      
      // Client contribution analysis
      const clientRevenue = allInvoices.reduce((acc, invoice) => {
        if (invoice.clients && invoice.status === 'paid') {
          const clientName = invoice.clients.name;
          acc[clientName] = (acc[clientName] || 0) + invoice.amount;
        }
        return acc;
      }, {} as Record<string, number>);
      
      const clientContribution = Object.entries(clientRevenue)
        .map(([client_name, total_revenue]) => ({ client_name, total_revenue: total_revenue as number }))
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10); // Top 10 clients
      
      // Growth rate (last 3 months vs previous 3 months)
      const growthRate = this.calculateGrowthRate(allPayments);
      
      // Cash flow data
      const cashFlow = {
        monthly: this.calculateMonthlyCashFlow(allPayments),
        quarterly: this.calculateQuarterlyCashFlow(allPayments),
      };
      
      // Profit margin (simplified - assuming 20% cost ratio)
      const profitMargin = totalRevenue > 0 ? ((totalRevenue * 0.8) / totalRevenue) * 100 : 0;
      
      return {
        success: true,
        metrics: {
          totalRevenue,
          monthlyRevenue,
          outstandingInvoices: outstandingInvoices_amount,
          overdueInvoices: overdueInvoices_amount,
          averageInvoiceValue,
          monthlyTrend,
          cashFlow,
          paymentMethods,
          clientContribution,
          growthRate,
          profitMargin,
        }
      };
      
    } catch (error) {
      return { success: false, error: 'Failed to calculate financial metrics' };
    }
  }
  
  /**
   * Generate unique invoice number
   */
  private static async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Get server client
    const supabase = await createClient();
    
    // Get count of invoices this month
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id')
      .gte('created_at', `${year}-${month}-01`)
      .lt('created_at', `${year}-${month === '12' ? year + 1 : year}-${month === '12' ? '01' : String(parseInt(month) + 1).padStart(2, '0')}-01`);
    
    const count = invoices?.length || 0;
    const sequence = String(count + 1).padStart(4, '0');
    
    return `INV-${year}${month}-${sequence}`;
  }
  
  /**
   * Calculate invoice analytics
   */
  private static async calculateInvoiceAnalytics(invoices: any[]): Promise<{
    totalInvoices: number;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    overdueAmount: number;
    averageInvoiceValue: number;
  }> {
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
    const outstandingAmount = invoices.filter(inv => ['sent', 'overdue'].includes(inv.status)).reduce((sum, inv) => sum + inv.amount, 0);
    const overdueAmount = invoices.filter(inv => 
      inv.status === 'overdue' || 
      (inv.status === 'sent' && new Date(inv.due_date) < new Date())
    ).reduce((sum, inv) => sum + inv.amount, 0);
    const averageInvoiceValue = totalInvoices > 0 ? totalAmount / totalInvoices : 0;
    
    return {
      totalInvoices,
      totalAmount,
      paidAmount,
      outstandingAmount,
      overdueAmount,
      averageInvoiceValue,
    };
  }
  
  /**
   * Calculate monthly revenue trend
   */
  private static calculateMonthlyRevenueTrend(payments: any[]): { month: string; revenue: number; invoices: number }[] {
    const monthlyData: Record<string, { revenue: number; invoices: number }> = {};
    
    payments.forEach(payment => {
      if (payment.payment_date) {
        const month = payment.payment_date.slice(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { revenue: 0, invoices: 0 };
        }
        monthlyData[month].revenue += payment.amount;
        monthlyData[month].invoices += 1;
      }
    });
    
    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }
  
  /**
   * Calculate growth rate
   */
  private static calculateGrowthRate(payments: any[]): number {
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    
    const recent3Months = payments
      .filter(p => new Date(p.payment_date) >= threeMonthsAgo)
      .reduce((sum, p) => sum + p.amount, 0);
    
    const previous3Months = payments
      .filter(p => new Date(p.payment_date) >= sixMonthsAgo && new Date(p.payment_date) < threeMonthsAgo)
      .reduce((sum, p) => sum + p.amount, 0);
    
    if (previous3Months === 0) return recent3Months > 0 ? 100 : 0;
    return ((recent3Months - previous3Months) / previous3Months) * 100;
  }
  
  /**
   * Calculate monthly cash flow
   */
  private static calculateMonthlyCashFlow(payments: any[]): { month: string; income: number; expenses: number }[] {
    const monthlyIncome: Record<string, number> = {};
    
    payments.forEach(payment => {
      if (payment.payment_date) {
        const month = payment.payment_date.slice(0, 7);
        monthlyIncome[month] = (monthlyIncome[month] || 0) + payment.amount;
      }
    });
    
    return Object.entries(monthlyIncome)
      .map(([month, income]) => ({
        month,
        income,
        expenses: income * 0.2, // Simplified: assume 20% expenses
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }
  
  /**
   * Calculate quarterly cash flow
   */
  private static calculateQuarterlyCashFlow(payments: any[]): { quarter: string; income: number; expenses: number }[] {
    const quarterlyIncome: Record<string, number> = {};
    
    payments.forEach(payment => {
      if (payment.payment_date) {
        const date = new Date(payment.payment_date);
        const year = date.getFullYear();
        const quarter = Math.ceil((date.getMonth() + 1) / 3);
        const quarterKey = `${year}-Q${quarter}`;
        quarterlyIncome[quarterKey] = (quarterlyIncome[quarterKey] || 0) + payment.amount;
      }
    });
    
    return Object.entries(quarterlyIncome)
      .map(([quarter, income]) => ({
        quarter,
        income,
        expenses: income * 0.2,
      }))
      .sort((a, b) => a.quarter.localeCompare(b.quarter))
      .slice(-8); // Last 8 quarters
  }
  
  /**
   * Log financial activity for audit trail
   */
  private static async logFinancialActivity(
    invoiceId: string,
    activityType: string,
    description: string,
    userId: string
  ): Promise<void> {
    try {
      // Get server client
      const supabase = await createClient();
      
      await supabase
        .from('activities')
        .insert({
          type: activityType,
          description,
          related_to: 'invoice',
          related_id: invoiceId,
          user_id: userId,
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to log financial activity:', error);
    }
  }
}

// Export financial tracking functions for API routes
export const financialTracking = {
  createInvoice: FinancialTracking.createInvoice.bind(FinancialTracking),
  updateInvoice: FinancialTracking.updateInvoice.bind(FinancialTracking),
  recordPayment: FinancialTracking.recordPayment.bind(FinancialTracking),
  getInvoices: FinancialTracking.getInvoices.bind(FinancialTracking),
  getFinancialMetrics: FinancialTracking.getFinancialMetrics.bind(FinancialTracking),
};
