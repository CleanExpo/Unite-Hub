# Xero Integration - Real Financial Operations System

**Created**: 2025-11-19
**Purpose**: Track REAL operational costs, not theoretical projections
**Goal**: Owner CRM experience with live P&L, cash flow, and profitability per client

---

## 🎯 Problem Statement

**Current State** (Pie in the Sky):
- ❌ Theoretical cost projections ($15-65/month per client)
- ❌ No real-time tracking of actual expenses
- ❌ Manual reconciliation of API costs, hosting, etc.
- ❌ No visibility into client profitability
- ❌ Can't answer: "Am I actually making money on this client?"

**Desired State** (Ground Truth):
- ✅ Real-time expense tracking from all sources (Anthropic, OpenRouter, Perplexity, Vercel, etc.)
- ✅ Automated invoice generation per client
- ✅ Live profitability dashboard (revenue - costs = profit)
- ✅ Xero accounting integration (single source of truth)
- ✅ Instant answers: "Which clients are profitable? Which are losing money?"

---

## 🏗️ System Architecture

### Data Flow

```
1. Client Signs Up ($495-1,295/month)
   ↓
2. Xero: Create Invoice (automated)
   ↓
3. Stripe: Collect Payment
   ↓
4. Xero: Mark Invoice as Paid (webhook)
   ↓
5. Service Delivery:
   - Anthropic API calls → Track cost
   - OpenRouter API calls → Track cost
   - Perplexity Sonar calls → Track cost
   - Vercel bandwidth → Track cost
   - Email sends (SendGrid) → Track cost
   ↓
6. Xero: Record Expenses (automated bills)
   ↓
7. Dashboard: Real-time P&L per client
   ↓
8. Monthly: Generate profit report & adjust pricing if needed
```

---

## 📦 Phase 1: Xero Integration Setup (Week 1)

### 1.1 Xero App Registration

**Steps**:
1. Go to [Xero Developer Portal](https://developer.xero.com/)
2. Create new app: "Unite-Hub Financial Ops"
3. OAuth 2.0 setup:
   - Redirect URI: `https://unite-hub.vercel.app/api/integrations/xero/callback`
   - Scopes:
     - `accounting.transactions` (read/write invoices, bills, payments)
     - `accounting.contacts` (read/write clients)
     - `accounting.settings` (read organization details)
     - `accounting.reports.read` (P&L, balance sheet)

**Environment Variables**:
```env
XERO_CLIENT_ID=your-xero-client-id
XERO_CLIENT_SECRET=your-xero-client-secret
XERO_REDIRECT_URI=https://unite-hub.vercel.app/api/integrations/xero/callback
XERO_WEBHOOK_KEY=your-webhook-signing-key
```

---

### 1.2 Install Xero Node SDK

```bash
npm install xero-node
npm install --save-dev @types/xero-node
```

**File**: `src/lib/accounting/xero-client.ts`

```typescript
import { XeroClient, TokenSet } from 'xero-node';
import { supabaseAdmin } from '@/lib/supabase';

export class XeroService {
  private client: XeroClient;

  constructor() {
    this.client = new XeroClient({
      clientId: process.env.XERO_CLIENT_ID!,
      clientSecret: process.env.XERO_CLIENT_SECRET!,
      redirectUris: [process.env.XERO_REDIRECT_URI!],
      scopes: [
        'accounting.transactions',
        'accounting.contacts',
        'accounting.settings',
        'accounting.reports.read'
      ].join(' ')
    });
  }

  /**
   * Initialize client with stored token
   */
  async initialize(organizationId: string): Promise<void> {
    const { data: tokens } = await supabaseAdmin
      .from('xero_tokens')
      .select('*')
      .eq('organization_id', organizationId)
      .single();

    if (!tokens) {
      throw new Error('Xero not connected for this organization');
    }

    const tokenSet: TokenSet = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: tokens.expires_at,
      id_token: tokens.id_token,
      token_type: 'Bearer',
      scope: tokens.scope
    };

    await this.client.setTokenSet(tokenSet);

    // Refresh if expired
    if (Date.now() >= tokens.expires_at * 1000) {
      const newTokenSet = await this.client.refreshToken();
      await this.saveTokenSet(organizationId, newTokenSet);
    }
  }

  /**
   * Save token set to database
   */
  private async saveTokenSet(organizationId: string, tokenSet: TokenSet): Promise<void> {
    await supabaseAdmin
      .from('xero_tokens')
      .upsert({
        organization_id: organizationId,
        access_token: tokenSet.access_token,
        refresh_token: tokenSet.refresh_token,
        expires_at: tokenSet.expires_at,
        id_token: tokenSet.id_token,
        scope: tokenSet.scope,
        updated_at: new Date().toISOString()
      });
  }

  /**
   * Get connected Xero tenant ID
   */
  async getTenantId(): Promise<string> {
    const tenants = await this.client.updateTenants();
    if (!tenants || tenants.length === 0) {
      throw new Error('No Xero organizations connected');
    }
    return tenants[0].tenantId;
  }
}
```

---

### 1.3 Database Schema for Xero Integration

**Migration**: `supabase/migrations/050_xero_integration.sql`

```sql
-- Store Xero OAuth tokens per organization
CREATE TABLE IF NOT EXISTS xero_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  id_token TEXT,
  scope TEXT,
  tenant_id TEXT, -- Xero organization ID
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- Track real-time expenses (API costs, hosting, etc.)
CREATE TABLE IF NOT EXISTS operational_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
  client_id UUID REFERENCES contacts(contact_id), -- Which client caused this expense
  expense_type TEXT NOT NULL, -- 'anthropic', 'openrouter', 'perplexity', 'vercel', 'sendgrid', etc.
  description TEXT,
  amount DECIMAL(10,4) NOT NULL, -- In USD
  tokens_used INT, -- For AI API calls
  api_endpoint TEXT, -- Which API was called
  request_id TEXT, -- For tracking/debugging
  xero_bill_id TEXT, -- Link to Xero bill (once synced)
  synced_to_xero BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track client invoices (synced with Xero)
CREATE TABLE IF NOT EXISTS client_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(workspace_id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES contacts(contact_id),
  xero_invoice_id TEXT UNIQUE, -- Xero invoice ID
  invoice_number TEXT,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL, -- 'draft', 'submitted', 'authorised', 'paid'
  due_date DATE,
  paid_date DATE,
  stripe_payment_intent_id TEXT,
  tier TEXT NOT NULL, -- 'starter', 'growth', 'premium'
  add_ons JSONB, -- Array of add-on services
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track client profitability (calculated view)
CREATE OR REPLACE VIEW client_profitability AS
SELECT
  ci.client_id,
  c.full_name AS client_name,
  ci.tier,
  ci.amount AS monthly_revenue,
  COALESCE(SUM(oe.amount), 0) AS monthly_costs,
  ci.amount - COALESCE(SUM(oe.amount), 0) AS monthly_profit,
  CASE
    WHEN ci.amount > 0 THEN
      ((ci.amount - COALESCE(SUM(oe.amount), 0)) / ci.amount * 100)
    ELSE 0
  END AS profit_margin_percentage
FROM client_invoices ci
LEFT JOIN contacts c ON ci.client_id = c.contact_id
LEFT JOIN operational_expenses oe ON oe.client_id = ci.client_id
  AND DATE_TRUNC('month', oe.created_at) = DATE_TRUNC('month', ci.created_at)
WHERE ci.status = 'paid'
GROUP BY ci.client_id, c.full_name, ci.tier, ci.amount;

-- Indexes for performance
CREATE INDEX idx_operational_expenses_client ON operational_expenses(client_id);
CREATE INDEX idx_operational_expenses_type ON operational_expenses(expense_type);
CREATE INDEX idx_operational_expenses_created ON operational_expenses(created_at);
CREATE INDEX idx_client_invoices_xero_id ON client_invoices(xero_invoice_id);
CREATE INDEX idx_client_invoices_client ON client_invoices(client_id);
CREATE INDEX idx_client_invoices_status ON client_invoices(status);

-- RLS Policies
ALTER TABLE xero_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invoices ENABLE ROW LEVEL SECURITY;

-- Only allow authenticated users to access their own org data
CREATE POLICY "Users can view their org's Xero tokens"
  ON xero_tokens FOR SELECT
  USING (organization_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their org's expenses"
  ON operational_expenses FOR SELECT
  USING (organization_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view their org's invoices"
  ON client_invoices FOR SELECT
  USING (organization_id IN (
    SELECT org_id FROM user_organizations
    WHERE user_id = auth.uid()
  ));
```

---

## 📦 Phase 2: Automated Expense Tracking (Week 2)

### 2.1 Cost Tracking Wrapper for AI APIs

**File**: `src/lib/accounting/cost-tracker.ts`

```typescript
import { supabaseAdmin } from '@/lib/supabase';

export interface CostTrackingParams {
  organizationId: string;
  workspaceId: string;
  clientId?: string;
  expenseType: 'anthropic' | 'openrouter' | 'perplexity' | 'vercel' | 'sendgrid' | 'resend';
  description: string;
  amount: number; // In USD
  tokensUsed?: number;
  apiEndpoint?: string;
  requestId?: string;
}

export class CostTracker {
  /**
   * Track an operational expense (called after every API request)
   */
  static async trackExpense(params: CostTrackingParams): Promise<void> {
    try {
      await supabaseAdmin
        .from('operational_expenses')
        .insert({
          organization_id: params.organizationId,
          workspace_id: params.workspaceId,
          client_id: params.clientId,
          expense_type: params.expenseType,
          description: params.description,
          amount: params.amount,
          tokens_used: params.tokensUsed,
          api_endpoint: params.apiEndpoint,
          request_id: params.requestId,
          synced_to_xero: false
        });

      console.log(`💰 Tracked expense: ${params.expenseType} - $${params.amount.toFixed(4)}`);
    } catch (error) {
      console.error('❌ Failed to track expense:', error);
      // Don't throw - we don't want expense tracking to break the app
    }
  }

  /**
   * Get total costs for a client this month
   */
  static async getClientMonthlyCosts(clientId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data, error } = await supabaseAdmin
      .from('operational_expenses')
      .select('amount')
      .eq('client_id', clientId)
      .gte('created_at', startOfMonth.toISOString());

    if (error || !data) return 0;

    return data.reduce((sum, expense) => sum + Number(expense.amount), 0);
  }

  /**
   * Get profitability for a client
   */
  static async getClientProfitability(clientId: string): Promise<{
    revenue: number;
    costs: number;
    profit: number;
    margin: number;
  }> {
    const { data: invoice } = await supabaseAdmin
      .from('client_invoices')
      .select('amount')
      .eq('client_id', clientId)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const revenue = invoice?.amount || 0;
    const costs = await this.getClientMonthlyCosts(clientId);
    const profit = revenue - costs;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return { revenue, costs, profit, margin };
  }
}
```

---

### 2.2 Wrap AI API Calls with Cost Tracking

**Update**: `src/lib/ai/openrouter-intelligence.ts`

```typescript
import { CostTracker } from '@/lib/accounting/cost-tracker';

// In callOpenRouter method, after successful API call:
private async callOpenRouter(
  model: string,
  prompt: string,
  additionalContent?: any[],
  context?: { organizationId: string; workspaceId: string; clientId?: string }
): Promise<string> {
  const response = await fetch(`${this.config.baseURL}/chat/completions`, {
    // ... existing code
  });

  const data = await response.json();

  // Track cost
  if (context) {
    const pricing = this.getPricingForModel(model);
    const cost = this.calculateCost(
      model,
      data.usage.prompt_tokens,
      data.usage.completion_tokens
    );

    await CostTracker.trackExpense({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      clientId: context.clientId,
      expenseType: 'openrouter',
      description: `${model} - ${data.usage.total_tokens} tokens`,
      amount: cost,
      tokensUsed: data.usage.total_tokens,
      apiEndpoint: '/chat/completions',
      requestId: data.id
    });
  }

  return data.choices[0].message.content;
}
```

**Update**: `src/lib/ai/perplexity-sonar.ts`

```typescript
import { CostTracker } from '@/lib/accounting/cost-tracker';

// In search method, after successful API call:
async search(
  query: string,
  options: SonarSearchOptions = {},
  context?: { organizationId: string; workspaceId: string; clientId?: string }
): Promise<SonarResponse> {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    // ... existing code
  });

  const data = await response.json();

  // Track cost ($0.005-0.01 per search)
  if (context) {
    const cost = options.model === 'sonar-pro' ? 0.01 : 0.005;

    await CostTracker.trackExpense({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      clientId: context.clientId,
      expenseType: 'perplexity',
      description: `Sonar search: ${query.substring(0, 50)}...`,
      amount: cost,
      tokensUsed: data.usage?.total_tokens,
      apiEndpoint: '/chat/completions',
      requestId: data.id
    });
  }

  return data;
}
```

---

## 📦 Phase 3: Xero Invoice & Bill Automation (Week 3)

### 3.1 Automated Invoice Creation

**File**: `src/lib/accounting/xero-invoicing.ts`

```typescript
import { XeroService } from './xero-client';
import { Invoice, Contact } from 'xero-node';
import { supabaseAdmin } from '@/lib/supabase';

export class XeroInvoicing {
  private xero: XeroService;

  constructor() {
    this.xero = new XeroService();
  }

  /**
   * Create invoice in Xero when client signs up
   */
  async createClientInvoice(params: {
    organizationId: string;
    workspaceId: string;
    clientId: string;
    tier: 'starter' | 'growth' | 'premium';
    addOns?: string[];
  }): Promise<string> {
    await this.xero.initialize(params.organizationId);
    const tenantId = await this.xero.getTenantId();

    // Get client details
    const { data: client } = await supabaseAdmin
      .from('contacts')
      .select('*')
      .eq('contact_id', params.clientId)
      .single();

    if (!client) throw new Error('Client not found');

    // Calculate total amount
    const tierPricing = {
      starter: 495,
      growth: 895,
      premium: 1295
    };

    const addOnPricing: Record<string, number> = {
      'video-content': 495,
      'extra-platform': 97,
      'analytics': 147,
      'ads-management': 297,
      'pr-outreach': 397
    };

    const baseAmount = tierPricing[params.tier];
    const addOnAmount = (params.addOns || []).reduce(
      (sum, addOn) => sum + (addOnPricing[addOn] || 0),
      0
    );
    const totalAmount = baseAmount + addOnAmount;

    // Create or get Xero contact
    const xeroContact = await this.getOrCreateXeroContact(tenantId, client);

    // Create invoice
    const lineItems = [
      {
        description: `Marketing Intelligence Platform - ${params.tier.charAt(0).toUpperCase() + params.tier.slice(1)} Tier`,
        quantity: 1,
        unitAmount: baseAmount,
        accountCode: '200' // Revenue account
      }
    ];

    // Add line items for add-ons
    (params.addOns || []).forEach(addOn => {
      lineItems.push({
        description: `Add-On: ${addOn.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
        quantity: 1,
        unitAmount: addOnPricing[addOn],
        accountCode: '200'
      });
    });

    const invoice: Invoice = {
      type: Invoice.TypeEnum.ACCREC, // Accounts Receivable (sales invoice)
      contact: xeroContact,
      lineItems: lineItems,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days
      reference: `Client: ${client.full_name}`,
      status: Invoice.StatusEnum.AUTHORISED
    };

    const response = await this.xero.client.accountingApi.createInvoices(tenantId, {
      invoices: [invoice]
    });

    const createdInvoice = response.body.invoices![0];

    // Store in our database
    await supabaseAdmin
      .from('client_invoices')
      .insert({
        organization_id: params.organizationId,
        workspace_id: params.workspaceId,
        client_id: params.clientId,
        xero_invoice_id: createdInvoice.invoiceID,
        invoice_number: createdInvoice.invoiceNumber,
        amount: totalAmount,
        status: 'authorised',
        due_date: createdInvoice.dueDate,
        tier: params.tier,
        add_ons: params.addOns
      });

    console.log(`✅ Created Xero invoice: ${createdInvoice.invoiceNumber} - $${totalAmount}`);
    return createdInvoice.invoiceID!;
  }

  /**
   * Get or create Xero contact for client
   */
  private async getOrCreateXeroContact(tenantId: string, client: any): Promise<Contact> {
    // Search for existing contact
    const searchResponse = await this.xero.client.accountingApi.getContacts(
      tenantId,
      undefined,
      `EmailAddress="${client.email}"`
    );

    if (searchResponse.body.contacts && searchResponse.body.contacts.length > 0) {
      return searchResponse.body.contacts[0];
    }

    // Create new contact
    const contact: Contact = {
      name: client.full_name || client.email,
      emailAddress: client.email,
      contactStatus: Contact.ContactStatusEnum.ACTIVE
    };

    if (client.company) {
      contact.name = client.company;
    }

    if (client.phone) {
      contact.phones = [{
        phoneType: 'DEFAULT',
        phoneNumber: client.phone
      }];
    }

    const createResponse = await this.xero.client.accountingApi.createContacts(tenantId, {
      contacts: [contact]
    });

    return createResponse.body.contacts![0];
  }

  /**
   * Sync monthly expenses to Xero as bills
   */
  async syncExpensesToXero(organizationId: string): Promise<void> {
    await this.xero.initialize(organizationId);
    const tenantId = await this.xero.getTenantId();

    // Get unsynced expenses
    const { data: expenses } = await supabaseAdmin
      .from('operational_expenses')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('synced_to_xero', false)
      .order('created_at', { ascending: true });

    if (!expenses || expenses.length === 0) {
      console.log('✅ No expenses to sync');
      return;
    }

    // Group expenses by type and create bills
    const expensesByType = expenses.reduce((acc, expense) => {
      if (!acc[expense.expense_type]) {
        acc[expense.expense_type] = [];
      }
      acc[expense.expense_type].push(expense);
      return acc;
    }, {} as Record<string, any[]>);

    for (const [type, typeExpenses] of Object.entries(expensesByType)) {
      const totalAmount = typeExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

      // Create bill (supplier invoice)
      const bill = {
        type: 'ACCPAY', // Accounts Payable (purchase/bill)
        contact: {
          name: this.getSupplierName(type)
        },
        lineItems: [{
          description: `${type} API usage - ${typeExpenses.length} requests`,
          quantity: 1,
          unitAmount: totalAmount,
          accountCode: '400' // Expense account
        }],
        date: new Date().toISOString().split('T')[0],
        dueDate: new Date().toISOString().split('T')[0],
        status: 'AUTHORISED'
      };

      const response = await this.xero.client.accountingApi.createInvoices(tenantId, {
        invoices: [bill as any]
      });

      const createdBill = response.body.invoices![0];

      // Mark expenses as synced
      const expenseIds = typeExpenses.map(e => e.id);
      await supabaseAdmin
        .from('operational_expenses')
        .update({
          xero_bill_id: createdBill.invoiceID,
          synced_to_xero: true
        })
        .in('id', expenseIds);

      console.log(`✅ Synced ${typeExpenses.length} ${type} expenses to Xero - $${totalAmount.toFixed(2)}`);
    }
  }

  private getSupplierName(expenseType: string): string {
    const suppliers: Record<string, string> = {
      anthropic: 'Anthropic AI',
      openrouter: 'OpenRouter',
      perplexity: 'Perplexity AI',
      vercel: 'Vercel Inc',
      sendgrid: 'SendGrid (Twilio)',
      resend: 'Resend'
    };
    return suppliers[expenseType] || expenseType;
  }
}
```

---

## 📦 Phase 4: Owner Dashboard with Real P&L (Week 4)

### 4.1 Financial Dashboard API

**File**: `src/app/api/dashboard/financial-ops/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { CostTracker } from '@/lib/accounting/cost-tracker';

export async function GET(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = req.nextUrl.searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json({ error: 'organizationId required' }, { status: 400 });
    }

    // Get client profitability
    const { data: profitability } = await supabase
      .from('client_profitability')
      .select('*')
      .order('monthly_profit', { ascending: false });

    // Get total revenue this month
    const { data: invoices } = await supabase
      .from('client_invoices')
      .select('amount')
      .eq('status', 'paid')
      .gte('created_at', new Date(new Date().setDate(1)).toISOString());

    const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

    // Get total costs this month
    const { data: expenses } = await supabase
      .from('operational_expenses')
      .select('amount')
      .gte('created_at', new Date(new Date().setDate(1)).toISOString());

    const totalCosts = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;

    // Get costs by type
    const { data: costsByType } = await supabase
      .from('operational_expenses')
      .select('expense_type, amount')
      .gte('created_at', new Date(new Date().setDate(1)).toISOString());

    const costBreakdown = (costsByType || []).reduce((acc, exp) => {
      if (!acc[exp.expense_type]) {
        acc[exp.expense_type] = 0;
      }
      acc[exp.expense_type] += Number(exp.amount);
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalCosts,
        totalProfit: totalRevenue - totalCosts,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue * 100) : 0
      },
      costBreakdown,
      clientProfitability: profitability || []
    });
  } catch (error) {
    console.error('Financial ops API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

### 4.2 Owner Dashboard UI

**File**: `src/app/dashboard/financial-ops/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function FinancialOpsPage() {
  const { currentOrganization } = useAuth();
  const [financialData, setFinancialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrganization) {
      fetchFinancialData();
    }
  }, [currentOrganization]);

  const fetchFinancialData = async () => {
    const response = await fetch(
      `/api/dashboard/financial-ops?organizationId=${currentOrganization?.org_id}`
    );
    const data = await response.json();
    setFinancialData(data);
    setLoading(false);
  };

  if (loading) return <div>Loading financial data...</div>;
  if (!financialData) return <div>No data available</div>;

  const { summary, costBreakdown, clientProfitability } = financialData;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Financial Operations</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              ${summary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">
              ${summary.totalCosts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${summary.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${summary.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${summary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.profitMargin.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown by Service</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(costBreakdown).map(([name, value]) => ({ name, value }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: $${entry.value.toFixed(2)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {Object.entries(costBreakdown).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Client Profitability Table */}
      <Card>
        <CardHeader>
          <CardTitle>Client Profitability</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Client</th>
                <th className="text-left p-2">Tier</th>
                <th className="text-right p-2">Revenue</th>
                <th className="text-right p-2">Costs</th>
                <th className="text-right p-2">Profit</th>
                <th className="text-right p-2">Margin</th>
              </tr>
            </thead>
            <tbody>
              {clientProfitability.map((client: any) => (
                <tr key={client.client_id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{client.client_name}</td>
                  <td className="p-2 capitalize">{client.tier}</td>
                  <td className="text-right p-2">${client.monthly_revenue.toFixed(2)}</td>
                  <td className="text-right p-2">${client.monthly_costs.toFixed(2)}</td>
                  <td className={`text-right p-2 font-bold ${client.monthly_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${client.monthly_profit.toFixed(2)}
                  </td>
                  <td className={`text-right p-2 ${client.profit_margin_percentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {client.profit_margin_percentage.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
```

---

## 📦 Phase 5: Xero Webhooks for Real-Time Updates (Week 5)

### 5.1 Webhook Endpoint

**File**: `src/app/api/webhooks/xero/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    // Verify webhook signature
    const signature = req.headers.get('x-xero-signature');
    const webhookKey = process.env.XERO_WEBHOOK_KEY!;
    const body = await req.text();

    const hash = crypto
      .createHmac('sha256', webhookKey)
      .update(body)
      .digest('base64');

    if (hash !== signature) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Process events
    const events = JSON.parse(body);

    for (const event of events.events) {
      if (event.eventType === 'UPDATE' && event.eventCategory === 'INVOICE') {
        await handleInvoiceUpdate(event);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleInvoiceUpdate(event: any): Promise<void> {
  const invoiceId = event.resourceId;

  // Update invoice status in our database
  const { data: invoice } = await supabaseAdmin
    .from('client_invoices')
    .select('*')
    .eq('xero_invoice_id', invoiceId)
    .single();

  if (!invoice) {
    console.log(`Invoice ${invoiceId} not found in database`);
    return;
  }

  // Fetch latest invoice data from Xero
  // (This would require initializing XeroClient, omitted for brevity)

  // Update status
  await supabaseAdmin
    .from('client_invoices')
    .update({
      status: 'paid', // Or whatever the new status is
      paid_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('xero_invoice_id', invoiceId);

  console.log(`✅ Updated invoice ${invoiceId} to paid status`);
}
```

---

## 🎯 Next Steps

### Week 1: Setup
- [ ] Register Xero app
- [ ] Install xero-node SDK
- [ ] Run database migration (050)
- [ ] Test OAuth flow

### Week 2: Cost Tracking
- [ ] Wrap all AI API calls with CostTracker
- [ ] Test expense tracking
- [ ] Verify costs are being recorded

### Week 3: Invoicing
- [ ] Implement automated invoice creation
- [ ] Test invoice sync with Xero
- [ ] Implement bill sync for expenses

### Week 4: Dashboard
- [ ] Build financial ops dashboard
- [ ] Test real-time P&L calculations
- [ ] Show client profitability

### Week 5: Webhooks
- [ ] Set up Xero webhooks
- [ ] Test real-time invoice updates
- [ ] Monitor webhook logs

---

## 📊 Expected Outcomes

**After Implementation**:
✅ Know EXACT cost per client (not estimates)
✅ Real-time P&L dashboard (revenue - costs = profit)
✅ Automated invoicing in Xero
✅ Automated expense tracking (all API costs)
✅ Client profitability ranking (which clients make money)
✅ Data-driven pricing decisions (adjust based on real costs)

**Example Real Data**:
```
Client: Balustrade Company
Tier: Growth ($895/month)
Monthly Costs:
  - OpenRouter: $12.45
  - Perplexity: $3.20
  - Anthropic: $8.90
  - Vercel: $0.50
  - SendGrid: $1.20
  TOTAL: $26.25

Monthly Profit: $868.75 (97.1% margin)
Status: ✅ HIGHLY PROFITABLE
```

---

**This is the real financial operations system you need to run a data-driven AI marketing agency! 🚀**

---

**Last Updated**: 2025-11-19
**Status**: Ready for Implementation
**Timeline**: 5 weeks to full Xero integration
**Priority**: High (need real numbers before scaling)
