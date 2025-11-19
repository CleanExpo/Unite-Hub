/**
 * Time Tracking Validation Schemas - Phase 3 Step 8
 * Zod schemas for validating time tracking data structures.
 */

import { z } from 'zod';

// ============================================================================
// ENUMS
// ============================================================================

export const entryTypeSchema = z.enum(['timer', 'manual']);
export const entryStatusSchema = z.enum(['pending', 'approved', 'rejected', 'billed']);

// ============================================================================
// TIME SESSION SCHEMAS
// ============================================================================

export const startTimeSessionSchema = z.object({
  staffId: z.string().uuid('Invalid staff ID'),
  organizationId: z.string().uuid('Invalid organization ID'),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  description: z.string().max(500).optional(),
});

export type StartTimeSessionRequest = z.infer<typeof startTimeSessionSchema>;

export const stopTimeSessionSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  staffId: z.string().uuid('Invalid staff ID'),
});

export type StopTimeSessionRequest = z.infer<typeof stopTimeSessionSchema>;

// ============================================================================
// MANUAL TIME ENTRY SCHEMAS
// ============================================================================

export const createManualEntrySchema = z.object({
  staffId: z.string().uuid('Invalid staff ID'),
  organizationId: z.string().uuid('Invalid organization ID'),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  hours: z
    .number()
    .positive('Hours must be positive')
    .max(24, 'Hours cannot exceed 24')
    .refine((val) => val > 0, 'Hours must be greater than 0'),
  description: z.string().min(1, 'Description is required').max(500),
  billable: z.boolean().optional().default(true),
  hourlyRate: z.number().positive().optional(),
});

export type CreateManualEntryRequest = z.infer<typeof createManualEntrySchema>;

// ============================================================================
// APPROVAL SCHEMAS
// ============================================================================

export const approveEntrySchema = z.object({
  entryId: z.string().uuid('Invalid entry ID'),
  approvedBy: z.string().uuid('Invalid approver ID'),
  organizationId: z.string().uuid('Invalid organization ID'),
});

export type ApproveEntryRequest = z.infer<typeof approveEntrySchema>;

export const rejectEntrySchema = z.object({
  entryId: z.string().uuid('Invalid entry ID'),
  rejectedBy: z.string().uuid('Invalid rejector ID'),
  organizationId: z.string().uuid('Invalid organization ID'),
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});

export type RejectEntryRequest = z.infer<typeof rejectEntrySchema>;

export const bulkApproveSchema = z.object({
  entryIds: z.array(z.string().uuid()).min(1, 'At least one entry ID is required'),
  approvedBy: z.string().uuid('Invalid approver ID'),
  organizationId: z.string().uuid('Invalid organization ID'),
});

export type BulkApproveRequest = z.infer<typeof bulkApproveSchema>;

// ============================================================================
// QUERY PARAMS SCHEMAS
// ============================================================================

export const getTimeEntriesSchema = z.object({
  staffId: z.string().uuid().optional(),
  organizationId: z.string().uuid('Organization ID is required'),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: entryStatusSchema.optional(),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
});

export type GetTimeEntriesParams = z.infer<typeof getTimeEntriesSchema>;

// ============================================================================
// TIME ENTRY SCHEMA (Response)
// ============================================================================

export const timeEntrySchema = z.object({
  id: z.string().uuid(),
  staffId: z.string().uuid(),
  organizationId: z.string().uuid(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  description: z.string(),
  date: z.string(),
  hours: z.number(),
  entryType: entryTypeSchema,
  sessionId: z.string().uuid().optional(),
  billable: z.boolean(),
  hourlyRate: z.number().optional(),
  totalAmount: z.number().optional(),
  status: entryStatusSchema,
  approvedBy: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional(),
  rejectionReason: z.string().optional(),
  xeroSynced: z.boolean(),
  xeroTimesheetId: z.string().optional(),
  xeroSyncedAt: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TimeEntry = z.infer<typeof timeEntrySchema>;

// ============================================================================
// TIME SESSION SCHEMA (Response)
// ============================================================================

export const timeSessionSchema = z.object({
  id: z.string().uuid(),
  staffId: z.string().uuid(),
  organizationId: z.string().uuid(),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  description: z.string().optional(),
  startedAt: z.string().datetime(),
  stoppedAt: z.string().datetime().optional(),
  durationSeconds: z.number().int().optional(),
  metadata: z.record(z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TimeSession = z.infer<typeof timeSessionSchema>;

// ============================================================================
// XERO SYNC SCHEMA
// ============================================================================

export const xeroSyncSchema = z.object({
  entryIds: z.array(z.string().uuid()).min(1, 'At least one entry ID is required'),
  organizationId: z.string().uuid('Invalid organization ID'),
});

export type XeroSyncRequest = z.infer<typeof xeroSyncSchema>;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export function validateStartTimeSession(data: unknown) {
  return startTimeSessionSchema.safeParse(data);
}

export function validateStopTimeSession(data: unknown) {
  return stopTimeSessionSchema.safeParse(data);
}

export function validateCreateManualEntry(data: unknown) {
  return createManualEntrySchema.safeParse(data);
}

export function validateApproveEntry(data: unknown) {
  return approveEntrySchema.safeParse(data);
}

export function validateRejectEntry(data: unknown) {
  return rejectEntrySchema.safeParse(data);
}

export function validateBulkApprove(data: unknown) {
  return bulkApproveSchema.safeParse(data);
}

export function validateGetTimeEntries(data: unknown) {
  return getTimeEntriesSchema.safeParse(data);
}

export function validateXeroSync(data: unknown) {
  return xeroSyncSchema.safeParse(data);
}

export function validateTimeEntry(data: unknown) {
  return timeEntrySchema.safeParse(data);
}

export function validateTimeSession(data: unknown) {
  return timeSessionSchema.safeParse(data);
}
