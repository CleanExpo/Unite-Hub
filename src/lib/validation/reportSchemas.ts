/**
 * Report Validation Schemas - Phase 3 Step 9
 *
 * Zod validation for reporting requests
 */

import { z } from 'zod';

// ============================================================================
// BASE SCHEMAS
// ============================================================================

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const organizationParamSchema = z.object({
  organizationId: z.string().uuid('Invalid organization ID format'),
});

export const contactParamSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID format'),
});

export const projectParamSchema = z.object({
  projectId: z.string().uuid('Invalid project ID format').optional(),
});

// ============================================================================
// FINANCIAL REPORT SCHEMAS
// ============================================================================

export const financialSummaryRequestSchema = organizationParamSchema.merge(
  dateRangeSchema
);

export const organizationPnLRequestSchema = organizationParamSchema
  .merge(dateRangeSchema)
  .merge(
    z.object({
      includePrevious: z.boolean().default(false),
    })
  );

export const projectFinancialsRequestSchema =
  organizationParamSchema.merge(projectParamSchema);

export const aiCostBreakdownRequestSchema =
  organizationParamSchema.merge(dateRangeSchema);

export const transactionHistoryRequestSchema = organizationParamSchema
  .merge(dateRangeSchema)
  .merge(projectParamSchema)
  .merge(
    z.object({
      transactionTypes: z
        .array(
          z.enum([
            'time_entry',
            'stripe_payment',
            'xero_invoice',
            'ai_cost',
            'expense',
            'refund',
            'adjustment',
          ])
        )
        .optional(),
    })
  );

export const monthlyComparisonRequestSchema = organizationParamSchema.merge(
  z.object({
    months: z.number().int().min(1).max(24).default(6),
  })
);

// ============================================================================
// CLIENT REPORT SCHEMAS
// ============================================================================

export const clientBillingRequestSchema = contactParamSchema;

export const clientPnLRequestSchema = contactParamSchema.merge(dateRangeSchema);

export const clientHoursRequestSchema = contactParamSchema.merge(dateRangeSchema);

export const clientPaymentsRequestSchema =
  contactParamSchema.merge(dateRangeSchema);

// ============================================================================
// TYPES
// ============================================================================

export type FinancialSummaryRequest = z.infer<typeof financialSummaryRequestSchema>;
export type OrganizationPnLRequest = z.infer<typeof organizationPnLRequestSchema>;
export type ProjectFinancialsRequest = z.infer<typeof projectFinancialsRequestSchema>;
export type AICostBreakdownRequest = z.infer<typeof aiCostBreakdownRequestSchema>;
export type TransactionHistoryRequest = z.infer<typeof transactionHistoryRequestSchema>;
export type MonthlyComparisonRequest = z.infer<typeof monthlyComparisonRequestSchema>;
export type ClientBillingRequest = z.infer<typeof clientBillingRequestSchema>;
export type ClientPnLRequest = z.infer<typeof clientPnLRequestSchema>;
export type ClientHoursRequest = z.infer<typeof clientHoursRequestSchema>;
export type ClientPaymentsRequest = z.infer<typeof clientPaymentsRequestSchema>;
