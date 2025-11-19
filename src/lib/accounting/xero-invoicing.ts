/**
 * Xero Invoicing - Phase 3B Financial Engine
 *
 * Automated invoice creation and expense syncing with Xero.
 *
 * Phase 3 Step 1: TypeScript stub with placeholder logic.
 * Future steps will implement real Xero API calls.
 */

export interface InvoiceJobContext {
  organizationId: string;
  workspaceId?: string;
  clientId: string;
  projectId?: string;
  scopeId?: string;
  xeroTenantId: string;    // Which Xero account to use
  currency?: string;        // Default: 'USD'
  dueInDays?: number;      // Default: 30
}

export interface InvoiceResult {
  success: boolean;
  message: string;
  externalInvoiceId?: string;  // Xero invoice ID
  errorCode?: string;          // For retry logic
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitAmount: number;
  accountCode: string;  // Xero account code (e.g., "200" for Sales)
  taxType?: string;     // e.g., "OUTPUT2" for 10% GST
}

/**
 * createProjectInvoice
 *
 * Phase 3 Step 1 stub: Creates a project-based invoice in Xero.
 * This function does NOT call Xero yet; it only returns a placeholder result.
 *
 * Future implementation will:
 * 1. Initialize XeroService with tenant
 * 2. Build invoice payload from project scope
 * 3. Call Xero API: POST /invoices
 * 4. Save invoice ID to client_invoices table
 * 5. Return success/failure result
 *
 * @param context - Invoice job context
 * @returns InvoiceResult with success status
 */
export async function createProjectInvoice(
  context: InvoiceJobContext
): Promise<InvoiceResult> {
  // Phase 3 Step 1: Stub implementation
  // In a later step, this will construct a Xero invoice payload based on
  // project scope, tasks, and pricing rules, then call the Xero API.

  console.log('[STUB] Creating project invoice:', {
    organizationId: context.organizationId,
    clientId: context.clientId,
    projectId: context.projectId,
    xeroTenantId: context.xeroTenantId,
  });

  return {
    success: true,
    message: `Project invoice stub created for client ${context.clientId} in tenant ${context.xeroTenantId}.`,
  };
}

/**
 * createSubscriptionInvoice
 *
 * Phase 3 Step 1 stub: Creates a subscription/retainer invoice in Xero.
 *
 * Future implementation will:
 * 1. Get subscription details from database
 * 2. Build recurring invoice payload
 * 3. Call Xero API
 * 4. Schedule next invoice
 *
 * @param context - Invoice job context
 * @returns InvoiceResult with success status
 */
export async function createSubscriptionInvoice(
  context: InvoiceJobContext
): Promise<InvoiceResult> {
  console.log('[STUB] Creating subscription invoice:', {
    organizationId: context.organizationId,
    clientId: context.clientId,
    xeroTenantId: context.xeroTenantId,
  });

  return {
    success: true,
    message: `Subscription invoice stub created for client ${context.clientId} in tenant ${context.xeroTenantId}.`,
  };
}

/**
 * syncUnbilledExpenses
 *
 * Phase 3 Step 1 stub: Syncs unbilled expenses into invoice-ready summaries.
 *
 * Future implementation will:
 * 1. Query operational_expenses where synced_to_xero = false
 * 2. Group by client_id and xero_tenant_id
 * 3. For pass-through clients, create Xero bills
 * 4. For all clients, mark as synced
 *
 * @param organizationId - Organization to sync expenses for
 * @returns Result with success status and message
 */
export async function syncUnbilledExpenses(
  organizationId: string
): Promise<{ success: boolean; message: string; expenseCount?: number }> {
  console.log('[STUB] Syncing unbilled expenses for org:', organizationId);

  return {
    success: true,
    message: `Unbilled expenses sync stub completed for organization ${organizationId}.`,
    expenseCount: 0,
  };
}

/**
 * buildLineItemsFromProject
 *
 * Phase 3 Step 3 placeholder: Builds invoice line items from project scope.
 *
 * Future implementation will:
 * 1. Load project and associated scope from database
 * 2. Extract deliverables from selected tier (Good/Better/Best)
 * 3. Map deliverables to invoice line items with pricing
 *
 * @param projectId - Project to build line items for
 * @returns Array of invoice line items
 */
export async function buildLineItemsFromProject(
  projectId: string
): Promise<InvoiceLineItem[]> {
  // Stub: Return placeholder line items
  return [
    {
      description: 'Project deliverables (placeholder)',
      quantity: 1,
      unitAmount: 10000.0,
      accountCode: '200', // Sales account
    },
  ];
}
