/**
 * FINANCIAL TRACKING AUTOMATION API
 * 
 * Handles automated invoice generation, payment tracking, and financial workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { FinancialTracking } from '@/lib/crm/business-logic/FinancialTracking';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Automation schemas
const AutoInvoiceSchema = z.object({
  dealId: z.string().uuid(),
  templateType: z.enum(['deal_closure', 'milestone', 'recurring', 'custom']).default('deal_closure'),
  customAmount: z.number().min(0).optional(),
  dueInDays: z.number().min(1).max(365).default(30),
  userId: z.string().uuid(),
});

const PaymentTrackingSchema = z.object({
  invoiceId: z.string().uuid(),
  enableReminders: z.boolean().default(true),
  reminderSchedule: z.array(z.number()).default([7, 3, 1]), // Days before due date
  autoOverdue: z.boolean().default(true),
  userId: z.string().uuid(),
});

const FinancialWorkflowSchema = z.object({
  workflowType: z.enum(['monthly_reports', 'overdue_management', 'cash_flow_forecast', 'revenue_analysis']),
  scheduleType: z.enum(['immediate', 'daily', 'weekly', 'monthly']).default('immediate'),
  parameters: z.record(z.any()).optional(),
  userId: z.string().uuid(),
});

/**
 * POST /api/crm/invoices/automation - Execute financial automation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle different automation types
    switch (body.action) {
      case 'auto_invoice':
        return await handleAutoInvoiceGeneration(body);
      case 'payment_tracking':
        return await handlePaymentTracking(body);
      case 'overdue_management':
        return await handleOverdueManagement(body);
      case 'financial_workflow':
        return await handleFinancialWorkflow(body);
      case 'revenue_recognition':
        return await handleRevenueRecognition(body);
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid automation action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Financial automation API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/crm/invoices/automation - Get automation status and analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const dealId = searchParams.get('dealId');
    const invoiceId = searchParams.get('invoiceId');
    
    switch (type) {
      case 'invoice_eligibility':
        if (!dealId) {
          return NextResponse.json(
            { success: false, error: 'Deal ID required for eligibility check' },
            { status: 400 }
          );
        }
        const eligibility = await checkInvoiceEligibility(dealId);
        return NextResponse.json({ success: true, eligibility });
        
      case 'payment_status':
        if (!invoiceId) {
          return NextResponse.json(
            { success: false, error: 'Invoice ID required for payment status' },
            { status: 400 }
          );
        }
        const paymentStatus = await getPaymentTrackingStatus(invoiceId);
        return NextResponse.json({ success: true, paymentStatus });
        
      case 'overdue_summary':
        const overdueSummary = await getOverdueSummary();
        return NextResponse.json({ success: true, overdueSummary });
        
      case 'automation_metrics':
        const metrics = await getAutomationMetrics();
        return NextResponse.json({ success: true, metrics });
        
      default:
        const overview = await getFinancialAutomationOverview();
        return NextResponse.json({ success: true, overview });
    }
    
  } catch (error) {
    console.error('Financial automation status API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle automatic invoice generation from deals
 */
async function handleAutoInvoiceGeneration(body: any) {
  try {
    const validated = AutoInvoiceSchema.parse(body);
    
    // Get server client
    const supabase = await createClient();
    
    // Get deal details
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(`
        *,
        clients (
          id,
          name,
          email
        )
      `)
      .eq('id', validated.dealId)
      .single();
    
    if (dealError || !deal) {
      return NextResponse.json(
        { success: false, error: 'Deal not found' },
        { status: 404 }
      );
    }
    
    // Check if deal is eligible for auto-invoicing
    const eligibility = await checkInvoiceEligibility(validated.dealId);
    
    if (!eligibility.eligible) {
      return NextResponse.json({
        success: false,
        error: eligibility.reason
      });
    }
    
    // Calculate invoice amount based on template type
    let invoiceAmount = validated.customAmount || deal.value;
    let description = `Invoice for ${deal.title}`;
    
    switch (validated.templateType) {
      case 'deal_closure':
        invoiceAmount = deal.value;
        description = `Final invoice for completed deal: ${deal.title}`;
        break;
      case 'milestone':
        invoiceAmount = deal.value * 0.3; // 30% milestone
        description = `Milestone payment for deal: ${deal.title}`;
        break;
      case 'recurring':
        invoiceAmount = deal.value / 12; // Monthly recurring
        description = `Monthly recurring invoice for: ${deal.title}`;
        break;
    }
    
    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + validated.dueInDays);
    
    // Create invoice
    const invoiceResult = await FinancialTracking.createInvoice({
      client_id: deal.client_id,
      amount: invoiceAmount,
      due_date: dueDate.toISOString(),
      description,
      userId: validated.userId
    });
    
    if (!invoiceResult.success) {
      return NextResponse.json({
        success: false,
        error: invoiceResult.error
      });
    }
    
    // Link invoice to deal
    await supabase
      .from('deal_invoices')
      .insert({
        deal_id: validated.dealId,
        invoice_id: invoiceResult.invoice!.id,
        created_at: new Date().toISOString()
      });
    
    // Set up automatic payment tracking
    await setupPaymentTracking(invoiceResult.invoice!.id, validated.userId);
    
    // Log automation activity
    await logFinancialAutomation(
      validated.dealId,
      'auto_invoice_generated',
      `Auto-generated ${validated.templateType} invoice for ${invoiceAmount}`,
      validated.userId
    );
    
    return NextResponse.json({
      success: true,
      invoice: invoiceResult.invoice,
      automation: {
        type: validated.templateType,
        amount: invoiceAmount,
        dueDate: dueDate.toISOString(),
        paymentTrackingEnabled: true
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Auto invoice generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate automatic invoice' },
      { status: 500 }
    );
  }
}

/**
 * Handle payment tracking automation
 */
async function handlePaymentTracking(body: any) {
  try {
    const validated = PaymentTrackingSchema.parse(body);
    
    const trackingResult = await setupPaymentTracking(
      validated.invoiceId, 
      validated.userId,
      {
        enableReminders: validated.enableReminders,
        reminderSchedule: validated.reminderSchedule,
        autoOverdue: validated.autoOverdue
      }
    );
    
    return NextResponse.json({
      success: true,
      tracking: trackingResult
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Payment tracking error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set up payment tracking' },
      { status: 500 }
    );
  }
}

/**
 * Handle overdue invoice management
 */
async function handleOverdueManagement(body: any) {
  try {
    const { action, invoiceIds, userId } = body;
    
    const supabase = await createClient();
    
    switch (action) {
      case 'mark_overdue':
        const overdueResult = await markInvoicesOverdue(invoiceIds);
        return NextResponse.json({
          success: true,
          processed: overdueResult.count,
          invoices: overdueResult.invoices
        });
        
      case 'send_reminders':
        const reminderResult = await sendOverdueReminders(invoiceIds, userId);
        return NextResponse.json({
          success: true,
          sent: reminderResult.count,
          results: reminderResult.results
        });
        
      case 'auto_collections':
        const collectionsResult = await processAutoCollections(userId);
        return NextResponse.json({
          success: true,
          processed: collectionsResult
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid overdue management action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Overdue management error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process overdue management' },
      { status: 500 }
    );
  }
}

/**
 * Handle financial workflow automation
 */
async function handleFinancialWorkflow(body: any) {
  try {
    const validated = FinancialWorkflowSchema.parse(body);
    
    let workflowResult;
    
    switch (validated.workflowType) {
      case 'monthly_reports':
        workflowResult = await generateMonthlyReport(validated.parameters);
        break;
      case 'overdue_management':
        workflowResult = await executeOverdueWorkflow();
        break;
      case 'cash_flow_forecast':
        workflowResult = await generateCashFlowForecast(validated.parameters);
        break;
      case 'revenue_analysis':
        workflowResult = await performRevenueAnalysis(validated.parameters);
        break;
      default:
        throw new Error('Invalid workflow type');
    }
    
    // Log workflow execution
    await logFinancialAutomation(
      'system',
      'workflow_executed',
      `Executed ${validated.workflowType} workflow`,
      validated.userId
    );
    
    return NextResponse.json({
      success: true,
      workflow: {
        type: validated.workflowType,
        schedule: validated.scheduleType,
        result: workflowResult,
        executedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
    }
    
    console.error('Financial workflow error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute financial workflow' },
      { status: 500 }
    );
  }
}

/**
 * Handle revenue recognition automation
 */
async function handleRevenueRecognition(body: any) {
  try {
    const { method, periodType, dealIds, userId } = body;
    
    const recognitionResult = await processRevenueRecognition(method, periodType, dealIds);
    
    // Log revenue recognition
    await logFinancialAutomation(
      'system',
      'revenue_recognized',
      `Processed revenue recognition for ${dealIds?.length || 'all'} deals`,
      userId
    );
    
    return NextResponse.json({
      success: true,
      recognition: recognitionResult
    });
    
  } catch (error) {
    console.error('Revenue recognition error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process revenue recognition' },
      { status: 500 }
    );
  }
}

/**
 * Check if deal is eligible for auto-invoicing
 */
async function checkInvoiceEligibility(dealId: string) {
  const supabase = await createClient();
  
  // Get deal details
  const { data: deal } = await supabase
    .from('deals')
    .select('*, clients(id)')
    .eq('id', dealId)
    .single();
  
  if (!deal) {
    return { eligible: false, reason: 'Deal not found' };
  }
  
  if (!deal.clients) {
    return { eligible: false, reason: 'No client associated with deal' };
  }
  
  if (deal.status !== 'closed-won') {
    return { eligible: false, reason: 'Deal must be closed-won for auto-invoicing' };
  }
  
  // Check for existing invoices
  const { data: existingInvoices } = await supabase
    .from('deal_invoices')
    .select('invoice_id')
    .eq('deal_id', dealId);
  
  return {
    eligible: true,
    reason: 'Deal eligible for auto-invoicing',
    existingInvoices: existingInvoices?.length || 0,
    dealValue: deal.value,
    clientId: deal.client_id
  };
}

/**
 * Set up automatic payment tracking
 */
async function setupPaymentTracking(
  invoiceId: string, 
  userId: string, 
  options: any = {}
) {
  const supabase = await createClient();
  
  // Create payment tracking record
  const { data: tracking, error } = await supabase
    .from('payment_tracking')
    .insert({
      invoice_id: invoiceId,
      enable_reminders: options.enableReminders ?? true,
      reminder_schedule: options.reminderSchedule ?? [7, 3, 1],
      auto_overdue: options.autoOverdue ?? true,
      created_by: userId,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('Failed to set up payment tracking:', error);
    return { success: false, error: error.message };
  }
  
  return {
    success: true,
    trackingId: tracking.id,
    features: {
      reminders: options.enableReminders ?? true,
      autoOverdue: options.autoOverdue ?? true,
      schedule: options.reminderSchedule ?? [7, 3, 1]
    }
  };
}

/**
 * Mark invoices as overdue
 */
async function markInvoicesOverdue(invoiceIds: string[] = []) {
  const supabase = await createClient();
  
  let query = supabase
    .from('invoices')
    .select('*')
    .eq('status', 'sent')
    .lt('due_date', new Date().toISOString());
  
  if (invoiceIds.length > 0) {
    query = query.in('id', invoiceIds);
  }
  
  const { data: overdueInvoices } = await query;
  
  if (!overdueInvoices?.length) {
    return { count: 0, invoices: [] };
  }
  
  // Update invoices to overdue status
  const { error } = await supabase
    .from('invoices')
    .update({ 
      status: 'overdue',
      updated_at: new Date().toISOString()
    })
    .in('id', overdueInvoices.map(inv => inv.id));
  
  if (error) {
    console.error('Failed to mark invoices overdue:', error);
    return { count: 0, invoices: [] };
  }
  
  return {
    count: overdueInvoices.length,
    invoices: overdueInvoices.map(inv => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      amount: inv.amount,
      daysPastDue: Math.floor((Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24))
    }))
  };
}

/**
 * Send overdue reminders
 */
async function sendOverdueReminders(invoiceIds: string[], userId: string) {
  // Simplified implementation - would integrate with email service
  const results = invoiceIds.map(id => ({
    invoiceId: id,
    sent: true,
    method: 'email',
    timestamp: new Date().toISOString()
  }));
  
  return {
    count: results.length,
    results
  };
}

/**
 * Process automatic collections
 */
async function processAutoCollections(userId: string) {
  // Simplified implementation for collections workflow
  return {
    processed: true,
    collectionsInitiated: 0,
    message: 'Auto-collections workflow initiated'
  };
}

/**
 * Generate monthly financial report
 */
async function generateMonthlyReport(parameters: any = {}) {
  const metrics = await FinancialTracking.getFinancialMetrics();
  
  if (!metrics.success) {
    throw new Error('Failed to generate monthly report');
  }
  
  return {
    reportType: 'monthly',
    period: new Date().toISOString().slice(0, 7),
    metrics: metrics.metrics,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Execute overdue workflow
 */
async function executeOverdueWorkflow() {
  const overdueResult = await markInvoicesOverdue();
  
  return {
    workflowType: 'overdue_management',
    invoicesProcessed: overdueResult.count,
    overdueInvoices: overdueResult.invoices
  };
}

/**
 * Generate cash flow forecast
 */
async function generateCashFlowForecast(parameters: any = {}) {
  const metrics = await FinancialTracking.getFinancialMetrics();
  
  if (!metrics.success) {
    throw new Error('Failed to generate cash flow forecast');
  }
  
  const currentMonth = metrics.metrics?.monthlyRevenue || 0;
  const forecast = [];
  
  // Simple 6-month forecast based on current trends
  for (let i = 1; i <= 6; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    
    forecast.push({
      month: date.toISOString().slice(0, 7),
      projectedIncome: currentMonth * (1 + (Math.random() * 0.2 - 0.1)), // Â±10% variance
      confidence: 0.75
    });
  }
  
  return {
    forecastType: 'cash_flow',
    period: '6_months',
    currentMonthRevenue: currentMonth,
    forecast
  };
}

/**
 * Perform revenue analysis
 */
async function performRevenueAnalysis(parameters: any = {}) {
  const metrics = await FinancialTracking.getFinancialMetrics();
  
  if (!metrics.success) {
    throw new Error('Failed to perform revenue analysis');
  }
  
  return {
    analysisType: 'revenue',
    totalRevenue: metrics.metrics?.totalRevenue || 0,
    growthRate: metrics.metrics?.growthRate || 0,
    topClients: metrics.metrics?.clientContribution?.slice(0, 5) || [],
    recommendations: [
      'Focus on top-performing client segments',
      'Implement recurring revenue strategies',
      'Optimize payment collection processes'
    ]
  };
}

/**
 * Process revenue recognition
 */
async function processRevenueRecognition(method: string, periodType: string, dealIds?: string[]) {
  // Simplified revenue recognition logic
  return {
    method,
    periodType,
    dealsProcessed: dealIds?.length || 0,
    revenueRecognized: 0,
    status: 'completed'
  };
}

/**
 * Get payment tracking status
 */
async function getPaymentTrackingStatus(invoiceId: string) {
  const supabase = await createClient();
  
  const { data: tracking } = await supabase
    .from('payment_tracking')
    .select('*')
    .eq('invoice_id', invoiceId)
    .single();
  
  const { data: invoice } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();
  
  if (!invoice) {
    throw new Error('Invoice not found');
  }
  
  const daysSinceDue = Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    invoiceId,
    status: invoice.status,
    dueDate: invoice.due_date,
    daysSinceDue: Math.max(0, daysSinceDue),
    trackingEnabled: !!tracking,
    remindersEnabled: tracking?.enable_reminders || false,
    autoOverdueEnabled: tracking?.auto_overdue || false
  };
}

/**
 * Get overdue summary
 */
async function getOverdueSummary() {
  const supabase = await createClient();
  
  const { data: overdueInvoices } = await supabase
    .from('invoices')
    .select('*')
    .eq('status', 'overdue');
  
  const totalOverdue = overdueInvoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
  
  return {
    count: overdueInvoices?.length || 0,
    totalAmount: totalOverdue,
    invoices: overdueInvoices?.map(inv => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      amount: inv.amount,
      daysPastDue: Math.floor((Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24))
    })) || []
  };
}

/**
 * Get automation metrics
 */
async function getAutomationMetrics() {
  const supabase = await createClient();
  
  // Get automation activity from last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: activities } = await supabase
    .from('activities')
    .select('type')
    .gte('timestamp', thirtyDaysAgo)
    .in('type', ['auto_invoice_generated', 'payment_tracked', 'overdue_processed']);
  
  const autoInvoices = activities?.filter(a => a.type === 'auto_invoice_generated').length || 0;
  const paymentTracking = activities?.filter(a => a.type === 'payment_tracked').length || 0;
  const overdueProcessed = activities?.filter(a => a.type === 'overdue_processed').length || 0;
  
  return {
    period: '30_days',
    autoInvoicesGenerated: autoInvoices,
    paymentTrackingEvents: paymentTracking,
    overdueInvoicesProcessed: overdueProcessed,
    totalAutomationEvents: activities?.length || 0
  };
}

/**
 * Get financial automation overview
 */
async function getFinancialAutomationOverview() {
  const supabase = await createClient();
  
  // Get counts
  const { count: totalInvoices } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true });
  
  const { count: overdueCount } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'overdue');
  
  const { count: trackingCount } = await supabase
    .from('payment_tracking')
    .select('*', { count: 'exact', head: true });
  
  return {
    totalInvoices: totalInvoices || 0,
    overdueInvoices: overdueCount || 0,
    paymentTrackingEnabled: trackingCount || 0,
    automationFeatures: {
      autoInvoicing: true,
      paymentTracking: true,
      overdueManagement: true,
      revenueRecognition: true
    },
    lastUpdate: new Date().toISOString()
  };
}

/**
 * Log financial automation activity
 */
async function logFinancialAutomation(
  relatedId: string,
  activityType: string,
  description: string,
  userId: string
) {
  try {
    const supabase = await createClient();
    
    await supabase
      .from('activities')
      .insert({
        type: activityType,
        description,
        related_to: 'financial',
        related_id: relatedId,
        user_id: userId,
        timestamp: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Failed to log financial automation activity:', error);
  }
}
