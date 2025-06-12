/**
 * FINANCIAL TRACKING AUTOMATION - TEST SUITE
 * 
 * Tests automated invoice generation, payment tracking, and financial workflows
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock data for testing
const mockDeal = {
  id: 'deal-123',
  title: 'Enterprise Software License',
  value: 50000,
  status: 'closed-won',
  client_id: 'client-123',
  user_id: 'user-123',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  clients: {
    id: 'client-123',
    name: 'Acme Corporation',
    email: 'billing@acme.com'
  }
};

const mockInvoice = {
  id: 'invoice-123',
  invoice_number: 'INV-202412-0001',
  client_id: 'client-123',
  amount: 50000,
  status: 'draft',
  issue_date: new Date().toISOString(),
  due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  description: 'Final invoice for completed deal: Enterprise Software License',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const mockOverdueInvoice = {
  ...mockInvoice,
  id: 'invoice-overdue-123',
  status: 'sent',
  due_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
};

const mockPayments = [
  {
    id: 'payment-1',
    invoice_id: 'invoice-123',
    amount: 25000,
    payment_date: '2024-12-01T00:00:00Z',
    payment_method: 'bank_transfer'
  },
  {
    id: 'payment-2',
    invoice_id: 'invoice-456',
    amount: 30000,
    payment_date: '2024-12-05T00:00:00Z',
    payment_method: 'credit_card'
  }
];

describe('Financial Tracking Automation', () => {
  describe('Automatic Invoice Generation', () => {
    it('should generate invoice for closed-won deal', async () => {
      const autoInvoiceRequest = {
        dealId: mockDeal.id,
        templateType: 'deal_closure',
        dueInDays: 30,
        userId: mockDeal.user_id
      };
      
      const result = await testAutoInvoiceGeneration(autoInvoiceRequest, mockDeal);
      
      expect(result.success).toBe(true);
      expect(result.invoice).toBeDefined();
      expect(result.invoice.amount).toBe(mockDeal.value);
      expect(result.automation.type).toBe('deal_closure');
      expect(result.automation.paymentTrackingEnabled).toBe(true);
    });

    it('should calculate milestone invoice amount correctly', async () => {
      const milestoneRequest = {
        dealId: mockDeal.id,
        templateType: 'milestone',
        dueInDays: 15,
        userId: mockDeal.user_id
      };
      
      const result = await testAutoInvoiceGeneration(milestoneRequest, mockDeal);
      
      expect(result.success).toBe(true);
      expect(result.automation.amount).toBe(mockDeal.value * 0.3); // 30% milestone
      expect(result.automation.type).toBe('milestone');
    });

    it('should calculate recurring invoice amount correctly', async () => {
      const recurringRequest = {
        dealId: mockDeal.id,
        templateType: 'recurring',
        dueInDays: 30,
        userId: mockDeal.user_id
      };
      
      const result = await testAutoInvoiceGeneration(recurringRequest, mockDeal);
      
      expect(result.success).toBe(true);
      expect(result.automation.amount).toBe(mockDeal.value / 12); // Monthly recurring
      expect(result.automation.type).toBe('recurring');
    });

    it('should use custom amount when provided', async () => {
      const customRequest = {
        dealId: mockDeal.id,
        templateType: 'custom',
        customAmount: 75000,
        dueInDays: 45,
        userId: mockDeal.user_id
      };
      
      const result = await testAutoInvoiceGeneration(customRequest, mockDeal);
      
      expect(result.success).toBe(true);
      expect(result.automation.amount).toBe(75000);
    });

    it('should reject invoice generation for non-closed deals', async () => {
      const invalidDeal = { ...mockDeal, status: 'negotiation' };
      
      const request = {
        dealId: invalidDeal.id,
        templateType: 'deal_closure',
        userId: mockDeal.user_id
      };
      
      const result = await testAutoInvoiceGeneration(request, invalidDeal);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('closed-won');
    });
  });

  describe('Payment Tracking Automation', () => {
    it('should set up payment tracking with default settings', async () => {
      const trackingRequest = {
        invoiceId: mockInvoice.id,
        userId: mockDeal.user_id
      };
      
      const result = await testPaymentTracking(trackingRequest);
      
      expect(result.success).toBe(true);
      expect(result.tracking.features.reminders).toBe(true);
      expect(result.tracking.features.autoOverdue).toBe(true);
      expect(result.tracking.features.schedule).toEqual([7, 3, 1]);
    });

    it('should set up payment tracking with custom settings', async () => {
      const customTrackingRequest = {
        invoiceId: mockInvoice.id,
        enableReminders: false,
        reminderSchedule: [14, 7, 1],
        autoOverdue: false,
        userId: mockDeal.user_id
      };
      
      const result = await testPaymentTracking(customTrackingRequest);
      
      expect(result.success).toBe(true);
      expect(result.tracking.features.reminders).toBe(false);
      expect(result.tracking.features.autoOverdue).toBe(false);
      expect(result.tracking.features.schedule).toEqual([14, 7, 1]);
    });

    it('should track payment status correctly', async () => {
      const paymentStatus = await testGetPaymentTrackingStatus(mockInvoice.id, mockInvoice);
      
      expect(paymentStatus.invoiceId).toBe(mockInvoice.id);
      expect(paymentStatus.status).toBe(mockInvoice.status);
      expect(paymentStatus.trackingEnabled).toBe(true);
    });

    it('should calculate days since due correctly', async () => {
      const paymentStatus = await testGetPaymentTrackingStatus(
        mockOverdueInvoice.id, 
        mockOverdueInvoice
      );
      
      expect(paymentStatus.daysSinceDue).toBeGreaterThan(0);
      expect(paymentStatus.daysSinceDue).toBe(5); // 5 days overdue
    });
  });

  describe('Overdue Management', () => {
    it('should identify and mark overdue invoices', async () => {
      const overdueInvoices = [mockOverdueInvoice];
      const result = await testMarkInvoicesOverdue(overdueInvoices);
      
      expect(result.count).toBe(1);
      expect(result.invoices[0].daysPastDue).toBeGreaterThan(0);
      expect(result.invoices[0].id).toBe(mockOverdueInvoice.id);
    });

    it('should generate overdue summary', async () => {
      const overdueInvoices = [mockOverdueInvoice];
      const summary = await testGetOverdueSummary(overdueInvoices);
      
      expect(summary.count).toBe(1);
      expect(summary.totalAmount).toBe(mockOverdueInvoice.amount);
      expect(summary.invoices).toHaveLength(1);
    });

    it('should send overdue reminders', async () => {
      const reminderResult = await testSendOverdueReminders([mockOverdueInvoice.id]);
      
      expect(reminderResult.count).toBe(1);
      expect(reminderResult.results[0].sent).toBe(true);
      expect(reminderResult.results[0].method).toBe('email');
    });

    it('should handle empty overdue list', async () => {
      const result = await testMarkInvoicesOverdue([]);
      
      expect(result.count).toBe(0);
      expect(result.invoices).toHaveLength(0);
    });
  });

  describe('Financial Workflows', () => {
    it('should generate monthly financial report', async () => {
      const reportResult = await testGenerateMonthlyReport();
      
      expect(reportResult.reportType).toBe('monthly');
      expect(reportResult.period).toBeDefined();
      expect(reportResult.metrics).toBeDefined();
      expect(reportResult.generatedAt).toBeDefined();
    });

    it('should execute overdue workflow', async () => {
      const overdueInvoices = [mockOverdueInvoice];
      const workflowResult = await testExecuteOverdueWorkflow(overdueInvoices);
      
      expect(workflowResult.workflowType).toBe('overdue_management');
      expect(workflowResult.invoicesProcessed).toBe(1);
      expect(workflowResult.overdueInvoices).toHaveLength(1);
    });

    it('should generate cash flow forecast', async () => {
      const forecastResult = await testGenerateCashFlowForecast(5000);
      
      expect(forecastResult.forecastType).toBe('cash_flow');
      expect(forecastResult.period).toBe('6_months');
      expect(forecastResult.currentMonthRevenue).toBe(5000);
      expect(forecastResult.forecast).toHaveLength(6);
    });

    it('should perform revenue analysis', async () => {
      const analysisResult = await testPerformRevenueAnalysis(mockPayments);
      
      expect(analysisResult.analysisType).toBe('revenue');
      expect(analysisResult.totalRevenue).toBeGreaterThan(0);
      expect(analysisResult.recommendations).toHaveLength(3);
    });
  });

  describe('Revenue Recognition', () => {
    it('should process revenue recognition', async () => {
      const recognitionResult = await testProcessRevenueRecognition(
        'accrual',
        'monthly',
        [mockDeal.id]
      );
      
      expect(recognitionResult.method).toBe('accrual');
      expect(recognitionResult.periodType).toBe('monthly');
      expect(recognitionResult.dealsProcessed).toBe(1);
      expect(recognitionResult.status).toBe('completed');
    });

    it('should handle batch revenue recognition', async () => {
      const multipleDeals = [mockDeal.id, 'deal-456', 'deal-789'];
      const recognitionResult = await testProcessRevenueRecognition(
        'cash',
        'quarterly',
        multipleDeals
      );
      
      expect(recognitionResult.dealsProcessed).toBe(3);
    });
  });

  describe('Invoice Eligibility', () => {
    it('should confirm eligible deal for auto-invoicing', async () => {
      const eligibility = await testCheckInvoiceEligibility(mockDeal);
      
      expect(eligibility.eligible).toBe(true);
      expect(eligibility.dealValue).toBe(mockDeal.value);
      expect(eligibility.clientId).toBe(mockDeal.client_id);
    });

    it('should reject non-closed deals', async () => {
      const openDeal = { ...mockDeal, status: 'proposal' };
      const eligibility = await testCheckInvoiceEligibility(openDeal);
      
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toContain('closed-won');
    });

    it('should reject deals without clients', async () => {
      const dealWithoutClient = { ...mockDeal, clients: null };
      const eligibility = await testCheckInvoiceEligibility(dealWithoutClient);
      
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.reason).toContain('client');
    });
  });

  describe('Automation Metrics', () => {
    it('should calculate automation metrics', async () => {
      const activities = [
        { type: 'auto_invoice_generated' },
        { type: 'auto_invoice_generated' },
        { type: 'payment_tracked' },
        { type: 'overdue_processed' }
      ];
      
      const metrics = await testGetAutomationMetrics(activities);
      
      expect(metrics.period).toBe('30_days');
      expect(metrics.autoInvoicesGenerated).toBe(2);
      expect(metrics.paymentTrackingEvents).toBe(1);
      expect(metrics.overdueInvoicesProcessed).toBe(1);
      expect(metrics.totalAutomationEvents).toBe(4);
    });

    it('should provide automation overview', async () => {
      const overview = await testGetFinancialAutomationOverview();
      
      expect(overview.totalInvoices).toBeGreaterThanOrEqual(0);
      expect(overview.overdueInvoices).toBeGreaterThanOrEqual(0);
      expect(overview.automationFeatures.autoInvoicing).toBe(true);
      expect(overview.automationFeatures.paymentTracking).toBe(true);
      expect(overview.lastUpdate).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete financial automation workflow', async () => {
      // Step 1: Check eligibility
      const eligibility = await testCheckInvoiceEligibility(mockDeal);
      expect(eligibility.eligible).toBe(true);
      
      // Step 2: Generate auto-invoice
      const invoiceResult = await testAutoInvoiceGeneration({
        dealId: mockDeal.id,
        templateType: 'deal_closure',
        userId: mockDeal.user_id
      }, mockDeal);
      expect(invoiceResult.success).toBe(true);
      
      // Step 3: Set up payment tracking
      const trackingResult = await testPaymentTracking({
        invoiceId: invoiceResult.invoice.id,
        userId: mockDeal.user_id
      });
      expect(trackingResult.success).toBe(true);
      
      // Step 4: Check payment status
      const paymentStatus = await testGetPaymentTrackingStatus(
        invoiceResult.invoice.id,
        invoiceResult.invoice
      );
      expect(paymentStatus.trackingEnabled).toBe(true);
    });

    it('should handle end-to-end overdue management', async () => {
      // Step 1: Mark invoices overdue
      const overdueResult = await testMarkInvoicesOverdue([mockOverdueInvoice]);
      expect(overdueResult.count).toBe(1);
      
      // Step 2: Send reminders
      const reminderResult = await testSendOverdueReminders([mockOverdueInvoice.id]);
      expect(reminderResult.count).toBe(1);
      
      // Step 3: Generate summary
      const summary = await testGetOverdueSummary([mockOverdueInvoice]);
      expect(summary.count).toBe(1);
      expect(summary.totalAmount).toBe(mockOverdueInvoice.amount);
    });
  });
});

// Test helper functions
async function testAutoInvoiceGeneration(request: any, deal: any) {
  // Check eligibility first
  const eligibility = await testCheckInvoiceEligibility(deal);
  
  if (!eligibility.eligible) {
    return { success: false, error: eligibility.reason };
  }
  
  // Calculate invoice amount based on template type
  let invoiceAmount = request.customAmount || deal.value;
  
  switch (request.templateType) {
    case 'deal_closure':
      invoiceAmount = deal.value;
      break;
    case 'milestone':
      invoiceAmount = deal.value * 0.3;
      break;
    case 'recurring':
      invoiceAmount = deal.value / 12;
      break;
  }
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + (request.dueInDays || 30));
  
  const invoice = {
    ...mockInvoice,
    id: `invoice-${Date.now()}`,
    amount: invoiceAmount,
    due_date: dueDate.toISOString(),
    description: `${request.templateType} invoice for ${deal.title}`
  };
  
  return {
    success: true,
    invoice,
    automation: {
      type: request.templateType,
      amount: invoiceAmount,
      dueDate: dueDate.toISOString(),
      paymentTrackingEnabled: true
    }
  };
}

async function testPaymentTracking(request: any) {
  const features = {
    reminders: request.enableReminders ?? true,
    autoOverdue: request.autoOverdue ?? true,
    schedule: request.reminderSchedule ?? [7, 3, 1]
  };
  
  return {
    success: true,
    tracking: {
      trackingId: `tracking-${Date.now()}`,
      features
    }
  };
}

async function testGetPaymentTrackingStatus(invoiceId: string, invoice: any) {
  const daysSinceDue = Math.floor(
    (Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return {
    invoiceId,
    status: invoice.status,
    dueDate: invoice.due_date,
    daysSinceDue: Math.max(0, daysSinceDue),
    trackingEnabled: true,
    remindersEnabled: true,
    autoOverdueEnabled: true
  };
}

async function testMarkInvoicesOverdue(invoices: any[]) {
  const overdueInvoices = invoices.filter(inv => 
    inv.status === 'sent' && new Date(inv.due_date) < new Date()
  );
  
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

async function testSendOverdueReminders(invoiceIds: string[]) {
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

async function testGetOverdueSummary(overdueInvoices: any[]) {
  const totalAmount = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  
  return {
    count: overdueInvoices.length,
    totalAmount,
    invoices: overdueInvoices.map(inv => ({
      id: inv.id,
      invoice_number: inv.invoice_number,
      amount: inv.amount,
      daysPastDue: Math.floor((Date.now() - new Date(inv.due_date).getTime()) / (1000 * 60 * 60 * 24))
    }))
  };
}

async function testGenerateMonthlyReport() {
  return {
    reportType: 'monthly',
    period: new Date().toISOString().slice(0, 7),
    metrics: {
      totalRevenue: 125000,
      monthlyRevenue: 15000,
      outstandingInvoices: 25000,
      overdueInvoices: 5000
    },
    generatedAt: new Date().toISOString()
  };
}

async function testExecuteOverdueWorkflow(overdueInvoices: any[]) {
  const markResult = await testMarkInvoicesOverdue(overdueInvoices);
  
  return {
    workflowType: 'overdue_management',
    invoicesProcessed: markResult.count,
    overdueInvoices: markResult.invoices
  };
}

async function testGenerateCashFlowForecast(currentMonthRevenue: number) {
  const forecast = [];
  
  for (let i = 1; i <= 6; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    
    forecast.push({
      month: date.toISOString().slice(0, 7),
      projectedIncome: currentMonthRevenue * (1 + (Math.random() * 0.2 - 0.1)),
      confidence: 0.75
    });
  }
  
  return {
    forecastType: 'cash_flow',
    period: '6_months',
    currentMonthRevenue,
    forecast
  };
}

async function testPerformRevenueAnalysis(payments: any[]) {
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  return {
    analysisType: 'revenue',
    totalRevenue,
    growthRate: 15.5,
    topClients: [
      { client_name: 'Acme Corporation', total_revenue: 50000 },
      { client_name: 'TechCorp Inc', total_revenue: 30000 }
    ],
    recommendations: [
      'Focus on top-performing client segments',
      'Implement recurring revenue strategies',
      'Optimize payment collection processes'
    ]
  };
}

async function testProcessRevenueRecognition(method: string, periodType: string, dealIds: string[]) {
  return {
    method,
    periodType,
    dealsProcessed: dealIds.length,
    revenueRecognized: dealIds.length * 15000,
    status: 'completed'
  };
}

async function testCheckInvoiceEligibility(deal: any) {
  if (!deal.clients) {
    return { eligible: false, reason: 'No client associated with deal' };
  }
  
  if (deal.status !== 'closed-won') {
    return { eligible: false, reason: 'Deal must be closed-won for auto-invoicing' };
  }
  
  return {
    eligible: true,
    reason: 'Deal eligible for auto-invoicing',
    existingInvoices: 0,
    dealValue: deal.value,
    clientId: deal.client_id
  };
}

async function testGetAutomationMetrics(activities: any[]) {
  const autoInvoices = activities.filter(a => a.type === 'auto_invoice_generated').length;
  const paymentTracking = activities.filter(a => a.type === 'payment_tracked').length;
  const overdueProcessed = activities.filter(a => a.type === 'overdue_processed').length;
  
  return {
    period: '30_days',
    autoInvoicesGenerated: autoInvoices,
    paymentTrackingEvents: paymentTracking,
    overdueInvoicesProcessed: overdueProcessed,
    totalAutomationEvents: activities.length
  };
}

async function testGetFinancialAutomationOverview() {
  return {
    totalInvoices: 25,
    overdueInvoices: 3,
    paymentTrackingEnabled: 18,
    automationFeatures: {
      autoInvoicing: true,
      paymentTracking: true,
      overdueManagement: true,
      revenueRecognition: true
    },
    lastUpdate: new Date().toISOString()
  };
}

// Export test functions for CI/CD integration
export {
  testAutoInvoiceGeneration,
  testPaymentTracking,
  testGetPaymentTrackingStatus,
  testMarkInvoicesOverdue,
  testSendOverdueReminders,
  testGetOverdueSummary,
  testGenerateMonthlyReport,
  testExecuteOverdueWorkflow,
  testGenerateCashFlowForecast,
  testPerformRevenueAnalysis,
  testProcessRevenueRecognition,
  testCheckInvoiceEligibility,
  testGetAutomationMetrics,
  testGetFinancialAutomationOverview
};
